import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Generate a 6-character room code ──
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Create a new room ──
export const createRoom = mutation({
  args: {
    roomName: v.string(),
    mapId: v.string(),
    maxPlayers: v.number(),
    botCount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db.get(identity.subject as any) as { name?: string } | null;
    const playerName = user?.name || "Jogador";

    // Generate unique code
    let roomCode = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("gameRooms")
        .withIndex("by_code", (q) => q.eq("roomCode", roomCode))
        .first();
      if (!existing) break;
      roomCode = generateCode();
      attempts++;
    }

    const roomId = await ctx.db.insert("gameRooms", {
      roomCode,
      roomName: args.roomName || `Sala ${roomCode}`,
      hostId: identity.subject as string,
      hostName: playerName,
      mapId: args.mapId,
      maxPlayers: Math.min(args.maxPlayers, 20),
      currentPlayers: 1,
      botCount: args.botCount,
      status: "waiting",
      createdAt: Date.now(),
    });

    // Add host as first player
    await ctx.db.insert("roomPlayers", {
      roomId,
      userId: identity.subject as string,
      playerName,
      isReady: true,
      joinedAt: Date.now(),
    });

    return { roomId, roomCode };
  },
});

// ── Join an existing room ──
export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db.get(identity.subject as any) as { name?: string } | null;
    const playerName = user?.name || "Jogador";

    // Find room by code
    const room = await ctx.db
      .query("gameRooms")
      .withIndex("by_code", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();

    if (!room) throw new Error("Sala nao encontrada");
    if (room.status !== "waiting") throw new Error("Partida ja em andamento");
    if (room.currentPlayers >= room.maxPlayers) throw new Error("Sala cheia");

    // Check if already in room
    const existing = await ctx.db
      .query("roomPlayers")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", identity.subject as string).eq("roomId", room._id)
      )
      .first();

    if (existing) return { roomId: room._id, alreadyJoined: true };

    await ctx.db.insert("roomPlayers", {
      roomId: room._id,
      userId: identity.subject as string,
      playerName,
      isReady: false,
      joinedAt: Date.now(),
    });

    // Update player count
    await ctx.db.patch(room._id, {
      currentPlayers: room.currentPlayers + 1,
    });

    return { roomId: room._id, alreadyJoined: false };
  },
});

// ── Leave a room ──
export const leaveRoom = mutation({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("roomPlayers")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", identity.subject as string).eq("roomId", args.roomId)
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);

      const room = await ctx.db.get(args.roomId);
      if (room) {
        await ctx.db.patch(args.roomId, {
          currentPlayers: Math.max(0, room.currentPlayers - 1),
        });

        // If host left, assign new host or delete room
        if (room.hostId === identity.subject as string) {
          const remaining = await ctx.db
            .query("roomPlayers")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .first();

          if (remaining) {
            const newHostUser = await ctx.db.get(remaining.userId as any) as { name?: string } | null;
            await ctx.db.patch(args.roomId, {
              hostId: remaining.userId,
              hostName: newHostUser?.name || "Jogador",
            });
          } else {
            // No players left — delete room
            await ctx.db.delete(args.roomId);
          }
        }
      }
    }
  },
});

// ── Toggle ready status ──
export const toggleReady = mutation({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("roomPlayers")
      .withIndex("by_user_room", (q) =>
        q.eq("userId", identity.subject as string).eq("roomId", args.roomId)
      )
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, {
        isReady: !membership.isReady,
      });
    }
  },
});

// ── Start game (host only) ──
export const startGame = mutation({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Sala nao encontrada");
    if (room.hostId !== identity.subject) throw new Error("Apenas o host pode iniciar");

    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const allReady = players.every((p) => p.isReady || p.userId === room.hostId);
    if (!allReady && players.length > 1) throw new Error("Nem todos estao prontos");

    await ctx.db.patch(args.roomId, {
      status: "playing",
      startedAt: Date.now(),
    });

    return { success: true };
  },
});

// ── List active rooms ──
export const listRooms = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("gameRooms")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();

    return rooms.map((r) => ({
      _id: r._id,
      roomCode: r.roomCode,
      roomName: r.roomName,
      hostName: r.hostName,
      mapId: r.mapId,
      currentPlayers: r.currentPlayers,
      maxPlayers: r.maxPlayers,
      botCount: r.botCount,
      createdAt: r.createdAt,
    }));
  },
});

// ── Get room details ──
export const getRoom = query({
  args: { roomId: v.id("gameRooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return {
      ...room,
      playersList: players.map((p) => ({
        userId: p.userId,
        playerName: p.playerName,
        isReady: p.isReady,
        isHost: p.userId === room.hostId,
        joinedAt: p.joinedAt,
      })),
    };
  },
});

// ── Get room by code ──
export const getRoomByCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("gameRooms")
      .withIndex("by_code", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();

    if (!room) return null;

    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    return {
      ...room,
      playersList: players.map((p) => ({
        userId: p.userId,
        playerName: p.playerName,
        isReady: p.isReady,
        isHost: p.userId === room.hostId,
      })),
    };
  },
});

// ── Update real-time game state ──
export const updateGameState = mutation({
  args: {
    roomId: v.id("gameRooms"),
    x: v.number(),
    y: v.number(),
    health: v.number(),
    weapon: v.string(),
    alive: v.boolean(),
    kills: v.number(),
    facing: v.number(),
    isCrouching: v.boolean(),
    isSprinting: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    // Upsert game state
    const existing = await ctx.db
      .query("gameStates")
      .filter((q) =>
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("userId"), identity.subject as string)
        )
      )
      .first();

    const user = await ctx.db.get(identity.subject as any) as { name?: string } | null;
    const playerName = user?.name || "Jogador";

    if (existing) {
      await ctx.db.patch(existing._id, {
        x: args.x,
        y: args.y,
        health: args.health,
        weapon: args.weapon,
        alive: args.alive,
        kills: args.kills,
        facing: args.facing,
        isCrouching: args.isCrouching,
        isSprinting: args.isSprinting,
        playerName,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("gameStates", {
        roomId: args.roomId,
        userId: identity.subject as string,
        playerName,
        x: args.x,
        y: args.y,
        health: args.health,
        weapon: args.weapon,
        alive: args.alive,
        kills: args.kills,
        facing: args.facing,
        isCrouching: args.isCrouching,
        isSprinting: args.isSprinting,
        updatedAt: Date.now(),
      });
    }
  },
});

// ── Get all game states for a room ──
export const getGameStates = query({
  args: { roomId: v.id("gameRooms") },
  handler: async (ctx, args) => {
    const states = await ctx.db
      .query("gameStates")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return states.filter((s) => Date.now() - s.updatedAt < 5000); // Only recent states
  },
});

// ── End game ──
export const endRoom = mutation({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      status: "finished",
    });

    // Clean up game states
    const states = await ctx.db
      .query("gameStates")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const state of states) {
      await ctx.db.delete(state._id);
    }
  },
});
