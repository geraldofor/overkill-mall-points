// ============================================================================
// OVERKILL MALL — Core Game Engine v2
// Canvas-based 2D top-down battle royale with Free Fire-inspired mechanics
// ============================================================================

import {
  GameState,
  GameConfig,
  GameMap,
  Player,
  Bullet,
  Item,
  GlooWall,
  Vec2,
  KillFeedEntry,
  WeaponType,
  Armor,
  Helmet,
  Particle,
  MovementState,
  ItemType,
  FloatingText,
  Hitmarker,
} from "./types";
import { WEAPONS, calcDamage, calcSpread } from "./weapons";
import { SCORE, getKillstreakLabel } from "./scoring";
import { audio } from "./audio";

let nextId = 0;
function uid(): string {
  return `${Date.now()}_${nextId++}`;
}

// ============================================================================
// Constants
// ============================================================================

const WALK_SPEED = 180;
const SPRINT_SPEED = 270;
const CROUCH_SPEED = 90;
const EP_TO_HP_RATE = 1; // 1 EP per second → HP
const EP_TICK_INTERVAL = 1; // convert EP every 1s
const STEPS_INTERVAL_WALK = 0.4;
const STEPS_INTERVAL_SPRINT = 0.25;
const GLOO_WALL_MAX = 3;
const GLOO_WALL_HP = 200;
const GLOO_WALL_LIFETIME = 120;
const GLOO_WALL_SIZE = 60;
const MEDKIT_HEAL = 75;
const MEDKIT_TIME = 5;
const BANDAGE_HEAL = 25;
const BANDAGE_TIME = 3;
const SPEED_BOOST_DURATION = 10;
const SPEED_BOOST_MULT = 1.2;

// Bot names
const BOT_NAMES = [
  "Shadow_X", "NightHawk", "Phantom_BR", "GhostRider", "CyberWolf",
  "BlazeFire", "IronMask", "DarkPulse", "StormBreak", "VenomStrike",
  "NeonRush", "TitanGrip", "ViperBite", "Rogue77", "AlphaStrike",
  "DeltaForce", "OmegaBlade", "NovaBurst", "SteelFang", "RapidFire",
];

const PLAYER_COLORS = [
  "#ff2b3d", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7",
  "#ec4899", "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6",
];

const WEAPON_TYPES: WeaponType[] = ["pistol", "smg", "rifle", "shotgun", "sniper"];

