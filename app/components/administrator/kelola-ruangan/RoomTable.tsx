"use client";

import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import type { LabDepartmentValue, LabProgramValue, RoomItem } from "./room-types";
import {
  SuperAdminTableCard,
  SuperAdminTableScroll,
  SuperAdminTable,
  SuperAdminTableBody,
} from "../ui/SuperAdminTable";

import { isLabBuilding } from "@/app/utils/building";

const PROGRAM_LABEL: Record<LabProgramValue, string> = {
  ELEKTRO: "Teknik Elektro",
  IT: "Informatika",
  ARSITEKTUR: "Arsitektur",
  PWK: "PWK",
  SIPIL: "Teknik Sipil",
  LINGKUNGAN: "Teknik Lingkungan",
  MESIN: "Teknik Mesin",
  INDUSTRI: "Teknik Industri",
};

const DEPARTMENT_LABEL: Record<LabDepartmentValue, string> = {
  ELEKTRO: "Elektro",
  ARSITEKTUR: "Arsitektur",
  SIPIL: "Sipil",
  MESIN: "Mesin",
};

const formatFloorLabel = (value: string) => {
  const trimmed = (value ?? "").trim();
  const floor = trimmed.match(/\d+/)?.[0] ?? trimmed.replace(/^(lantai|lt\.?)/i, "").trim();
  return floor ? `Lantai ${floor}` : "Lantai belum diisi";
};

const formatRoomMetaLabel = (room: RoomItem) => {
  const floorLabel = formatFloorLabel(room.floor);

  if (!isLabBuilding(room.building)) {
    return floorLabel;
  }

  const programLabel = room.labProgram ? PROGRAM_LABEL[room.labProgram] : "-";
  const departmentLabel = room.labDepartment ? DEPARTMENT_LABEL[room.labDepartment] : "-";

  // Format yang diminta: Lantai | Prodi | Jurusan
  return `${floorLabel} | ${programLabel} | ${departmentLabel}`;
};

type RoomTableProps = {
  rooms: RoomItem[];
  onEdit: (room: RoomItem) => void;
  onDelete: (room: RoomItem) => void;
};

const EmptyState = () => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
    <p className="text-sm font-semibold text-slate-700">Belum ada data ruangan</p>
    <p className="mt-1 text-sm text-slate-500">Tambahkan ruangan pertama untuk mulai mengelola.</p>
  </div>
);

export default function RoomTable({ rooms, onEdit, onDelete }: RoomTableProps) {
  if (rooms.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="hidden lg:block">
        <SuperAdminTableCard className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SuperAdminTableScroll>
            <SuperAdminTable className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Ruangan</th>
                  <th className="px-4 py-3 font-semibold">Gedung</th>
                  <th className="px-4 py-3 font-semibold">Kapasitas</th>
                  <th className="px-4 py-3 font-semibold">Fasilitas</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <SuperAdminTableBody className="bg-white text-sm text-slate-700">
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                          {room.imageUrl ? (
                            <Image
                              src={room.imageUrl}
                              alt={room.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                              No Img
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{room.name}</p>
                          <p className="text-xs text-slate-500">{formatRoomMetaLabel(room)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{room.building}</td>
                    <td className="px-4 py-3">{room.capacity} Orang</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {room.facilities.length > 0 ? (
                          room.facilities.map((facility) => (
                            <span
                              key={`${room.id}-${facility}`}
                              className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700"
                            >
                              {facility}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          room.status === "aktif"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {room.status === "aktif" ? "Aktif" : "Maintenance"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(room)}
                          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Edit ${room.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(room)}
                          className="rounded-md p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Hapus ${room.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </SuperAdminTableBody>
            </SuperAdminTable>
          </SuperAdminTableScroll>
        </SuperAdminTableCard>
      </div>

      <div className="grid gap-3 lg:hidden">
        {rooms.map((room) => (
          <article key={room.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {room.imageUrl ? (
                  <Image src={room.imageUrl} alt={room.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    No Img
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                 <p className="font-semibold text-slate-900">{room.name}</p>
                 <p className="text-sm text-slate-500">{room.building}</p>
                 <p className="text-sm text-slate-500">{formatRoomMetaLabel(room)}</p>
                 <p className="text-sm text-slate-600">Kapasitas: {room.capacity} Orang</p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {room.facilities.length > 0 ? (
                room.facilities.map((facility) => (
                  <span
                    key={`${room.id}-mobile-${facility}`}
                    className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700"
                  >
                    {facility}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Fasilitas belum diisi</span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  room.status === "aktif"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {room.status === "aktif" ? "Aktif" : "Maintenance"}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(room)}
                  className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label={`Edit ${room.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(room)}
                  className="rounded-md p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Hapus ${room.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
