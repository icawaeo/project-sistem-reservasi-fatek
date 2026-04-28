import Link from "next/link";

export type LandingBuildingCard = {
  name: string;
  image?: string;
  roomsLabel?: string;
};

type BuildingDirectorySectionProps = {
  buildings: LandingBuildingCard[];
};

export default function BuildingDirectorySection({ buildings }: BuildingDirectorySectionProps) {
  return (
    <section id="buildings" className="mt-16 py-12 bg-[#f5f5f0] overflow-hidden">
      <div className="mb-8 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-none">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-10 w-1.5 rounded-full bg-slate-900" />
            <div>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Gedung yang Tersedia
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">
                Pilih gedung untuk melihat daftar ruangan, kapasitas, dan fasilitas yang tersedia untuk mendukung kegiatan akademik Anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 px-4 sm:px-6 lg:px-8 xl:px-10 overflow-x-auto no-scrollbar pb-6 snap-x">
        {buildings.map((building) => (
          <div
            key={building.name}
            className="shrink-0 w-[320px] sm:w-105 md:w-112.5 snap-center group relative h-56 rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-transform duration-300 hover:scale-[1.02]"
          >
            {building.image ? (
              <img
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={building.name}
                src={building.image}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-slate-200" />
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="mb-3 inline-flex items-center rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white backdrop-blur-md">
                {building.roomsLabel ?? "0 RUANGAN"}
              </div>
              <div className="text-white text-xs sm:text-sm md:text-base font-bold leading-snug drop-shadow-md line-clamp-2 mb-2">
                {building.name}
              </div>
              <Link
                href={`/gedung/${encodeURIComponent(building.name)}`}
                className="inline-flex items-center gap-1 rounded-2xl bg-white px-4 py-2 text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100"
              >
                Lihat Ruangan
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
