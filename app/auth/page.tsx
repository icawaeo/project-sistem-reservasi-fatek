"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoginView from "../../components/auth/loginView";
import RegisterView from "../../components/auth/registerView";
import { motion, AnimatePresence } from "framer-motion";

function AuthContent() {
  const params = useSearchParams();
  const router = useRouter();

  const tab = (params.get("tab") ?? "login") as "login" | "register";

  const setTab = (nextTab: "login" | "register") => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", nextTab);
    router.replace(`/auth?${next.toString()}`);
  };

  return (
      <div className="min-h-screen flex flex-col w-full bg-[radial-gradient(1200px_circle_at_20%_10%,#dbeafe_0%,transparent_55%),radial-gradient(900px_circle_at_80%_30%,#bfdbfe_0%,transparent_60%),linear-gradient(135deg,#c7d2fe_0%,#93c5fd_40%,#60a5fa_100%)] font-sans">
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-6xl overflow-hidden rounded-[44px] bg-white/25 backdrop-blur-xl ring-1 ring-white/40 shadow-[0_30px_100px_rgba(2,6,23,0.20)]">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* LEFT COLUMN */}
              <div className="relative p-10 lg:p-14 text-slate-900 bg-white/10 flex flex-col justify-center">
                <h1 className="mt-6 text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] text-slate-900">
                  Reservasi Ruangan Fakultas Teknik
                  <br />
                  UNSRAT
                </h1>
                <p className="mt-4 max-w-md text-slate-600 leading-relaxed">
                  Lakukan pemesanan ruangan, cek ketersediaan jadwal, dan kelola penggunaan ruangan 
                  Fakultas Teknik Universitas Sam Ratulangi secara online.
                </p>
              </div>

              {/* RIGHT COLUMN */}
              <div className="p-8 lg:p-12">
                <div className="flex justify-center">
                  <div className="relative flex w-full items-center rounded-full bg-white/40 p-1 ring-1 ring-white/30">
                    
                    {/* Efek Slider Masuk/Daftar */}
                    <motion.div
                      className="absolute inset-y-1 left-1 rounded-full bg-white shadow-sm"
                      initial={false}
                      animate={{
                        width: "calc(50% - 4px)",
                        x: tab === "login" ? 0 : "100%",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />

                    <button
                      onClick={() => setTab("login")}
                      className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 text-center ${
                        tab === "login" ? "text-slate-900" : "text-slate-600"
                      }`}
                    >
                      Masuk
                    </button>

                    <button
                      onClick={() => setTab("register")}
                      className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 text-center ${
                        tab === "register" ? "text-slate-900" : "text-slate-600"
                      }`}
                    >
                      Daftar
                    </button>
                  </div>
                </div>

                <div className="mt-8 relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tab === "login" ? <LoginView /> : <RegisterView />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 text-center text-xs text-slate-700/80">
          © {new Date().getFullYear()} PUSAT TEKNOLOGI INFORMASI - UNIVERSITAS SAM RATULANGI MANADO
          <div className="mt-2 flex items-center justify-center gap-6">
            <a className="hover:underline" href="#">Syarat & Ketentuan</a>
            <a className="hover:underline" href="#">Pusat Bantuan</a>
            <a className="hover:underline" href="#">Kontak</a>
          </div>
        </div>
      </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}