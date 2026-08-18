import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { GameEngine } from "@/game/engine";
import { ALL_MAPS } from "@/game/maps";
import { GameState, GameMap, WeaponType } from "@/game/types";
import { WEAPONS } from "@/game/weapons";
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
  Shield,
  Zap,
  Snowflake,
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

  const map: GameMap | undefined = ALL_MAPS.find((m) => m.id === mapId);

  const resizeCanvas = useCallback(() => {
    setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    if (!canvasRef.current || !map) return;
    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onUpdate((state: GameState) => {
      setGameState({ ...state });
    });

    engine.onGameOverFn((state: GameState) => {
      setTimeout(() => setShowResults(true), 2000);
      setGameState({ ...state });
    });

    engine.start(
      {
        mapId: map.id,
        playerCount: botCount + 1,
        botCount,
        matchDuration: 300,
        map,
      },
      playerName,
    );

    return () => engine.stop();
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

  const placement = gameState ? gameState.aliveCount : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0c] select-none">
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
          {/* Top bar — alive count, kills, timer, placement */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <Users className="size-4 text-[#7c7c82]" />
                <span className="font-anton text-base text-[#f4f2ee]">
                  {gameState?.aliveCount || 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Swords className="size-4 text-[#ff2b3d]" />
                <span className="font-anton text-base text-[#f4f2ee]">
                  {human.kills}
                </span>
              </div>
              {human.headshots > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs">🎯</span>
                  <span className="font-oswald text-xs text-[#ffcc00]">
                    {human.headshots}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-[#7c7c82]" />
              <span className="font-anton text-base text-[#f4f2ee]">
                {formatTime(gameState?.matchTime || 0)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Trophy className="size-4 text-[#ffcc00]" />
              <span className="font-anton text-base text-[#ffcc00]">
                #{placement}
              </span>
            </div>
          </div>

          {/* Left panel — Health, EP, Armor, Weapon */}
          <div className="absolute bottom-4 left-4 pointer-events-none z-10 max-w-[200px]">
            {/* Health */}
            <div className="flex items-center gap-2 mb-1">
              <Heart className="size-4 text-[#ff2b3d]" />
              <span className="font-anton text-lg text-[#f4f2ee]">
                {Math.ceil(human.health)}
              </span>
              {human.ep > 0 && (
                <span className="font-oswald text-xs text-[#a855f7] ml-1">
                  EP:{Math.floor(human.ep)}
                </span>
              )}
            </div>
            <div className="w-44 h-3 bg-[#1a1a1c] rounded-sm overflow-hidden border border-[#26262a]">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${(human.health / human.maxHealth) * 100}%`,
                  backgroundColor:
                    human.health > 50 ? "#22c55e" : human.health > 25 ? "#f59e0b" : "#ff2b3d",
                }}
              />
            </div>

            {/* EP bar */}
            {human.ep > 0 && (
              <div className="w-44 h-1.5 bg-[#1a1a1c] rounded-sm overflow-hidden border border-[#26262a] mt-0.5">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${(human.ep / human.maxEp) * 100}%`,
                    backgroundColor: "#a855f7",
                  }}
                />
              </div>
            )}

            {/* Armor bar */}
            {human.armor.level > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Shield className="size-3 text-[#94a3b8]" />
                <div className="w-32 h-2 bg-[#1a1a1c] rounded-sm overflow-hidden border border-[#26262a]">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${(human.armor.durability / human.armor.maxDurability) * 100}%`,
                      backgroundColor: "#94a3b8",
                    }}
                  />
                </div>
                <span className="font-oswald text-[10px] text-[#64748b]">
                  Lv{human.armor.level}
                </span>
              </div>
            )}

            {/* Helmet indicator */}
            {human.helmet.level > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px]">🪖</span>
                <span className="font-oswald text-[10px] text-[#64748b]">
                  Capacete Lv{human.helmet.level}
                </span>
                <div className="w-16 h-1 bg-[#1a1a1c] rounded-sm overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${(human.helmet.durability / human.helmet.maxDurability) * 100}%`,
                      backgroundColor: "#94a3b8",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Weapon & Ammo */}
            <div className="flex items-center gap-2 mt-2">
              <Crosshair className="size-3 text-[#7c7c82]" />
              <span className="font-oswald text-xs text-[#7c7c82] uppercase">
                {WEAPONS[human.weapon].name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`font-anton text-base ${
                  human.ammo <= 5
                    ? "text-[#ff2b3d] animate-pulse"
                    : human.ammo <= 15
                    ? "text-[#f59e0b]"
                    : "text-[#f4f2ee]"
                }`}
              >
                {human.ammo}
              </span>
              <span className="font-oswald text-xs text-[#52525a]">
                / {human.maxAmmo}
              </span>
              <span className="font-oswald text-[10px] text-[#52525a] ml-1">
                Reserva: {human.reserveAmmo}
              </span>
            </div>

            {/* Gloo walls */}
            {human.glooWalls > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Snowflake className="size-3 text-[#00e5ff]" />
                <span className="font-oswald text-xs text-[#00e5ff]">
                  {human.glooWalls} / {human.maxGlooWalls}
                </span>
                <span className="font-oswald text-[10px] text-[#52525a]">
                  [G] Parede
                </span>
              </div>
            )}

            {/* Movement state */}
            <div className="flex items-center gap-2 mt-1.5">
              {human.isCrouching && (
                <span className="font-oswald text-[10px] text-[#f59e0b] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded">
                  AGACHADO
                </span>
              )}
              {human.isSprinting && (
                <span className="font-oswald text-[10px] text-[#3b82f6] bg-[#3b82f6]/10 px-1.5 py-0.5 rounded">
                  CORRENDO
                </span>
              )}
            </div>
          </div>

          {/* Score — bottom center */}
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

          {/* Kill feed — top right */}
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
                  {entry.isHeadshot ? "🎯" : getWeaponIcon(entry.weaponType)}
                </span>
                <span className="font-oswald text-xs text-[#ff2b3d]">
                  {entry.victimName}
                </span>
              </div>
            ))}
          </div>

          {/* Minimap — bottom right */}
          <div className="absolute bottom-4 right-4 pointer-events-none z-10">
            <div className="w-36 h-36 bg-[#0b0b0d]/90 border border-[#26262a] rounded overflow-hidden relative">
              <Minimap gameState={gameState} humanId={human.id} />
            </div>
          </div>

          {/* Quick items bar — above minimap */}
          <div className="absolute bottom-[170px] right-4 pointer-events-none z-10 flex gap-1">
            <QuickItem slot="4" label="Bandagem" count={-1} active={false} />
            <QuickItem slot="5" label="Kit Médico" count={-1} active={false} />
            <QuickItem slot="G" label="Gloo Wall" count={human.glooWalls} active={false} />
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
                      ⚠ FORA DA ZONA SEGURA!
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Controls hint — desktop only */}
          <div className="absolute top-14 left-4 pointer-events-none z-10 hidden sm:block">
            <div className="bg-[#141416]/50 border border-[#26262a] rounded px-3 py-2 space-y-0.5">
              <span className="font-oswald text-[10px] text-[#52525a] block">
                WASD — Mover
              </span>
              <span className="font-oswald text-[10px] text-[#52525a] block">
                Shift — Correr
              </span>
              <span className="font-oswald text-[10px] text-[#52525a] block">
                Ctrl/C — Agachar
              </span>
              <span className="font-oswald text-[10px] text-[#52525a] block">
                R — Recarregar
              </span>
              <span className="font-oswald text-[10px] text-[#52525a] block">
                G/Q — Parede de Gel
              </span>
              <span className="font-oswald text-[10px] text-[#52525a] block">
                4 — Bandagem | 5 — Kit Médico
              </span>
            </div>
          </div>

          {/* Mobile touch hints */}
          <div className="absolute bottom-4 left-1/2 translate-x-[calc(-50%+80px)] pointer-events-none z-10 sm:hidden">
            <div className="bg-[#141416]/60 rounded px-3 py-1">
              <span className="font-oswald text-[10px] text-[#52525a] uppercase">
                Esq=mover | Dir=atirar
              </span>
            </div>
          </div>
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
// Quick Item slot
// ============================================================================
function QuickItem({
  slot,
  label,
  count,
  active,
}: {
  slot: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <div
      className={`w-10 h-10 bg-[#141416]/80 border rounded flex flex-col items-center justify-center ${
        active ? "border-[#ffcc00]" : "border-[#26262a]"
      }`}
    >
      <span className="font-oswald text-[8px] text-[#52525a] uppercase">{slot}</span>
      <span className="font-oswald text-[8px] text-[#7c7c82]">{count > 0 ? count : ""}</span>
    </div>
  );
}

