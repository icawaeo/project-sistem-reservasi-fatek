"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { BuildingItem } from "./building-types";

type BuildingTableProps = {
  buildings: BuildingItem[];
  onEdit: (building: BuildingItem) => void;
  onDelete: (building: BuildingItem) => void;
};

const EmptyState = () => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
    <p className="text-sm font-semibold text-slate-700">Belum ada data gedung</p>
    <p className="mt-1 text-sm text-slate-500">Tambahkan gedung pertama untuk memulai manajemen.</p>
  </div>
);

const formatOperational = (building: BuildingItem) => {
  const dayLabel = building.operationalDays.length > 0 ? building.operationalDays.join(", ") : "-";
  return `${dayLabel} | ${building.openTime} - ${building.closeTime}`;
};

export default function BuildingTable({ buildings, onEdit, onDelete }: BuildingTableProps) {
  if (buildings.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama Gedung</th>
              <th className="px-4 py-3 font-semibold">Waktu Operasional</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {buildings.map((building) => (
              <tr key={building.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{building.name}</td>
                <td className="px-4 py-3">{formatOperational(building)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(building)}
                      className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`Edit ${building.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(building)}
                      className="rounded-md p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Hapus ${building.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {buildings.map((building) => (
          <article key={building.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="font-semibold text-slate-900">{building.name}</p>
            <p className="mt-1 text-sm text-slate-600">{formatOperational(building)}</p>

            <div className="mt-3 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => onEdit(building)}
                className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label={`Edit ${building.name}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(building)}
                className="rounded-md p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Hapus ${building.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
