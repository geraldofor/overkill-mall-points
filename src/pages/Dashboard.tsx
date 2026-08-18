import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Swords, Trophy, Clock, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router";

const LEADERBOARD = [
  { rank: 1, name: "Shadow_X", kills: 12, score: 2840, win: true },
  { rank: 2, name: "NightHawk", kills: 9, score: 2120, win: false },
  { rank: 3, name: "Phantom_BR", kills: 8, score: 1890, win: false },
  { rank: 4, name: "GhostRider", kills: 6, score: 1540, win: false },
  { rank: 5, name: "CyberWolf", kills: 5, score: 1320, win: false },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
              LOBBY
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

      {/* Main content */}
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
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="font-anton text-4xl md:text-5xl text-[#f4f2ee] uppercase tracking-tight">
              Bem-vindo ao{" "}
              <span className="text-[#ff2b3d]">Shopping</span>
            </h1>
            <p className="mt-2 font-oswald text-[#7c7c82] tracking-wide">
              Prepare-se para a próxima partida. Os corredores estão esperando.
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Swords, label: "Abates", value: "47", color: "#ff2b3d" },
              { icon: Trophy, label: "Vitórias", value: "8", color: "#ffcc00" },
              { icon: Clock, label: "Tempo", value: "12h", color: "#7c7c82" },
              { icon: Zap, label: "Score", value: "12,450", color: "#ff2b3d" },
            ].map((stat, i) => (
              <Card
                key={i}
                className="border-[#26262a] bg-[#141416] hover:border-[#ff2b3d]/30 transition-colors"
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

          <div className="grid md:grid-cols-2 gap-6">
            {/* Play button */}
            <Card className="border-[#26262a] bg-[#141416] overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-8 text-center"
                  style={{
                    background: `
                      radial-gradient(ellipse 400px 300px at 50% 50%, rgba(255,43,61,0.15), transparent 70%)
                    `,
                  }}
                >
                  <div className="font-oswald text-xs tracking-[0.35em] text-[#ffcc00] uppercase mb-4">
                    Pronto para ação
                  </div>
                  <h2 className="font-anton text-3xl md:text-4xl text-[#f4f2ee] uppercase mb-2">
                    JOGAR
                  </h2>
                  <p className="text-sm text-[#7c7c82] mb-6 max-w-xs mx-auto">
                    matchmaking automático • 13 setores • modo solo ou squad
                  </p>
                  <Button
                    type="button"
                    className="bg-[#ff2b3d] hover:bg-[#ff1526] text-white font-oswald text-lg tracking-wider px-12 py-6 uppercase cursor-pointer"
                  >
                    Entrar na fila
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="border-[#26262a] bg-[#141416]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-oswald text-sm tracking-[0.14em] text-[#7c7c82] uppercase">
                    Ranking Global
                  </h3>
                  <span className="font-oswald text-[10px] tracking-wider text-[#52525a] uppercase">
                    Temporada 1
                  </span>
                </div>

                <div className="space-y-2">
                  {LEADERBOARD.map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        player.win
                          ? "bg-[#ff2b3d]/10 border border-[#ff2b3d]/30"
                          : "bg-[#0b0b0d]"
                      }`}
                    >
                      <span
                        className={`font-anton text-lg w-8 text-center ${
                          player.rank <= 3 ? "text-[#ffcc00]" : "text-[#7c7c82]"
                        }`}
                      >
                        {player.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#f4f2ee] truncate">
                          {player.name}
                        </p>
                        <p className="text-xs text-[#7c7c82]">
                          {player.kills} abates
                        </p>
                      </div>
                      <span className="font-anton text-sm text-[#f4f2ee]">
                        {player.score.toLocaleString()}
                      </span>
                      {player.win && (
                        <span className="text-[10px] font-oswald tracking-wider text-[#ffcc00] uppercase">
                          WIN
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}