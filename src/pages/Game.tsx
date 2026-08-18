import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { GameEngine } from "@/game/engine";
import { ALL_MAPS } from "@/game/maps";
import { GameState, GameMap } from "@/game/types";
import { SCORE } from "@/game/scoring";
import { useAuth } from "@/hooks/use-auth";
import {
  Heart,
  Crosshair,
  MapPin,
  Clock,
  Users,
  Swords,
  Trophy,
} from "lucide-react";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const mapId = searchParams.get("map") || "norte_plaza";
  const botCount = parseInt(searchParams.get("bots") || "14", 10);
  const playerName = user?.name || "Jogador";

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  // Find the map
  const map: GameMap | undefined = ALL_MAPS.find((m) => m.id === mapId);

  // Resize canvas to fill viewport
  const resizeCanvas = useCallback(() => {
    setCanvasSize({
      w: window.innerWidth,
      h: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Initialize engine
  useEffect(() => {
    if (!canvasRef.current || !map) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onUpdate((state: GameState) => {
      setGameState({ ...state });
    });

    engine.onGameOverFn((state: GameState) => {
      setTimeout(() => {
        setShowResults(true);
      }, 2000);
      setGameState({ ...state });
    });

    engine.start(
      {
        mapId: map.id,
        playerCount: botCount + 1,
        botCount,
        matchDuration: 300, // 5 minutes
        map,
      },
      playerName,
    );

    return () => {
      engine.stop();
    };
  }, [map, botCount, playerName]);

  if (!map) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0d] text-[#f4f2ee]">
        <div className="text-center">
          <p className="font-oswald text-lg">Mapa não encontrado</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 font-oswald text-sm text-[#ff2b3d] uppercase cursor-pointer"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const human = gameState?.players
    ? Array.from(gameState.players.values()).find((p) => !p.isBot)
    : null;

  const placement = gameState
    ? gameState.aliveCount
    : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0c]">
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className="block"
        style={{ touchAction: "none" }}
      />

      {/* HUD Overlay */}
      {human && !showResults && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Users className="size-4 text-[#7c7c82]" />
                <span className="font-oswald text-sm text-[#f4f2ee]">
                  {gameState?.aliveCount || 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Swords className="size-4 text-[#ff2b3d]" />
                <span className="font-oswald text-sm text-[#f4f2ee]">
                  {human.kills}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-[#7c7c82]" />
              <span className="font-oswald text-sm text-[#f4f2ee]">
                {formatTime(gameState?.matchTime || 0)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Trophy className="size-4 text-[#ffcc00]" />
              <span className="font-oswald text-sm text-[#f4f2ee]">
                #{placement}
              </span>
            </div>
          </div>

          {/* Health bar - bottom left */}
          <div className="absolute bottom-4 left-4 pointer-events-none z-10">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="size-4 text-[#ff2b3d]" />
              <span className="font-anton text-lg text-[#f4f2ee]">
                {Math.ceil(human.health)}
              </span>
            </div>
            <div className="w-40 h-3 bg-[#1a1a1c] rounded-sm overflow-hidden border border-[#26262a]">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${(human.health / human.maxHealth) * 100}%`,
                  backgroundColor:
                    human.health > 50
                      ? "#22c55e"
                      : human.health > 25
                        ? "#f59e0b"
                        : "#ff2b3d",
                }}
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Crosshair className="size-3 text-[#7c7c82]" />
              <span className="font-oswald text-xs text-[#7c7c82]">
                {human.ammo}/{human.maxAmmo}
              </span>
              <span className="font-oswald text-[10px] text-[#52525a] ml-2">
                [R] RECARGA
              </span>
            </div>
          </div>

          {/* Score - bottom center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <div className="bg-[#141416]/80 border border-[#26262a] rounded px-4 py-2 text-center">
              <span className="font-oswald text-[10px] tracking-[0.14em] text-[#7c7c82] uppercase block">
                Score
              </span>
              <span className="font-anton text-xl text-[#ffcc00]">
                {human.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Kill feed - top right */}
          <div className="absolute top-10 right-4 pointer-events-none z-10">
            {gameState?.killFeed.slice(0, 5).map((entry, i) => (
              <div
                key={i}
                className="bg-[#141416]/80 border border-[#26262a] rounded px-3 py-1 mb-1 text-right"
                style={{ opacity: 1 - i * 0.15 }}
              >
                <span className="font-oswald text-xs text-[#f4f2ee]">
                  {entry.killerName}
                </span>
                <span className="font-oswald text-xs text-[#7c7c82] mx-1">
                  {entry.isHeadshot ? "🎯" : "→"}
                </span>
                <span className="font-oswald text-xs text-[#ff2b3d]">
                  {entry.victimName}
                </span>
              </div>
            ))}
          </div>

          {/* Minimap - bottom right */}
          <div className="absolute bottom-4 right-4 pointer-events-none z-10">
            <div className="w-32 h-32 bg-[#0b0b0d]/90 border border-[#26262a] rounded overflow-hidden">
              <Minimap gameState={gameState} humanId={human.id} />
            </div>
          </div>

          {/* Mobile touch hints */}
          <div className="absolute bottom-4 left-1/2 translate-x-[calc(-50%+80px)] pointer-events-none z-10 sm:hidden">
            <div className="bg-[#141416]/60 rounded px-3 py-1">
              <span className="font-oswald text-[10px] text-[#52525a] uppercase">
                Toque esquerda = mover | Direita = atirar
              </span>
            </div>
          </div>

          {/* Zone warning */}
          {human.alive && gameState?.zone && (() => {
            const dist = Math.sqrt(
              (human.pos.x - gameState.zone.centerX) ** 2 +
              (human.pos.y - gameState.zone.centerY) ** 2,
            );
            if (dist > gameState.zone.radius * 0.85) {
              return (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none z-10 animate-pulse">
                  <div className="bg-[#ff2b3d]/20 border border-[#ff2b3d]/50 rounded px-4 py-2">
                    <span className="font-oswald text-xs text-[#ff2b3d] uppercase tracking-wider">
                      ⚠ Fora da zona segura!
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </>
      )}

      {/* Game Over Results */}
      {showResults && human && gameState && (
        <GameResults
          gameState={gameState}
          humanId={human.id}
          onExit={() => navigate("/")}
        />
      )}
    </div>
  );
}

// ============================================================================
// Minimap component
// ============================================================================
function Minimap({
  gameState,
  humanId,
}: {
  gameState: GameState | null;
  humanId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !gameState) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const map = gameState.map;
    const scale = c.width / map.width;

    ctx.clearRect(0, 0, c.width, c.height);

    // Floor
    ctx.fillStyle = map.color;
    ctx.fillRect(0, 0, c.width, c.height);

    // Rooms
    for (const room of map.rooms) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(room.x * scale, room.y * scale, room.w * scale, room.h * scale);
    }

    // Zone
    ctx.strokeStyle = "#ff2b3d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
      gameState.zone.centerX * scale,
      gameState.zone.centerY * scale,
      gameState.zone.radius * scale,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    // Players
    for (const [, player] of gameState.players) {
      if (!player.alive) continue;
      ctx.fillStyle = player.id === humanId ? "#ffcc00" : player.color;
      ctx.beginPath();
      ctx.arc(player.pos.x * scale, player.pos.y * scale, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [gameState, humanId]);

  return <canvas ref={canvasRef} width={128} height={128} className="block" />;
}

// ============================================================================
// Results screen
// ============================================================================
function GameResults({
  gameState,
  humanId,
  onExit,
}: {
  gameState: GameState;
  humanId: string;
  onExit: () => void;
}) {
  const human = gameState.players.get(humanId);
  if (!human) return null;

  // Calculate placement
  const alivePlayers = Array.from(gameState.players.values())
    .filter((p) => p.alive)
    .sort((a, b) => b.health - a.health);
  const deadPlayers = Array.from(gameState.players.values())
    .filter((p) => !p.alive)
    .sort((a, b) => b.survivalTime - a.survivalTime);

  const allSorted = [...alivePlayers, ...deadPlayers];
  const placement = allSorted.findIndex((p) => p.id === humanId) + 1;

  // Score breakdown
  const combatScore =
    human.kills * SCORE.KILL +
    human.headshots * SCORE.HEADSHOT +
    Math.floor(human.damageDealt / 10) * SCORE.DAMAGE_PER_10;

  const survivalScore = Math.floor(human.survivalTime * SCORE.SURVIVAL_PER_SECOND);

  const placementScore = (() => {
    if (placement === 1) return SCORE.PLACEMENT_WIN;
    if (placement === 2) return SCORE.PLACEMENT_TOP2;
    if (placement === 3) return SCORE.PLACEMENT_TOP3;
    if (placement <= 5) return SCORE.PLACEMENT_TOP5;
    if (placement <= 10) return SCORE.PLACEMENT_TOP10;
    return 0;
  })();

  const streakBonus =
    human.killstreakMax >= 10
      ? SCORE.KILLSTREAK_10
      : human.killstreakMax >= 7
        ? SCORE.KILLSTREAK_7
        : human.killstreakMax >= 5
          ? SCORE.KILLSTREAK_5
          : human.killstreakMax >= 3
            ? SCORE.KILLSTREAK_3
            : 0;

  const objectiveScore = human.itemsCollected * SCORE.ITEM_COLLECT;

  const totalScore = combatScore + survivalScore + placementScore + streakBonus + objectiveScore;

  return (
    <div className="absolute inset-0 bg-[#0b0b0d]/95 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-oswald text-xs tracking-[0.35em] text-[#ffcc00] uppercase mb-2">
            Partida encerrada
          </div>
          {placement === 1 ? (
            <h1 className="font-anton text-6xl text-[#ffcc00] uppercase">
              VITÓRIA!
            </h1>
          ) : (
            <h1 className="font-anton text-5xl text-[#f4f2ee] uppercase">
              #{placement}º Lugar
            </h1>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Abates", value: human.kills, color: "#ff2b3d" },
            { label: "Headshots", value: human.headshots, color: "#ffcc00" },
            { label: "Dano", value: Math.floor(human.damageDealt), color: "#f59e0b" },
            { label: "Tempo", value: `${Math.floor(human.survivalTime)}s`, color: "#7c7c82" },
            { label: "Itens", value: human.itemsCollected, color: "#22c55e" },
            { label: "Streak Max", value: human.killstreakMax, color: "#a855f7" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[#141416] border border-[#26262a] rounded p-3 text-center"
            >
              <span className="font-oswald text-[10px] tracking-wider text-[#7c7c82] uppercase block">
                {stat.label}
              </span>
              <span
                className="font-anton text-xl block mt-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Score breakdown */}
        <div className="bg-[#141416] border border-[#26262a] rounded p-4 mb-6">
          <h3 className="font-oswald text-xs tracking-[0.14em] text-[#7c7c82] uppercase mb-3">
            Detalhes da pontuação
          </h3>
          <div className="space-y-2">
            {[
              { label: "Combate", value: combatScore },
              { label: "Sobrevivência", value: survivalScore },
              { label: "Posição (#" + placement + ")", value: placementScore },
              { label: "Objetivos", value: objectiveScore },
              { label: "Bônus Streak", value: streakBonus },
            ].map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="font-oswald text-sm text-[#7c7c82]">
                  {item.label}
                </span>
                <span className="font-oswald text-sm text-[#f4f2ee]">
                  +{item.value.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t border-[#26262a] pt-2 mt-2 flex justify-between">
              <span className="font-oswald text-sm text-[#ffcc00] uppercase">
                Total
              </span>
              <span className="font-anton text-lg text-[#ffcc00]">
                {totalScore.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 bg-[#1a1a1c] border border-[#26262a] rounded font-oswald text-sm tracking-wider text-[#7c7c82] hover:bg-[#26262a] hover:text-[#f4f2ee] transition-colors cursor-pointer uppercase"
          >
            Sair
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3 bg-[#ff2b3d] rounded font-oswald text-sm tracking-wider text-white hover:bg-[#ff1526] transition-colors cursor-pointer uppercase"
          >
            Jogar novamente
          </button>
        </div>
      </div>
    </div>
  );
}