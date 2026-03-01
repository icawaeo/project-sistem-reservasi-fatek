"use client";

import Link from "next/link";

export default function LoginView() {
  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-900">Masuk ke Akun</h2>
      <p className="mt-2 text-sm text-slate-700/80">
        Gunakan email UNSRAT atau email umum untuk melanjutkan.
      </p>

      <div className="mt-6 rounded-3xl bg-white/40 p-6 ring-1 ring-white/30">
        <form className="space-y-4">
          <div>
            <label className="text-xs font-bold tracking-wider text-slate-700">
              EMAIL
            </label>
            <input
              type="email"
              placeholder="nama@student.unsrat.ac.id / nama@unsrat.ac.id"
              className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wider text-slate-700">
                KATA SANDI
              </label>
              
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
            />
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
            className="mt-2 w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Masuk
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