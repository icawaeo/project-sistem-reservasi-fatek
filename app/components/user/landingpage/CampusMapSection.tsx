"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [isOtherLocationsOpen, setIsOtherLocationsOpen] = useState(false);
  const [pinnedMapPoint, setPinnedMapPoint] = useState<number | null>(null);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOtherLocationsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOtherLocationsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    queueMicrotask(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOtherLocationsOpen]);

  const currentMap = useMemo(() => {
    if (activeMapPoint === "all") return allMapView;
    return mapPoints[activeMapPoint];
  }, [activeMapPoint, allMapView, mapPoints]);

  const isAllMapView = activeMapPoint === "all";
  const locationItems: Array<{ key: "all" | number; name: string }> = [
    { key: "all", name: allMapView.name },
    ...mapPoints.map((point, index) => ({ key: index, name: point.name })),
  ];

  const handlePinAndSelectMapPoint = (index: number) => {
    setPinnedMapPoint(index);
    setActiveMapPoint(index);
    setIsOtherLocationsOpen(false);
  };

  return (
    <section className="w-full bg-slate-100 px-4 pb-16 pt-28 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-none flex-col gap-8 md:flex-row md:items-start">
        <div className="rounded-3xl bg-transparent md:w-74 md:flex-none lg:w-78">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-slate-900" />
            <div>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Lokasi Gedung
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">
                Pilih gedung untuk melihat lokasi pada peta dan mendapatkan petunjuk arah menuju area Fakultas Teknik UNSRAT.
              </p>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar lg:hidden">
            <button
              onClick={() => {
                setActiveMapPoint("all");
                setPinnedMapPoint(null);
              }}
              type="button"
              className={`inline-flex h-11 shrink-0 items-center gap-2.5 rounded-xl border px-4 text-left text-[13px] font-semibold transition-all ${
                isAllMapView
                  ? "border-slate-300 bg-slate-200/75 text-slate-900"
                  : "border-slate-200 bg-slate-100/60 text-slate-700 hover:bg-slate-200/60"
              }`}
            >
              <MapPin size={14} className="shrink-0 text-slate-500" />
              <span className="line-clamp-1">{allMapView.name}</span>
            </button>

            {pinnedMapPoint !== null && mapPoints[pinnedMapPoint] ? (
              <button
                key={`pinned-${pinnedMapPoint}-${mapPoints[pinnedMapPoint].name}`}
                onClick={() => setActiveMapPoint(pinnedMapPoint)}
                type="button"
                className={`inline-flex h-11 shrink-0 items-center gap-2.5 rounded-xl border px-4 text-left text-[13px] font-semibold transition-all ${
                  activeMapPoint === pinnedMapPoint
                    ? "border-slate-300 bg-slate-200/75 text-slate-900"
                    : "border-slate-200 bg-slate-100/60 text-slate-700 hover:bg-slate-200/60"
                }`}
              >
                <MapPin size={14} className="shrink-0 text-slate-500" />
                <span className="line-clamp-1">{mapPoints[pinnedMapPoint].name}</span>
              </button>
            ) : null}

            <button
              onClick={() => setIsOtherLocationsOpen(true)}
              type="button"
              className="inline-flex h-11 shrink-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-100/60 px-4 text-left text-[13px] font-semibold text-slate-700 transition-all hover:bg-slate-200/60"
            >
              <MapPin size={14} className="shrink-0 text-slate-500" />
              <span className="line-clamp-1">Lainnya</span>
            </button>
          </div>

          <div className="mt-7 hidden flex-col items-stretch gap-2.5 lg:flex">
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

        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
          <div className="relative h-96 md:h-140 bg-slate-200">
            {!isMapLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/50">
                <MapPin size={48} className="text-slate-400 mb-4" />
                <button
                  onClick={() => setIsMapLoaded(true)}
                  type="button"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Tampilkan Peta Interaktif
                </button>
              </div>
            ) : (
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
            )}
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

      {isOtherLocationsOpen ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 md:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOtherLocationsOpen(false);
            }
          }}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="other-locations-title"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25"
          >
            <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-4 py-4 md:px-6">
              <div>
                <h3
                  id="other-locations-title"
                  className="text-lg font-black tracking-tight text-slate-900 md:text-xl"
                >
                  Pilih Gedung
                </h3>
                <p className="mt-1 text-xs text-slate-600 md:text-sm">
                  Pilih salah satu gedung untuk ditampilkan.
                </p>
              </div>

              <button
                ref={closeButtonRef}
                onClick={() => setIsOtherLocationsOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                aria-label="Tutup pilihan gedung"
                type="button"
              >
                Tutup
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
              {mapPoints.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                  Belum ada data gedung.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {mapPoints.map((point, index) => {
                    const isActive = activeMapPoint === index;

                    return (
                      <button
                        key={`${index}-${point.name}`}
                        onClick={() => handlePinAndSelectMapPoint(index)}
                        type="button"
                        className={`inline-flex h-11 w-full items-center gap-2.5 rounded-xl border px-4 text-left text-[13px] font-semibold transition-all ${
                          isActive
                            ? "border-slate-300 bg-slate-200/75 text-slate-900"
                            : "border-slate-200 bg-slate-100/60 text-slate-700 hover:bg-slate-200/60"
                        }`}
                      >
                        <MapPin size={14} className="shrink-0 text-slate-500" />
                        <span className="line-clamp-1">{point.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
              <button
                type="button"
                onClick={() => setIsOtherLocationsOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
