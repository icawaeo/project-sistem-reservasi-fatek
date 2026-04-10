"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import ImageUpload from "./ImageUpload";
import type { BuildingItem, BuildingPayload, BuildingStatus } from "./building-types";

type BuildingFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  building?: BuildingItem | null;
  onClose: () => void;
  onSubmit: (payload: BuildingPayload) => Promise<void>;
};

type FormState = {
  name: string;
  operationalDays: string[];
  openTime: string;
  closeTime: string;
  status: BuildingStatus;
  imageUrl: string | null;
};

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const initialState: FormState = {
  name: "",
  operationalDays: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
  openTime: "08:00",
  closeTime: "17:00",
  status: "aktif",
  imageUrl: null,
};

export default function BuildingFormModal({
  isOpen,
  mode,
  building,
  onClose,
  onSubmit,
}: BuildingFormModalProps) {
  const { pushToast } = useToast();
  const [form, setForm] = useState<FormState>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && building) {
      setForm({
        name: building.name,
        operationalDays: building.operationalDays,
        openTime: building.openTime,
        closeTime: building.closeTime,
        status: building.status,
        imageUrl: building.imageUrl,
      });
      return;
    }

    setForm(initialState);
  }, [isOpen, mode, building]);

  const hasValidTimeRange = useMemo(() => {
    return form.openTime < form.closeTime;
  }, [form.openTime, form.closeTime]);

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const exists = prev.operationalDays.includes(day);
      const nextDays = exists
        ? prev.operationalDays.filter((item) => item !== day)
        : [...prev.operationalDays, day];

      return {
        ...prev,
        operationalDays: DAYS.filter((item) => nextDays.includes(item)),
      };
    });
  };

  const setPresetDays = (days: string[]) => {
    setForm((prev) => ({
      ...prev,
      operationalDays: days,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      pushToast({ type: "warning", message: "Nama gedung belum diisi." });
      return;
    }

    if (form.operationalDays.length === 0) {
      pushToast({ type: "warning", message: "Pilih minimal satu hari operasional." });
      return;
    }

    if (!hasValidTimeRange) {
      pushToast({ type: "warning", message: "Jam buka harus lebih awal dari jam tutup." });
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        name,
        operationalDays: form.operationalDays,
        openTime: form.openTime,
        closeTime: form.closeTime,
        status: form.status,
        imageUrl: form.imageUrl,
      });

      onClose();
    } catch (err) {
      pushToast({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {mode === "create" ? "Tambah Gedung" : "Edit Gedung"}
            </h3>
            <p className="text-sm text-slate-500">Isi data operasional gedung dengan lengkap.</p>
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
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Nama Gedung</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Contoh: Gedung Teknik Sipil"
              required
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Hari Operasional</span>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPresetDays(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"])}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Senin - Jumat
              </button>
              <button
                type="button"
                onClick={() => setPresetDays(["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"])}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Senin - Sabtu
              </button>
              <button
                type="button"
                onClick={() => setPresetDays(DAYS)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Semua Hari
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DAYS.map((day) => {
                const isActive = form.operationalDays.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Jam Buka</span>
              <input
                type="time"
                value={form.openTime}
                onChange={(event) => setForm((prev) => ({ ...prev, openTime: event.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Jam Tutup</span>
              <input
                type="time"
                value={form.closeTime}
                onChange={(event) => setForm((prev) => ({ ...prev, closeTime: event.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as BuildingStatus }))
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="aktif">Aktif</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
          </div>

          <ImageUpload
            value={form.imageUrl}
            onChange={(value) => setForm((prev) => ({ ...prev, imageUrl: value }))}
            label="Foto Gedung"
          />

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
              {isLoading ? "Menyimpan..." : mode === "create" ? "Simpan Gedung" : "Update Gedung"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
