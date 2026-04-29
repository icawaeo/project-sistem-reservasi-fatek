"use client";

import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronUp, X } from "lucide-react";

export type RoomAvailability = {
  room_id: string;
  room_name: string;
  room_building: string;
  room_capacity: number;
  room_locDetail: string;
  room_imageUrl?: string | null;
};

export type BuildingGroup = {
  building: string;
  rooms: RoomAvailability[];
};

const normalizeCommaSeparated = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeFloor = (value: string) => {
  const trimmed = value.trim();
  const matchedNumber = trimmed.match(/\d+/);

  if (matchedNumber) {
    return matchedNumber[0];
  }

  return trimmed.replace(/^(lantai|lt\.?)/i, "").trim();
};

const parseRoomDetails = (value: unknown): { floor: string; facilities: string[] } => {
  const parts = normalizeCommaSeparated(value);

  if (parts.length === 0) {
    return { floor: "", facilities: [] };
  }

  const firstPart = parts[0];
  const hasFloorPrefix = /^(lantai|lt\.?)/i.test(firstPart) || /^\d+$/.test(firstPart);

  if (hasFloorPrefix) {
    return {
      floor: normalizeFloor(firstPart),
      facilities: parts.slice(1),
    };
  }

  return {
    floor: "",
    facilities: parts,
  };
};

type AvailabilityModalProps = {
  open: boolean;
  onClose: () => void;
  scheduleLabel: string;
  buildings: BuildingGroup[];
  onSelectRoom: (room: RoomAvailability) => void;
};

export default function AvailabilityModal({
  open,
  onClose,
  scheduleLabel,
  buildings,
  onSelectRoom,
}: AvailabilityModalProps) {
  const buildingNames = useMemo(() => buildings.map((b) => b.building), [buildings]);
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({});

  const expanded = useMemo(() => {
    if (!open) {
      return {};
    }

    const defaults = buildingNames.reduce<Record<string, boolean>>((acc, name, index) => {
      acc[name] = index === 0;
      return acc;
    }, {});

    return {
      ...defaults,
      ...expandedOverride,
    };
  }, [buildingNames, expandedOverride, open]);

  const handleClose = () => {
    setExpandedOverride({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm md:p-6">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl shadow-slate-900/25">
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-200 px-4 py-4 md:px-6">
          <div>
            <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-800">
              Daftar Ketersediaan Ruangan
            </h3>
            <p className="mt-1 text-xs md:text-sm text-slate-600">{scheduleLabel}</p>
          </div>

          <button
            onClick={handleClose}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Tutup popup"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-3 py-3 md:px-5 md:py-4">
          {buildings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600">
              Tidak ada ruangan tersedia untuk jadwal yang dipilih.
            </div>
          ) : (
            <div className="space-y-3">
              {buildings.map((group) => {
                const isExpanded = Boolean(expanded[group.building]);

                return (
                  <div
                    key={group.building}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <button
                      onClick={() =>
                        setExpandedOverride((prev) => ({
                          ...prev,
                          [group.building]: !Boolean(expanded[group.building]),
                        }))
                      }
                      className="flex w-full items-center justify-between bg-slate-100 px-4 py-3 text-left hover:bg-slate-200"
                      type="button"
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Building2 size={16} className="text-slate-900" />
                          <span className="min-w-0 flex-1 text-xs font-black uppercase leading-snug tracking-[0.16em] text-slate-700 md:text-sm">
                            <span className="line-clamp-2">{group.building}</span>
                          </span>
                          <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold leading-none text-slate-600 md:text-[11px]">
                            {group.rooms.length} Ruangan
                          </span>
                        </div>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-slate-500" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-500" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-slate-100">
                        {group.rooms.map((room) => (
                          <div
                            key={room.room_id}
                            className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base md:text-lg font-bold text-slate-800">
                                  {room.room_name}
                                </p>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                  Tersedia
                                </span>
                              </div>

                              {(() => {
                                const details = parseRoomDetails(room.room_locDetail);
                                if (details.facilities.length === 0) return null;

                                return (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {details.facilities.map((facility) => (
                                      <span
                                        key={`${room.room_id}-${facility}`}
                                        className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                                      >
                                        {facility}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}

                              <p className="mt-1 text-sm md:text-base text-slate-600">
                                Kapasitas: {room.room_capacity} Orang
                              </p>
                              {(() => {
                                const details = parseRoomDetails(room.room_locDetail);

                                if (details.floor) {
                                  return (
                                    <p className="text-xs italic text-slate-500 md:text-sm">
                                      Lantai {details.floor}
                                    </p>
                                  );
                                }

                                return room.room_locDetail ? (
                                  <p className="text-xs italic text-slate-500 md:text-sm">{room.room_locDetail}</p>
                                ) : null;
                              })()}
                            </div>

                            <button
                              onClick={() => onSelectRoom(room)}
                              className="h-fit rounded-lg bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                              type="button"
                            >
                              Pilih Ruangan
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
