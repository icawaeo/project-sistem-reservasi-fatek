"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type AccountType = "CIVITAS" | "UMUM";

function AccordionHeader(props: {
  icon: string;
  title: string;
  subtitle: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="w-full flex items-center justify-between rounded-2xl bg-white/35 px-5 py-4 ring-1 ring-white/25"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="h-10 w-10 rounded-full bg-slate-900/10 grid place-items-center ring-1 ring-white/25">
            <span className="text-slate-900">{props.icon}</span>
        </div>
        <div>
          <div className="font-extrabold text-slate-900">{props.title}</div>
          <div className="text-xs text-slate-700/80">{props.subtitle}</div>
        </div>
      </div>
      <div className="text-slate-700/80">{props.open ? "˄" : "˅"}</div>
    </button>
  );
}

export default function RegisterView() {
  const [accountType, setAccountType] = useState<AccountType>("CIVITAS");

  const isCivitas = accountType === "CIVITAS";

  const emailLabel = useMemo(() => {
    return isCivitas ? "EMAIL UNSRAT" : "EMAIL";
  }, [isCivitas]);

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-900">Buat Akun Baru</h2>
      <p className="mt-2 text-sm text-slate-700/80">
        Pilih tipe akun Anda untuk melanjutkan pendaftaran.
      </p>

      <div className="mt-6 space-y-5">
        {/* Civitas */}
        <div className="rounded-3xl bg-white/30 p-4 ring-1 ring-white/25">
            <AccordionHeader
                icon="🎓"
                title="Civitas UNSRAT"
                subtitle="Mahasiswa, Dosen, & Staf"
                open={isCivitas}
                onClick={() => setAccountType("CIVITAS")}
            />

            {isCivitas && (
                <div className="mt-4 rounded-3xl bg-white/35 p-5 ring-1 ring-white/20">
                <form className="space-y-4">
                    <div>
                    <label className="text-xs font-bold tracking-wider text-slate-700">
                        NAMA LENGKAP
                    </label>
                    <input
                        placeholder="Nama lengkap sesuai identitas"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                    />
                    </div>

                    <div>
                    <label className="text-xs font-bold tracking-wider text-slate-700">
                        NIM / NIP
                    </label>
                    <input
                        placeholder="Nomor Induk"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                    />
                    </div>

                    <div>
                    <label className="text-xs font-bold tracking-wider text-slate-700">
                        {emailLabel}
                    </label>
                    <input
                        type="email"
                        placeholder="nama@student.unsrat.ac.id / nama@unsrat.ac.id"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                    />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold tracking-wider text-slate-700">
                        KATA SANDI
                        </label>
                        <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold tracking-wider text-slate-700">
                        KONFIRMASI
                        </label>
                        <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                        />
                    </div>
                    </div>

                    <button
                    type="submit"
                    className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
                    >
                    Daftar Sebagai Civitas
                    </button>
                </form>
                </div>
            )}
        </div>

        {/* separator */}
        <div className="flex items-center gap-4 px-2">
            <div className="h-px flex-1 bg-white/30" />
            <div className="text-xs font-bold tracking-widest text-slate-700/80">
                ATAU
            </div>
            <div className="h-px flex-1 bg-white/30" />
        </div>

        {/* Umum */}
        <div className="rounded-3xl bg-white/30 p-4 ring-1 ring-white/25">
            <AccordionHeader
                icon="🌐"
                title="Umum"
                subtitle="Alumni & Pengunjung Luar"
                open={!isCivitas}
                onClick={() => setAccountType("UMUM")}
            />

            {!isCivitas && (
                <div className="mt-4 rounded-3xl bg-white/35 p-5 ring-1 ring-white/20">
                <form className="space-y-4">
                    <div>
                    <label className="text-xs font-bold tracking-wider text-slate-700">
                        NAMA LENGKAP
                    </label>
                    <input
                        placeholder="Nama lengkap"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                    />
                    </div>

                    <div>
                    <label className="text-xs font-bold tracking-wider text-slate-700">
                        EMAIL
                    </label>
                    <input
                        type="email"
                        placeholder="nama@email.com"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                    />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold tracking-wider text-slate-700">
                        KATA SANDI
                        </label>
                        <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold tracking-wider text-slate-700">
                        KONFIRMASI
                        </label>
                        <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30"
                        />
                    </div>
                    </div>

                    <button
                    type="submit"
                    className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
                    >
                    Daftar Sebagai Umum
                    </button>
                </form>
                </div>
            )}
        </div>

        <p className="pt-2 text-center text-sm text-slate-700">
            Sudah memiliki akun?{" "}
            <Link className="font-semibold hover:underline" href="/auth?tab=login">
                Masuk di sini
            </Link>
        </p>
      </div>
    </div>
  );
}