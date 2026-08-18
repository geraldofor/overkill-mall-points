// ============================================================================
// OVERKILL MALL — Core Game Engine
// Canvas-based 2D top-down battle royale
// ============================================================================

import {
  GameState,
  GameConfig,
  Player,
  Bullet,
  Item,
  Vec2,
  Wall,
  KillFeedEntry,
  WeaponType,
} from "./types";
import { SCORE, getKillstreakLabel } from "./scoring";

let nextId = 0;
function uid(): string {
  return `${Date.now()}_${nextId++}`;
}

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
  private animFrame = 0;
  private lastTime = 0;
  private running = false;
  private humanId: string = "";
  private _onUpdate: ((state: GameState) => void) | null = null;
  private _onGameOver: ((state: GameState) => void) | null = null;

  // Touch controls
  private touchJoystick = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
  private touchShoot = { active: false, x: 0, y: 0 };

  // Fire rate control
  private lastFireTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.setupInput();
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  start(config: GameConfig, playerName: string): GameState {
    this.config = config;
    this.state = this.createInitialState(config, playerName);
    this.humanId = this.state.players
      .entries()
      .next()
      .value![0];
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

  // ------------------------------------------------------------------
  // State creation
  // ------------------------------------------------------------------

  private createInitialState(config: GameConfig, playerName: string): GameState {
    const players = new Map<string, Player>();
    const map = config.map;
    const allSpawns = [...map.spawns].sort(() => Math.random() - 0.5);

    // Human player
    const humanSpawn = allSpawns[0] || { x: map.width / 2, y: map.height / 2 };
    const human: Player = {
      id: uid(),
      name: playerName,
      isBot: false,
      pos: { x: humanSpawn.x, y: humanSpawn.y },
      vel: { x: 0, y: 0 },
      radius: 14,
      health: 100,
      maxHealth: 100,
      alive: true,
      facing: 0,
      color: PLAYER_COLORS[0],
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
      ammo: 30,
      maxAmmo: 30,
      weapon: "rifle" as WeaponType,
      invulnerableUntil: 0,
    };
    players.set(human.id, human);

    // Bots
    const botNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < config.botCount; i++) {
      const spawn = allSpawns[(i + 1) % allSpawns.length] || {
        x: Math.random() * map.width,
        y: Math.random() * map.height,
      };
      const bot: Player = {
        id: uid(),
        name: botNames[i % botNames.length],
        isBot: true,
        pos: { x: spawn.x, y: spawn.y },
        vel: { x: 0, y: 0 },
        radius: 14,
        health: 100,
        maxHealth: 100,
        alive: true,
        facing: Math.random() * Math.PI * 2,
        color: PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length],
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
        ammo: 30,
        maxAmmo: 30,
        weapon: (["pistol", "rifle", "shotgun"] as WeaponType[])[
          Math.floor(Math.random() * 3)
        ],
        invulnerableUntil: 0,
      };
      players.set(bot.id, bot);
    }

    // Items
    const items: Item[] = map.itemSpawns.map((pos) => ({
      id: uid(),
      type: (["health", "ammo", "speed", "shield"] as const)[
        Math.floor(Math.random() * 4)
      ],
      pos: { ...pos },
      collected: false,
    }));

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
      nextShrinkTime: 15, // first shrink after 15 seconds
    };

    return {
      players,
      bullets: [],
      items,
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
    };
  }

  // ------------------------------------------------------------------
  // Input setup
  // ------------------------------------------------------------------

  private setupInput(): void {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (down) this.keys.add(e.key.toLowerCase());
      else this.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", (e) => onKey(e, true));
    window.addEventListener("keyup", (e) => onKey(e, false));

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left + this.camera.x;
      this.mouse.y = e.clientY - rect.top + this.camera.y;
    });

    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.mouse.down = true;
    });
    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.down = false;
    });

    // Touch controls
    this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e), { passive: false });
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    for (const touch of Array.from(e.changedTouches)) {
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (x < this.canvas.width / 2) {
        // Left side — movement joystick
        this.touchJoystick = { active: true, startX: x, startY: y, x, y };
      } else {
        // Right side — shoot direction
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
        const maxDist = 40;
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
      const x = touch.clientX - rect.left;
      if (x < this.canvas.width / 2) {
        this.touchJoystick = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
      } else {
        this.touchShoot = { active: false, x: 0, y: 0 };
        this.mouse.down = false;
      }
    }
  }

  // ------------------------------------------------------------------
  // Game loop
  // ------------------------------------------------------------------

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = now;

    this.update(dt);
    this.render();
    this.animFrame = requestAnimationFrame(this.loop);
  };

  // ------------------------------------------------------------------
  // Update
  // ------------------------------------------------------------------

  private update(dt: number): void {
    const s = this.state;
    if (s.gameOver) return;

    // Countdown
    if (!s.started) {
      s.countdown -= dt;
      if (s.countdown <= 0) {
        s.started = true;
      }
      return;
    }

    s.matchTime += dt;

    // Zone update
    this.updateZone(dt);

    // Player input & movement
    const human = s.players.get(this.humanId);
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
    }

    // Bullets
    this.updateBullets(dt);

    // Zone damage
    this.applyZoneDamage(dt);

    // Check alive count
    let alive = 0;
    let lastAlive: Player | null = null;
    for (const [, p] of s.players) {
      if (p.alive) {
        alive++;
        lastAlive = p;
      }
    }
    s.aliveCount = alive;

    // Game over check
    if (alive <= 1) {
      s.gameOver = true;
      s.winnerId = lastAlive?.id || null;
      // Assign placements
      let placement = s.totalPlayers;
      for (const [, p] of s.players) {
        if (!p.alive && p.survivalTime > 0) {
          // Already dead — placement was set at death
        }
      }
      if (lastAlive) {
        lastAlive.score += this.getPlacementScore(1);
      }
      this._onGameOver?.(s);
    }

    // Match time limit
    if (s.matchTime >= s.matchDuration) {
      s.gameOver = true;
      // Winner = last alive or highest HP
      let best: Player | null = null;
      for (const [, p] of s.players) {
        if (p.alive && (!best || p.health > best.health)) {
          best = p;
        }
      }
      s.winnerId = best?.id || null;
      this._onGameOver?.(s);
    }

    // Callback
    this._onUpdate?.(s);
  }

  // ------------------------------------------------------------------
  // Player input
  // ------------------------------------------------------------------

  private handlePlayerInput(player: Player, dt: number): void {
    let dx = 0;
    let dy = 0;

    // Keyboard
    if (this.keys.has("w") || this.keys.has("arrowup")) dy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) dy += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) dx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) dx += 1;

    // Touch joystick
    if (this.touchJoystick.active) {
      const jdx = this.touchJoystick.x - this.touchJoystick.startX;
      const jdy = this.touchJoystick.y - this.touchJoystick.startY;
      const dist = Math.sqrt(jdx * jdx + jdy * jdy);
      if (dist > 5) {
        dx = jdx / dist;
        dy = jdy / dist;
      }
    }

    // Normalize
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    const speed = 200; // pixels per second
    player.vel.x = dx * speed;
    player.vel.y = dy * speed;

    // Facing direction — toward mouse or touch
    let targetX: number;
    let targetY: number;
    if (this.touchShoot.active) {
      const rect = this.canvas.getBoundingClientRect();
      targetX = this.touchShoot.x - rect.left + this.camera.x;
      targetY = this.touchShoot.y - rect.top + this.camera.y;
    } else {
      targetX = this.mouse.x;
      targetY = this.mouse.y;
    }
    player.facing = Math.atan2(
      targetY - player.pos.y,
      targetX - player.pos.x,
    );

    // Shooting
    if (this.mouse.down || this.touchShoot.active) {
      const now = performance.now();
      const fireRate = player.weapon === "shotgun" ? 600 : player.weapon === "rifle" ? 150 : 300;
      if (now - this.lastFireTime > fireRate && player.ammo > 0) {
        this.fireBullet(player);
        this.lastFireTime = now;
      }
    }

    // Reload
    if (this.keys.has("r") && player.ammo < player.maxAmmo) {
      player.ammo = player.maxAmmo;
    }
  }

  // ------------------------------------------------------------------
  // Bot AI
  // ------------------------------------------------------------------

  private updateBot(bot: Player, dt: number): void {
    const s = this.state;

    // Find nearest alive enemy
    let nearest: Player | null = null;
    let nearDist = Infinity;
    for (const [, p] of s.players) {
      if (p.id === bot.id || !p.alive) continue;
      const d = this.dist(bot.pos, p.pos);
      if (d < nearDist) {
        nearDist = d;
        nearest = p;
      }
    }

    const aggroRange = 400;
    const fleeRange = 80;

    if (nearest && nearDist < aggroRange) {
      // Move toward enemy
      const angle = Math.atan2(
        nearest.pos.y - bot.pos.y,
        nearest.pos.x - bot.pos.x,
      );

      if (nearDist < fleeRange && bot.health < 30) {
        // Flee when low HP and close
        bot.vel.x = -Math.cos(angle) * 160;
        bot.vel.y = -Math.sin(angle) * 160;
      } else {
        // Approach and strafe
        const strafeAngle = angle + Math.sin(s.matchTime * 2 + bot.pos.x) * 0.5;
        bot.vel.x = Math.cos(strafeAngle) * 140;
        bot.vel.y = Math.sin(strafeAngle) * 140;
      }

      bot.facing = angle;

      // Shoot if in range
      if (nearDist < aggroRange * 0.8 && bot.ammo > 0) {
        const now = performance.now();
        const fireRate = bot.weapon === "shotgun" ? 800 : bot.weapon === "rifle" ? 200 : 400;
        // Bots fire at ~60% accuracy
        if (
          now - (bot as any)._lastFire > fireRate &&
          Math.random() < 0.6
        ) {
          this.fireBullet(bot);
          (bot as any)._lastFire = now;
        }
      }
    } else {
      // Wander toward zone center
      const toZoneX = s.zone.centerX - bot.pos.x;
      const toZoneY = s.zone.centerY - bot.pos.y;
      const toZoneDist = Math.sqrt(toZoneX * toZoneX + toZoneY * toZoneY);

      if (toZoneDist > s.zone.radius * 0.5) {
        // Move toward zone
        bot.vel.x = (toZoneX / toZoneDist) * 100;
        bot.vel.y = (toZoneY / toZoneDist) * 100;
        bot.facing = Math.atan2(toZoneY, toZoneX);
      } else {
        // Random wander
        if (Math.random() < 0.02) {
          const angle = Math.random() * Math.PI * 2;
          bot.vel.x = Math.cos(angle) * 80;
          bot.vel.y = Math.sin(angle) * 80;
          bot.facing = angle;
        }
      }
    }

    // Reload
    if (bot.ammo <= 0) {
      bot.ammo = bot.maxAmmo;
    }
  }

  // ------------------------------------------------------------------
  // Movement & collision
  // ------------------------------------------------------------------

  private moveEntity(entity: Player, dt: number): void {
    const newX = entity.pos.x + entity.vel.x * dt;
    const newY = entity.pos.y + entity.vel.y * dt;

    // Check wall collisions
    const testRect = {
      x: newX - entity.radius,
      y: newY - entity.radius,
      w: entity.radius * 2,
      h: entity.radius * 2,
    };

    let canMoveX = true;
    let canMoveY = true;

    for (const wall of this.state.map.walls) {
      if (this.rectsOverlap(testRect, wall)) {
        // Check if X movement causes collision
        const xRect = {
          x: newX - entity.radius,
          y: entity.pos.y - entity.radius,
          w: entity.radius * 2,
          h: entity.radius * 2,
        };
        if (this.rectsOverlap(xRect, wall)) canMoveX = false;

        // Check if Y movement causes collision
        const yRect = {
          x: entity.pos.x - entity.radius,
          y: newY - entity.radius,
          w: entity.radius * 2,
          h: entity.radius * 2,
        };
        if (this.rectsOverlap(yRect, wall)) canMoveY = false;
      }
    }

    // Apply movement
    if (canMoveX) entity.pos.x = newX;
    if (canMoveY) entity.pos.y = newY;

    // Clamp to map bounds
    entity.pos.x = Math.max(
      entity.radius,
      Math.min(this.state.map.width - entity.radius, entity.pos.x),
    );
    entity.pos.y = Math.max(
      entity.radius,
      Math.min(this.state.map.height - entity.radius, entity.pos.y),
    );

    // Check item pickups
    for (const item of this.state.items) {
      if (item.collected) continue;
      if (this.dist(entity.pos, item.pos) < entity.radius + 12) {
        item.collected = true;
        entity.itemsCollected++;
        entity.score += SCORE.ITEM_COLLECT;

        switch (item.type) {
          case "health":
            entity.health = Math.min(entity.maxHealth, entity.health + 30);
            break;
          case "ammo":
            entity.ammo = Math.min(entity.maxAmmo, entity.ammo + 10);
            break;
          case "speed":
            // Temporary speed boost — we'll just add score
            entity.score += 10;
            break;
          case "shield":
            entity.health = Math.min(entity.maxHealth + 25, entity.health + 25);
            break;
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // Bullets
  // ------------------------------------------------------------------

  private fireBullet(owner: Player): void {
    const spread = owner.weapon === "shotgun" ? 0.3 : owner.weapon === "rifle" ? 0.05 : 0.1;
    const bulletCount = owner.weapon === "shotgun" ? 5 : 1;
    const speed = owner.weapon === "shotgun" ? 500 : owner.weapon === "rifle" ? 600 : 450;
    const damage = owner.weapon === "shotgun" ? 15 : owner.weapon === "rifle" ? 12 : 18;

    for (let i = 0; i < bulletCount; i++) {
      const angle = owner.facing + (Math.random() - 0.5) * spread;
      const bullet: Bullet = {
        id: uid(),
        ownerId: owner.id,
        ownerName: owner.name,
        pos: { x: owner.pos.x, y: owner.pos.y },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        damage,
        isHeadshot: owner.weapon === "rifle" && Math.random() < 0.15,
        lifetime: 1.5,
        trail: [],
      };
      this.state.bullets.push(bullet);
    }

    owner.ammo--;
  }

  private updateBullets(dt: number): void {
    const s = this.state;
    const surviving: Bullet[] = [];

    for (const bullet of s.bullets) {
      bullet.lifetime -= dt;
      if (bullet.lifetime <= 0) continue;

      // Store trail
      bullet.trail.push({ x: bullet.pos.x, y: bullet.pos.y });
      if (bullet.trail.length > 5) bullet.trail.shift();

      bullet.pos.x += bullet.vel.x * dt;
      bullet.pos.y += bullet.vel.y * dt;

      // Wall collision
      let hitWall = false;
      for (const wall of s.map.walls) {
        if (
          bullet.pos.x >= wall.x &&
          bullet.pos.x <= wall.x + wall.w &&
          bullet.pos.y >= wall.y &&
          bullet.pos.y <= wall.y + wall.h
        ) {
          hitWall = true;
          break;
        }
      }
      if (hitWall) continue;

      // Out of bounds
      if (
        bullet.pos.x < 0 || bullet.pos.x > s.map.width ||
        bullet.pos.y < 0 || bullet.pos.y > s.map.height
      ) continue;

      // Hit player
      let hit = false;
      for (const [, player] of s.players) {
        if (player.id === bullet.ownerId || !player.alive) continue;
        if (this.dist(bullet.pos, player.pos) < player.radius + 4) {
          // Hit!
          let dmg = bullet.damage;
          if (bullet.isHeadshot) dmg = Math.floor(dmg * 2.5);

          player.health -= dmg;

          // Track damage for assists
          const attacker = s.players.get(bullet.ownerId);
          if (attacker) {
            attacker.damageDealt += dmg;
          }

          // Register assist contributor
          if (!player.assists.includes(bullet.ownerId)) {
            // This is actually the damage dealer, not assist
          }

          if (player.health <= 0) {
            player.health = 0;
            player.alive = false;

            // Killer stats
            if (attacker) {
              attacker.kills++;
              attacker.score += SCORE.KILL;
              attacker.killstreak++;
              if (attacker.killstreak > attacker.killstreakMax) {
                attacker.killstreakMax = attacker.killstreak;
              }
              if (bullet.isHeadshot) {
                attacker.headshots++;
                attacker.score += SCORE.HEADSHOT;
              }

              // Killstreak bonus
              const streakLabel = getKillstreakLabel(attacker.killstreak);
              if (streakLabel) {
                this.addKillFeed({
                  killerName: attacker.name,
                  victimName: `${streakLabel} ${player.name}`,
                  isHeadshot: false,
                  timestamp: s.matchTime,
                });
              }
            }

            // Kill feed
            this.addKillFeed({
              killerName: bullet.ownerName,
              victimName: player.name,
              isHeadshot: bullet.isHeadshot,
              timestamp: s.matchTime,
            });

            // Placement
            const placement = s.aliveCount;
            player.score += this.getPlacementScore(placement);
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

  // ------------------------------------------------------------------
  // Zone
  // ------------------------------------------------------------------

  private updateZone(dt: number): void {
    const z = this.state.zone;
    z.nextShrinkTime -= dt;

    if (z.nextShrinkTime <= 0) {
      z.phase++;
      z.targetRadius = Math.max(80, z.radius * 0.6);
      z.shrinkSpeed = (z.radius - z.targetRadius) / 20; // shrink over 20 seconds
      z.damage = 2 + z.phase * 3;
      z.nextShrinkTime = 30; // next shrink in 30 seconds
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
      const distFromCenter = this.dist(player.pos, {
        x: z.centerX,
        y: z.centerY,
      });
      if (distFromCenter > z.radius) {
        player.health -= z.damage * dt;
        if (player.health <= 0) {
          player.health = 0;
          player.alive = false;
          this.addKillFeed({
            killerName: "ZONA",
            victimName: player.name,
            isHeadshot: false,
            timestamp: this.state.matchTime,
          });
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------

  private render(): void {
    const s = this.state;
    const c = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Camera follows human
    const human = s.players.get(this.humanId);
    if (human) {
      this.camera.x = human.pos.x - W / 2;
      this.camera.y = human.pos.y - H / 2;
    }

    // Clear
    c.fillStyle = "#0a0a0c";
    c.fillRect(0, 0, W, H);

    c.save();
    c.translate(-this.camera.x, -this.camera.y);

    // Draw map floor
    this.renderMap(c);

    // Draw zone
    this.renderZone(c);

    // Draw items
    this.renderItems(c);

    // Draw players
    for (const [, player] of s.players) {
      this.renderPlayer(c, player);
    }

    // Draw bullets
    this.renderBullets(c);

    c.restore();

    // Draw countdown
    if (!s.started) {
      c.fillStyle = "rgba(0,0,0,0.6)";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#ff2b3d";
      c.font = "bold 72px Anton, sans-serif";
      c.textAlign = "center";
      c.fillText(
        Math.ceil(s.countdown).toString(),
        W / 2,
        H / 2 + 24,
      );
      c.textAlign = "start";
    }
  }

  private renderMap(c: CanvasRenderingContext2D): void {
    const map = this.state.map;

    // Floor tiles
    c.fillStyle = map.color;
    c.fillRect(0, 0, map.width, map.height);

    // Grid
    c.strokeStyle = "rgba(255,255,255,0.03)";
    c.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < map.width; x += step) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, map.height);
      c.stroke();
    }
    for (let y = 0; y < map.height; y += step) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(map.width, y);
      c.stroke();
    }

    // Room floors (lighter)
    for (const room of map.rooms) {
      const colors: Record<string, string> = {
        food_court: "rgba(255,204,0,0.06)",
        store: "rgba(255,255,255,0.04)",
        anchor: "rgba(255,43,61,0.06)",
        corridor: "rgba(255,255,255,0.02)",
        atrium: "rgba(255,255,255,0.05)",
        parking: "rgba(100,100,100,0.08)",
        escalator: "rgba(100,200,255,0.06)",
        restroom: "rgba(100,100,200,0.06)",
        entrance: "rgba(200,255,200,0.06)",
      };
      c.fillStyle = colors[room.type] || "rgba(255,255,255,0.03)";
      c.fillRect(room.x, room.y, room.w, room.h);

      // Room name
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
        // Top highlight
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

    // Draw danger zone (outside circle) as red tint
    c.save();
    c.fillStyle = "rgba(255,43,61,0.15)";
    c.fillRect(0, 0, map.width, map.height);

    // Clear the safe zone
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    c.arc(z.centerX, z.centerY, z.radius, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";

    // Zone border
    c.strokeStyle = "#ff2b3d";
    c.lineWidth = 3;
    c.setLineDash([10, 5]);
    c.beginPath();
    c.arc(z.centerX, z.centerY, z.radius, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  private renderItems(c: CanvasRenderingContext2D): void {
    for (const item of this.state.items) {
      if (item.collected) continue;

      const colors: Record<string, string> = {
        health: "#22c55e",
        ammo: "#f59e0b",
        speed: "#3b82f6",
        shield: "#a855f7",
      };
      const icons: Record<string, string> = {
        health: "+",
        ammo: "•",
        speed: "»",
        shield: "◇",
      };

      c.fillStyle = colors[item.type] || "#fff";
      c.globalAlpha = 0.5 + Math.sin(performance.now() / 300) * 0.2;
      c.beginPath();
      c.arc(item.pos.x, item.pos.y, 8, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;

      c.fillStyle = "#fff";
      c.font = "bold 10px Inter, sans-serif";
      c.textAlign = "center";
      c.fillText(icons[item.type] || "?", item.pos.x, item.pos.y + 4);
      c.textAlign = "start";
    }
  }

  private renderPlayer(c: CanvasRenderingContext2D, player: Player): void {
    if (!player.alive) return;

    const isHuman = player.id === this.humanId;

    // Shadow
    c.fillStyle = "rgba(0,0,0,0.3)";
    c.beginPath();
    c.ellipse(player.pos.x, player.pos.y + player.radius + 2, player.radius, 5, 0, 0, Math.PI * 2);
    c.fill();

    // Body
    c.fillStyle = player.color;
    c.beginPath();
    c.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
    c.fill();

    // Direction indicator
    c.fillStyle = "rgba(0,0,0,0.4)";
    c.beginPath();
    c.arc(
      player.pos.x + Math.cos(player.facing) * 8,
      player.pos.y + Math.sin(player.facing) * 8,
      5,
      0,
      Math.PI * 2,
    );
    c.fill();

    // Health bar
    const barW = 30;
    const barH = 4;
    const barX = player.pos.x - barW / 2;
    const barY = player.pos.y - player.radius - 10;

    c.fillStyle = "rgba(0,0,0,0.5)";
    c.fillRect(barX, barY, barW, barH);

    const healthPct = player.health / player.maxHealth;
    c.fillStyle = healthPct > 0.5 ? "#22c55e" : healthPct > 0.25 ? "#f59e0b" : "#ff2b3d";
    c.fillRect(barX, barY, barW * healthPct, barH);

    // Name
    c.fillStyle = isHuman ? "#ffcc00" : "rgba(255,255,255,0.7)";
    c.font = `${isHuman ? "bold " : ""}10px Inter, sans-serif`;
    c.textAlign = "center";
    c.fillText(player.name, player.pos.x, barY - 4);
    c.textAlign = "start";

    // Human indicator
    if (isHuman) {
      c.strokeStyle = "#ffcc00";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(player.pos.x, player.pos.y, player.radius + 4, 0, Math.PI * 2);
      c.stroke();
    }
  }

  private renderBullets(c: CanvasRenderingContext2D): void {
    for (const bullet of this.state.bullets) {
      // Trail
      if (bullet.trail.length > 1) {
        c.strokeStyle = "rgba(255,200,50,0.3)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(bullet.trail[0].x, bullet.trail[0].y);
        for (let i = 1; i < bullet.trail.length; i++) {
          c.lineTo(bullet.trail[i].x, bullet.trail[i].y);
        }
        c.lineTo(bullet.pos.x, bullet.pos.y);
        c.stroke();
      }

      // Bullet
      c.fillStyle = bullet.isHeadshot ? "#ff2b3d" : "#ffcc00";
      c.beginPath();
      c.arc(bullet.pos.x, bullet.pos.y, 3, 0, Math.PI * 2);
      c.fill();
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private dist(a: Vec2, b: Vec2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  private rectsOverlap(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private addKillFeed(entry: KillFeedEntry): void {
    this.state.killFeed.unshift(entry);
    if (this.state.killFeed.length > 8) {
      this.state.killFeed.pop();
    }
  }

  private getPlacementScore(placement: number): number {
    if (placement === 1) return SCORE.PLACEMENT_WIN;
    if (placement === 2) return SCORE.PLACEMENT_TOP2;
    if (placement === 3) return SCORE.PLACEMENT_TOP3;
    if (placement <= 5) return SCORE.PLACEMENT_TOP5;
    if (placement <= 10) return SCORE.PLACEMENT_TOP10;
    return 0;
  }
}