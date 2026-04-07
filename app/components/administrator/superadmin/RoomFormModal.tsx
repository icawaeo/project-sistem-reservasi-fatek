"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import ImageUpload from "./ImageUpload";
import type { RoomItem, RoomPayload, RoomStatus } from "./room-types";

type RoomFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  room?: RoomItem | null;
  buildings: string[];
  onClose: () => void;
  onSubmit: (payload: RoomPayload) => Promise<void>;
};

type FormState = {
  name: string;
  building: string;
  floor: string;
  capacity: string;
  facilities: string[];
  status: RoomStatus;
  imageUrl: string | null;
  facilityInput: string;
};

const initialState: FormState = {
  name: "",
  building: "",
  floor: "",
  capacity: "",
  facilities: [],
  status: "aktif",
  imageUrl: null,
  facilityInput: "",
};

export default function RoomFormModal({
  isOpen,
  mode,
  room,
  buildings,
  onClose,
  onSubmit,
}: RoomFormModalProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && room) {
      setForm({
        name: room.name,
        building: room.building,
        floor: room.floor,
        capacity: String(room.capacity),
        facilities: room.facilities,
        status: room.status,
        imageUrl: room.imageUrl,
        facilityInput: "",
      });
      setError(null);
      return;
    }

    setForm(initialState);
    setError(null);
  }, [isOpen, mode, room, buildings]);

  const addFacility = (rawValue: string) => {
    const value = rawValue.trim();

    if (!value) {
      return;
    }

    if (form.facilities.some((item) => item.toLowerCase() === value.toLowerCase())) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      facilities: [...prev.facilities, value],
      facilityInput: "",
    }));
  };

  const removeFacility = (value: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((item) => item !== value),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const capacity = Number(form.capacity);
    const roomName = (form.name ?? "").trim();

    if (!roomName) {
      setError("Nama ruangan belum diisi.");
      return;
    }

    if (!form.building.trim()) {
      setError("Belum ada gedung yang dipilih.");
      return;
    }

    if (Number.isNaN(capacity) || capacity <= 0) {
      setError("Kapasitas wajib diisi dengan benar.");
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        name: roomName,
        building: form.building.trim(),
        floor: (form.floor ?? "").replace(/\D+/g, "").trim(),
        capacity: Math.floor(capacity),
        facilities: form.facilities,
        status: form.status,
        imageUrl: form.imageUrl,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const buildingOptions =
    form.building && !buildings.includes(form.building) ? [...buildings, form.building] : buildings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === "create" ? "Tambah Ruangan" : "Edit Ruangan"}
            </h3>
            <p className="text-sm text-slate-500">Isi informasi ruangan dengan lengkap.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Nama Ruangan</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Contoh: Lab Model & Maket"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Kapasitas (Orang)</span>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="40"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Gedung</span>
              <select
                value={form.building}
                onChange={(event) => setForm((prev) => ({ ...prev, building: event.target.value }))}
                className={`h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 ${
                  form.building ? "text-slate-900" : "text-slate-400"
                }`}
              >
                <option value="" className="text-slate-400">
                  Pilih gedung
                </option>
                {buildingOptions.map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Lantai</span>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={form.floor}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    floor: event.target.value.replace(/\D+/g, ""),
                  }))
                }
                required
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Contoh: 2"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as RoomStatus }))
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="aktif">Aktif</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Fasilitas</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.facilityInput}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, facilityInput: event.target.value }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addFacility(form.facilityInput);
                  }
                }}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Ketik fasilitas lalu Enter"
              />
              <button
                type="button"
                onClick={() => addFacility(form.facilityInput)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <Plus size={14} />
                Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.facilities.length > 0 ? (
                form.facilities.map((facility) => (
                  <span
                    key={facility}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                  >
                    {facility}
                    <button
                      type="button"
                      onClick={() => removeFacility(facility)}
                      className="text-indigo-500 hover:text-indigo-700"
                      aria-label={`Hapus fasilitas ${facility}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">Belum ada fasilitas.</p>
              )}
            </div>
          </div>

          <ImageUpload value={form.imageUrl} onChange={(value) => setForm((prev) => ({ ...prev, imageUrl: value }))} />

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {isLoading ? "Menyimpan..." : mode === "create" ? "Simpan Ruangan" : "Update Ruangan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
