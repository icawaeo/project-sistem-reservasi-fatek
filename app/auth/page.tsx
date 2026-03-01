"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoginView from "./loginView";
import RegisterView from "./registerView";

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
              <div className="relative p-10 lg:p-14 text-slate-900 bg-white/10">

                <h1 className="mt-6 text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] text-slate-900">
                  Bergabung dengan
                  <br />
                  Ekosistem Digital
                </h1>
                
                <p className="mt-4 max-w-md text-slate-600 leading-relaxed">
                  Mulai perjalanan akademik Anda dengan akses terintegrasi ke seluruh layanan
                  digital Universitas Sam Ratulangi.
                </p>

              </div>

              {/* RIGHT COLUMN */}
              <div className="p-8 lg:p-12">
                <div className="flex justify-center">
                  <div className="flex w-full items-center rounded-full bg-white/40 p-1 ring-1 ring-white/30">
                    <button
                      onClick={() => setTab("login")}
                      className={[
                        "flex-1 py-2 rounded-full text-sm font-semibold transition text-center",
                        tab === "login"
                          ? "bg-white text-slate-900 shadow"
                          : "text-slate-700 hover:text-slate-900",
                      ].join(" ")}
                    >
                      Masuk
                    </button>

                    <button
                      onClick={() => setTab("register")}
                      className={[
                        "flex-1 py-2 rounded-full text-sm font-semibold transition text-center",
                        tab === "register"
                          ? "bg-white text-slate-900 shadow"
                          : "text-slate-700 hover:text-slate-900",
                      ].join(" ")}
                      >
                      Daftar
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  {tab === "login" ? <LoginView /> : <RegisterView />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="px-8 py-6 text-center text-xs text-slate-700/80">
          © {new Date().getFullYear()} PUSAT TEKNOLOGI INFORMASI - UNIVERSITAS SAM RATULANGI MANADO
          <div className="mt-2 flex items-center justify-center gap-6">
            <a className="hover:underline" href="#">
              Syarat & Ketentuan
            </a>
            <a className="hover:underline" href="#">
              Pusat Bantuan
            </a>
            <a className="hover:underline" href="#">
              Kontak
            </a>
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