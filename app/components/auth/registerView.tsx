"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/toast";

export default function RegisterView() {
    const router = useRouter();
    const { pushToast } = useToast();
    
    const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    email: "",
    password: "",
    confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        
        // Reset form jika berhasil
        setFormData({
          name: "",
          identifier: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
        
        router.push("/?tab=login");
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftar.";
        pushToast({ type: "error", message });
        console.error("Registration error:", err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900">Buat Akun Baru</h2>
            <p className="mt-2 text-sm lg:text-base text-slate-700/80">
        Daftar sebagai civitas UNSRAT untuk menggunakan sistem reservasi ruangan.
      </p>

      <div className="mt-6">
        <div className="rounded-3xl bg-white/30 p-5 ring-1 ring-white/25">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-slate-900/10 grid place-items-center ring-1 ring-white/25">
                    <span className="text-slate-900">🎓</span>
                </div>
                <div>
                    <div className="text-base lg:text-lg font-extrabold text-slate-900">Civitas UNSRAT</div>
                    <div className="text-xs lg:text-sm text-slate-700/80">Mahasiswa &amp; Dosen Fakultas Teknik</div>
                </div>
            </div>

            <div className="rounded-3xl bg-white/35 p-5 ring-1 ring-white/20">
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label className="text-xs lg:text-sm font-bold tracking-wider text-slate-700">
                        NAMA LENGKAP
                    </label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Masukkan nama lengkap Anda"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm lg:text-base"
                    />
                </div>

                <div>
                    <label className="text-xs lg:text-sm font-bold tracking-wider text-slate-700">
                        NIM / NIP
                    </label>
                    <input
                        name="identifier" 
                        value={formData.identifier} 
                        onChange={handleChange}
                        required 
                        placeholder="Masukkan NIM atau NIP Anda"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm lg:text-base"
                    />
                </div>

                <div>
                    <label className="text-xs lg:text-sm font-bold tracking-wider text-slate-700">
                        ALAMAT EMAIL UNSRAT
                    </label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email} 
                        onChange={handleChange} 
                        required
                        placeholder="nama@student.unsrat.ac.id"
                        className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm lg:text-base"
                    />
                    <p className="mt-1.5 text-[11px] lg:text-xs text-slate-600/80">
                        Gunakan email <span className="font-semibold">@student.unsrat.ac.id</span> atau <span className="font-semibold">@unsrat.ac.id</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs lg:text-sm font-bold tracking-wider text-slate-700">
                        KATA SANDI
                    </label>
                    <div className="relative mt-2">
                        <input
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan kata sandi"
                            className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 pr-12 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm lg:text-base"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 mt-1 text-slate-500 hover:text-slate-900"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-xs lg:text-sm font-bold tracking-wider text-slate-700">
                        KONFIRMASI
                    </label>
                    <div className="relative mt-2">
                        <input
                            name="confirmPassword" 
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Konfirmasi kata sandi"
                            className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 pr-12 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-slate-900/30 text-slate-900 text-sm lg:text-base"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 mt-1 text-slate-500 hover:text-slate-900"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm lg:text-base font-semibold text-white disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Daftar Akun"}
                </button>
            </form>
            </div>
        </div>

        <p className="pt-4 text-center text-sm lg:text-base text-slate-700">
            Sudah memiliki akun?{" "}
            <Link className="font-semibold hover:underline" href="/?tab=login">
                Masuk di sini
            </Link>
        </p>
      </div>
    </div>
  );
}