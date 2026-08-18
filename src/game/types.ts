// ============================================================================
// OVERKILL MALL — Game Types
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

export interface Entity {
  id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  health: number;
  maxHealth: number;
  alive: boolean;
  facing: number; // angle in radians
}

export interface Player extends Entity {
  name: string;
  isBot: boolean;
  color: string;
  score: number;
  kills: number;
  headshots: number;
  damageDealt: number;
  assists: string[]; // IDs of players they damaged recently
  survivalTime: number;
  itemsCollected: number;
  killstreak: number;
  killstreakMax: number;
  lastKillTime: number;
  ammo: number;
  maxAmmo: number;
  weapon: WeaponType;
  invulnerableUntil: number; // timestamp
}

export interface Bullet {
  id: string;
  ownerId: string;
  ownerName: string;
  pos: Vec2;
  vel: Vec2;
  damage: number;
  isHeadshot: boolean;
  lifetime: number;
  trail: Vec2[];
}

export interface Item {
  id: string;
  type: ItemType;
  pos: Vec2;
  collected: boolean;
}

export type WeaponType = "pistol" | "rifle" | "shotgun";
export type ItemType = "health" | "ammo" | "speed" | "shield";

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
  realName: string; // the actual mall name for reference
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

export interface KillFeedEntry {
  killerName: string;
  victimName: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface GameState {
  players: Map<string, Player>;
  bullets: Bullet[];
  items: Item[];
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
}

export interface GameConfig {
  mapId: string;
  playerCount: number; // total players (human + bots)
  botCount: number;
  matchDuration: number; // seconds
  map: GameMap;
}