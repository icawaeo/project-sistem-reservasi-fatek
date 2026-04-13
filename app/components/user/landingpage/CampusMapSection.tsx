"use client";

import { useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";

export type CampusMapPoint = {
  name: string;
  shortUrl: string;
  embedUrl: string;
};

type CampusMapSectionProps = {
  mapPoints: CampusMapPoint[];
  allMapView: CampusMapPoint;
};

export default function CampusMapSection({ mapPoints, allMapView }: CampusMapSectionProps) {
  const [activeMapPoint, setActiveMapPoint] = useState<number | "all">("all");

  const currentMap = useMemo(() => {
    if (activeMapPoint === "all") return allMapView;
    return mapPoints[activeMapPoint];
  }, [activeMapPoint, allMapView, mapPoints]);

  const isAllMapView = activeMapPoint === "all";

  return (
    <section className="py-12 px-8 max-w-5xl mx-auto">
      <h2 className="text-center text-sm md:text-base font-bold tracking-[0.25em] text-slate-900 uppercase mb-8">
        Lokasi Gedung
      </h2>

      <div className="mb-4 md:mb-5">
        <div className="-mx-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0">
          <div className="flex w-max min-w-full items-center gap-2 md:mx-auto md:w-full md:max-w-5xl md:min-w-0 md:flex-wrap md:justify-center md:gap-3">
            <button
              onClick={() => setActiveMapPoint("all")}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap transition-all md:px-4 ${
                isAllMapView
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
              }`}
              type="button"
            >
              <MapPin size={13} />
              {allMapView.name}
            </button>

            {mapPoints.map((point, index) => (
              <button
                key={point.name}
                onClick={() => setActiveMapPoint(index)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap transition-all md:px-4 ${
                  !isAllMapView && activeMapPoint === index
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                }`}
                type="button"
              >
                <MapPin size={13} />
                {point.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 h-64 sm:h-72 bg-white">
        <iframe
          key={currentMap.name}
          src={currentMap.embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={currentMap.name}
        />
      </div>

      <div className="mt-3 flex justify-center">
        <a
          href={currentMap.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          Buka di Google Maps
          <ExternalLink size={13} />
        </a>
      </div>
    </section>
  );
}
