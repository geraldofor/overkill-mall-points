import { motion } from "framer-motion";
import { useNavigate } from "react-router";

const TICKER_ITEMS = [
  { text: "ZONA FECHA EM BREVE", hot: true },
  { text: "13 SETORES DISPONÍVEIS", hot: false },
  { text: "LOJA ABERTA — LOOT PREMIUM", hot: true },
  { text: "ÚLTIMO ANDAR VENCE", hot: false },
];

const STATS = [
  { num: "13", lbl: "Setores" },
  { num: "1–20", lbl: "Jogadores" },
  { num: "~10min", lbl: "Por partida" },
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

      {/* Main content */}
      <main
        className="flex-1 flex flex-col items-center justify-center relative px-6 py-10 text-center"
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
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`py-3.5 px-6.5 text-left ${
                i < STATS.length - 1 ? "border-r border-[#26262a]" : ""
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

        {/* CTA button */}
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
          <span className="text-lg transition-transform duration-150 group-hover:translate-x-1">
            →
          </span>
        </motion.button>

        {/* Sub note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-5 text-[11.5px] tracking-[0.05em] text-[#52525a] font-oswald uppercase"
        >
          Acesso antecipado — protótipo interno
        </motion.p>
      </main>
    </div>
  );
}