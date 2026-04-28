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
  const locationItems: Array<{ key: "all" | number; name: string }> = [
    { key: "all", name: allMapView.name },
    ...mapPoints.map((point, index) => ({ key: index, name: point.name })),
  ];

  return (
    <section className="mt-16 px-4 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-310 flex-col gap-8 md:flex-row md:items-start">
        <div className="rounded-3xl bg-transparent p-2 pt-6 md:w-74 md:flex-none lg:w-78 lg:pt-14">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-10 w-1.5 rounded-full bg-slate-900" />
            <div>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Lokasi Gedung
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">
                Pilih gedung untuk melihat lokasi pada peta dan mendapatkan petunjuk arah menuju area Fakultas Teknik UNSRAT.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col items-stretch gap-2.5">
            {locationItems.map((item) => {
              const isActive = item.key === "all" ? isAllMapView : activeMapPoint === item.key;

              return (
                <button
                  key={`${item.key}-${item.name}`}
                  onClick={() => setActiveMapPoint(item.key)}
                  type="button"
                  className={`inline-flex h-11 w-full items-center gap-2.5 rounded-xl border px-4 text-left text-[13px] font-semibold transition-all ${
                    isActive
                      ? "border-slate-300 bg-slate-200/75 text-slate-900"
                      : "border-slate-200 bg-slate-100/60 text-slate-700 hover:bg-slate-200/60"
                  }`}
                >
                  <MapPin size={14} className="shrink-0 text-slate-500" />
                  <span className="line-clamp-1">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] md:ml-auto md:max-w-165">
          <div className="h-96 md:h-140">
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

          <div className="flex justify-end border-t border-slate-200 bg-white px-4 py-3">
            <a
              href={currentMap.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 sm:text-sm"
            >
              Buka di Google Maps
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
