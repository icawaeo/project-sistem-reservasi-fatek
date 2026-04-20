"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/toast";

export default function LoginView() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { pushToast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getPostLoginRedirectPath = async () => {
    try {
      const response = await fetch("/api/auth/post-login-redirect", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return "/landingpage";
      }

      const payload = (await response.json()) as { redirectTo?: string };
      return payload.redirectTo || "/landingpage";
    } catch {
      return "/landingpage";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false, 
      });

      if (res?.error) {
        pushToast({ type: "error", message: "Email atau password salah" });
      } else {
        const redirectTo = await getPostLoginRedirectPath();
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      pushToast({ type: "error", message: "Terjadi kesalahan sistem" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900">Masuk ke Akun</h2>
      <p className="mt-2 text-sm lg:text-base text-slate-700/80">
        Gunakan email yang sudah didaftarkan untuk melanjutkan.
      </p>

      <div className="mt-6 rounded-3xl bg-white/40 p-6 ring-1 ring-white/30">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs lg:text-sm font-bold tracking-wider text-slate-700">
              ALAMAT EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan alamat email Anda"
              className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm lg:text-base"
            />
          </div>

          <div>
            <label className="text-xs lg:text-sm font-bold tracking-wider text-slate-700">
              KATA SANDI
            </label>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                className="w-full rounded-2xl bg-white/70 px-4 py-3 pr-12 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm lg:text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="mt-2 text-right">
              <button
                type="button"
                className="text-xs lg:text-sm font-semibold text-slate-700 hover:underline"
              >
                Lupa Kata Sandi
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-slate-900 py-3 text-sm lg:text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm lg:text-base text-slate-700">
        Belum punya akun?{" "}
        <Link className="font-semibold hover:underline" href="/?tab=register">
          Daftar
        </Link>
      </p>
    </div>
  );
}