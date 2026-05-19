"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/components/ui/toast";

const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function SetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const { pushToast } = useToast();

  const [isChecking, setIsChecking] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [emailHint, setEmailHint] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/set-password?token=${encodeURIComponent(token)}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as { valid?: boolean; email?: string };

        setIsValidToken(Boolean(payload.valid));
        setEmailHint(payload.email ?? null);
      } catch {
        setIsValidToken(false);
      } finally {
        setIsChecking(false);
      }
    };

    validateToken();
  }, [token]);

  const passwordRuleMet = useMemo(() => PASSWORD_RULES.test(password), [password]);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      pushToast({ type: "error", message: "Token tidak ditemukan." });
      return;
    }

    if (!passwordRuleMet) {
      pushToast({ type: "error", message: "Kata sandi belum memenuhi persyaratan keamanan." });
      return;
    }

    if (password !== confirmPassword) {
      pushToast({ type: "error", message: "Kata sandi tidak sesuai" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Gagal menyimpan kata sandi");
      }

      router.push("/auth?tab=login");
      router.refresh();
    } catch (err) {
      pushToast({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan kata sandi.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white px-5 py-4 text-sm lg:text-base text-slate-700 shadow-sm ring-1 ring-slate-200">
          Memvalidasi tautan set kata sandi...
        </div>
      </main>
    );
  }

  if (!isValidToken) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Tautan Tidak Valid</h1>
          <p className="mt-2 text-sm lg:text-base text-slate-600">
            Link set kata sandi sudah kedaluwarsa atau sudah pernah digunakan. Hubungi superadmin untuk meminta tautan baru.
          </p>
          <Link href="/auth?tab=login" className="mt-4 inline-block text-sm lg:text-base font-semibold text-slate-900 hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Atur Kata Sandi Akun</h1>
        <p className="mt-1 text-sm lg:text-base text-slate-600">
          Buat kata sandi baru untuk akun{emailHint ? ` (${emailHint})` : ""}.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1.5">
            <span className="text-sm lg:text-base font-semibold text-slate-700">Kata Sandi Baru</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-11 text-sm lg:text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-slate-400"
                placeholder="Masukkan kata sandi baru"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label="Tampilkan atau sembunyikan kata sandi"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm lg:text-base font-semibold text-slate-700">Konfirmasi Kata Sandi</span>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-11 text-sm lg:text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-slate-400"
                placeholder="Ulangi kata sandi baru"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label="Tampilkan atau sembunyikan konfirmasi kata sandi"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <p className={`text-xs lg:text-sm ${passwordRuleMet ? "text-emerald-700" : "text-slate-500"}`}>
            Kata sandi minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, serta angka.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm lg:text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordContent />
    </Suspense>
  );
}
