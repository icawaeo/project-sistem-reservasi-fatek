"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Loader2, Trash2, X } from "lucide-react";

import { LAB_PROGRAM_LABELS } from "@/lib/room-scope";

import { FIELD_CLASS_NAME, TYPE_OPTIONS } from "./constants";
import type { AdminRole, RoomOption, ScheduleFormState, ScheduleItem } from "./types";

type Props = {
  adminRole: AdminRole;
  programScope: string | null;
  rooms: RoomOption[];
  programOptions: string[];
  form: ScheduleFormState;
  editingId: string | null;
  editingSchedule: ScheduleItem | null;
  isSaving: boolean;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (item: ScheduleItem) => void;
};

export default function ScheduleFormModal({
  adminRole,
  programScope,
  rooms,
  programOptions,
  form,
  editingId,
  editingSchedule,
  isSaving,
  setForm,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{editingId ? "Edit Jadwal" : "Tambah Jadwal"}</h3>
            <p className="text-sm text-slate-500">Jadwal ini akan memblokir ketersediaan ruangan pada slot terkait.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-5 py-5">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-600">Judul Kegiatan</span>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className={FIELD_CLASS_NAME}
              placeholder="Contoh: Kuliah Sistem Digital"
              required
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">Jenis</span>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                className={FIELD_CLASS_NAME}
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">Tanggal</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className={FIELD_CLASS_NAME}
                required
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">Jam Mulai</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                className={FIELD_CLASS_NAME}
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">Jam Selesai</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                className={FIELD_CLASS_NAME}
                required
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-600">Ruangan</span>
            <select
              value={form.roomId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  roomId: event.target.value,
                  programScope: adminRole === "KAPRODI" ? programScope ?? "" : "",
                }))
              }
              className={FIELD_CLASS_NAME}
              required
            >
              <option value="">Pilih ruangan</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} - {room.building}
                </option>
              ))}
            </select>
          </label>

          {adminRole !== "KAPRODI" && programOptions.length > 0 ? (
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">Program Studi Terkait</span>
              <select
                value={form.programScope}
                onChange={(event) => setForm((prev) => ({ ...prev, programScope: event.target.value }))}
                className={FIELD_CLASS_NAME}
              >
                <option value="">Umum Jurusan</option>
                {programOptions.map((program) => (
                  <option key={program} value={program}>
                    {LAB_PROGRAM_LABELS[program as keyof typeof LAB_PROGRAM_LABELS]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {adminRole === "KAPRODI" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              Program studi: {programScope ? LAB_PROGRAM_LABELS[programScope as keyof typeof LAB_PROGRAM_LABELS] : "-"}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
            {editingSchedule ? (
              <button
                type="button"
                onClick={() => onDelete(editingSchedule)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100"
              >
                <Trash2 size={15} />
                Hapus
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
                {editingId ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
