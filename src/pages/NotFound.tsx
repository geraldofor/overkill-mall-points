import { motion } from "framer-motion";
import { useNavigate } from "react-router";

export default function NotFound() {
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

      <main
        className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 50% 0%, rgba(255,43,61,0.10), transparent 60%),
            radial-gradient(ellipse 700px 400px at 15% 100%, rgba(255,204,0,0.05), transparent 60%)
          `,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="font-oswald text-xs tracking-[0.35em] text-[#ffcc00] uppercase mb-6">
            Setor não encontrado
          </div>
          <h1 className="font-anton text-8xl md:text-9xl text-[#ff2b3d] leading-none">
            404
          </h1>
          <p className="mt-4 font-oswald text-lg tracking-wide text-[#7c7c82]">
            Este setor foi demolido ou nunca existiu.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-8 font-oswald text-sm tracking-[0.14em] text-[#ff2b3d] uppercase hover:text-[#ff1526] transition-colors cursor-pointer"
          >
            ← Voltar ao lobby
          </button>
        </motion.div>
      </main>
    </div>
  );
}