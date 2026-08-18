// ============================================================================
// OVERKILL MALL — Game Types v2
// Full Free Fire-inspired type system
// ============================================================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ============================================================================
// Armor & Equipment
// ============================================================================

export type ArmorLevel = 0 | 1 | 2 | 3 | 4;
export type HelmetLevel = 0 | 1 | 2 | 3 | 4;

export interface Armor {
  level: ArmorLevel;
  durability: number; // 0–100
  maxDurability: number;
}

export interface Helmet {
  level: HelmetLevel;
  durability: number;
  maxDurability: number;
}

// ============================================================================
// Weapons
// ============================================================================

export type WeaponType =
  | "pistol"
  | "smg"
  | "rifle"
  | "shotgun"
  | "sniper";

export interface WeaponDef {
  name: string;
  damage: number;           // base damage per bullet
  fireRate: number;         // ms between shots
  bulletSpeed: number;      // px/s
  spread: number;           // base spread in radians
  moveSpreadPenalty: number; // additional spread while moving
  recoil: number;           // visual recoil intensity 0–1
  magSize: number;          // bullets per magazine
  reloadTime: number;       // ms to reload
  range: number;            // max bullet lifetime in seconds
  pellets: number;          // number of pellets per shot (shotgun = 5–8)
  headshotMult: number;     // headshot damage multiplier
  damageDropoff: number;    // distance at which damage starts dropping (% of range)
  bulletCount?: number;     // for burst weapons
}

// ============================================================================
// Player
// ============================================================================

export type MovementState = "walk" | "sprint" | "crouch" | "crouch_walk";

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  ep: number;               // energy points (slowly converts to HP)
  maxEp: number;
  alive: boolean;
  facing: number;           // angle in radians
  color: string;

  // Equipment
  weapon: WeaponType;
  armor: Armor;
  helmet: Helmet;
  glooWalls: number;        // count of deployable walls
  maxGlooWalls: number;

  // Movement
  movementState: MovementState;
  sprintSpeed: number;
  walkSpeed: number;
  crouchSpeed: number;
  isCrouching: boolean;
  isSprinting: boolean;

  // Ammo
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;

  // Scoring
  score: number;
  kills: number;
  headshots: number;
  damageDealt: number;
  assists: string[];
  survivalTime: number;
  itemsCollected: number;
  killstreak: number;
  killstreakMax: number;
  lastKillTime: number;

  // State
  invulnerableUntil: number;
  lastDamageTime: number;
  placement: number;

  // Crouch accuracy bonus
  accuracyBonus: number;    // multiplier for spread reduction when crouched
}

// ============================================================================
// Bullets & Projectiles
// ============================================================================

export interface Bullet {
  id: string;
  ownerId: string;
  ownerName: string;
  pos: Vec2;
  vel: Vec2;
  damage: number;
  baseDamage: number;       // before distance falloff
  isHeadshot: boolean;
  lifetime: number;
  maxLifetime: number;
  trail: Vec2[];
  weaponType: WeaponType;
}

// ============================================================================
// Gloo Wall (deployable cover)
// ============================================================================

export interface GlooWall {
  id: string;
  ownerId: string;
  pos: Vec2;
  rotation: number;         // angle in radians
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  lifetime: number;         // seconds until despawn (120s)
}

// ============================================================================
// Items
// ============================================================================

export type ItemType =
  | "health"          // +30 HP instantly
  | "medkit"          // +75 HP over 5s (channeling)
  | "bandage"         // +25 HP over 3s
  | "ep_boost"        // +50 EP (slowly converts to HP)
  | "ammo"            // +20 reserve ammo
  | "gloo_wall"       // +1 gloo wall charge
  | "vest_1" | "vest_2" | "vest_3" | "vest_4"     // armor pickup
  | "helmet_1" | "helmet_2" | "helmet_3" | "helmet_4" // helmet pickup
  | "speed_boost"     // temporary 20% speed for 10s
  | "wpn_pistol" | "wpn_smg" | "wpn_rifle" | "wpn_shotgun" | "wpn_sniper"; // weapon pickups

export interface Item {
  id: string;
  type: ItemType;
  pos: Vec2;
  collected: boolean;
}

// ============================================================================
// Map & Environment
// ============================================================================

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
  type: WallType;
}

export type WallType = "wall" | "cover" | "decoration";

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  type: RoomType;
}

export type RoomType =
  | "food_court"
  | "store"
  | "anchor"
  | "corridor"
  | "atrium"
  | "parking"
  | "escalator"
  | "restroom"
  | "entrance";

export interface SpawnPoint {
  x: number;
  y: number;
}

export interface GameMap {
  id: string;
  name: string;
  realName: string;
  width: number;
  height: number;
  walls: Wall[];
  rooms: Room[];
  spawns: SpawnPoint[];
  itemSpawns: Vec2[];
  color: string;
  accentColor: string;
  description: string;
}

// ============================================================================
// Zone (shrinking play area)
// ============================================================================

export interface Zone {
  centerX: number;
  centerY: number;
  radius: number;
  targetRadius: number;
  shrinkSpeed: number;
  damage: number;
  phase: number;
  nextShrinkTime: number;
}

// ============================================================================
// Kill Feed
// ============================================================================

export interface KillFeedEntry {
  killerName: string;
  victimName: string;
  isHeadshot: boolean;
  weaponType?: WeaponType;
  timestamp: number;
}

// ============================================================================
// Game State
// ============================================================================

export interface GameState {
  players: Map<string, Player>;
  bullets: Bullet[];
  items: Item[];
  glooWalls: GlooWall[];
  map: GameMap;
  zone: Zone;
  killFeed: KillFeedEntry[];
  matchTime: number;
  matchDuration: number;
  aliveCount: number;
  totalPlayers: number;
  gameOver: boolean;
  winnerId: string | null;
  started: boolean;
  countdown: number;

  // Particles (visual feedback)
  particles: Particle[];

  // Screen shake
  screenShake: number; // remaining shake intensity
}

// ============================================================================
// Particles
// ============================================================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: "hit" | "muzzle" | "death" | "heal" | "spark";
}

// ============================================================================
// Audio Events
// ============================================================================

export type AudioEvent =
  | { type: "shoot"; weapon: WeaponType; x: number; y: number }
  | { type: "hit"; x: number; y: number; isHeadshot: boolean }
  | { type: "kill"; x: number; y: number }
  | { type: "step"; x: number; y: number }
  | { type: "pickup"; x: number; y: number }
  | { type: "reload"; x: number; y: number }
  | { type: "gloo_place"; x: number; y: number }
  | { type: "zone_warning" }
  | { type: "heal"; x: number; y: number };

// ============================================================================
// Config
// ============================================================================

export interface GameConfig {
  mapId: string;
  playerCount: number;
  botCount: number;
  matchDuration: number;
  map: GameMap;
}
