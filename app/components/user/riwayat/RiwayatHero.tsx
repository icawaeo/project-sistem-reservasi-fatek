import Image from "next/image";

export default function RiwayatHero() {
  return (
    <section className="relative h-[62vh] min-h-105">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-slate-700 via-slate-600 to-slate-800" />
        <Image src="/hero.jpeg" alt="Fakultas Teknik" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-linear-to-b from-black/85 via-black/65 to-black/85 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pb-12">
        <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">Riwayat Peminjaman</h1>
        <p className="text-white/75 mt-2 text-sm lg:text-base max-w-md">
          Lacak status pengajuan terbaru dan seluruh histori peminjaman ruangan Anda.
        </p>
      </div>
    </section>
  );
}
