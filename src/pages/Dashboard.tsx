import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ALL_MAPS } from "@/game/maps";
import {
  LogOut,
  Swords,
  Trophy,
  Clock,
  Zap,
  MapPin,
  ChevronRight,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";

const BOT_OPTIONS = [
  { label: "8 Bots", value: 8 },
  { label: "12 Bots", value: 12 },
  { label: "14 Bots", value: 14 },
  { label: "19 Bots", value: 19 },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedMap, setSelectedMap] = useState<string>(ALL_MAPS[0].id);
  const [botCount, setBotCount] = useState(14);
  const [playerColor, setPlayerColor] = useState("#ff2b3d");

  const AVATAR_COLORS = [
    { label: "Vermelho", value: "#ff2b3d" },
    { label: "Azul", value: "#3b82f6" },
    { label: "Verde", value: "#22c55e" },
    { label: "Amarelo", value: "#f59e0b" },
    { label: "Roxo", value: "#a855f7" },
    { label: "Rosa", value: "#ec4899" },
    { label: "Ciano", value: "#06b6d4" },
    { label: "Laranja", value: "#f97316" },
    { label: "Violeta", value: "#8b5cf6" },
    { label: "Turquesa", value: "#14b8a6" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const startGame = (mapId: string) => {
    navigate(`/game?map=${mapId}&bots=${botCount}&color=${encodeURIComponent(playerColor)}`);
  };

  const roomColors: Record<string, string> = {
    food_court: "#ffcc00",
    store: "#3b82f6",
    anchor: "#ff2b3d",
    atrium: "#22c55e",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0d]">
      {/* Caution stripe top */}
      <div
        className="h-2.5 w-full shrink-0"
        style={{
          background: `repeating-linear-gradient(45deg, #ffcc00, #ffcc00 14px, #1a1a1c 14px, #1a1a1c 28px)`,
        }}
      />

      {/* Header */}
      <header className="bg-[#141416] border-b border-[#26262a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="font-anton text-2xl tracking-tight text-[#f4f2ee]">
              OVER<span className="text-[#ff2b3d]">KILL</span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-[#26262a]" />
            <span className="hidden sm:block font-oswald text-xs tracking-[0.14em] text-[#7c7c82] uppercase">
              Selecionar Mapa
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#f4f2ee]">
                {user?.name || "Jogador"}
              </p>
              <p className="text-xs text-[#7c7c82]">Nível 12</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-[#26262a] bg-[#1a1a1c] hover:bg-[#26262a] text-[#7c7c82] hover:text-[#f4f2ee] font-oswald tracking-wider cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main
        className="flex-1 px-6 py-8"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 50% 0%, rgba(255,43,61,0.06), transparent 60%),
            radial-gradient(ellipse 700px 400px at 85% 100%, rgba(255,204,0,0.03), transparent 60%)
          `,
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Welcome */}
          <div className="mb-6">
            <h1 className="font-anton text-4xl md:text-5xl text-[#f4f2ee] uppercase tracking-tight">
              Escolha seu{" "}
              <span className="text-[#ff2b3d]">Setor</span>
            </h1>
            <p className="mt-2 font-oswald text-[#7c7c82] tracking-wide">
              Selecione um mapa e entre na batalha. Cada shopping tem sua própria arena.
            </p>
          </div>

          {/* Bot count selector */}
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className="font-oswald text-xs tracking-[0.14em] text-[#7c7c82] uppercase">
              Oponentes:
            </span>
            {BOT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBotCount(opt.value)}
                className={`px-4 py-2 rounded font-oswald text-xs tracking-wider uppercase cursor-pointer transition-all ${
                  botCount === opt.value
                    ? "bg-[#ff2b3d] text-white"
                    : "bg-[#1a1a1c] border border-[#26262a] text-[#7c7c82] hover:border-[#ff2b3d]/50 hover:text-[#f4f2ee]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Avatar color picker */}
          <div className="mb-6">
            <span className="font-oswald text-xs tracking-[0.14em] text-[#7c7c82] uppercase block mb-2">
              Cor do Avatar:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPlayerColor(color.value)}
                  title={color.label}
                  className={`w-9 h-9 rounded-full cursor-pointer transition-all border-2 ${
                    playerColor === color.value
                      ? "border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>

          {/* Map grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {ALL_MAPS.map((map) => {
              const isSelected = selectedMap === map.id;
              return (
                <Card
                  key={map.id}
                  onClick={() => setSelectedMap(map.id)}
                  className={`border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-[#ff2b3d] bg-[#141416] shadow-[0_0_20px_rgba(255,43,61,0.15)]"
                      : "border-[#26262a] bg-[#141416] hover:border-[#26262a]/80"
                  }`}
                >
                  <CardContent className="p-6">
                    {/* Map header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-anton text-2xl text-[#f4f2ee] uppercase">
                          {map.name}
                        </h3>
                        <p className="font-oswald text-xs tracking-wider text-[#52525a] mt-0.5">
                          {map.realName}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-[#ff2b3d] animate-pulse" />
                      )}
                    </div>

                    {/* Map preview — simplified top-down view */}
                    <div
                      className="w-full h-40 rounded border border-[#26262a] mb-4 overflow-hidden relative"
                      style={{ backgroundColor: map.color }}
                    >
                      <MapPreview map={map} />
                      {/* Zone indicator */}
                      <div
                        className="absolute border border-[#ff2b3d]/40 rounded-full"
                        style={{
                          width: `${(Math.min(map.width, map.height) * 0.45 / map.width) * 100}%`,
                          height: `${(Math.min(map.width, map.height) * 0.45 / map.height) * 100}%`,
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          borderStyle: "dashed",
                        }}
                      />
                    </div>

                    {/* Map info */}
                    <p className="font-oswald text-xs text-[#7c7c82] mb-4 leading-relaxed">
                      {map.description}
                    </p>

                    {/* Room types */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.from(new Set(map.rooms.map((r) => r.type)))
                        .slice(0, 5)
                        .map((type) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 rounded text-[10px] font-oswald tracking-wider uppercase"
                            style={{
                              backgroundColor: `${roomColors[type] || "#7c7c82"}15`,
                              color: roomColors[type] || "#7c7c82",
                            }}
                          >
                            {type.replace("_", " ")}
                          </span>
                        ))}
                    </div>

                    {/* Play button */}
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startGame(map.id);
                      }}
                      className={`w-full font-oswald text-sm tracking-wider uppercase cursor-pointer ${
                        isSelected
                          ? "bg-[#ff2b3d] hover:bg-[#ff1526] text-white"
                          : "bg-[#1a1a1c] hover:bg-[#26262a] text-[#7c7c82] border border-[#26262a]"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          Entrar no {map.name}
                          <ChevronRight className="ml-2 size-4" />
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 size-4" />
                          Selecionar
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Multiplayer button */}
          <div className="mt-6">
            <button
              onClick={() => navigate("/lobby")}
              className="w-full py-3.5 bg-[#ffcc00]/10 border-2 border-[#ffcc00]/40 rounded-lg font-oswald text-sm tracking-wider text-[#ffcc00] hover:bg-[#ffcc00]/20 hover:border-[#ffcc00]/60 transition-all uppercase flex items-center justify-center gap-2"
            >
              <Users className="size-5" />
              Multiplayer Online
              <span className="font-oswald text-[9px] bg-[#ffcc00]/20 px-2 py-0.5 rounded-full ml-1">
                NOVO
              </span>
            </button>
            <p className="font-oswald text-[9px] text-[#52525a] text-center mt-1.5">
              Crie salas e jogue com seus amigos online
            </p>
          </div>

          {/* Quick stats footer */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Swords, label: "Abates Totais", value: "47", color: "#ff2b3d" },
              { icon: Trophy, label: "Vitórias", value: "8", color: "#ffcc00" },
              { icon: Clock, label: "Tempo Jogado", value: "12h", color: "#7c7c82" },
              { icon: Zap, label: "Score Total", value: "12,450", color: "#ff2b3d" },
            ].map((stat, i) => (
              <Card
                key={i}
                className="border-[#26262a] bg-[#141416]"
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon className="size-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="font-anton text-xl text-[#f4f2ee]">{stat.value}</p>
                    <p className="font-oswald text-[10px] tracking-[0.14em] text-[#7c7c82] uppercase">
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Simple map preview renderer
// ============================================================================
function MapPreview({ map }: { map: (typeof ALL_MAPS)[number] }) {
  const scaleX = 100 / map.width;
  const scaleY = 100 / map.height;

  const roomTypeColors: Record<string, string> = {
    food_court: "rgba(255,204,0,0.25)",
    store: "rgba(59,130,246,0.2)",
    anchor: "rgba(255,43,61,0.25)",
    corridor: "rgba(255,255,255,0.05)",
    atrium: "rgba(255,255,255,0.15)",
    parking: "rgba(100,100,100,0.15)",
    escalator: "rgba(100,200,255,0.2)",
    restroom: "rgba(100,100,200,0.15)",
    entrance: "rgba(200,255,200,0.2)",
  };

  return (
    <div className="absolute inset-0">
      {map.rooms.map((room, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${room.x * scaleX}%`,
            top: `${room.y * scaleY}%`,
            width: `${room.w * scaleX}%`,
            height: `${room.h * scaleY}%`,
            backgroundColor: roomTypeColors[room.type] || "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      ))}
      {map.spawns.slice(0, 20).map((spawn, i) => (
        <div
          key={`spawn-${i}`}
          className="absolute w-1 h-1 rounded-full bg-[#22c55e]"
          style={{
            left: `${spawn.x * scaleX}%`,
            top: `${spawn.y * scaleY}%`,
          }}
        />
      ))}
    </div>
  );
}