// ============================================================================
// Engine class
// ============================================================================

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state!: GameState;
  private config!: GameConfig;
  private keys: Set<string> = new Set();
  private mouse = { x: 0, y: 0, down: false };
  private camera = { x: 0, y: 0 };
  private zoom = 1; // Camera zoom factor
  private animFrame = 0;
  private lastTime = 0;
  private running = false;
  private humanId: string = "";
  private _onUpdate: ((state: GameState) => void) | null = null;
  private _onGameOver: ((state: GameState) => void) | null = null;
  private _onHumanDeath: ((state: GameState) => void) | null = null;

  // Touch controls
  private touchJoystick = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
  private touchShoot = { active: false, x: 0, y: 0 };

  // Fire rate & reload control (per player)
  private lastFireTimes = new Map<string, number>();
  private reloadState = new Map<string, { reloading: boolean; startTime: number }>();

  // Medkit / bandage channeling
  private healChannel = new Map<string, { type: "medkit" | "bandage"; startTime: number; duration: number; healAmount: number }>();

  // Speed boost timer
  private speedBoosts = new Map<string, number>(); // endTime

  // Step sound timer
  private stepTimers = new Map<string, number>();

  // EP tick timer
  private epTickTimer = 0;

  // Audio init flag
  private audioInited = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.setupInput();
  }

  // ==================================================================
  // Public API
  // ==================================================================

  start(config: GameConfig, playerName: string, playerColor?: string): GameState {
    this.config = config;
    this.state = this.createInitialState(config, playerName, playerColor);
    this.humanId = this.state.players.entries().next().value![0];
    // Set zoom based on screen size — mobile gets zoomed in more
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    this.zoom = isMobile ? (minDim < 400 ? 1.6 : 1.3) : 1;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
    return this.state;
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
  }

  getState(): GameState {
    return this.state;
  }

  onUpdate(fn: (state: GameState) => void): void {
    this._onUpdate = fn;
  }

  onGameOverFn(fn: (state: GameState) => void): void {
    this._onGameOver = fn;
  }

  onHumanDeathFn(fn: (state: GameState) => void): void {
    this._onHumanDeath = fn;
  }

  // ==================================================================
  // State creation
  // ==================================================================

  private createInitialState(config: GameConfig, playerName: string, playerColor?: string): GameState {
    const players = new Map<string, Player>();
    const map = config.map;
    const allSpawns = [...map.spawns].sort(() => Math.random() - 0.5);

    // Human player
    const humanSpawn = allSpawns[0] || { x: map.width / 2, y: map.height / 2 };
    const human: Player = this.createPlayer({
      id: uid(),
      name: playerName,
      isBot: false,
      spawn: humanSpawn,
      color: playerColor || PLAYER_COLORS[0],
      weapon: "rifle",
    });
    players.set(human.id, human);

    // Bots
    const botNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < config.botCount; i++) {
      const spawn = allSpawns[(i + 1) % allSpawns.length] || {
        x: Math.random() * map.width,
        y: Math.random() * map.height,
      };
      const botWeapon = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
      const bot: Player = this.createPlayer({
        id: uid(),
        name: botNames[i % botNames.length],
        isBot: true,
        spawn,
        color: PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length],
        weapon: botWeapon,
      });
      // Give bots random armor/helmet
      const armorLvl = Math.random() < 0.3 ? (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3 : 0;
      const helmetLvl = Math.random() < 0.25 ? (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3 : 0;
      bot.armor = this.createArmor(armorLvl);
      bot.helmet = this.createHelmet(helmetLvl);
      players.set(bot.id, bot);
    }

    // Items — more varied distribution
    const items: Item[] = this.generateItems(map);

    // Gloo walls
    const glooWalls: GlooWall[] = [];

    // Zone
    const zoneRadius = Math.min(map.width, map.height) * 0.45;
    const zone: GameState["zone"] = {
      centerX: map.width / 2,
      centerY: map.height / 2,
      radius: zoneRadius,
      targetRadius: zoneRadius,
      shrinkSpeed: 0,
      damage: 2,
      phase: 0,
      nextShrinkTime: 20,
    };

    return {
      players,
      bullets: [],
      items,
      glooWalls,
      map,
      zone,
      killFeed: [],
      matchTime: 0,
      matchDuration: config.matchDuration,
      aliveCount: config.playerCount,
      totalPlayers: config.playerCount,
      gameOver: false,
      winnerId: null,
      started: false,
      countdown: 3,
      particles: [],
      floatingTexts: [],
      hitmarkers: [],
      screenShake: 0,
    };
  }

  private createPlayer(opts: {
    id: string;
    name: string;
    isBot: boolean;
    spawn: Vec2;
    color: string;
    weapon: WeaponType;
  }): Player {
    const weaponDef = WEAPONS[opts.weapon];
    return {
      id: opts.id,
      name: opts.name,
      isBot: opts.isBot,
      pos: { ...opts.spawn },
      vel: { x: 0, y: 0 },
      radius: 13,
      health: 100,
      maxHealth: 100,
      ep: 0,
      maxEp: 100,
      alive: true,
      facing: 0,
      color: opts.color,
      weapon: opts.weapon,
      armor: this.createArmor(0),
      helmet: this.createHelmet(0),
      glooWalls: opts.isBot ? 0 : 2,
      maxGlooWalls: GLOO_WALL_MAX,
      movementState: "walk",
      sprintSpeed: SPRINT_SPEED,
      walkSpeed: WALK_SPEED,
      crouchSpeed: CROUCH_SPEED,
      isCrouching: false,
      isSprinting: false,
      ammo: weaponDef.magSize,
      maxAmmo: weaponDef.magSize,
      reserveAmmo: weaponDef.magSize * 3,
      score: 0,
      kills: 0,
      headshots: 0,
      damageDealt: 0,
      assists: [],
      survivalTime: 0,
      itemsCollected: 0,
      killstreak: 0,
      killstreakMax: 0,
      lastKillTime: 0,
      invulnerableUntil: 0,
      lastDamageTime: 0,
      placement: 0,
      accuracyBonus: 1,
    };
  }

  private createArmor(level: 0 | 1 | 2 | 3 | 4): Armor {
    const durabilities: Record<number, number> = { 0: 0, 1: 50, 2: 75, 3: 100, 4: 100 };
    const d = durabilities[level];
    return { level, durability: d, maxDurability: d };
  }

  private createHelmet(level: 0 | 1 | 2 | 3 | 4): Helmet {
    const durabilities: Record<number, number> = { 0: 0, 1: 30, 2: 50, 3: 75, 4: 100 };
    const d = durabilities[level];
    return { level, durability: d, maxDurability: d };
  }

  private generateItems(map: GameMap): Item[] {
    const items: Item[] = [];
    const types: ItemType[] = [
      "health", "health", "health",
      "ammo", "ammo", "ammo", "ammo",
      "ep_boost", "ep_boost",
      "gloo_wall", "gloo_wall",
      "vest_1", "vest_1", "vest_2",
      "helmet_1", "helmet_1", "helmet_2",
      "bandage", "bandage",
      "medkit",
      "speed_boost",
    ];

    for (const spawn of map.itemSpawns) {
      const type = types[Math.floor(Math.random() * types.length)];
      items.push({
        id: uid(),
        type,
        pos: {
          x: spawn.x + (Math.random() - 0.5) * 30,
          y: spawn.y + (Math.random() - 0.5) * 30,
        },
        collected: false,
      });
    }

    // Weapon pickups — scattered in corridors and rooms
    const weaponPickups: ItemType[] = ["wpn_smg", "wpn_smg", "wpn_shotgun", "wpn_shotgun", "wpn_pistol", "wpn_pistol", "wpn_rifle", "wpn_sniper"];
    for (let i = 0; i < 12; i++) {
      const type = weaponPickups[i % weaponPickups.length];
      const room = map.rooms[Math.floor(Math.random() * map.rooms.length)];
      items.push({
        id: uid(),
        type,
        pos: {
          x: room.x + 30 + Math.random() * (room.w - 60),
          y: room.y + 30 + Math.random() * (room.h - 60),
        },
        collected: false,
      });
    }

    // Add extra items in atrium/food court areas
    for (const room of map.rooms) {
      if (room.type === "atrium" || room.type === "food_court") {
        for (let i = 0; i < 2; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          items.push({
            id: uid(),
            type,
            pos: {
              x: room.x + 40 + Math.random() * (room.w - 80),
              y: room.y + 40 + Math.random() * (room.h - 80),
            },
            collected: false,
          });
        }
      }
    }

    return items;
  }

  // ==================================================================
  // Input setup
  // ==================================================================

  private setupInput(): void {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (down) this.keys.add(e.key.toLowerCase());
      else this.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", (e) => onKey(e, true));
    window.addEventListener("keyup", (e) => onKey(e, false));

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = ((e.clientX - rect.left) * scaleX) / this.zoom + this.camera.x;
      this.mouse.y = ((e.clientY - rect.top) * scaleY) / this.zoom + this.camera.y;
    });

    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.mouse.down = true;
      if (!this.audioInited) { audio.init(); this.audioInited = true; }
    });
    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.down = false;
    });

    // Touch
    this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e), { passive: false });
  }

  // Public touch action handlers (called from Game.tsx buttons)
  public pressAction(action: string): void {
    this.keys.add(action);
    // Auto-remove after a frame for one-shot actions
    setTimeout(() => this.keys.delete(action), 50);
  }

  public isMobile(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (!this.audioInited) { audio.init(); this.audioInited = true; }
    for (const touch of Array.from(e.changedTouches)) {
      const rect = this.canvas.getBoundingClientRect();
      const displayW = rect.width;
      const displayH = rect.height;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Left half = joystick (movement), right half = aim+shoot (standard mobile shooter)
      if (x < displayW * 0.45) {
        this.touchJoystick = { active: true, startX: x, startY: y, x, y };
      } else {
        this.touchShoot = { active: true, x: touch.clientX, y: touch.clientY };
        this.mouse.down = true;
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    for (const touch of Array.from(e.changedTouches)) {
      if (this.touchJoystick.active) {
        const rect = this.canvas.getBoundingClientRect();
        const dx = touch.clientX - rect.left - this.touchJoystick.startX;
        const dy = touch.clientY - rect.top - this.touchJoystick.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 55;
        if (dist > maxDist) {
          this.touchJoystick.x = this.touchJoystick.startX + (dx / dist) * maxDist;
          this.touchJoystick.y = this.touchJoystick.startY + (dy / dist) * maxDist;
        } else {
          this.touchJoystick.x = touch.clientX - rect.left;
          this.touchJoystick.y = touch.clientY - rect.top;
        }
      }
      if (this.touchShoot.active) {
        this.touchShoot.x = touch.clientX;
        this.touchShoot.y = touch.clientY;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    for (const touch of Array.from(e.changedTouches)) {
      const rect = this.canvas.getBoundingClientRect();
      const displayW = rect.width;
      const x = touch.clientX - rect.left;
      if (x < displayW * 0.45) {
        this.touchJoystick = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
      } else {
        this.touchShoot = { active: false, x: 0, y: 0 };
        this.mouse.down = false;
      }
    }
  }

  // ==================================================================
  // Game loop
  // ==================================================================

  private loop = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(dt);
    this.render();
    this.animFrame = requestAnimationFrame(this.loop);
  };

  // ==================================================================
  // Update
  // ==================================================================

  private update(dt: number): void {
    const s = this.state;
    if (s.gameOver) return;

    // Countdown
    if (!s.started) {
      s.countdown -= dt;
      if (s.countdown <= 0) s.started = true;
      return;
    }

    s.matchTime += dt;

    // Update audio listener position
    const human = s.players.get(this.humanId);
    if (human) audio.setListenerPos(human.pos);

    // Zone
    this.updateZone(dt);

    // EP → HP conversion
    this.epTickTimer += dt;
    if (this.epTickTimer >= EP_TICK_INTERVAL) {
      this.epTickTimer = 0;
      for (const [, p] of s.players) {
        if (!p.alive) continue;
        if (p.ep > 0) {
          const epToConvert = Math.min(p.ep, EP_TO_HP_RATE * EP_TICK_INTERVAL);
          p.ep -= epToConvert;
          p.health = Math.min(p.maxHealth, p.health + epToConvert);
        }
      }
    }

    // Medkit / bandage channeling
    for (const [pid, ch] of this.healChannel) {
      const player = s.players.get(pid);
      if (!player || !player.alive) { this.healChannel.delete(pid); continue; }
      const elapsed = (s.matchTime - ch.startTime); // use matchTime as proxy
      if (elapsed >= ch.duration) {
        player.health = Math.min(player.maxHealth, player.health + ch.healAmount);
        this.healChannel.delete(pid);
        audio.play({ type: "heal", x: player.pos.x, y: player.pos.y });
        this.spawnParticles(player.pos.x, player.pos.y, "#22c55e", 8, "heal");
      }
    }

    // Speed boost expiry
    const now = performance.now();
    for (const [pid, endTime] of this.speedBoosts) {
      if (now > endTime) this.speedBoosts.delete(pid);
    }

    // Player input & movement
    if (human && human.alive) {
      this.handlePlayerInput(human, dt);
    }

    // Bot AI
    for (const [, player] of s.players) {
      if (player.isBot && player.alive) {
        this.updateBot(player, dt);
      }
    }

    // Move all players & check collisions
    for (const [, player] of s.players) {
      if (!player.alive) continue;
      this.moveEntity(player, dt);
      player.survivalTime += dt;

      // Footstep sounds
      this.handleFootsteps(player, dt);
    }

    // Bullets
    this.updateBullets(dt);

    // Gloo walls decay
    this.updateGlooWalls(dt);

    // Zone damage
    this.applyZoneDamage(dt);

    // Particles
    this.updateParticles(dt);

    // Floating texts
    this.updateFloatingTexts(dt);

    // Hitmarkers
    this.updateHitmarkers(dt);

    // Alive count & game over
    let alive = 0;
    let lastAlive: Player | null = null;
    for (const [, p] of s.players) {
      if (p.alive) { alive++; lastAlive = p; }
    }
    s.aliveCount = alive;

    if (alive <= 1) {
      s.gameOver = true;
      s.winnerId = lastAlive?.id || null;
      if (lastAlive) {
        lastAlive.score += SCORE.PLACEMENT_WIN;
        lastAlive.placement = 1;
      }
      // Assign placements to dead players
      let deadPlacement = s.totalPlayers;
      const dead = Array.from(s.players.values()).filter(p => !p.alive).sort((a, b) => b.survivalTime - a.survivalTime);
      for (const p of dead) {
        if (p.placement === 0) {
          p.placement = deadPlacement;
          deadPlacement--;
        }
      }
      this._onGameOver?.(s);
    }

    if (s.matchTime >= s.matchDuration) {
      s.gameOver = true;
      let best: Player | null = null;
      for (const [, p] of s.players) {
        if (p.alive && (!best || p.health > best.health)) best = p;
      }
      s.winnerId = best?.id || null;
      this._onGameOver?.(s);
    }

    this._onUpdate?.(s);
  }

  // ==================================================================
  // Player input
  // ==================================================================

  private handlePlayerInput(player: Player, dt: number): void {
    let dx = 0;
    let dy = 0;

    if (this.keys.has("w") || this.keys.has("arrowup")) dy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) dy += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) dx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) dx += 1;

    // Touch joystick
    if (this.touchJoystick.active) {
      const jdx = this.touchJoystick.x - this.touchJoystick.startX;
      const jdy = this.touchJoystick.y - this.touchJoystick.startY;
      const dist = Math.sqrt(jdx * jdx + jdy * jdy);
      if (dist > 5) { dx = jdx / dist; dy = jdy / dist; }
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }

    // Crouch (Ctrl or C)
    player.isCrouching = this.keys.has("control") || this.keys.has("c");
    // Sprint (Shift)
    player.isSprinting = this.keys.has("shift") && !player.isCrouching && len > 0;

    // Cancel heal channel if moving
    if (len > 0 && this.healChannel.has(player.id)) {
      this.healChannel.delete(player.id);
    }

    // Speed
    let speed = player.walkSpeed;
    if (player.isSprinting) speed = player.sprintSpeed;
    if (player.isCrouching) speed = player.crouchSpeed;

    // Speed boost
    if (this.speedBoosts.has(player.id)) speed *= SPEED_BOOST_MULT;

    player.vel.x = dx * speed;
    player.vel.y = dy * speed;

    // Facing direction
    let targetX: number, targetY: number;
    if (this.touchShoot.active) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      targetX = ((this.touchShoot.x - rect.left) * scaleX) / this.zoom + this.camera.x;
      targetY = ((this.touchShoot.y - rect.top) * scaleY) / this.zoom + this.camera.y;
    } else {
      targetX = this.mouse.x;
      targetY = this.mouse.y;
    }
    player.facing = Math.atan2(targetY - player.pos.y, targetX - player.pos.x);

    // Shooting
    if (this.mouse.down || this.touchShoot.active) {
      const now = performance.now();
      const weaponDef = WEAPONS[player.weapon];
      const lastFire = this.lastFireTimes.get(player.id) || 0;
      const rs = this.reloadState.get(player.id);

      if (now - lastFire > weaponDef.fireRate && player.ammo > 0 && !rs?.reloading) {
        this.fireBullet(player);
        this.lastFireTimes.set(player.id, now);
      }
    }

    // Reload (R)
    if (this.keys.has("r")) {
      const rs = this.reloadState.get(player.id);
      if (!rs?.reloading && player.ammo < player.maxAmmo && player.reserveAmmo > 0) {
        this.reloadState.set(player.id, { reloading: true, startTime: performance.now() });
        audio.play({ type: "reload", x: player.pos.x, y: player.pos.y });
      }
    }

    // Check reload completion
    const rs = this.reloadState.get(player.id);
    if (rs?.reloading) {
      const elapsed = performance.now() - rs.startTime;
      const weaponDef = WEAPONS[player.weapon];
      if (elapsed >= weaponDef.reloadTime) {
        const needed = player.maxAmmo - player.ammo;
        const available = Math.min(needed, player.reserveAmmo);
        player.ammo += available;
        player.reserveAmmo -= available;
        this.reloadState.set(player.id, { reloading: false, startTime: 0 });
      }
    }

    // Gloo wall deploy (G key or Q)
    if (this.keys.has("g") || this.keys.has("q")) {
      this.keys.delete("g");
      this.keys.delete("q");
      this.deployGlooWall(player);
    }

    // Use medkit (5) or bandage (4)
    if (this.keys.has("5") && !this.healChannel.has(player.id)) {
      this.keys.delete("5");
      this.startHealChannel(player, "medkit");
    }
    if (this.keys.has("4") && !this.healChannel.has(player.id)) {
      this.keys.delete("4");
      this.startHealChannel(player, "bandage");
    }
  }

  // ==================================================================
  // Bot AI (improved)
  // ==================================================================

  private updateBot(bot: Player, dt: number): void {
    const s = this.state;

    let nearest: Player | null = null;
    let nearDist = Infinity;
    for (const [, p] of s.players) {
      if (p.id === bot.id || !p.alive) continue;
      const d = this.dist(bot.pos, p.pos);
      if (d < nearDist) { nearDist = d; nearest = p; }
    }

    const aggroRange = 280;
    const fleeRange = 130;

    // Reload if empty
    const rs = this.reloadState.get(bot.id);
    if (bot.ammo <= 0 && !rs?.reloading) {
      if (bot.reserveAmmo > 0) {
        this.reloadState.set(bot.id, { reloading: true, startTime: performance.now() });
      } else {
        bot.ammo = bot.maxAmmo; // infinite bot ammo fallback
      }
    }

    if (nearest && nearDist < aggroRange) {
      const angle = Math.atan2(nearest.pos.y - bot.pos.y, nearest.pos.x - bot.pos.x);

      if (nearDist < fleeRange && bot.health < 35) {
        bot.vel.x = -Math.cos(angle) * 170;
        bot.vel.y = -Math.sin(angle) * 170;
        bot.isSprinting = true;
        bot.isCrouching = false;
      } else {
        const strafeAngle = angle + Math.sin(s.matchTime * 1.5 + bot.pos.x * 0.01) * 0.35;
        const moveSpeed = nearDist < 200 ? 90 : 120;
        bot.vel.x = Math.cos(strafeAngle) * moveSpeed;
        bot.vel.y = Math.sin(strafeAngle) * moveSpeed;
        bot.isSprinting = nearDist > 250;
        bot.isCrouching = false;
      }

      bot.facing = angle;

      // Shoot (nerfed: slower reaction, lower accuracy)
      if (nearDist < aggroRange * 0.75 && bot.ammo > 0 && !rs?.reloading) {
        const now = performance.now();
        const weaponDef = WEAPONS[bot.weapon];
        const lastFire = this.lastFireTimes.get(bot.id) || 0;
        const accuracy = 0.25 + Math.random() * 0.1;
        const fireDelay = weaponDef.fireRate * 2.2;
        if (now - lastFire > fireDelay && Math.random() < accuracy) {
          this.fireBullet(bot);
          this.lastFireTimes.set(bot.id, now);
        }
      }

      // Rare gloo wall usage
      if (nearDist < 150 && bot.glooWalls > 0 && bot.health < 30 && Math.random() < 0.003) {
        this.deployGlooWall(bot);
      }
    } else {
      // Wander toward zone
      const toZoneX = s.zone.centerX - bot.pos.x;
      const toZoneY = s.zone.centerY - bot.pos.y;
      const toZoneDist = Math.sqrt(toZoneX * toZoneX + toZoneY * toZoneY);

      if (toZoneDist > s.zone.radius * 0.5) {
        bot.vel.x = (toZoneX / toZoneDist) * 110;
        bot.vel.y = (toZoneY / toZoneDist) * 110;
        bot.facing = Math.atan2(toZoneY, toZoneX);
      } else {
        if (Math.random() < 0.01) {
          const a = Math.random() * Math.PI * 2;
          bot.vel.x = Math.cos(a) * 60;
          bot.vel.y = Math.sin(a) * 60;
          bot.facing = a;
        }
      }
      bot.isSprinting = false;
      bot.isCrouching = false;
    }
  }

  // ==================================================================
  // Movement & collision
  // ==================================================================

  private moveEntity(entity: Player, dt: number): void {
    const newX = entity.pos.x + entity.vel.x * dt;
    const newY = entity.pos.y + entity.vel.y * dt;

    const r = entity.radius;
    const testRect = { x: newX - r, y: newY - r, w: r * 2, h: r * 2 };

    let canMoveX = true;
    let canMoveY = true;

    // Check wall collisions
    for (const wall of this.state.map.walls) {
      if (this.rectsOverlap(testRect, wall)) {
        const xRect = { x: newX - r, y: entity.pos.y - r, w: r * 2, h: r * 2 };
        if (this.rectsOverlap(xRect, wall)) canMoveX = false;
        const yRect = { x: entity.pos.x - r, y: newY - r, w: r * 2, h: r * 2 };
        if (this.rectsOverlap(yRect, wall)) canMoveY = false;
      }
    }

    // Check gloo wall collisions
    for (const gw of this.state.glooWalls) {
      const gwRect = { x: gw.pos.x - gw.width / 2, y: gw.pos.y - gw.height / 2, w: gw.width, h: gw.height };
      if (this.rectsOverlap(testRect, gwRect)) {
        const xRect = { x: newX - r, y: entity.pos.y - r, w: r * 2, h: r * 2 };
        if (this.rectsOverlap(xRect, gwRect)) canMoveX = false;
        const yRect = { x: entity.pos.x - r, y: newY - r, w: r * 2, h: r * 2 };
        if (this.rectsOverlap(yRect, gwRect)) canMoveY = false;
      }
    }

    if (canMoveX) entity.pos.x = newX;
    if (canMoveY) entity.pos.y = newY;

    entity.pos.x = Math.max(r, Math.min(this.state.map.width - r, entity.pos.x));
    entity.pos.y = Math.max(r, Math.min(this.state.map.height - r, entity.pos.y));

    // Item pickups
    for (const item of this.state.items) {
      if (item.collected) continue;
      if (this.dist(entity.pos, item.pos) < entity.radius + 14) {
        this.collectItem(entity, item);
      }
    }
  }

  // ==================================================================
  // Item collection
  // ==================================================================

  private collectItem(player: Player, item: Item): void {
    item.collected = true;
    player.itemsCollected++;
    player.score += SCORE.ITEM_COLLECT;
    audio.play({ type: "pickup", x: player.pos.x, y: player.pos.y });
    this.spawnParticles(item.pos.x, item.pos.y, this.getItemColor(item.type), 5, "spark");

    switch (item.type) {
      case "health":
        player.health = Math.min(player.maxHealth, player.health + 30);
        break;
      case "medkit":
        this.startHealChannel(player, "medkit");
        break;
      case "bandage":
        this.startHealChannel(player, "bandage");
        break;
      case "ep_boost":
        player.ep = Math.min(player.maxEp, player.ep + 50);
        break;
      case "ammo":
        player.reserveAmmo += 30;
        break;
      case "gloo_wall":
        player.glooWalls = Math.min(player.maxGlooWalls, player.glooWalls + 1);
        break;
      case "vest_1":
        if (player.armor.level < 1) player.armor = this.createArmor(1);
        else { player.armor.durability = Math.min(player.armor.maxDurability, player.armor.durability + 25); }
        break;
      case "vest_2":
        if (player.armor.level < 2) player.armor = this.createArmor(2);
        else { player.armor.durability = Math.min(player.armor.maxDurability, player.armor.durability + 25); }
        break;
      case "vest_3":
        if (player.armor.level < 3) player.armor = this.createArmor(3);
        else { player.armor.durability = Math.min(player.armor.maxDurability, player.armor.durability + 25); }
        break;
      case "vest_4":
        player.armor = this.createArmor(4);
        break;
      case "helmet_1":
        if (player.helmet.level < 1) player.helmet = this.createHelmet(1);
        else { player.helmet.durability = Math.min(player.helmet.maxDurability, player.helmet.durability + 15); }
        break;
      case "helmet_2":
        if (player.helmet.level < 2) player.helmet = this.createHelmet(2);
        else { player.helmet.durability = Math.min(player.helmet.maxDurability, player.helmet.durability + 15); }
        break;
      case "helmet_3":
        if (player.helmet.level < 3) player.helmet = this.createHelmet(3);
        else { player.helmet.durability = Math.min(player.helmet.maxDurability, player.helmet.durability + 15); }
        break;
      case "helmet_4":
        player.helmet = this.createHelmet(4);
        break;
      case "speed_boost":
        this.speedBoosts.set(player.id, performance.now() + SPEED_BOOST_DURATION * 1000);
        break;
      case "wpn_pistol":
      case "wpn_smg":
      case "wpn_rifle":
      case "wpn_shotgun":
      case "wpn_sniper": {
        const wpnType = item.type.replace("wpn_", "") as WeaponType;
        player.weapon = wpnType;
        const def = WEAPONS[wpnType];
        player.ammo = def.magSize;
        player.maxAmmo = def.magSize;
        player.reserveAmmo = def.magSize * 3;
        break;
      }
    }
  }

  private startHealChannel(player: Player, type: "medkit" | "bandage"): void {
    if (player.health >= player.maxHealth) return;
    // Cancel existing channel
    this.healChannel.delete(player.id);
    const dur = type === "medkit" ? MEDKIT_TIME : BANDAGE_TIME;
    const heal = type === "medkit" ? MEDKIT_HEAL : BANDAGE_HEAL;
    this.healChannel.set(player.id, {
      type,
      startTime: this.state.matchTime,
      duration: dur,
      healAmount: Math.min(heal, player.maxHealth - player.health),
    });
  }

  // ==================================================================
  // Gloo walls
  // ==================================================================

  private deployGlooWall(player: Player): void {
    if (player.glooWalls <= 0) return;

    // Place wall in front of the player
    const dist = 45;
    const wx = player.pos.x + Math.cos(player.facing) * dist;
    const wy = player.pos.y + Math.sin(player.facing) * dist;

    // Check no overlap with existing walls
    const testRect = { x: wx - GLOO_WALL_SIZE / 2, y: wy - GLOO_WALL_SIZE / 2, w: GLOO_WALL_SIZE, h: GLOO_WALL_SIZE };
    for (const wall of this.state.map.walls) {
      if (this.rectsOverlap(testRect, wall)) return;
    }

    player.glooWalls--;
    this.state.glooWalls.push({
      id: uid(),
      ownerId: player.id,
      pos: { x: wx, y: wy },
      rotation: player.facing,
      width: GLOO_WALL_SIZE,
      height: 8,
      health: GLOO_WALL_HP,
      maxHealth: GLOO_WALL_HP,
      lifetime: GLOO_WALL_LIFETIME,
    });

    audio.play({ type: "gloo_place", x: wx, y: wy });
    this.spawnParticles(wx, wy, "#00e5ff", 10, "spark");
  }

  private updateGlooWalls(dt: number): void {
    this.state.glooWalls = this.state.glooWalls.filter(gw => {
      gw.lifetime -= dt;
      return gw.lifetime > 0 && gw.health > 0;
    });
  }

  // ==================================================================
  // Footsteps
  // ==================================================================

  private handleFootsteps(player: Player, dt: number): void {
    const vx = player.vel.x;
    const vy = player.vel.y;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 20) return;

    const interval = player.isSprinting ? STEPS_INTERVAL_SPRINT : STEPS_INTERVAL_WALK;
    const timer = (this.stepTimers.get(player.id) || 0) + dt;
    if (timer >= interval) {
      this.stepTimers.set(player.id, 0);
      if (!player.isBot) {
        audio.play({ type: "step", x: player.pos.x, y: player.pos.y });
      }
    } else {
      this.stepTimers.set(player.id, timer);
    }
  }

  // ==================================================================
  // Bullets
  // ==================================================================

  private fireBullet(owner: Player): void {
    const weaponDef = WEAPONS[owner.weapon];
    const isMoving = Math.sqrt(owner.vel.x ** 2 + owner.vel.y ** 2) > 30;
    const spread = calcSpread(weaponDef, isMoving, owner.isCrouching);

    for (let i = 0; i < weaponDef.pellets; i++) {
      const angle = owner.facing + (Math.random() - 0.5) * spread;
      const bullet: Bullet = {
        id: uid(),
        ownerId: owner.id,
        ownerName: owner.name,
        pos: { x: owner.pos.x + Math.cos(owner.facing) * 15, y: owner.pos.y + Math.sin(owner.facing) * 15 },
        vel: { x: Math.cos(angle) * weaponDef.bulletSpeed, y: Math.sin(angle) * weaponDef.bulletSpeed },
        damage: weaponDef.damage,
        baseDamage: weaponDef.damage,
        isHeadshot: Math.random() < (owner.weapon === "sniper" ? 0.2 : owner.weapon === "rifle" ? 0.12 : 0.08),
        lifetime: weaponDef.range,
        maxLifetime: weaponDef.range,
        trail: [],
        weaponType: owner.weapon,
      };
      this.state.bullets.push(bullet);
    }

    owner.ammo--;
    audio.play({ type: "shoot", weapon: owner.weapon, x: owner.pos.x, y: owner.pos.y });

    // Muzzle flash particles
    this.spawnParticles(
      owner.pos.x + Math.cos(owner.facing) * 18,
      owner.pos.y + Math.sin(owner.facing) * 18,
      "#ffaa00", 3, "muzzle",
    );

    // Screen shake for human
    if (!owner.isBot) {
      this.state.screenShake = Math.max(this.state.screenShake, WEAPONS[owner.weapon].recoil * 4);
    }
  }

  private updateBullets(dt: number): void {
    const s = this.state;
    const surviving: Bullet[] = [];

    for (const bullet of s.bullets) {
      bullet.lifetime -= dt;
      if (bullet.lifetime <= 0) continue;

      bullet.trail.push({ x: bullet.pos.x, y: bullet.pos.y });
      if (bullet.trail.length > 6) bullet.trail.shift();

      bullet.pos.x += bullet.vel.x * dt;
      bullet.pos.y += bullet.vel.y * dt;

      // Wall collision
      let hitWall = false;
      for (const wall of s.map.walls) {
        if (bullet.pos.x >= wall.x && bullet.pos.x <= wall.x + wall.w &&
            bullet.pos.y >= wall.y && bullet.pos.y <= wall.y + wall.h) {
          hitWall = true;
          this.spawnParticles(bullet.pos.x, bullet.pos.y, "#888", 3, "hit");
          break;
        }
      }
      if (hitWall) continue;

      // Gloo wall collision
      let hitGloo = false;
      for (const gw of s.glooWalls) {
        const gx = gw.pos.x - gw.width / 2;
        const gy = gw.pos.y - gw.height / 2;
        if (bullet.pos.x >= gx && bullet.pos.x <= gx + gw.width &&
            bullet.pos.y >= gy && bullet.pos.y <= gy + gw.height) {
          gw.health -= bullet.damage;
          hitGloo = true;
          this.spawnParticles(bullet.pos.x, bullet.pos.y, "#00e5ff", 3, "hit");
          break;
        }
      }
      if (hitGloo) continue;

      // Out of bounds
      if (bullet.pos.x < 0 || bullet.pos.x > s.map.width ||
          bullet.pos.y < 0 || bullet.pos.y > s.map.height) continue;

      // Hit player
      let hit = false;
      for (const [, player] of s.players) {
        if (player.id === bullet.ownerId || !player.alive) continue;
        if (this.dist(bullet.pos, player.pos) < player.radius + 5) {
          const attacker = s.players.get(bullet.ownerId);
          const distance = this.dist(bullet.pos, attacker?.pos || bullet.pos);
          const weaponDef = WEAPONS[bullet.weaponType];

          // Calculate damage with falloff, armor, headshot
          const isHeadshot = bullet.isHeadshot;
          let dmg = calcDamage(weaponDef, bullet.baseDamage, distance, isHeadshot, player.armor.level);

          // Helmet reduces headshot damage
          if (isHeadshot && player.helmet.level > 0) {
            const helmetReduction = [0, 0.15, 0.25, 0.35, 0.45][player.helmet.level];
            dmg = Math.floor(dmg * (1 - helmetReduction));
            // Helmet durability loss
            player.helmet.durability -= dmg * 0.3;
            if (player.helmet.durability <= 0) {
              player.helmet = this.createHelmet(0);
            }
          }

          // Armor durability loss
          if (player.armor.level > 0 && !isHeadshot) {
            player.armor.durability -= dmg * 0.2;
            if (player.armor.durability <= 0) {
              player.armor = this.createArmor(0);
            }
          }

          // Damage EP first (EP absorbs 20% of damage)
          if (player.ep > 0) {
            const epAbsorb = dmg * 0.2;
            player.ep = Math.max(0, player.ep - epAbsorb);
            dmg = Math.floor(dmg * 0.8);
          }

          player.health -= dmg;
          player.lastDamageTime = s.matchTime;

          if (attacker) {
            attacker.damageDealt += dmg;
            // Track for assists
            if (!player.assists.includes(attacker.id)) {
              player.assists.push(attacker.id);
            }
          }

          // Hit particles
          this.spawnParticles(bullet.pos.x, bullet.pos.y, isHeadshot ? "#ff2b3d" : "#ff8844", isHeadshot ? 8 : 4, "hit");
          audio.play({ type: "hit", x: bullet.pos.x, y: bullet.pos.y, isHeadshot });

          // Floating damage number
          const dmgText = isHeadshot ? `-${dmg}!` : `-${dmg}`;
          s.floatingTexts.push({
            x: bullet.pos.x + (Math.random() - 0.5) * 10,
            y: bullet.pos.y - 10,
            text: dmgText,
            color: isHeadshot ? "#ff2b3d" : "#ffcc00",
            life: 1.0,
            maxLife: 1.0,
            vy: -60,
            fontSize: isHeadshot ? 16 : 13,
          });

          // Hitmarker (only for human player's hits)
          if (bullet.ownerId === this.humanId) {
            s.hitmarkers.push({
              x: bullet.pos.x,
              y: bullet.pos.y,
              life: 0.2,
              isHeadshot,
              size: isHeadshot ? 10 : 7,
            });
          }

          if (player.health <= 0) {
            player.health = 0;
            player.alive = false;
            player.placement = s.aliveCount;

            // Human player died — stop engine and show results
            if (player.id === this.humanId) {
              this.running = false;
              this._onHumanDeath?.(s);
            }

            // Killer stats
            if (attacker) {
              attacker.kills++;
              attacker.score += SCORE.KILL;
              attacker.killstreak++;
              if (attacker.killstreak > attacker.killstreakMax) attacker.killstreakMax = attacker.killstreak;
              if (isHeadshot) {
                attacker.headshots++;
                attacker.score += SCORE.HEADSHOT;
              }

              const streakLabel = getKillstreakLabel(attacker.killstreak);
              if (streakLabel) {
                this.addKillFeed({ killerName: attacker.name, victimName: `${streakLabel} ${player.name}`, isHeadshot: false, timestamp: s.matchTime });
              }

              audio.play({ type: "kill", x: player.pos.x, y: player.pos.y });
            }

            // Assist points
            for (const assistId of player.assists) {
              if (assistId !== bullet.ownerId) {
                const assistPlayer = s.players.get(assistId);
                if (assistPlayer) {
                  assistPlayer.score += SCORE.ASSIST;
                  assistPlayer.assists.push(player.id);
                }
              }
            }

            this.addKillFeed({ killerName: bullet.ownerName, victimName: player.name, isHeadshot, weaponType: bullet.weaponType, timestamp: s.matchTime });

            // Death particles
            this.spawnParticles(player.pos.x, player.pos.y, player.color, 15, "death");
          }

          hit = true;
          break;
        }
      }
      if (hit) continue;

      surviving.push(bullet);
    }

    s.bullets = surviving;
  }

  // ==================================================================
  // Zone
  // ==================================================================

  private updateZone(dt: number): void {
    const z = this.state.zone;
    z.nextShrinkTime -= dt;

    if (z.nextShrinkTime <= 0) {
      z.phase++;
      z.targetRadius = Math.max(60, z.radius * 0.55);
      z.shrinkSpeed = (z.radius - z.targetRadius) / 18;
      z.damage = 3 + z.phase * 4;
      z.nextShrinkTime = 25;
      audio.play({ type: "zone_warning" });
    }

    if (z.radius > z.targetRadius) {
      z.radius -= z.shrinkSpeed * dt;
      if (z.radius < z.targetRadius) z.radius = z.targetRadius;
    }
  }

  private applyZoneDamage(dt: number): void {
    const z = this.state.zone;
    for (const [, player] of this.state.players) {
      if (!player.alive) continue;
      const distFromCenter = this.dist(player.pos, { x: z.centerX, y: z.centerY });
      if (distFromCenter > z.radius) {
        player.health -= z.damage * dt;
        if (player.health <= 0) {
          player.health = 0;
          player.alive = false;
          player.placement = this.state.aliveCount;
          // Human player died from zone — stop engine and show results
          if (player.id === this.humanId) {
            this.running = false;
            this._onHumanDeath?.(this.state);
          }
          this.addKillFeed({ killerName: "⚡ ZONA", victimName: player.name, isHeadshot: false, timestamp: this.state.matchTime });
          this.spawnParticles(player.pos.x, player.pos.y, "#ff2b3d", 12, "death");
        }
      }
    }
  }

  // ==================================================================
  // Particles
  // ==================================================================

  private spawnParticles(x: number, y: number, color: string, count: number, type: Particle["type"]): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.3 + Math.random() * 0.4,
        color,
        size: type === "death" ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
        type,
      });
    }
  }

  private updateParticles(dt: number): void {
    this.state.particles = this.state.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt;
      return p.life > 0;
    });
  }

  private updateFloatingTexts(dt: number): void {
    this.state.floatingTexts = this.state.floatingTexts.filter(ft => {
      ft.y += ft.vy * dt;
      ft.life -= dt;
      return ft.life > 0;
    });
  }

  private updateHitmarkers(dt: number): void {
    this.state.hitmarkers = this.state.hitmarkers.filter(hm => {
      hm.life -= dt;
      return hm.life > 0;
    });
  }

  // ==================================================================
  // Rendering
  // ==================================================================

  private render(): void {
    const s = this.state;
    const c = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Calculate view size based on zoom (higher zoom = smaller view = zoomed in)
    const viewW = W / this.zoom;
    const viewH = H / this.zoom;

    const human = s.players.get(this.humanId);
    if (human) {
      this.camera.x = human.pos.x - viewW / 2;
      this.camera.y = human.pos.y - viewH / 2;
    }

    // Screen shake decay
    let shakeX = 0, shakeY = 0;
    if (s.screenShake > 0.1) {
      shakeX = (Math.random() - 0.5) * s.screenShake * 2;
      shakeY = (Math.random() - 0.5) * s.screenShake * 2;
      s.screenShake *= 0.85;
    } else {
      s.screenShake = 0;
    }

    // Clear
    c.fillStyle = "#0a0a0c";
    c.fillRect(0, 0, W, H);

    c.save();
    c.scale(this.zoom, this.zoom);
    c.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    this.renderMap(c);
    this.renderZone(c);
    this.renderItems(c);
    this.renderGlooWalls(c);
    this.renderParticles(c);
    this.renderFloatingTexts(c);
    this.renderHitmarkers(c);

    // Sort players by Y for pseudo-depth
    const sortedPlayers = Array.from(s.players.values()).filter(p => p.alive).sort((a, b) => a.pos.y - b.pos.y);
    for (const player of sortedPlayers) {
      this.renderPlayer(c, player);
    }

    this.renderBullets(c);

    // Crosshair / aim line for human player
    if (human && human.alive) {
      this.renderCrosshair(c, human);
    }

    c.restore();

    // Reload progress bar (on screen)
    if (human) {
      const rs = this.reloadState.get(human.id);
      if (rs?.reloading) {
        const weaponDef = WEAPONS[human.weapon];
        const elapsed = performance.now() - rs.startTime;
        const pct = Math.min(1, elapsed / weaponDef.reloadTime);
        c.fillStyle = "rgba(0,0,0,0.5)";
        c.fillRect(W / 2 - 60, H / 2 + 30, 120, 6);
        c.fillStyle = "#ffcc00";
        c.fillRect(W / 2 - 60, H / 2 + 30, 120 * pct, 6);
        c.fillStyle = "#ffcc00";
        c.font = "10px Oswald, sans-serif";
        c.textAlign = "center";
        c.fillText("RECARGA...", W / 2, H / 2 + 50);
        c.textAlign = "start";
      }

      // Medkit/bandage progress
      const ch = this.healChannel.get(human.id);
      if (ch) {
        const elapsed = this.state.matchTime - ch.startTime;
        const pct = Math.min(1, elapsed / ch.duration);
        c.fillStyle = "rgba(0,0,0,0.5)";
        c.fillRect(W / 2 - 60, H / 2 + 30, 120, 6);
        c.fillStyle = "#22c55e";
        c.fillRect(W / 2 - 60, H / 2 + 30, 120 * pct, 6);
        c.fillStyle = "#22c55e";
        c.font = "10px Oswald, sans-serif";
        c.textAlign = "center";
        c.fillText(ch.type === "medkit" ? "CURANDO (KIT)..." : "CURANDO (BANDAGEM)...", W / 2, H / 2 + 50);
        c.textAlign = "start";
      }

      // Speed boost indicator
      if (this.speedBoosts.has(human.id)) {
        const remaining = Math.max(0, (this.speedBoosts.get(human.id)! - performance.now()) / 1000);
        c.fillStyle = "rgba(59,130,246,0.3)";
        c.fillRect(W / 2 - 40, H / 2 - 30, 80, 16);
        c.fillStyle = "#3b82f6";
        c.font = "10px Oswald, sans-serif";
        c.textAlign = "center";
        c.fillText(`⚡ ${remaining.toFixed(0)}s`, W / 2, H / 2 - 18);
        c.textAlign = "start";
      }
    }

    // Countdown
    if (!s.started) {
      c.fillStyle = "rgba(0,0,0,0.6)";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#ff2b3d";
      c.font = "bold 72px Anton, sans-serif";
      c.textAlign = "center";
      c.fillText(Math.ceil(s.countdown).toString(), W / 2, H / 2 + 24);
      c.textAlign = "start";
    }
  }

  private renderMap(c: CanvasRenderingContext2D): void {
    const map = this.state.map;
    c.fillStyle = map.color;
    c.fillRect(0, 0, map.width, map.height);

    // Grid
    c.strokeStyle = "rgba(255,255,255,0.03)";
    c.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < map.width; x += step) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, map.height); c.stroke();
    }
    for (let y = 0; y < map.height; y += step) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(map.width, y); c.stroke();
    }

    // Room floors
    for (const room of map.rooms) {
      const colors: Record<string, string> = {
        food_court: "rgba(255,204,0,0.06)", store: "rgba(255,255,255,0.04)",
        anchor: "rgba(255,43,61,0.06)", corridor: "rgba(255,255,255,0.02)",
        atrium: "rgba(255,255,255,0.05)", parking: "rgba(100,100,100,0.08)",
        escalator: "rgba(100,200,255,0.06)", restroom: "rgba(100,100,200,0.06)",
        entrance: "rgba(200,255,200,0.06)",
      };
      c.fillStyle = colors[room.type] || "rgba(255,255,255,0.03)";
      c.fillRect(room.x, room.y, room.w, room.h);

      if (room.type !== "corridor") {
        c.fillStyle = "rgba(255,255,255,0.15)";
        c.font = "10px Oswald, sans-serif";
        c.textAlign = "center";
        c.fillText(room.name.toUpperCase(), room.x + room.w / 2, room.y + room.h / 2 + 4);
        c.textAlign = "start";
      }
    }

    // Walls
    for (const wall of map.walls) {
      if (wall.type === "wall") {
        c.fillStyle = "#2a2a30";
        c.fillRect(wall.x, wall.y, wall.w, wall.h);
        c.fillStyle = "rgba(255,255,255,0.05)";
        c.fillRect(wall.x, wall.y, wall.w, 2);
      } else if (wall.type === "cover") {
        c.fillStyle = "#1e1e24";
        c.fillRect(wall.x, wall.y, wall.w, wall.h);
        c.strokeStyle = "rgba(255,255,255,0.08)";
        c.lineWidth = 1;
        c.strokeRect(wall.x, wall.y, wall.w, wall.h);
      }
    }
  }

  private renderZone(c: CanvasRenderingContext2D): void {
    const z = this.state.zone;
    const map = this.state.map;

    c.save();
    c.fillStyle = "rgba(255,43,61,0.12)";
    c.fillRect(0, 0, map.width, map.height);
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    c.arc(z.centerX, z.centerY, z.radius, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";

    // Animated zone border
    c.strokeStyle = "#ff2b3d";
    c.lineWidth = 3;
    const dashOffset = performance.now() / 50;
    c.setLineDash([10, 5]);
    c.lineDashOffset = dashOffset;
    c.beginPath();
    c.arc(z.centerX, z.centerY, z.radius, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  private renderItems(c: CanvasRenderingContext2D): void {
    const time = performance.now();
    for (const item of this.state.items) {
      if (item.collected) continue;

      const color = this.getItemColor(item.type);
      const icon = this.getItemIcon(item.type);
      const isWeapon = item.type.startsWith("wpn_");

      // Floating bob
      const bob = Math.sin(time / 400 + item.pos.x * 0.1) * 2;
      const baseRadius = isWeapon ? 13 : 10;
      // Glow ring
      c.globalAlpha = 0.25 + Math.sin(time / 300 + item.pos.x) * 0.15;
      c.fillStyle = color;
      c.beginPath();
      c.arc(item.pos.x, item.pos.y + bob, baseRadius + 3, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;

      // Background circle
      c.fillStyle = "rgba(10,10,12,0.85)";
      c.beginPath();
      c.arc(item.pos.x, item.pos.y + bob, baseRadius, 0, Math.PI * 2);
      c.fill();

      // Colored border
      c.strokeStyle = color;
      c.lineWidth = isWeapon ? 2 : 1.5;
      c.beginPath();
      c.arc(item.pos.x, item.pos.y + bob, baseRadius, 0, Math.PI * 2);
      c.stroke();

      // Icon text
      c.fillStyle = color;
      c.font = isWeapon ? "bold 9px Oswald, sans-serif" : "bold 10px Inter, sans-serif";
      c.textAlign = "center";
      c.fillText(icon, item.pos.x, item.pos.y + bob + 4);
      c.textAlign = "start";
    }
  }

  private renderGlooWalls(c: CanvasRenderingContext2D): void {
    const time = performance.now();
    for (const gw of this.state.glooWalls) {
      c.save();
      c.translate(gw.pos.x, gw.pos.y);
      c.rotate(gw.rotation);

      const pct = gw.health / gw.maxHealth;
      const w = gw.width;
      const h = 10;

      // Outer glow — stronger when healthier
      c.shadowColor = `rgba(0,229,255,${0.2 + pct * 0.4})`;
      c.shadowBlur = 6 + Math.sin(time / 200) * 3 * pct;

      // Ice body with gradient
      const grad = c.createLinearGradient(-w / 2, 0, w / 2, 0);
      grad.addColorStop(0, `rgba(0,180,230,${0.3 + pct * 0.4})`);
      grad.addColorStop(0.5, `rgba(0,229,255,${0.4 + pct * 0.5})`);
      grad.addColorStop(1, `rgba(0,180,230,${0.3 + pct * 0.4})`);
      c.fillStyle = grad;
      this.roundRect(c, -w / 2, -h / 2, w, h, 3);
      c.fill();

      // Border
      c.strokeStyle = `rgba(0,255,255,${0.4 + pct * 0.6})`;
      c.lineWidth = 1.5;
      this.roundRect(c, -w / 2, -h / 2, w, h, 3);
      c.stroke();

      // Frost crystal lines
      c.shadowBlur = 0;
      c.strokeStyle = "rgba(255,255,255,0.2)";
      c.lineWidth = 0.8;
      const segments = 5;
      for (let i = 0; i < segments; i++) {
        const sx = -w / 2 + (w / segments) * i + w / segments / 2;
        c.beginPath();
        c.moveTo(sx, -h / 2 + 1);
        c.lineTo(sx + (Math.random() - 0.5) * 6, h / 2 - 1);
        c.stroke();
      }

      // Top highlight
      c.fillStyle = "rgba(255,255,255,0.12)";
      c.fillRect(-w / 2 + 3, -h / 2 + 1, w - 6, 2);

      // DURABILITY CRACKS — show when wall takes damage
      if (pct < 0.8) {
        c.strokeStyle = `rgba(255,255,255,${(0.8 - pct) * 0.6})`;
        c.lineWidth = 1;
        const crackCount = Math.floor((1 - pct) * 8);
        for (let i = 0; i < crackCount; i++) {
          const cx = -w / 2 + Math.sin(i * 7.3 + gw.pos.x) * w * 0.4 + w / 2;
          const cy = -h / 2 + Math.cos(i * 5.1 + gw.pos.y) * h * 0.3 + h / 2;
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(cx + Math.sin(i * 3.7) * 8, cy + Math.cos(i * 2.9) * 4);
          c.stroke();
        }
      }

      // DESTROYED FLASH — when very low, show red warning
      if (pct < 0.25) {
        c.fillStyle = `rgba(255,43,61,${0.15 + Math.sin(time / 100) * 0.1})`;
        this.roundRect(c, -w / 2, -h / 2, w, h, 3);
        c.fill();
      }

      // Durability bar below the wall
      if (pct < 1) {
        c.fillStyle = "rgba(0,0,0,0.5)";
        c.fillRect(-w / 2, h / 2 + 2, w, 2);
        const barColor = pct > 0.5 ? "#00e5ff" : pct > 0.25 ? "#f59e0b" : "#ff2b3d";
        c.fillStyle = barColor;
        c.fillRect(-w / 2, h / 2 + 2, w * pct, 2);
      }

      c.restore();
    }
  }

  private renderParticles(c: CanvasRenderingContext2D): void {
    for (const p of this.state.particles) {
      const alpha = p.life / p.maxLife;
      c.globalAlpha = alpha;
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  private renderFloatingTexts(c: CanvasRenderingContext2D): void {
    for (const ft of this.state.floatingTexts) {
      const alpha = Math.min(1, ft.life / ft.maxLife * 2);
      const scale = 1 + (1 - ft.life / ft.maxLife) * 0.3;
      c.globalAlpha = alpha;
      c.fillStyle = ft.color;
      c.font = `bold ${Math.round(ft.fontSize * scale)}px Anton, sans-serif`;
      c.textAlign = "center";
      c.strokeStyle = "rgba(0,0,0,0.7)";
      c.lineWidth = 3;
      c.strokeText(ft.text, ft.x, ft.y);
      c.fillText(ft.text, ft.x, ft.y);
      c.textAlign = "start";
    }
    c.globalAlpha = 1;
  }

  private renderHitmarkers(c: CanvasRenderingContext2D): void {
    const human = this.state.players.get(this.humanId);
    if (!human || !human.alive) return;

    for (const hm of this.state.hitmarkers) {
      const alpha = hm.life / 0.2;
      const size = hm.size * (1 + (1 - alpha) * 0.5);
      c.globalAlpha = alpha * 0.9;
      c.strokeStyle = hm.isHeadshot ? "#ff2b3d" : "#ffffff";
      c.lineWidth = 2;

      // X shape hitmarker
      const dx = size * 0.4;
      c.beginPath();
      c.moveTo(hm.x - dx, hm.y - dx);
      c.lineTo(hm.x - dx * 0.3, hm.y - dx * 0.3);
      c.moveTo(hm.x + dx, hm.y - dx);
      c.lineTo(hm.x + dx * 0.3, hm.y - dx * 0.3);
      c.moveTo(hm.x - dx, hm.y + dx);
      c.lineTo(hm.x - dx * 0.3, hm.y + dx * 0.3);
      c.moveTo(hm.x + dx, hm.y + dx);
      c.lineTo(hm.x + dx * 0.3, hm.y + dx * 0.3);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  private renderPlayer(c: CanvasRenderingContext2D, player: Player): void {
    if (!player.alive) return;
    const isHuman = player.id === this.humanId;

    c.save();
    c.translate(player.pos.x, player.pos.y);

    // Shadow
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.beginPath();
    c.ellipse(2, player.radius + 4, player.radius * 0.85, 5, 0, 0, Math.PI * 2);
    c.fill();

    const bodyLen = player.isCrouching ? 18 : 24;
    const bodyWid = player.isCrouching ? 16 : 14;

    c.rotate(player.facing);

    // --- ARM / HAND holding weapon (behind body) ---
    c.fillStyle = this.skinColor(player.color);
    c.beginPath();
    c.ellipse(bodyLen / 2 - 6, 5, 4, 3, 0.3, 0, Math.PI * 2);
    c.fill();

    // --- TORSO ---
    // Outer body
    const darkerColor = this.darkenColor(player.color, 0.7);
    c.fillStyle = darkerColor;
    c.beginPath();
    c.ellipse(0, 0, bodyLen / 2 + 1, bodyWid / 2 + 1, 0, 0, Math.PI * 2);
    c.fill();
    // Inner body
    c.fillStyle = player.color;
    c.beginPath();
    c.ellipse(-1, 0, bodyLen / 2 - 1, bodyWid / 2 - 1, 0, 0, Math.PI * 2);
    c.fill();
    // Core highlight
    c.fillStyle = "rgba(255,255,255,0.08)";
    c.beginPath();
    c.ellipse(-3, -2, bodyLen / 4, bodyWid / 4, 0, 0, Math.PI * 2);
    c.fill();

    // --- HEAD ---
    c.fillStyle = this.skinColor(player.color);
    c.beginPath();
    c.arc(bodyLen / 2 - 2, 0, 5.5, 0, Math.PI * 2);
    c.fill();
    // Helmet cover
    if (player.helmet.level > 0) {
      const helmetAlpha = 0.3 + player.helmet.level * 0.12;
      c.fillStyle = `rgba(160,170,180,${helmetAlpha})`;
      c.beginPath();
      c.arc(bodyLen / 2 - 2, 0, 6.5, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = `rgba(200,210,220,${helmetAlpha + 0.1})`;
      c.lineWidth = 1;
      c.beginPath();
      c.arc(bodyLen / 2 - 2, 0, 6.5, -0.5, 0.5);
      c.stroke();
    }

    // --- WEAPON (weapon-specific rendering) ---
    this.renderWeaponOnPlayer(c, player.weapon, bodyLen);

    // --- ARMOR ring ---
    if (player.armor.level > 0) {
      const armorColors = ["", "#4a5568", "#718096", "#a0aec0", "#e2e8f0"];
      c.strokeStyle = armorColors[player.armor.level];
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(0, 0, bodyLen / 2 + 3, bodyWid / 2 + 3, 0, 0, Math.PI * 2);
      c.stroke();
    }

    c.rotate(-player.facing);

    // --- SPRINT TRAIL ---
    if (player.isSprinting) {
      c.globalAlpha = 0.15;
      for (let i = 1; i <= 3; i++) {
        c.fillStyle = player.color;
        c.beginPath();
        c.arc(
          -Math.cos(player.facing) * i * 6,
          -Math.sin(player.facing) * i * 6,
          player.radius - i * 2,
          0, Math.PI * 2,
        );
        c.fill();
      }
      c.globalAlpha = 1;
    }

    // --- CROUCH RING ---
    if (player.isCrouching) {
      c.strokeStyle = "rgba(255,255,255,0.25)";
      c.lineWidth = 1;
      c.setLineDash([3, 3]);
      c.beginPath();
      c.arc(0, 0, player.radius + 2, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
    }

    c.restore();

    // --- HEALTH BAR ---
    const barW = 30;
    const barH = 3.5;
    const barX = player.pos.x - barW / 2;
    const barY = player.pos.y - player.radius - 16;

    // Background
    c.fillStyle = "rgba(0,0,0,0.7)";
    this.roundRect(c, barX - 1, barY - 1, barW + 2, barH + 2, 2);
    c.fill();

    const healthPct = player.health / player.maxHealth;
    const hpColor = healthPct > 0.5 ? "#22c55e" : healthPct > 0.25 ? "#f59e0b" : "#ff2b3d";
    if (healthPct > 0) {
      c.fillStyle = hpColor;
      this.roundRect(c, barX, barY, barW * healthPct, barH, 1.5);
      c.fill();
    }

    // --- ARMOR BAR (above HP) ---
    if (player.armor.level > 0) {
      const armorPct = player.armor.durability / player.armor.maxDurability;
      c.fillStyle = "rgba(0,0,0,0.5)";
      c.fillRect(barX, barY - 4, barW, 2.5);
      c.fillStyle = "#94a3b8";
      if (armorPct > 0) c.fillRect(barX, barY - 4, barW * armorPct, 2.5);
    }

    // --- NAME TAG ---
    c.fillStyle = isHuman ? "#ffcc00" : "rgba(255,255,255,0.7)";
    c.font = `${isHuman ? "bold " : ""}10px Inter, sans-serif`;
    c.textAlign = "center";
    c.fillText(player.name, player.pos.x, barY - 7);
    c.textAlign = "start";

    // --- HUMAN INDICATOR ---
    if (isHuman) {
      c.strokeStyle = "rgba(255,204,0,0.4)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(player.pos.x, player.pos.y, player.radius + 6, 0, Math.PI * 2);
      c.stroke();
    }
  }

  private renderWeaponOnPlayer(c: CanvasRenderingContext2D, weapon: WeaponType, bodyLen: number): void {
    switch (weapon) {
      case "pistol":
        // Small compact pistol
        c.fillStyle = "#444";
        c.fillRect(bodyLen / 2 - 2, -2, 10, 4);
        c.fillStyle = "#333";
        c.fillRect(bodyLen / 2 + 4, -1.5, 5, 3);
        break;
      case "smg":
        // SMG — shorter barrel, larger body
        c.fillStyle = "#3a3a3a";
        c.fillRect(bodyLen / 2 - 4, -3, 14, 6);
        c.fillStyle = "#555";
        c.fillRect(bodyLen / 2 + 6, -2, 6, 4);
        // Magazine
        c.fillStyle = "#2a2a2a";
        c.fillRect(bodyLen / 2 - 1, 3, 4, 5);
        break;
      case "rifle":
        // Assault rifle — long barrel
        c.fillStyle = "#3a3a3a";
        c.fillRect(bodyLen / 2 - 3, -3, 18, 6);
        c.fillStyle = "#555";
        c.fillRect(bodyLen / 2 + 10, -2, 8, 4);
        // Magazine
        c.fillStyle = "#2a2a2a";
        c.fillRect(bodyLen / 2 + 2, 3, 5, 6);
        break;
      case "shotgun":
        // Shotgun — wide barrel
        c.fillStyle = "#4a3a2a";
        c.fillRect(bodyLen / 2 - 3, -4, 16, 8);
        c.fillStyle = "#333";
        c.fillRect(bodyLen / 2 + 8, -2.5, 7, 5);
        break;
      case "sniper":
        // Sniper — very long thin barrel
        c.fillStyle = "#333";
        c.fillRect(bodyLen / 2 - 3, -2, 24, 4);
        c.fillStyle = "#555";
        c.fillRect(bodyLen / 2 + 17, -1.5, 6, 3);
        // Scope
        c.fillStyle = "#2244aa";
        c.beginPath();
        c.arc(bodyLen / 2 + 6, -5, 3, 0, Math.PI * 2);
        c.fill();
        break;
    }
  }

  private renderCrosshair(c: CanvasRenderingContext2D, player: Player): void {
    const len = 28;
    const gap = 8;
    const cx = player.pos.x + Math.cos(player.facing) * (len + 5);
    const cy = player.pos.y + Math.sin(player.facing) * (len + 5);

    c.strokeStyle = "rgba(255,255,255,0.5)";
    c.lineWidth = 1.5;

    // 4 crosshair lines
    const cos = Math.cos(player.facing);
    const sin = Math.sin(player.facing);
    const perpX = -sin;
    const perpY = cos;

    // Top
    c.beginPath();
    c.moveTo(cx + perpX * gap, cy + perpY * gap);
    c.lineTo(cx + perpX * len, cy + perpY * len);
    c.stroke();
    // Bottom
    c.beginPath();
    c.moveTo(cx - perpX * gap, cy - perpY * gap);
    c.lineTo(cx - perpX * len, cy - perpY * len);
    c.stroke();
    // Left
    c.beginPath();
    c.moveTo(cx + cos * gap, cy + sin * gap);
    c.lineTo(cx + cos * len, cy + sin * len);
    c.stroke();
    // Right
    c.beginPath();
    c.moveTo(cx - cos * gap, cy - sin * gap);
    c.lineTo(cx - cos * len, cy - sin * len);
    c.stroke();

    // Center dot
    c.fillStyle = "rgba(255,255,255,0.7)";
    c.beginPath();
    c.arc(cx, cy, 1.5, 0, Math.PI * 2);
    c.fill();

    // Aim line (faint line from player to crosshair)
    c.strokeStyle = "rgba(255,255,255,0.08)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(player.pos.x + cos * 15, player.pos.y + sin * 15);
    c.lineTo(cx, cy);
    c.stroke();
  }

  private renderBullets(c: CanvasRenderingContext2D): void {
    for (const bullet of this.state.bullets) {
      if (bullet.trail.length > 1) {
        c.strokeStyle = bullet.weaponType === "sniper" ? "rgba(255,50,50,0.4)" : "rgba(255,200,50,0.3)";
        c.lineWidth = bullet.weaponType === "shotgun" ? 1.5 : 2;
        c.beginPath();
        c.moveTo(bullet.trail[0].x, bullet.trail[0].y);
        for (let i = 1; i < bullet.trail.length; i++) {
          c.lineTo(bullet.trail[i].x, bullet.trail[i].y);
        }
        c.lineTo(bullet.pos.x, bullet.pos.y);
        c.stroke();
      }

      c.fillStyle = bullet.isHeadshot ? "#ff2b3d" : bullet.weaponType === "sniper" ? "#ff4444" : "#ffcc00";
      c.beginPath();
      c.arc(bullet.pos.x, bullet.pos.y, bullet.weaponType === "shotgun" ? 2 : 3, 0, Math.PI * 2);
      c.fill();
    }
  }

  // ==================================================================
  // Helpers
  // ==================================================================

  private dist(a: Vec2, b: Vec2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  private rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private addKillFeed(entry: KillFeedEntry): void {
    this.state.killFeed.unshift(entry);
    if (this.state.killFeed.length > 8) this.state.killFeed.pop();
  }

  private skinColor(playerColor: string): string {
    // Generate a skin tone from player color
    const r = parseInt(playerColor.slice(1, 3), 16);
    const g = parseInt(playerColor.slice(3, 5), 16);
    const b = parseInt(playerColor.slice(5, 7), 16);
    const avg = (r + g + b) / 3;
    if (avg > 150) return `rgb(${Math.floor(r * 0.7)},${Math.floor(g * 0.6)},${Math.floor(b * 0.5)})`;
    return `rgb(${Math.min(255, r + 80)},${Math.min(255, g + 60)},${Math.min(255, b + 40)})`;
  }

  private getItemColor(type: ItemType): string {
    const colors: Record<string, string> = {
      health: "#22c55e", medkit: "#16a34a", bandage: "#4ade80",
      ep_boost: "#a855f7", ammo: "#f59e0b", gloo_wall: "#00e5ff",
      vest_1: "#64748b", vest_2: "#94a3b8", vest_3: "#cbd5e1", vest_4: "#f8fafc",
      helmet_1: "#64748b", helmet_2: "#94a3b8", helmet_3: "#cbd5e1", helmet_4: "#f8fafc",
      speed_boost: "#3b82f6",
      wpn_pistol: "#f59e0b", wpn_smg: "#ef4444", wpn_rifle: "#22c55e",
      wpn_shotgun: "#f97316", wpn_sniper: "#a855f7",
    };
    return colors[type] || "#fff";
  }

  private getItemIcon(type: ItemType): string {
    const icons: Record<string, string> = {
      health: "+", medkit: "M", bandage: "B",
      ep_boost: "E", ammo: "A", gloo_wall: "G",
      vest_1: "V1", vest_2: "V2", vest_3: "V3", vest_4: "V4",
      helmet_1: "H1", helmet_2: "H2", helmet_3: "H3", helmet_4: "H4",
      speed_boost: "S",
      wpn_pistol: "PIS", wpn_smg: "SMG", wpn_rifle: "RIF",
      wpn_shotgun: "SG", wpn_sniper: "SNI",
    };
    return icons[type] || "?";
  }

  private darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
