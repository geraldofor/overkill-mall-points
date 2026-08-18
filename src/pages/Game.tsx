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
  Clock,
  Users,
  Swords,
  Trophy,
  Shield,
  Snowflake,
  RotateCcw,
  ShieldPlus,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Helper: detect mobile
// ──────────────────────────────────────────────────────────────
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

// ──────────────────────────────────────────────────────────────
// Main Game Component
// ──────────────────────────────────────────────────────────────
export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const mapId = searchParams.get("map") || "norte_plaza";
  const botCount = parseInt(searchParams.get("bots") || "14", 10);
  const playerColor = searchParams.get("color") || "#ff2b3d";
  const playerName = user?.name || "Jogador";

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [isMobile] = useState(isMobileDevice);
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== "undefined" && window.innerHeight > window.innerWidth
  );

  const map: GameMap | undefined = ALL_MAPS.find((m) => m.id === mapId);

  // ── Resize + orientation detection ──
  const resizeCanvas = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setCanvasSize({ w, h });
    setIsPortrait(h > w);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
    };
  }, [resizeCanvas]);

  // ── Try to lock landscape ──
  useEffect(() => {
    if (!isMobile) return;
    const lock = async () => {
      try {
        const screen = window.screen as Screen & { orientation?: { lock?: (o: string) => Promise<void> } };
        if (screen.orientation?.lock) {
          await screen.orientation.lock("landscape");
        }
      } catch {
        // Orientation lock not supported — fallback to prompt overlay
      }
    };
    lock();
  }, [isMobile]);

  // ── Try fullscreen ──
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;
    const goFullscreen = async () => {
      try {
        const el = containerRef.current;
        if (el && !document.fullscreenElement) {
          await el.requestFullscreen?.();
        }
      } catch {
        // Fullscreen not supported
      }
    };
    goFullscreen();
  }, [isMobile]);

  // ── Start engine ──
  useEffect(() => {
    if (!canvasRef.current || !map) return;
    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onUpdate((state: GameState) => {
      setGameState({ ...state });
    });

    engine.onGameOverFn((state: GameState) => {
      engine.stop();
      setGameState({ ...state });
      setTimeout(() => setShowResults(true), 800);
    });

    // Human player died — show results fast
    engine.onHumanDeathFn((state: GameState) => {
      setGameState({ ...state });
      engine.stop();
      setTimeout(() => setShowResults(true), 500);
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
      playerColor,
    );

    return () => engine.stop();
  }, [map, botCount, playerName]);

  // ── Mobile action handlers ──
  const pressAction = useCallback((key: string) => {
    engineRef.current?.pressAction(key);
  }, []);

  if (!map) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0d] text-[#f4f2ee]">
        <div className="text-center">
          <p className="font-oswald text-lg">Mapa nao encontrado</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 font-oswald text-sm text-[#ff2b3d] uppercase cursor-pointer"
          >
            Voltar
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
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-[#0a0a0c] select-none"
    >
      {/* ── Orientation lock prompt for mobile portrait ── */}
      {isMobile && isPortrait && !showResults && (
        <div className="absolute inset-0 z-[100] bg-[#0b0b0d] flex flex-col items-center justify-center gap-6 p-8">
          <RotateCcw className="size-16 text-[#ffcc00] animate-spin" style={{ animationDuration: "3s" }} />
          <h2 className="font-anton text-3xl text-[#f4f2ee] text-center">
            Vire o celular
          </h2>
          <p className="font-oswald text-sm text-[#7c7c82] text-center max-w-[280px]">
            O jogo funciona melhor em modo paisagem. Gire seu dispositivo para jogar.
          </p>
          <div className="flex items-center gap-2 text-[#52525a]">
            <svg width="40" height="28" viewBox="0 0 40 28" fill="none" className="opacity-50">
              <rect x="1" y="1" width="38" height="26" rx="3" stroke="currentColor" strokeWidth="2"/>
              <rect x="4" y="4" width="14" height="20" rx="1" fill="currentColor" opacity="0.3"/>
            </svg>
            <svg width="28" height="40" viewBox="0 0 28 40" fill="none" className="text-[#ffcc00] opacity-70">
              <rect x="1" y="1" width="26" height="38" rx="3" stroke="currentColor" strokeWidth="2"/>
              <rect x="4" y="4" width="20" height="14" rx="1" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className="block"
        style={{ touchAction: "none" }}
      />

      {/* ── HUD Overlay ── */}
      {human && !showResults && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 sm:size-4 text-[#7c7c82]" />
                <span className="font-anton text-sm sm:text-base text-[#f4f2ee]">
                  {gameState?.aliveCount || 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Swords className="size-3.5 sm:size-4 text-[#ff2b3d]" />
                <span className="font-anton text-sm sm:text-base text-[#f4f2ee]">
                  {human.kills}
                </span>
              </div>
              {human.headshots > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] sm:text-xs">🎯</span>
                  <span className="font-oswald text-[10px] sm:text-xs text-[#ffcc00]">
                    {human.headshots}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 sm:size-4 text-[#7c7c82]" />
              <span className="font-anton text-sm sm:text-base text-[#f4f2ee]">
                {formatTime(gameState?.matchTime || 0)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Trophy className="size-3.5 sm:size-4 text-[#ffcc00]" />
              <span className="font-anton text-sm sm:text-base text-[#ffcc00]">
                #{placement}
              </span>
            </div>
          </div>

          {/* Left panel — HP, EP, Armor, Weapon — hidden on small mobile */}
          <div className="absolute bottom-4 left-3 sm:left-4 pointer-events-none z-10 max-w-[180px] sm:max-w-[200px]">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
              <Heart className="size-3.5 sm:size-4 text-[#ff2b3d]" />
              <span className="font-anton text-base sm:text-lg text-[#f4f2ee]">
                {Math.ceil(human.health)}
              </span>
              {human.ep > 0 && (
                <span className="font-oswald text-[10px] sm:text-xs text-[#a855f7] ml-1">
                  EP:{Math.floor(human.ep)}
                </span>
              )}
            </div>
            <div className="w-36 sm:w-44 h-2.5 sm:h-3 bg-[#1a1a1c] rounded-sm overflow-hidden border border-[#26262a]">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${(human.health / human.maxHealth) * 100}%`,
                  backgroundColor:
                    human.health > 50 ? "#22c55e" : human.health > 25 ? "#f59e0b" : "#ff2b3d",
                }}
              />
            </div>
            {human.ep > 0 && (
              <div className="w-36 sm:w-44 h-1.5 bg-[#1a1a1c] rounded-sm overflow-hidden border border-[#26262a] mt-0.5">
                <div
                  className="h-full transition-all duration-100"
                  style={{ width: `${(human.ep / human.maxEp) * 100}%`, backgroundColor: "#a855f7" }}
                />
              </div>
            )}
            {human.armor.level > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="size-3 text-[#94a3b8]" />
                <div className="w-28 sm:w-32 h-2 bg-[#1a1a1c] rounded-sm overflow-hidden border border-[#26262a]">
                  <div
                    className="h-full transition-all duration-100"
                    style={{ width: `${(human.armor.durability / human.armor.maxDurability) * 100}%`, backgroundColor: "#94a3b8" }}
                  />
                </div>
                <span className="font-oswald text-[9px] sm:text-[10px] text-[#64748b]">Lv{human.armor.level}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
              <Crosshair className="size-2.5 sm:size-3 text-[#7c7c82]" />
              <span className="font-oswald text-[10px] sm:text-xs text-[#7c7c82] uppercase">
                {WEAPONS[human.weapon].name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
              <span
                className={`font-anton text-sm sm:text-base ${
                  human.ammo <= 5
                    ? "text-[#ff2b3d] animate-pulse"
                    : human.ammo <= 15
                    ? "text-[#f59e0b]"
                    : "text-[#f4f2ee]"
                }`}
              >
                {human.ammo}
              </span>
              <span className="font-oswald text-[10px] sm:text-xs text-[#52525a]">
                / {human.maxAmmo}
              </span>
              <span className="font-oswald text-[9px] sm:text-[10px] text-[#52525a] ml-1">
                R:{human.reserveAmmo}
              </span>
            </div>
            {human.glooWalls > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 mt-1">
                <Snowflake className="size-3 text-[#00e5ff]" />
                <span className="font-oswald text-[10px] sm:text-xs text-[#00e5ff]">
                  {human.glooWalls}/{human.maxGlooWalls}
                </span>
              </div>
            )}
          </div>

          {/* Score — bottom center */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <div className="bg-[#141416]/80 border border-[#26262a] rounded px-3 py-1.5 sm:px-4 sm:py-2 text-center">
              <span className="font-oswald text-[8px] sm:text-[10px] tracking-[0.14em] text-[#7c7c82] uppercase block">
                Score
              </span>
              <span className="font-anton text-lg sm:text-xl text-[#ffcc00]">
                {human.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Kill feed — top right */}
          <div className="absolute top-10 right-2 sm:right-4 pointer-events-none z-10">
            {gameState?.killFeed.slice(0, isMobile ? 3 : 5).map((entry, i) => (
              <div
                key={i}
                className="bg-[#141416]/80 border border-[#26262a] rounded px-2 py-0.5 sm:px-3 sm:py-1 mb-0.5 sm:mb-1 text-right"
                style={{ opacity: 1 - i * 0.15 }}
              >
                <span className="font-oswald text-[10px] sm:text-xs text-[#f4f2ee]">
                  {entry.killerName}
                </span>
                <span className="font-oswald text-[10px] sm:text-xs text-[#7c7c82] mx-0.5 sm:mx-1">
                  {entry.isHeadshot ? "🎯" : getWeaponIcon(entry.weaponType)}
                </span>
                <span className="font-oswald text-[10px] sm:text-xs text-[#ff2b3d]">
                  {entry.victimName}
                </span>
              </div>
            ))}
          </div>

          {/* Minimap — mobile: top-right below killfeed, desktop: bottom-right */}
          <div className={`absolute ${isMobile ? 'top-28 right-2 w-20 h-20' : 'bottom-4 right-4 w-36 h-36'} pointer-events-none z-10`}>
            <div className="w-full h-full bg-[#0b0b0d]/90 border border-[#26262a] rounded overflow-hidden relative">
              <Minimap gameState={gameState} humanId={human.id} size={isMobile ? 96 : 144} />
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
                <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 pointer-events-none z-10 animate-pulse">
                  <div className="bg-[#ff2b3d]/20 border border-[#ff2b3d]/50 rounded px-3 py-1.5 sm:px-4 sm:py-2">
                    <span className="font-oswald text-[10px] sm:text-xs text-[#ff2b3d] uppercase tracking-wider">
                      FORA DA ZONA!
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Desktop controls hint */}
          <div className="absolute top-12 sm:top-14 left-3 sm:left-4 pointer-events-none z-10 hidden sm:block">
            <div className="bg-[#141416]/50 border border-[#26262a] rounded px-3 py-2 space-y-0.5">
              <span className="font-oswald text-[10px] text-[#52525a] block">WASD — Mover</span>
              <span className="font-oswald text-[10px] text-[#52525a] block">Shift — Correr</span>
              <span className="font-oswald text-[10px] text-[#52525a] block">Ctrl/C — Agachar</span>
              <span className="font-oswald text-[10px] text-[#52525a] block">R — Recarregar</span>
              <span className="font-oswald text-[10px] text-[#52525a] block">G/Q — Parede de Gel</span>
              <span className="font-oswald text-[10px] text-[#52525a] block">4 — Bandagem | 5 — Kit</span>
            </div>
          </div>

          {/* ── MOBILE: D-pad LEFT + Action Buttons RIGHT ── */}
          {isMobile && !isPortrait && (
            <>
              {/* LEFT SIDE: D-pad / Joystick visual area */}
              <div className="absolute bottom-20 left-4 z-15 pointer-events-none">
                <div className="relative w-28 h-28">
                  {/* D-pad background circle */}
                  <div className="absolute inset-0 rounded-full border-2 border-[#f4f2ee]/15 bg-[#0b0b0d]/30" />
                  {/* D-pad cross lines */}
                  <div className="absolute top-1/2 left-2 right-2 h-px bg-[#f4f2ee]/10 -translate-y-1/2" />
                  <div className="absolute left-1/2 top-2 bottom-2 w-px bg-[#f4f2ee]/10 -translate-x-1/2" />
                  {/* Center dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#f4f2ee]/20" />
                </div>
              </div>

              {/* RIGHT SIDE: Action buttons (Reload, Gloo Wall, Bandage, Medkit) */}
              <div className="absolute bottom-20 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
                {/* Reload — yellow */}
                <button
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); pressAction("r"); }}
                  className="w-14 h-14 bg-[#ffcc00]/20 border-2 border-[#ffcc00]/60 rounded-full flex items-center justify-center active:bg-[#ffcc00]/50 active:scale-95 touch-none shadow-lg"
                >
                  <RotateCcw className="size-6 text-[#ffcc00]" />
                </button>
                {/* Gloo Wall — cyan */}
                <button
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); pressAction("g"); }}
                  className="w-14 h-14 bg-[#00e5ff]/20 border-2 border-[#00e5ff]/60 rounded-full flex items-center justify-center active:bg-[#00e5ff]/50 active:scale-95 touch-none shadow-lg"
                >
                  <Snowflake className="size-6 text-[#00e5ff]" />
                </button>
                {/* Bandage — green */}
                <button
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); pressAction("4"); }}
                  className="w-12 h-12 bg-[#4ade80]/20 border-2 border-[#4ade80]/50 rounded-full flex items-center justify-center active:bg-[#4ade80]/50 active:scale-95 touch-none"
                >
                  <span className="font-oswald text-sm font-bold text-[#4ade80]">B</span>
                </button>
                {/* Medkit — dark green */}
                <button
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); pressAction("5"); }}
                  className="w-12 h-12 bg-[#16a34a]/20 border-2 border-[#16a34a]/50 rounded-full flex items-center justify-center active:bg-[#16a34a]/50 active:scale-95 touch-none"
                >
                  <span className="font-oswald text-sm font-bold text-[#16a34a]">M</span>
                </button>
              </div>
            </>
          )}

          {/* Mobile hint */}
          {isMobile && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
              <div className="bg-[#141416]/60 rounded px-2 py-1">
                <span className="font-oswald text-[9px] text-[#52525a] uppercase">
                  Esq=mover | Dir=atirar | Acoes: canto inferior direito
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Game Over Results */}
      {showResults && human && gameState && (
        <GameResults
          gameState={gameState}
          humanId={human.id}
          onExit={() => navigate("/")}
          isMobile={isMobile}
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
  size = 144,
}: {
  gameState: GameState | null;
  humanId: string;
  size?: number;
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

    for (const gw of gameState.glooWalls) {
      ctx.fillStyle = "rgba(0,229,255,0.6)";
      ctx.fillRect(
        (gw.pos.x - gw.width / 2) * scale,
        (gw.pos.y - gw.height / 2) * scale,
        gw.width * scale,
        gw.height * scale,
      );
    }

    for (const [, player] of gameState.players) {
      if (!player.alive) continue;
      ctx.fillStyle = player.id === humanId ? "#ffcc00" : player.color;
      ctx.beginPath();
      ctx.arc(player.pos.x * scale, player.pos.y * scale, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const human = gameState.players.get(humanId);
    if (human && human.alive) {
      ctx.strokeStyle = "#ffcc00";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(human.pos.x * scale, human.pos.y * scale, 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [gameState, humanId]);

  return <canvas ref={canvasRef} width={size} height={size} className="block" />;
}

// ============================================================================
// Results screen
// ============================================================================
function GameResults({
  gameState,
  humanId,
  onExit,
  isMobile,
}: {
  gameState: GameState;
  humanId: string;
  onExit: () => void;
  isMobile: boolean;
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
  const totalScore = combatScore + survivalScore + placementScore + streakBonus + objectiveScore;

  return (
    <div className="absolute inset-0 bg-[#0b0b0d]/95 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="font-oswald text-[10px] sm:text-xs tracking-[0.35em] text-[#ffcc00] uppercase mb-2">
            Partida encerrada
          </div>
          {placement === 1 ? (
            <h1 className="font-anton text-4xl sm:text-6xl text-[#ffcc00] uppercase">VITORIA!</h1>
          ) : (
            <h1 className="font-anton text-3xl sm:text-5xl text-[#f4f2ee] uppercase">
              #{placement} Lugar
            </h1>
          )}
        </div>

        <div className={`grid gap-2 sm:gap-3 mb-4 sm:mb-6 ${isMobile ? "grid-cols-3" : "grid-cols-3"}`}>
          {[
            { label: "Abates", value: human.kills, color: "#ff2b3d" },
            { label: "Headshots", value: human.headshots, color: "#ffcc00" },
            { label: "Dano", value: Math.floor(human.damageDealt), color: "#f59e0b" },
            { label: "Tempo", value: `${Math.floor(human.survivalTime)}s`, color: "#7c7c82" },
            { label: "Itens", value: human.itemsCollected, color: "#22c55e" },
            { label: "Streak", value: human.killstreakMax, color: "#a855f7" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#141416] border border-[#26262a] rounded p-2 sm:p-3 text-center">
              <span className="font-oswald text-[8px] sm:text-[10px] tracking-wider text-[#7c7c82] uppercase block">
                {stat.label}
              </span>
              <span className="font-anton text-base sm:text-xl block mt-0.5 sm:mt-1" style={{ color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#141416] border border-[#26262a] rounded p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="font-oswald text-[10px] sm:text-xs tracking-[0.14em] text-[#7c7c82] uppercase mb-2 sm:mb-3">
            Detalhes da pontuacao
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            {[
              { label: "Combate", value: combatScore },
              { label: "Sobrevivencia", value: survivalScore },
              { label: `Posicao (#${placement})`, value: placementScore },
              { label: "Objetivos", value: objectiveScore },
              { label: "Bonus Streak", value: streakBonus },
            ].map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="font-oswald text-xs sm:text-sm text-[#7c7c82]">{item.label}</span>
                <span className="font-oswald text-xs sm:text-sm text-[#f4f2ee]">
                  +{item.value.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t border-[#26262a] pt-2 mt-2 flex justify-between">
              <span className="font-oswald text-xs sm:text-sm text-[#ffcc00] uppercase">Total</span>
              <span className="font-anton text-base sm:text-lg text-[#ffcc00]">
                {totalScore.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-2.5 sm:py-3 bg-[#1a1a1c] border border-[#26262a] rounded font-oswald text-xs sm:text-sm tracking-wider text-[#7c7c82] hover:bg-[#26262a] hover:text-[#f4f2ee] transition-colors cursor-pointer uppercase"
          >
            Sair
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 sm:py-3 bg-[#ff2b3d] rounded font-oswald text-xs sm:text-sm tracking-wider text-white hover:bg-[#ff1526] transition-colors cursor-pointer uppercase"
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