// ============================================================================
// Minimap
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

    ctx.fillStyle = map.color;
    ctx.fillRect(0, 0, c.width, c.height);

    for (const room of map.rooms) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(room.x * scale, room.y * scale, room.w * scale, room.h * scale);
    }

    // Zone
    ctx.strokeStyle = "#ff2b3d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(
      gameState.zone.centerX * scale,
      gameState.zone.centerY * scale,
      gameState.zone.radius * scale,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    // Gloo walls on minimap
    for (const gw of gameState.glooWalls) {
      ctx.fillStyle = "rgba(0,229,255,0.6)";
      ctx.fillRect(
        (gw.pos.x - gw.width / 2) * scale,
        (gw.pos.y - gw.height / 2) * scale,
        gw.width * scale,
        gw.height * scale,
      );
    }

    // Players
    for (const [, player] of gameState.players) {
      if (!player.alive) continue;
      ctx.fillStyle = player.id === humanId ? "#ffcc00" : player.color;
      ctx.beginPath();
      ctx.arc(player.pos.x * scale, player.pos.y * scale, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Human player ring
    const human = gameState.players.get(humanId);
    if (human && human.alive) {
      ctx.strokeStyle = "#ffcc00";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(human.pos.x * scale, human.pos.y * scale, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [gameState, humanId]);

  return <canvas ref={canvasRef} width={144} height={144} className="block" />;
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

  const alivePlayers = Array.from(gameState.players.values())
    .filter((p) => p.alive)
    .sort((a, b) => b.health - a.health);
  const deadPlayers = Array.from(gameState.players.values())
    .filter((p) => !p.alive)
    .sort((a, b) => b.survivalTime - a.survivalTime);

  const allSorted = [...alivePlayers, ...deadPlayers];
  const placement = allSorted.findIndex((p) => p.id === humanId) + 1;

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

  const totalScore =
    combatScore + survivalScore + placementScore + streakBonus + objectiveScore;

  return (
    <div className="absolute inset-0 bg-[#0b0b0d]/95 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full">
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

        <div className="bg-[#141416] border border-[#26262a] rounded p-4 mb-6">
          <h3 className="font-oswald text-xs tracking-[0.14em] text-[#7c7c82] uppercase mb-3">
            Detalhes da pontuação
          </h3>
          <div className="space-y-2">
            {[
              { label: "Combate", value: combatScore },
              { label: "Sobrevivência", value: survivalScore },
              { label: `Posição (#${placement})`, value: placementScore },
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

// ============================================================================
// Helpers
// ============================================================================

function getWeaponIcon(weaponType?: WeaponType): string {
  if (!weaponType) return "→";
  const icons: Record<string, string> = {
    pistol: "🔫",
    smg: "⚡",
    rifle: "🎯",
    shotgun: "💥",
    sniper: "🔭",
  };
  return icons[weaponType] || "→";
}
