// ============================================================================
// OVERKILL MALL — Map Definitions
// Based on real Fortaleza-CE shopping centers with fictional names
// ============================================================================

import { GameMap, Room, Wall, SpawnPoint, Vec2 } from "./types";

const TILE = 40; // base tile size

// Helper to create walls from room definitions
function roomToWalls(room: Room): Wall[] {
  const walls: Wall[] = [];
  const t = TILE;
  // Top wall
  walls.push({ x: room.x, y: room.y, w: room.w, h: t, type: "wall" });
  // Bottom wall
  walls.push({ x: room.x, y: room.y + room.h - t, w: room.w, h: t, type: "wall" });
  // Left wall
  walls.push({ x: room.x, y: room.y, w: t, h: room.h, type: "wall" });
  // Right wall
  walls.push({ x: room.x + room.w - t, y: room.y, w: t, h: room.h, type: "wall" });
  return walls;
}

// Helper to create corridors between rooms
function corridor(
  x: number, y: number, w: number, h: number,
): Wall[] {
  const t = TILE;
  const walls: Wall[] = [];
  if (w > h) {
    // Horizontal corridor — walls on top and bottom
    walls.push({ x, y, w, h: t, type: "wall" });
    walls.push({ x, y: y + h - t, w, h: t, type: "wall" });
  } else {
    // Vertical corridor — walls on left and right
    walls.push({ x, y, w: t, h, type: "wall" });
    walls.push({ x: x + w - t, y, w: t, h, type: "wall" });
  }
  return walls;
}

// Helper to generate spawn points in a rectangle
function spawnsInArea(
  x: number, y: number, w: number, h: number, count: number,
): SpawnPoint[] {
  const points: SpawnPoint[] = [];
  const padding = TILE * 3;
  for (let i = 0; i < count; i++) {
    points.push({
      x: x + padding + Math.random() * (w - padding * 2),
      y: y + padding + Math.random() * (h - padding * 2),
    });
  }
  return points;
}

// ============================================================================
// MAP 1: Norte Plaza (based on North Shopping Jockey)
// Large rectangular mall with central atrium and radiating wings
// ============================================================================
export const MAP_NORTE_PLAZA: GameMap = {
  id: "norte_plaza",
  name: "Norte Plaza",
  realName: "North Shopping Jockey",
  width: 3200,
  height: 2400,
  color: "#1a2744",
  accentColor: "#3b82f6",
  description:
    "Shopping de grande porte com atrio central e alas radiantes. Lojas de ponta a ponta.",

  rooms: [
    // Central Atrium
    { x: 1200, y: 800, w: 800, h: 800, name: "Atrio Central", type: "atrium" },

    // North wing
    { x: 400, y: 200, w: 600, h: 500, name: "Ala Norte - Lojas", type: "store" },
    { x: 1200, y: 200, w: 400, h: 400, name: "Ala Norte - Ancora", type: "anchor" },
    { x: 2000, y: 200, w: 600, h: 500, name: "Ala Norte - Alimentacao", type: "food_court" },

    // West wing
    { x: 200, y: 900, w: 500, h: 600, name: "Ala Oeste - Lojas", type: "store" },
    { x: 200, y: 1600, w: 400, h: 400, name: "Estacionamento", type: "parking" },

    // East wing
    { x: 2500, y: 900, w: 500, h: 600, name: "Ala Leste - Lojas", type: "store" },
    { x: 2500, y: 1600, w: 400, h: 400, name: "Playground", type: "store" },

    // South wing
    { x: 400, y: 1800, w: 600, h: 400, name: "Ala Sul - Cinema", type: "anchor" },
    { x: 1200, y: 1800, w: 400, h: 300, name: "Escadas", type: "escalator" },
    { x: 2000, y: 1800, w: 600, h: 400, name: "Ala Sul - Lojas", type: "store" },

    // Entrance
    { x: 1350, y: 2200, w: 500, h: 200, name: "Entrada Principal", type: "entrance" },

    // Corridors connecting atrium to wings
    { x: 1000, y: 1000, w: 200, h: 400, name: "Corredor Oeste", type: "corridor" },
    { x: 2000, y: 1000, w: 200, h: 400, name: "Corredor Leste", type: "corridor" },
    { x: 1400, y: 600, w: 400, h: 200, name: "Corredor Norte", type: "corridor" },
    { x: 1400, y: 1600, w: 400, h: 200, name: "Corredor Sul", type: "corridor" },
  ],

  walls: [], // Generated below

  spawns: [],
  itemSpawns: [],
};

