import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { ALL_MAPS } from "@/game/maps";
import {
  MapPin,
  Swords,
  Shield,
  Target,
  Trophy,
  ChevronRight,
  Crosshair,
  Zap,
} from "lucide-react";

/* ─── animation variants ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

/* ─── ticker data ─── */
const TICKER_ITEMS = [
  { text: "ZONA FECHA EM BREVE", hot: true },
  { text: "13 SETORES DISPONÍVEIS", hot: false },
  { text: "LOOT ESPALHADO PELO MAPA", hot: true },
  { text: "ÚLTIMO EM PÉ VENCE", hot: false },
  { text: "PARTIDAS RÁPIDAS ~5 MIN", hot: false },
  { text: "HEADSHOT = BÔNUS", hot: true },
];

/* ─── stats ─── */
const STATS = [
  { num: "4", lbl: "Mapas", sub: "Setores únicos" },
  { num: "1–20", lbl: "Jogadores", sub: "Por partida" },
  { num: "~5min", lbl: "Duração", sub: "Partida rápida" },
  { num: "5", lbl: "Armas", sub: "Categorias" },
];

/* ─── features ─── */
const FEATURES = [
  {
    icon: Swords,
    title: "Combate Intenso",
    desc: "5 categorias de armas com spread, recoil e damage drop-off. Cada tiro conta.",
    color: "#ff2b3d",
  },
  {
    icon: Shield,
    title: "Sobrevivência",
    desc: "Zona contraindo, loot espalhado, armor e helmets. Fique vivo até o final.",
    color: "#3b82f6",
  },
  {
    icon: Target,
    title: "Pontuação Total",
    desc: "Abates, headshots, assistência, streaks e posição final. Tudo pontua.",
    color: "#ffcc00",
  },
  {
    icon: Trophy,
    title: "Ranking Global",
    desc: "Compete pelo topo do leaderboard. Temporada 1 já começou.",
    color: "#22c55e",
  },
];

