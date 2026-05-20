"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/toast";

const RESEND_COOLDOWN_SECONDS = 60;

type RegistrationStep = "form" | "otp";

export default function RegisterView() {
  const router = useRouter();
  const { pushToast } = useToast();

  // — Step state —
  const [step, setStep] = useState<RegistrationStep>("form");

  // — Form state —
  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // — OTP state —
  const [pendingId, setPendingId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [manualOtpCode, setManualOtpCode] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // — Countdown logic —
  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN_SECONDS);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // — Handlers —
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.name === "identifier" ? e.target.value.replace(/\D/g, "") : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mendaftar");

      setPendingId(data.pendingId);
      setMaskedEmail(data.maskedEmail);
      setManualOtpCode(typeof data.otpCode === "string" ? data.otpCode : null);
      setStep("otp");
      startCountdown();
      pushToast({
        type: data.otpEmailSent === false ? "warning" : "success",
        message:
          data.otpEmailSent === false
            ? "SMTP belum aktif. Gunakan kode verifikasi manual yang tampil di halaman."
            : "Kode verifikasi telah dikirim ke email Anda",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftar.";
      pushToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  // — OTP input handlers —
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "");
    if (digit.length > 1) {
      const digits = digit.slice(0, 6).split("");
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtpDigits(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;
    const digits = pasteData.split("");
    const newOtp = ["", "", "", "", "", ""];
    digits.forEach((d, i) => {
      if (i < 6) newOtp[i] = d;
    });
    setOtpDigits(newOtp);
    const focusIndex = Math.min(digits.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      pushToast({ type: "error", message: "Masukkan 6 digit kode verifikasi" });
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId, otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verifikasi gagal");
      }

      pushToast({ type: "success", message: "Akun berhasil dibuat! Sedang masuk..." });

      // Auto sign-in
      const signInResult = await signIn("credentials", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        pushToast({ type: "warning", message: "Akun berhasil dibuat. Silakan login secara manual." });
        router.push("/auth?tab=login");
      } else {
        window.location.href = "/landingpage";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat verifikasi.";
      pushToast({ type: "error", message });
      // Reset OTP fields on error
      setOtpDigits(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim ulang kode");

      pushToast({ type: "success", message: "Kode verifikasi baru telah dikirim" });
      setOtpDigits(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
      startCountdown();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengirim ulang kode.";
      pushToast({ type: "error", message });
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep("form");
    setOtpDigits(["", "", "", "", "", ""]);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (step === "otp") {
    return (
      <div>
        <button
          type="button"
          onClick={handleBackToForm}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-emerald-100 grid place-items-center ring-1 ring-emerald-200/60">
            <ShieldCheck size={20} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Verifikasi Email</h2>
          </div>
        </div>

        <p className="mt-1 text-sm text-slate-600">
          Kode verifikasi 6 digit telah dikirim ke{" "}
          <span className="font-semibold text-slate-800">{maskedEmail}</span>
        </p>

        {manualOtpCode ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            SMTP belum aktif. Kode verifikasi manual: <span className="font-bold tracking-widest">{manualOtpCode}</span>
          </div>
        ) : null}

        <div className="mt-4 rounded-3xl bg-white/40 p-4 lg:p-5 ring-1 ring-white/30">
          {/* OTP Illustration */}
          <div className="flex justify-center mb-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 grid place-items-center ring-1 ring-blue-100/60">
              <Mail size={20} className="text-blue-600" />
            </div>
          </div>

          {/* OTP Input Fields */}
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                disabled={otpLoading}
                className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl text-center text-lg sm:text-xl font-bold outline-none transition-all duration-200
                  ${digit
                    ? "bg-white ring-2 ring-slate-900/30 text-slate-900"
                    : "bg-white/70 ring-1 ring-white/60 text-slate-400"
                  }
                  focus:ring-2 focus:ring-slate-900/40 focus:bg-white
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={otpLoading || otpDigits.join("").length !== 6}
            className="mt-4 w-full flex justify-center items-center gap-2 rounded-2xl bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {otpLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Memverifikasi...
              </>
            ) : (
              "Verifikasi"
            )}
          </button>

          {/* Countdown & Resend */}
          <div className="mt-4 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-slate-500">
                Kirim ulang kode dalam{" "}
                <span className="font-bold text-slate-700 tabular-nums">{formatCountdown(countdown)}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? "Mengirim..." : "Kirim Ulang Kode"}
              </button>
            )}
          </div>

          {/* Info Expiry */}
          <p className="mt-4 text-center text-[11px] lg:text-xs text-slate-500">
            Kode berlaku selama 10 menit. Periksa folder spam jika email tidak ditemukan.
          </p>
        </div>

        <p className="pt-3 text-center text-sm text-slate-700">
          Sudah memiliki akun?{" "}
          <Link className="font-semibold hover:underline" href="/auth?tab=login">
            Masuk di sini
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-slate-900">Buat Akun Baru</h2>
      <p className="mt-1 text-sm text-slate-700/80">
        Daftar sebagai civitas UNSRAT untuk menggunakan sistem reservasi ruangan.
      </p>

      <div className="mt-4 rounded-3xl bg-white/40 p-4 lg:p-5 ring-1 ring-white/30">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-[11px] lg:text-xs font-bold tracking-wider text-slate-700">
              NAMA LENGKAP
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Masukkan nama lengkap Anda"
              className="mt-1.5 w-full rounded-2xl bg-white/70 px-4 py-2 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="text-[11px] lg:text-xs font-bold tracking-wider text-slate-700">
              NIM / NIP
            </label>
            <input
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
              inputMode="numeric"
              pattern="\d*"
              placeholder="Masukkan NIM atau NIP Anda"
              className="mt-1.5 w-full rounded-2xl bg-white/70 px-4 py-2 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="text-[11px] lg:text-xs font-bold tracking-wider text-slate-700">
              ALAMAT EMAIL UNSRAT
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="nama@student.unsrat.ac.id"
              className="mt-1.5 w-full rounded-2xl bg-white/70 px-4 py-2 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm"
            />
            <p className="mt-1 text-[10px] lg:text-[11px] text-slate-600/80">
              Gunakan email <span className="font-semibold">@student.unsrat.ac.id</span> atau <span className="font-semibold">@unsrat.ac.id</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] lg:text-xs font-bold tracking-wider text-slate-700">
                KATA SANDI
              </label>
              <div className="relative mt-1.5">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-2xl bg-white/70 px-4 py-2 pr-12 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 mt-0.5 text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[11px] lg:text-xs font-bold tracking-wider text-slate-700">
                KONFIRMASI
              </label>
              <div className="relative mt-1.5">
                <input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Konfirmasi kata sandi"
                  className="w-full rounded-2xl bg-white/70 px-4 py-2 pr-12 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 mt-0.5 text-slate-500 hover:text-slate-900"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 rounded-2xl bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Daftar Akun"}
          </button>
        </form>
      </div>

      <p className="pt-3 text-center text-sm text-slate-700">
        Sudah memiliki akun?{" "}
        <Link className="font-semibold hover:underline" href="/auth?tab=login">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