// ============================================================================
// MAP 2: Parque Shopping (based on Shopping Parangaba)
// More compact, grid-like layout with outdoor areas
// ============================================================================
export const MAP_PARQUE_SHOPPING: GameMap = {
  id: "parque_shopping",
  name: "Parque Shopping",
  realName: "Shopping Parangaba",
  width: 2800,
  height: 2800,
  color: "#1a3322",
  accentColor: "#22c55e",
  description:
    "Shopping compacto com layout em grade. Areas externas e cobertas misturadas.",

  rooms: [
    // Central area
    { x: 1000, y: 1000, w: 800, h: 800, name: "Praca Central", type: "atrium" },

    // Top row
    { x: 200, y: 200, w: 500, h: 500, name: "Loja Norte 1", type: "store" },
    { x: 900, y: 200, w: 400, h: 500, name: "Supermercado", type: "anchor" },
    { x: 1500, y: 200, w: 500, h: 500, name: "Loja Norte 2", type: "store" },
    { x: 2200, y: 200, w: 400, h: 500, name: "Restaurante", type: "food_court" },

    // Middle left
    { x: 200, y: 900, w: 400, h: 400, name: "Loja Oeste", type: "store" },
    { x: 200, y: 1500, w: 400, h: 500, name: "Academia", type: "store" },

    // Middle right
    { x: 2200, y: 900, w: 400, h: 400, name: "Loja Leste", type: "store" },
    { x: 2200, y: 1500, w: 400, h: 500, name: "Pet Shop", type: "store" },

    // Bottom row
    { x: 200, y: 2200, w: 500, h: 400, name: "Saida Sul 1", type: "entrance" },
    { x: 1100, y: 2200, w: 600, h: 400, name: "Saida Principal", type: "entrance" },
    { x: 2100, y: 2200, w: 500, h: 400, name: "Saida Sul 2", type: "entrance" },

    // Vertical corridors
    { x: 800, y: 200, w: 100, h: 1600, name: "Corredor V1", type: "corridor" },
    { x: 1900, y: 200, w: 100, h: 1600, name: "Corredor V2", type: "corridor" },

    // Horizontal corridors
    { x: 200, y: 700, w: 2400, h: 100, name: "Corredor H1", type: "corridor" },
    { x: 200, y: 2100, w: 2400, h: 100, name: "Corredor H2", type: "corridor" },

    // Parking
    { x: 600, y: 1500, w: 400, h: 400, name: "Estacionamento", type: "parking" },
  ],

  walls: [],
  spawns: [],
  itemSpawns: [],
};

// ============================================================================
// MAP 3: Bezerra Center (based on North Shopping Bezerra de Menezes)
// L-shaped layout with distinct zones
// ============================================================================
export const MAP_BEZERRA_CENTER: GameMap = {
  id: "bezerra_center",
  name: "Bezerra Center",
  realName: "North Shopping Bezerra de Menezes",
  width: 3000,
  height: 2600,
  color: "#331a22",
  accentColor: "#f43f5e",
  description:
    "Shopping em formato de L com zonas distintas. Area de lazer e lojas misturadas.",

  rooms: [
    // Main building (horizontal part of L)
    { x: 200, y: 400, w: 1800, h: 600, name: "Galpao Principal", type: "atrium" },
    { x: 200, y: 200, w: 500, h: 200, name: "Entrada Oeste", type: "entrance" },

    // Stores along top
    { x: 900, y: 200, w: 400, h: 200, name: "Loja A", type: "store" },
    { x: 1400, y: 200, w: 600, h: 200, name: "Alimentacao", type: "food_court" },

    // Vertical part of L (right side going down)
    { x: 1800, y: 400, w: 600, h: 1800, name: "Ala Vertical", type: "anchor" },
    { x: 2500, y: 400, w: 300, h: 600, name: "Loja Superior", type: "store" },
    { x: 2500, y: 1100, w: 300, h: 600, name: "Loja Inferior", type: "store" },

    // Bottom area
    { x: 1800, y: 2100, w: 600, h: 300, name: "Saida Sul", type: "entrance" },

    // Inner rooms
    { x: 400, y: 1100, w: 500, h: 400, name: "Sala de Eventos", type: "store" },
    { x: 1100, y: 1100, w: 500, h: 400, name: "Play Area", type: "store" },

    // Lower section
    { x: 400, y: 1700, w: 600, h: 500, name: "Estacionamento Sul", type: "parking" },
    { x: 1100, y: 1700, w: 500, h: 500, name: "Restaurante", type: "food_court" },

    // Corridors
    { x: 1000, y: 600, w: 100, h: 800, name: "Corredor Central", type: "corridor" },
    { x: 1700, y: 1000, w: 100, h: 800, name: "Corredor Leste", type: "corridor" },
  ],

  walls: [],
  spawns: [],
  itemSpawns: [],
};