/* ─── weapons showcase ─── */
const WEAPONS = [
  { name: "Pistola", desc: "Confiável, sem recarga lenta", dmg: "22", icon: "🔫" },
  { name: "SMG", desc: "Cadência alta, curta distância", dmg: "14×balas", icon: "⚡" },
  { name: "Fuzil", desc: "Versátil, longo alcance", dmg: "18", icon: "🎯" },
  { name: "Shotgun", desc: "Devastador de perto", dmg: "12×7", icon: "💥" },
  { name: "Sniper", desc: "Um tiro, uma eliminação", dmg: "75", icon: "🔴" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth?returnTo=/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0d] overflow-x-hidden">
      {/* ─── Caution stripe top ─── */}
      <div
        className="h-2.5 w-full shrink-0"
        style={{
          background: `repeating-linear-gradient(45deg, #ffcc00, #ffcc00 14px, #1a1a1c 14px, #1a1a1c 28px)`,
        }}
      />

      {/* ─── Navbar ─── */}
      <nav className="w-full max-w-6xl mx-auto flex items-center justify-between px-4 md:px-8 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-anton text-xl md:text-2xl tracking-wide text-[#f4f2ee] uppercase">
            OVER<span className="text-[#ff2b3d]">KILL</span>
          </span>
        </div>
        <button
          onClick={handleCTA}
          className="flex items-center gap-2 px-5 py-2.5 min-h-[48px] min-w-[48px] bg-[#ff2b3d] text-white font-oswald text-sm font-semibold tracking-wider uppercase rounded-[3px] hover:bg-[#ff1526] hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
        >
          {isAuthenticated ? "Dashboard" : "Entrar"}
          <ChevronRight className="size-4" />
        </button>
      </nav>

      {/* ─── Ticker bar ─── */}
      <div className="bg-[#141416] border-b border-[#232326] overflow-hidden whitespace-nowrap shrink-0">
        <div
          className="inline-block py-2.5 font-oswald text-xs tracking-[0.12em] text-[#7c7c82] uppercase"
          style={{ animation: "caution-scroll 28s linear infinite" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map(
            (item, i) => (
              <span
                key={i}
                className={`mx-7 ${item.hot ? "text-[#ff2b3d]" : ""}`}
              >
                {item.hot && "◆ "}
                {item.text}
              </span>
            )
          )}
        </div>
      </div>

      {/* ─── Hero Section ─── */}
      <main
        className="flex-1 flex flex-col items-center justify-center relative px-4 md:px-8 lg:px-16 py-12 md:py-16 text-center"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 50% 0%, rgba(255,43,61,0.10), transparent 60%),
            radial-gradient(ellipse 700px 400px at 15% 100%, rgba(255,204,0,0.05), transparent 60%)
          `,
        }}
      >
        <div className="w-full max-w-5xl mx-auto">
          {/* Directory label */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="flex items-center justify-center gap-2.5 mb-5 font-oswald text-[11px] md:text-[13px] tracking-[0.35em] text-[#ffcc00] uppercase"
          >
            <span className="w-6 h-px bg-[#ffcc00] opacity-60" />
            Battle Royale 2D
            <span className="w-6 h-px bg-[#ffcc00] opacity-60" />
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="font-anton font-normal text-[clamp(2.8rem,11vw,8rem)] leading-[0.92] tracking-[0.01em] uppercase text-[#f4f2ee] break-words"
            style={{ textShadow: "0 0 60px rgba(255,43,61,0.25)" }}
          >
            OVER<span className="text-[#ff2b3d] relative inline-block">KILL</span>
            <br />
            MALL
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.4}
            className="mt-5 md:mt-6 font-oswald text-[clamp(0.85rem,2vw,1.15rem)] tracking-[0.06em] text-[#7c7c82] max-w-lg mx-auto leading-relaxed"
          >
            <strong className="text-[#f4f2ee] font-semibold">
              Seja o último em pé.
            </strong>{" "}
            Partidas rápidas, múltiplos setores, combate real.{" "}
            <span className="text-[#ffcc00]">
              A zona fecha — você não pode.
            </span>
          </motion.p>

          {/* Stats strip */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-8 md:mt-11 grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#26262a] rounded-md overflow-hidden max-w-2xl mx-auto"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className={`py-4 px-4 md:py-5 md:px-6 text-center md:text-left ${
                  i < 3 ? "border-b md:border-b-0 md:border-r border-[#26262a]" : ""
                } ${i % 2 === 0 ? "border-r md:border-r-0" : ""} last:border-r-0`}
              >
                <span className="block font-anton text-2xl md:text-3xl text-[#f4f2ee]">
                  {s.num}
                </span>
                <span className="font-oswald text-[10px] md:text-xs tracking-[0.14em] text-[#ffcc00] uppercase">
                  {s.lbl}
                </span>
                <span className="block font-oswald text-[9px] tracking-wider text-[#52525a] uppercase mt-0.5">
                  {s.sub}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.8}
            className="mt-10 md:mt-12"
          >
            <motion.button
              whileHover={{ y: -2, backgroundColor: "#ff1526" }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255,43,61,0.45)",
                  "0 0 0 14px rgba(255,43,61,0)",
                  "0 0 0 0 rgba(255,43,61,0.45)",
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              onClick={handleCTA}
              className="inline-flex items-center justify-center gap-3 py-4 px-10 min-h-[56px] min-w-[200px] bg-[#ff2b3d] text-white font-oswald text-base font-semibold tracking-[0.14em] uppercase border-none rounded-[3px] cursor-pointer transition-colors duration-150"
            >
              {isAuthenticated ? "Ir para o Dashboard" : "Jogar Agora"}
              <Crosshair className="size-5" />
            </motion.button>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1.0}
            className="mt-4 text-[10px] md:text-[11.5px] tracking-[0.05em] text-[#52525a] font-oswald uppercase"
          >
            Acesso antecipado — protótipo em teste
          </motion.p>
        </div>
      </main>

      {/* ─── Features Section ─── */}
      <section className="px-4 md:px-8 lg:px-16 py-14 md:py-20 bg-[#0b0b0d]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14"
          >
            <span className="font-oswald text-xs tracking-[0.35em] text-[#ffcc00] uppercase">
              Mecânicas
            </span>
            <h2 className="font-anton text-3xl md:text-5xl text-[#f4f2ee] uppercase mt-2">
              Sobreviva. <span className="text-[#ff2b3d]">Domine.</span> Pontue.
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-[#141416] border border-[#26262a] rounded-lg p-5 md:p-6 hover:border-[#ff2b3d]/30 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feat.color}15` }}
                >
                  <feat.icon className="size-5" style={{ color: feat.color }} />
                </div>
                <h3 className="font-oswald text-sm tracking-wider text-[#f4f2ee] uppercase mb-2">
                  {feat.title}
                </h3>
                <p className="font-oswald text-xs text-[#7c7c82] leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Weapons Showcase ─── */}
      <section className="px-4 md:px-8 lg:px-16 py-14 md:py-20 bg-[#0e0e10]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14"
          >
            <span className="font-oswald text-xs tracking-[0.35em] text-[#ffcc00] uppercase">
              Arsenal
            </span>
            <h2 className="font-anton text-3xl md:text-5xl text-[#f4f2ee] uppercase mt-2">
              <span className="text-[#ff2b3d]">5 Categorias</span> de Armas
            </h2>
            <p className="font-oswald text-sm text-[#7c7c82] mt-2 max-w-md mx-auto">
              Cada arma tem spread, recoil e damage drop-off próprios. Escolha sabiamente.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
          >
            {WEAPONS.map((w, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-[#141416] border border-[#26262a] rounded-lg p-4 text-center hover:border-[#ff2b3d]/40 transition-all hover:scale-[1.03] cursor-default"
              >
                <span className="text-2xl mb-2 block">{w.icon}</span>
                <h4 className="font-anton text-base text-[#f4f2ee] uppercase">
                  {w.name}
                </h4>
                <p className="font-oswald text-[10px] text-[#7c7c82] mt-1 leading-snug">
                  {w.desc}
                </p>
                <span className="inline-block mt-2 font-anton text-sm text-[#ffcc00]">
                  {w.dmg} DMG
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Maps Showcase ─── */}
      <section className="px-4 md:px-8 lg:px-16 py-14 md:py-20 bg-[#0b0b0d]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14"
          >
            <span className="font-oswald text-xs tracking-[0.35em] text-[#ffcc00] uppercase">
              Arenas
            </span>
            <h2 className="font-anton text-3xl md:text-5xl text-[#f4f2ee] uppercase mt-2">
              4 <span className="text-[#ff2b3d]">Mapas</span> para Conquistar
            </h2>
            <p className="font-oswald text-sm text-[#7c7c82] mt-2 max-w-md mx-auto">
              Cada arena tem layout único, setores estratégicos e pontos de loot.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {ALL_MAPS.map((map) => (
              <motion.div
                key={map.id}
                variants={staggerItem}
                className="bg-[#141416] border border-[#26262a] rounded-lg overflow-hidden hover:border-[#ff2b3d]/30 transition-colors group"
              >
                {/* Map preview */}
                <div
                  className="h-28 md:h-32 relative overflow-hidden"
                  style={{ backgroundColor: map.color }}
                >
                  <div className="absolute inset-0">
                    {map.rooms
                      .filter((r) => r.type !== "corridor")
                      .slice(0, 12)
                      .map((room, j) => (
                        <div
                          key={j}
                          className="absolute transition-opacity group-hover:opacity-100 opacity-70"
                          style={{
                            left: `${(room.x / map.width) * 100}%`,
                            top: `${(room.y / map.height) * 100}%`,
                            width: `${(room.w / map.width) * 100}%`,
                            height: `${(room.h / map.height) * 100}%`,
                            backgroundColor: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        />
                      ))}
                  </div>
                  <div
                    className="absolute border rounded-full"
                    style={{
                      width: `${(Math.min(map.width, map.height) * 0.45 / map.width) * 100}%`,
                      height: `${(Math.min(map.width, map.height) * 0.45 / map.height) * 100}%`,
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      borderColor: "rgba(255,43,61,0.3)",
                      borderStyle: "dashed",
                    }}
                  />
                  <div className="absolute bottom-2 left-3">
                    <span
                      className="font-oswald text-[10px] tracking-wider uppercase px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${map.accentColor}20`,
                        color: map.accentColor,
                      }}
                    >
                      {map.rooms.length} salas
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin
                      className="size-3.5 shrink-0"
                      style={{ color: map.accentColor }}
                    />
                    <h3 className="font-anton text-base md:text-lg text-[#f4f2ee] uppercase">
                      {map.name}
                    </h3>
                  </div>
                  <p className="font-oswald text-[10px] tracking-wider text-[#52525a] uppercase mb-1.5">
                    {map.realName}
                  </p>
                  <p className="font-oswald text-xs text-[#7c7c82] leading-relaxed">
                    {map.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-4 md:px-8 lg:px-16 py-16 md:py-24 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(255,43,61,0.08), transparent 70%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <h2 className="font-anton text-4xl md:text-6xl text-[#f4f2ee] uppercase mb-4">
            Pronto para{" "}
            <span className="text-[#ff2b3d]">entrar?</span>
          </h2>
          <p className="font-oswald text-sm md:text-base text-[#7c7c82] mb-8 max-w-md mx-auto">
            Acesso antecipado. Jogue agora e ajude a moldar o jogo.
          </p>
          <motion.button
            whileHover={{ y: -2, backgroundColor: "#ff1526" }}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(255,43,61,0.45)",
                "0 0 0 14px rgba(255,43,61,0)",
                "0 0 0 0 rgba(255,43,61,0.45)",
              ],
            }}
            transition={{
              boxShadow: {
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            onClick={handleCTA}
            className="inline-flex items-center justify-center gap-3 py-4 px-10 min-h-[56px] min-w-[200px] bg-[#ff2b3d] text-white font-oswald text-base font-semibold tracking-[0.14em] uppercase border-none rounded-[3px] cursor-pointer transition-colors duration-150"
          >
            {isAuthenticated ? "Ir para o Dashboard" : "Jogar Agora"}
            <Zap className="size-5" />
          </motion.button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-4 md:px-8 py-6 border-t border-[#26262a] bg-[#0b0b0d] shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <span className="font-anton text-sm text-[#f4f2ee] uppercase">
              OVER<span className="text-[#ff2b3d]">KILL</span> MALL
            </span>
            <span className="text-[#26262a]">|</span>
            <span className="font-oswald text-[10px] tracking-wider text-[#52525a] uppercase">
              © 2025 Overkill Mall
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1c] border border-[#26262a] rounded text-[10px] font-oswald tracking-wider text-[#7c7c82] uppercase">
              <span className="text-[#ffcc00] font-bold">12+</span>
              Indicativo
            </span>
            <span className="font-oswald text-[10px] tracking-wider text-[#52525a] uppercase max-w-xs">
              Contém violência cartoonizada. Jogue com moderação.
            </span>
          </div>
        </div>
      </footer>

      {/* Caution stripe bottom */}
      <div
        className="h-2.5 w-full shrink-0"
        style={{
          background: `repeating-linear-gradient(45deg, #ffcc00, #ffcc00 14px, #1a1a1c 14px, #1a1a1c 28px)`,
        }}
      />
    </div>
  );
}
