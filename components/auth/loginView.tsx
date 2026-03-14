"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginView() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false, 
      });

      if (res?.error) {
        setError("Email atau password salah");
      } else {
        router.push("/landingpage");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-900">Masuk ke Akun</h2>
      <p className="mt-2 text-sm text-slate-700/80">
        Gunakan email yang sudah didaftarkan untuk melanjutkan.
      </p>

      <div className="mt-6 rounded-3xl bg-white/40 p-6 ring-1 ring-white/30">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-100 rounded-xl ring-1 ring-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold tracking-wider text-slate-700">
              ALAMAT EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan alamat email Anda"
              className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold tracking-wider text-slate-700">
              KATA SANDI
            </label>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                className="w-full rounded-2xl bg-white/70 px-4 py-3 pr-12 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm"
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
                className="text-xs font-semibold text-slate-700 hover:underline"
              >
                Lupa Kata Sandi
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-700">
        Belum punya akun?{" "}
        <Link className="font-semibold hover:underline" href="/auth?tab=register">
          Daftar
        </Link>
      </p>
    </div>
  );
}