// ============================================================================
// MAP 4: Villa Saara (inspired by Shopping via Sulpa, multipurpose)
// Complex multi-area layout with varied terrain
// ============================================================================
export const MAP_VILLA_SAARA: GameMap = {
  id: "villa_saara",
  name: "Villa Saara",
  realName: "Shopping Via Sulpa",
  width: 3400,
  height: 2200,
  color: "#2d1f0f",
  accentColor: "#f59e0b",
  description:
    "Complexo comercial de grande porte com multiplos blocos conectados por passarelas.",

  rooms: [
    // Block A - Main
    { x: 200, y: 200, w: 800, h: 700, name: "Bloco A - Principal", type: "atrium" },
    { x: 200, y: 1000, w: 400, h: 400, name: "Loja A1", type: "store" },
    { x: 700, y: 1000, w: 300, h: 400, name: "Loja A2", type: "store" },

    // Block B - Food
    { x: 1200, y: 200, w: 600, h: 500, name: "Bloco B - Alimentacao", type: "food_court" },
    { x: 1200, y: 800, w: 300, h: 300, name: "Cafe", type: "store" },
    { x: 1600, y: 800, w: 200, h: 300, name: "Loja B1", type: "store" },

    // Block C - Entertainment
    { x: 2000, y: 200, w: 600, h: 700, name: "Bloco C - Entretenimento", type: "anchor" },
    { x: 2000, y: 1000, w: 300, h: 400, name: "Sala de jogos", type: "store" },
    { x: 2400, y: 1000, w: 200, h: 400, name: "Boliche", type: "store" },

    // Block D - Services
    { x: 2800, y: 200, w: 400, h: 600, name: "Bloco D - Servicos", type: "store" },
    { x: 2800, y: 900, w: 400, h: 300, name: "Saude", type: "store" },

    // Lower area
    { x: 200, y: 1600, w: 800, h: 400, name: "Estacionamento", type: "parking" },
    { x: 1200, y: 1500, w: 600, h: 500, name: "Area de Carga", type: "store" },
    { x: 2000, y: 1500, w: 600, h: 500, name: "Saida Principal", type: "entrance" },
    { x: 2800, y: 1400, w: 400, h: 400, name: "Saida Lateral", type: "entrance" },

    // Connecting corridors (passarelas)
    { x: 1000, y: 350, w: 200, h: 80, name: "Passarela AB", type: "corridor" },
    { x: 1800, y: 350, w: 200, h: 80, name: "Passarela BC", type: "corridor" },
    { x: 2600, y: 400, w: 200, h: 80, name: "Passarela CD", type: "corridor" },
    { x: 1000, y: 1100, w: 200, h: 80, name: "Passarela Inferior", type: "corridor" },
    { x: 1800, y: 1100, w: 200, h: 80, name: "Passarela Inferior 2", type: "corridor" },

    // Vertical connectors
    { x: 600, y: 900, w: 80, h: 100, name: "Escada A", type: "escalator" },
    { x: 1400, y: 700, w: 80, h: 100, name: "Escada B", type: "escalator" },
    { x: 2200, y: 900, w: 80, h: 100, name: "Escada C", type: "escalator" },
  ],

  walls: [],
  spawns: [],
  itemSpawns: [],
};

// ============================================================================
// Generate walls, spawns, and item spawns for all maps
// ============================================================================

