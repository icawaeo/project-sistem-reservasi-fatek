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
      <h2 className="text-center text-sm md:text-base font-bold tracking-[0.25em] text-slate-900 uppercase mb-8">
        Gedung Yang Tersedia
      </h2>

      <div className="flex gap-6 px-6 sm:px-8 overflow-x-auto no-scrollbar pb-6 snap-x">
        {buildings.map((building) => (
          <div
            key={building.name}
            className="flex-shrink-0 w-[320px] sm:w-[420px] md:w-[450px] snap-center group relative h-56 rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-transform duration-300 hover:scale-[1.02]"
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
              <div className="text-white text-xs sm:text-sm md:text-base font-bold leading-snug drop-shadow-md line-clamp-2 mb-2">
                {building.name}
              </div>
              <Link
                href={`/gedung/${encodeURIComponent(building.name)}`}
                className="inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/35 border border-white/30 px-2.5 py-1 text-[10px] sm:text-xs md:text-sm font-semibold text-white backdrop-blur-sm transition-all"
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
