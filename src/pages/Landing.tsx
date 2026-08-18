import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { ALL_MAPS } from "@/game/maps";
import { MapPin, Swords, Clock, Users, Zap, Shield, Target, Trophy } from "lucide-react";

const TICKER_ITEMS = [
  { text: "ZONA FECHA EM BREVE", hot: true },
  { text: "13 SETORES DISPONÍVEIS", hot: false },
  { text: "LOJA ABERTA — LOOT PREMIUM", hot: true },
  { text: "ÚLTIMO ANDAR VENCE", hot: false },
];

const FEATURES = [
  {
    icon: Swords,
    title: "Combate Intenso",
    desc: "Armas variadas, headshots, killstreaks. Cada abate conta.",
    color: "#ff2b3d",
  },
  {
    icon: Shield,
    title: "Sobrevivência",
    desc: "Zona contraindo, loot espalhado. Fique vivo até o final.",
    color: "#3b82f6",
  },
  {
    icon: Target,
    title: "Sistema de Pontos",
    desc: "Combate, posição, streaks. Tudo pontua na hora.",
    color: "#ffcc00",
  },
  {
    icon: Trophy,
    title: "Ranking Global",
    desc: "Compete pelo topo do leaderboard. Temporada 1 já começou.",
    color: "#22c55e",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0d]">
      {/* Caution stripe top */}
      <div
        className="h-2.5 w-full shrink-0"
        style={{
          background: `repeating-linear-gradient(45deg, #ffcc00, #ffcc00 14px, #1a1a1c 14px, #1a1a1c 28px)`,
        }}
      />

      {/* Ticker bar */}
      <div className="bg-[#141416] border-b border-[#232326] overflow-hidden whitespace-nowrap shrink-0">
        <div
          className="inline-block py-2.5 font-oswald text-xs tracking-[0.12em] text-[#7c7c82] uppercase"
          style={{ animation: "caution-scroll 22s linear infinite" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className={`mx-7 ${item.hot ? "text-[#ff2b3d]" : ""}`}>
              {item.hot && "◆ "}{item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <main
        className="flex-1 flex flex-col items-center justify-center relative px-6 py-16 text-center"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 50% 0%, rgba(255,43,61,0.10), transparent 60%),
            radial-gradient(ellipse 700px 400px at 15% 100%, rgba(255,204,0,0.05), transparent 60%)
          `,
        }}
      >
        {/* Directory label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2.5 mb-5 font-oswald text-[13px] tracking-[0.35em] text-[#ffcc00] uppercase"
        >
          <span className="w-6.5 h-px bg-[#ffcc00] opacity-60" />
          Você está aqui
          <span className="w-6.5 h-px bg-[#ffcc00] opacity-60" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-anton font-normal text-[clamp(3.2rem,12vw,8rem)] leading-[0.92] tracking-[0.01em] uppercase text-[#f4f2ee]"
          style={{ textShadow: "0 0 60px rgba(255,43,61,0.25)" }}
        >
          OVER<span className="text-[#ff2b3d] relative inline-block">KILL</span>
          <br />
          MALL
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-5.5 font-oswald text-[clamp(0.95rem,1.8vw,1.15rem)] tracking-[0.06em] text-[#7c7c82] max-w-[520px]"
        >
          O shopping fecha.{" "}
          <strong className="text-[#f4f2ee] font-semibold">
            Só quem sobrevive até o último piso sai vivo.
          </strong>{" "}
          Battle royale dentro dos corredores que você já conhece.
        </motion.p>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-11 flex gap-0 border border-[#26262a] rounded-md overflow-hidden"
        >
          {[
            { num: "4", lbl: "Mapas" },
            { num: "1–20", lbl: "Jogadores" },
            { num: "~5min", lbl: "Por partida" },
          ].map((s, i) => (
            <div
              key={i}
              className={`py-3.5 px-6.5 text-left ${
                i < 2 ? "border-r border-[#26262a]" : ""
              } max-sm:border-r-0 max-sm:border-b max-sm:last:border-b-0 max-sm:text-center max-sm:w-full`}
            >
              <span className="block font-anton text-2xl text-[#f4f2ee]">
                {s.num}
              </span>
              <span className="font-oswald text-[10px] tracking-[0.14em] text-[#7c7c82] uppercase">
                {s.lbl}
              </span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          whileHover={{ y: -2, backgroundColor: "#ff1526" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/auth?returnTo=/dashboard")}
          className="cta-pulse mt-12 relative inline-flex items-center gap-3 py-4.5 px-11 bg-[#ff2b3d] text-white font-oswald text-[15px] font-semibold tracking-[0.14em] uppercase border-none rounded-[3px] cursor-pointer transition-all duration-150"
          style={{ animation: "pulse-glow 2.2s ease-in-out infinite" }}
        >
          Entrar no shopping
          <span className="text-lg">→</span>
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-5 text-[11.5px] tracking-[0.05em] text-[#52525a] font-oswald uppercase"
        >
          Acesso antecipado — protótipo interno
        </motion.p>
      </main>

      {/* Features section */}
      <section className="px-6 py-16 bg-[#0b0b0d]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="font-oswald text-xs tracking-[0.35em] text-[#ffcc00] uppercase">
              Como funciona
            </span>
            <h2 className="font-anton text-4xl text-[#f4f2ee] uppercase mt-2">
              Sobreviva. <span className="text-[#ff2b3d]">Domine.</span> Pontue.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#141416] border border-[#26262a] rounded-lg p-6 hover:border-[#ff2b3d]/30 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
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
          </div>
        </div>
      </section>

      {/* Maps showcase */}
      <section className="px-6 py-16 bg-[#0e0e10]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="font-oswald text-xs tracking-[0.35em] text-[#ffcc00] uppercase">
              Arenas
            </span>
            <h2 className="font-anton text-4xl text-[#f4f2ee] uppercase mt-2">
              4 <span className="text-[#ff2b3d]">Shoppings</span> de Fortaleza
            </h2>
            <p className="font-oswald text-sm text-[#7c7c82] mt-2 max-w-md mx-auto">
              Cada mapa é inspirado em um shopping real de Fortaleza, com layouts fiéis e nomes fictícios.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {ALL_MAPS.map((map, i) => (
              <motion.div
                key={map.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#141416] border border-[#26262a] rounded-lg overflow-hidden hover:border-[#ff2b3d]/30 transition-colors"
              >
                {/* Map preview */}
                <div
                  className="h-32 relative"
                  style={{ backgroundColor: map.color }}
                >
                  <div className="absolute inset-0">
                    {map.rooms.filter((r) => r.type !== "corridor").slice(0, 12).map((room, j) => (
                      <div
                        key={j}
                        className="absolute"
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
                    <MapPin className="size-3.5" style={{ color: map.accentColor }} />
                    <h3 className="font-anton text-lg text-[#f4f2ee] uppercase">
                      {map.name}
                    </h3>
                  </div>
                  <p className="font-oswald text-[10px] tracking-wider text-[#52525a] uppercase mb-2">
                    Baseado em: {map.realName}
                  </p>
                  <p className="font-oswald text-xs text-[#7c7c82] leading-relaxed">
                    {map.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-anton text-5xl md:text-6xl text-[#f4f2ee] uppercase mb-4">
            Pronto para{" "}
            <span className="text-[#ff2b3d]">entrar?</span>
          </h2>
          <p className="font-oswald text-[#7c7c82] mb-8 max-w-md mx-auto">
            Acesso antecipado. Jogue agora e ajude a moldar o jogo.
          </p>
          <button
            onClick={() => navigate("/auth?returnTo=/dashboard")}
            className="cta-pulse inline-flex items-center gap-3 py-4.5 px-11 bg-[#ff2b3d] text-white font-oswald text-[15px] font-semibold tracking-[0.14em] uppercase border-none rounded-[3px] cursor-pointer transition-all duration-150 hover:bg-[#ff1526] hover:-translate-y-0.5"
            style={{ animation: "pulse-glow 2.2s ease-in-out infinite" }}
          >
            Entrar no shopping
            <span className="text-lg">→</span>
          </button>
        </motion.div>
      </section>
    </div>
  );
}