function generateMapWalls(map: GameMap): void {
  const walls: Wall[] = [];
  const t = TILE;

  // Create outer boundary walls
  walls.push({ x: 0, y: 0, w: map.width, h: t, type: "wall" });
  walls.push({ x: 0, y: map.height - t, w: map.width, h: t, type: "wall" });
  walls.push({ x: 0, y: 0, w: t, h: map.height, type: "wall" });
  walls.push({ x: map.width - t, y: 0, w: t, h: map.height, type: "wall" });

  // Create walls for each room (with gaps for doorways)
  for (const room of map.rooms) {
    if (room.type === "corridor") continue;

    // Top wall with gaps
    const topGaps = Math.floor(Math.random() * 2) + 1;
    const topWallLength = room.w - t * 2;
    const gapWidth = t * 4;
    const segmentLength = (topWallLength - topGaps * gapWidth) / (topGaps + 1);

    let wx = room.x + t;
    for (let i = 0; i <= topGaps; i++) {
      const segW = Math.min(segmentLength, room.x + room.w - t - wx);
      if (segW > 0) {
        walls.push({ x: wx, y: room.y, w: segW, h: t, type: "wall" });
      }
      wx += segW + gapWidth;
    }

    // Bottom wall with gaps
    const botGaps = Math.floor(Math.random() * 2) + 1;
    const botWallLength = room.w - t * 2;
    const botSegLen = (botWallLength - botGaps * gapWidth) / (botGaps + 1);

    wx = room.x + t;
    for (let i = 0; i <= botGaps; i++) {
      const segW = Math.min(botSegLen, room.x + room.w - t - wx);
      if (segW > 0) {
        walls.push({ x: wx, y: room.y + room.h - t, w: segW, h: t, type: "wall" });
      }
      wx += segW + gapWidth;
    }

    // Left wall with gaps
    const leftGaps = Math.floor(Math.random() * 1) + 1;
    const leftWallLength = room.h - t * 2;
    const leftSegLen = (leftWallLength - leftGaps * gapWidth) / (leftGaps + 1);

    let wy = room.y + t;
    for (let i = 0; i <= leftGaps; i++) {
      const segH = Math.min(leftSegLen, room.y + room.h - t - wy);
      if (segH > 0) {
        walls.push({ x: room.x, y: wy, w: t, h: segH, type: "wall" });
      }
      wy += segH + gapWidth;
    }

    // Right wall with gaps
    const rightGaps = Math.floor(Math.random() * 1) + 1;
    const rightWallLength = room.h - t * 2;
    const rightSegLen = (rightWallLength - rightGaps * gapWidth) / (rightGaps + 1);

    wy = room.y + t;
    for (let i = 0; i <= rightGaps; i++) {
      const segH = Math.min(rightSegLen, room.y + room.h - t - wy);
      if (segH > 0) {
        walls.push({ x: room.x + room.w - t, y: wy, w: t, h: segH, type: "wall" });
      }
      wy += segH + gapWidth;
    }
  }

  // Add cover objects inside rooms
  for (const room of map.rooms) {
    if (room.type === "corridor" || room.type === "entrance") continue;
    const coverCount = room.type === "food_court" ? 4 : room.type === "store" ? 2 : 3;
    for (let i = 0; i < coverCount; i++) {
      const cx = room.x + t * 4 + Math.random() * (room.w - t * 8);
      const cy = room.y + t * 4 + Math.random() * (room.h - t * 8);
      const cw = t * 2 + Math.random() * t * 2;
      const ch = t * 2 + Math.random() * t * 2;
      walls.push({ x: cx, y: cy, w: cw, h: ch, type: "cover" });
    }
  }

  map.walls = walls;
}

function generateSpawns(map: GameMap): void {
  const spawns: SpawnPoint[] = [];
  const rooms = map.rooms.filter(
    (r) => r.type !== "corridor" && r.type !== "escalator",
  );

  // Put spawns in every room
  for (const room of rooms) {
    const count = room.type === "atrium" ? 4 : room.type === "food_court" ? 3 : 2;
    spawns.push(...spawnsInArea(room.x, room.y, room.w, room.h, count));
  }

  map.spawns = spawns;
}

function generateItemSpawns(map: GameMap): void {
  const items: Vec2[] = [];
  const rooms = map.rooms.filter((r) => r.type !== "corridor");

  for (const room of rooms) {
    const count = room.type === "food_court" || room.type === "store" ? 2 : 1;
    for (let i = 0; i < count; i++) {
      items.push({
        x: room.x + TILE * 3 + Math.random() * (room.w - TILE * 6),
        y: room.y + TILE * 3 + Math.random() * (room.h - TILE * 6),
      });
    }
  }

  map.itemSpawns = items;
}

// Initialize all maps
const ALL_MAPS = [MAP_NORTE_PLAZA, MAP_PARQUE_SHOPPING, MAP_BEZERRA_CENTER, MAP_VILLA_SAARA];

for (const map of ALL_MAPS) {
  generateMapWalls(map);
  generateSpawns(map);
  generateItemSpawns(map);
}

export { ALL_MAPS };

export function getMapById(id: string): GameMap | undefined {
  return ALL_MAPS.find((m) => m.id === id);
}