import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ALL_MAPS } from "@/game/maps";
import {
  Users,
  Plus,
  Search,
  ArrowLeft,
  Snowflake,
  Gamepad2,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function Lobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"create" | "join" | "room">("create");
  const [roomName, setRoomName] = useState("");
  const [selectedMap, setSelectedMap] = useState("norte_plaza");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [botCount, setBotCount] = useState(10);
  const [joinCode, setJoinCode] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState<Id<"gameRooms"> | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoomMut = useMutation(api.rooms.joinRoom);
  const leaveRoomMut = useMutation(api.rooms.leaveRoom);
  const toggleReadyMut = useMutation(api.rooms.toggleReady);
  const startGameMut = useMutation(api.rooms.startGame);
  const listRooms = useQuery(api.rooms.listRooms);
  const currentRoom = useQuery(
    api.rooms.getRoom,
    currentRoomId ? { roomId: currentRoomId } : "skip"
  );

  useEffect(() => {
    if (currentRoom && currentRoom.status === "playing") {
      const realPlayers = currentRoom.playersList?.length || 1;
      const botsNeeded = Math.max(0, botCount - (realPlayers - 1));
      navigate(`/game?map=${currentRoom.mapId}&bots=${botsNeeded}&room=${currentRoom._id}`);
    }
  }, [currentRoom, navigate, botCount]);

  const handleCreate = async () => {
    setError("");
    try {
      const result = await createRoom({
        roomName: roomName || `Sala de ${user?.name || "Jogador"}`,
        mapId: selectedMap,
        maxPlayers,
        botCount,
      });
      setCurrentRoomId(result.roomId);
      setTab("room");
    } catch (e: any) {
      setError(e.message || "Erro ao criar sala");
    }
  };

  const handleJoin = async (code?: string) => {
    setError("");
    const roomCode = code || joinCode.trim().toUpperCase();
    if (!roomCode) { setError("Digite um codigo de sala"); return; }
    try {
      const result = await joinRoomMut({ roomCode });
      setCurrentRoomId(result.roomId);
      setTab("room");
    } catch (e: any) {
      setError(e.message || "Erro ao entrar na sala");
    }
  };

  const handleLeave = async () => {
    if (currentRoomId) {
      await leaveRoomMut({ roomId: currentRoomId });
      setCurrentRoomId(null);
      setTab("join");
    }
  };

  const handleToggleReady = async () => {
    if (currentRoomId) await toggleReadyMut({ roomId: currentRoomId });
  };

  const handleStartGame = async () => {
    if (currentRoomId) {
      try { await startGameMut({ roomId: currentRoomId }); }
      catch (e: any) { setError(e.message || "Erro ao iniciar partida"); }
    }
  };

  const copyCode = () => {
    if (currentRoom?.roomCode) {
      navigator.clipboard.writeText(currentRoom.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHost = currentRoom && user && currentRoom.hostId === user._id;

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-[#f4f2ee]">
      <div className="bg-[#141416] border-b border-[#26262a] px-4 py-3 flex items-center gap-3">
        {tab !== "create" && (
          <button onClick={() => { if (tab === "room") handleLeave(); else setTab("create"); }}
            className="text-[#7c7c82] hover:text-[#f4f2ee] transition-colors">
            <ArrowLeft className="size-5" />
          </button>
        )}
        <Gamepad2 className="size-5 text-[#ff2b3d]" />
        <h1 className="font-anton text-xl tracking-wide">
          {tab === "room" ? "SALA" : "MULTIPLAYER"}
        </h1>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {error && (
          <div className="bg-[#ff2b3d]/10 border border-[#ff2b3d]/30 rounded px-3 py-2 mb-4">
            <span className="font-oswald text-xs text-[#ff2b3d]">{error}</span>
          </div>
        )}

        {/* CREATE / JOIN */}
        {(tab === "create" || tab === "join") && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab("create")}
                className={`flex-1 py-2.5 rounded font-oswald text-sm tracking-wider uppercase ${tab === "create" ? "bg-[#ff2b3d]" : "bg-[#1a1a1c] border border-[#26262a] text-[#7c7c82] hover:text-[#f4f2ee]"}`}>
                <Plus className="size-4 inline mr-1" /> Criar Sala
              </button>
              <button onClick={() => setTab("join")}
                className={`flex-1 py-2.5 rounded font-oswald text-sm tracking-wider uppercase ${tab === "join" ? "bg-[#ff2b3d]" : "bg-[#1a1a1c] border border-[#26262a] text-[#7c7c82] hover:text-[#f4f2ee]"}`}>
                <Search className="size-4 inline mr-1" /> Entrar
              </button>
            </div>

            {tab === "create" && (
              <>
                <div>
                  <label className="font-oswald text-[10px] tracking-wider text-[#7c7c82] uppercase block mb-1">Nome da Sala</label>
                  <input value={roomName} onChange={(e) => setRoomName(e.target.value)}
                    placeholder={`Sala de ${user?.name || "Jogador"}`}
                    className="w-full bg-[#141416] border border-[#26262a] rounded px-3 py-2.5 font-oswald text-sm text-[#f4f2ee] placeholder:text-[#52525a] focus:outline-none focus:border-[#ff2b3d]/50" />
                </div>
                <div>
                  <label className="font-oswald text-[10px] tracking-wider text-[#7c7c82] uppercase block mb-1">Mapa</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_MAPS.map((m) => (
                      <button key={m.id} onClick={() => setSelectedMap(m.id)}
                        className={`p-3 rounded border text-left transition-all ${selectedMap === m.id ? "border-[#ff2b3d] bg-[#ff2b3d]/10" : "border-[#26262a] bg-[#141416] hover:border-[#52525a]"}`}>
                        <span className="font-anton text-lg block" style={{ color: m.color }}>{m.name}</span>
                        <span className="font-oswald text-[9px] text-[#7c7c82]">{m.rooms.length} salas</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="font-oswald text-[10px] tracking-wider text-[#7c7c82] uppercase block mb-1">Jogadores: {maxPlayers}</label>
                    <input type="range" min={2} max={20} value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="w-full accent-[#ff2b3d]" />
                  </div>
                  <div className="flex-1">
                    <label className="font-oswald text-[10px] tracking-wider text-[#7c7c82] uppercase block mb-1">Bots: {botCount}</label>
                    <input type="range" min={0} max={19} value={botCount} onChange={(e) => setBotCount(parseInt(e.target.value))} className="w-full accent-[#ffcc00]" />
                  </div>
                </div>
                <button onClick={handleCreate} className="w-full py-3 bg-[#ff2b3d] rounded font-oswald text-sm tracking-wider uppercase hover:bg-[#ff1526] transition-colors">
                  Criar Sala
                </button>
              </>
            )}

            {tab === "join" && (
              <>
                <div>
                  <label className="font-oswald text-[10px] tracking-wider text-[#7c7c82] uppercase block mb-1">Codigo da Sala</label>
                  <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXX" maxLength={6}
                    className="w-full bg-[#141416] border border-[#26262a] rounded px-3 py-3 font-anton text-2xl text-[#ffcc00] placeholder:text-[#52525a] focus:outline-none focus:border-[#ffcc00]/50 uppercase tracking-[0.3em] text-center" />
                </div>
                <button onClick={() => handleJoin()} className="w-full py-3 bg-[#ffcc00] rounded font-oswald text-sm font-semibold tracking-wider text-[#0b0b0d] uppercase hover:bg-[#e6b800] transition-colors">
                  Entrar na Sala
                </button>
              </>
            )}

            {/* Quick join by code */}
            {tab === "create" && (
              <div className="flex gap-2">
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Codigo da sala" maxLength={6}
                  className="flex-1 bg-[#141416] border border-[#26262a] rounded px-3 py-2.5 font-oswald text-sm text-[#f4f2ee] placeholder:text-[#52525a] focus:outline-none focus:border-[#ffcc00]/50 uppercase tracking-wider text-center" />
                <button onClick={() => handleJoin()}
                  className="px-6 py-2.5 bg-[#ffcc00]/20 border border-[#ffcc00]/60 rounded font-oswald text-sm tracking-wider text-[#ffcc00] hover:bg-[#ffcc00]/30 transition-colors uppercase">
                  Entrar
                </button>
              </div>
            )}

            {/* Open rooms list */}
            {listRooms && listRooms.length > 0 && (
              <div>
                <h3 className="font-oswald text-[10px] tracking-wider text-[#7c7c82] uppercase mb-2">
                  Salas Abertas ({listRooms.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {listRooms.map((room) => (
                    <div key={room._id} className="bg-[#141416] border border-[#26262a] rounded p-3 flex items-center justify-between">
                      <div>
                        <span className="font-oswald text-sm text-[#f4f2ee] block">{room.roomName}</span>
                        <span className="font-oswald text-[9px] text-[#7c7c82]">
                          {room.roomCode} | {room.currentPlayers}/{room.maxPlayers} | {room.hostName}
                        </span>
                      </div>
                      <button onClick={() => handleJoin(room.roomCode)}
                        className="px-3 py-1.5 bg-[#22c55e]/20 border border-[#22c55e]/50 rounded font-oswald text-xs text-[#22c55e] hover:bg-[#22c55e]/30 transition-colors">
                        Entrar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROOM (waiting lobby) */}
        {tab === "room" && currentRoom && (
          <div className="space-y-4">
            <div className="bg-[#141416] border border-[#26262a] rounded p-4 text-center">
              <h2 className="font-anton text-2xl text-[#f4f2ee]">{currentRoom.roomName}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="font-oswald text-xs text-[#7c7c82]">CODIGO:</span>
                <button onClick={copyCode}
                  className="font-anton text-lg text-[#ffcc00] tracking-[0.2em] flex items-center gap-1 hover:text-[#e6b800] transition-colors">
                  {currentRoom.roomCode}
                  {copied ? <Check className="size-4 text-[#22c55e]" /> : <Copy className="size-4 text-[#7c7c82]" />}
                </button>
              </div>
              <p className="font-oswald text-[9px] text-[#52525a] mt-1">Compartilhe o codigo com seus amigos</p>
            </div>

            <div className="bg-[#141416] border border-[#26262a] rounded p-3 flex items-center justify-between">
              <div>
                <span className="font-oswald text-[9px] text-[#7c7c82] uppercase block">Mapa</span>
                <span className="font-anton text-lg" style={{ color: ALL_MAPS.find(m => m.id === currentRoom.mapId)?.color || "#fff" }}>
                  {ALL_MAPS.find(m => m.id === currentRoom.mapId)?.name || currentRoom.mapId}
                </span>
              </div>
              <div className="text-right">
                <span className="font-oswald text-[9px] text-[#7c7c82] uppercase block">Jogadores</span>
                <span className="font-anton text-lg text-[#f4f2ee]">{currentRoom.currentPlayers}/{currentRoom.maxPlayers}</span>
              </div>
            </div>

            <div>
              <h3 className="font-oswald text-[10px] tracking-wider text-[#7c7c82] uppercase mb-2">Jogadores na Sala</h3>
              <div className="space-y-1.5">
                {currentRoom.playersList?.map((p) => (
                  <div key={p.userId} className="bg-[#141416] border border-[#26262a] rounded px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 text-[#7c7c82]" />
                      <span className="font-oswald text-sm text-[#f4f2ee]">{p.playerName}</span>
                      {p.isHost && <span className="font-oswald text-[8px] bg-[#ffcc00]/20 text-[#ffcc00] px-1.5 py-0.5 rounded uppercase">Host</span>}
                    </div>
                    <span className={`font-oswald text-xs ${p.isReady ? "text-[#22c55e]" : "text-[#7c7c82]"}`}>
                      {p.isReady ? "PRONTO" : "AGUARDANDO"}
                    </span>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, (currentRoom.maxPlayers || 10) - (currentRoom.playersList?.length || 0)) }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-[#141416]/50 border border-[#26262a]/50 rounded px-3 py-2 flex items-center gap-2">
                    <Users className="size-3.5 text-[#52525a]" />
                    <span className="font-oswald text-sm text-[#52525a]">Aguardando jogador...</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleToggleReady}
                className="flex-1 py-3 bg-[#22c55e]/20 border border-[#22c55e]/50 rounded font-oswald text-sm tracking-wider text-[#22c55e] hover:bg-[#22c55e]/30 transition-colors uppercase">
                <Snowflake className="size-4 inline mr-1" /> Pronto
              </button>
              {isHost && (
                <button onClick={handleStartGame}
                  className="flex-1 py-3 bg-[#ff2b3d] rounded font-oswald text-sm tracking-wider hover:bg-[#ff1526] transition-colors uppercase">
                  Iniciar Partida
                </button>
              )}
            </div>
            {!isHost && (
              <p className="font-oswald text-[9px] text-[#52525a] text-center">Aguardando o host iniciar a partida...</p>
            )}
          </div>
        )}

        {tab === "room" && !currentRoom && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 text-[#ff2b3d] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
