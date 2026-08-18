import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      // Game profile
      totalScore: v.optional(v.number()),
      totalMatches: v.optional(v.number()),
      totalWins: v.optional(v.number()),
      totalKills: v.optional(v.number()),
      level: v.optional(v.number()),
    }).index("email", ["email"]),

    // Individual match records
    matches: defineTable({
      mapId: v.string(),
      mapName: v.string(),
      winnerId: v.optional(v.string()),
      winnerName: v.optional(v.string()),
      totalPlayers: v.number(),
      totalBots: v.number(),
      duration: v.number(), // seconds
      endedAt: v.number(),
    }).index("by_endedAt", ["endedAt"]),

    // Per-player results in a match
    matchPlayers: defineTable({
      matchId: v.id("matches"),
      userId: v.string(),
      playerName: v.string(),
      isBot: v.boolean(),
      placement: v.number(),
      kills: v.number(),
      headshots: v.number(),
      damageDealt: v.number(),
      assists: v.number(),
      survivalTime: v.number(),
      itemsCollected: v.number(),
      killstreakMax: v.number(),
      totalScore: v.number(),
    }).index("by_match", ["matchId"]).index("by_user", ["userId"]),

    // Persistent leaderboard (updated after each match)
    leaderboard: defineTable({
      userId: v.string(),
      playerName: v.string(),
      totalScore: v.number(),
      matches: v.number(),
      wins: v.number(),
      kills: v.number(),
      bestPlacement: v.number(),
      updatedAt: v.number(),
    }).index("by_score", ["totalScore"]),

    // ── Multiplayer Rooms ──
    gameRooms: defineTable({
      roomCode: v.string(),
      roomName: v.string(),
      hostId: v.string(),
      hostName: v.string(),
      mapId: v.string(),
      maxPlayers: v.number(),
      currentPlayers: v.number(),
      botCount: v.number(),
      status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")),
      createdAt: v.number(),
      startedAt: v.optional(v.number()),
      matchId: v.optional(v.id("matches")),
    }).index("by_code", ["roomCode"]).index("by_status", ["status"]),

    // Players in a room
    roomPlayers: defineTable({
      roomId: v.id("gameRooms"),
      userId: v.string(),
      playerName: v.string(),
      isReady: v.boolean(),
      joinedAt: v.number(),
    }).index("by_room", ["roomId"]).index("by_user_room", ["userId", "roomId"]),

    // Real-time game state sync (positions, health, etc.)
    gameStates: defineTable({
      roomId: v.id("gameRooms"),
      userId: v.string(),
      playerName: v.string(),
      x: v.number(),
      y: v.number(),
      health: v.number(),
      weapon: v.string(),
      alive: v.boolean(),
      kills: v.number(),
      facing: v.number(),
      isCrouching: v.boolean(),
      isSprinting: v.boolean(),
      updatedAt: v.number(),
    }).index("by_room", ["roomId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;