"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Mail, Phone, User, X } from "lucide-react";
import type { MonitoringReservation } from "./types";

type RoomOption = {
  room_id: string;
  room_name: string;
  room_building: string;
  room_locDetail: string;
  room_capacity: number;
};

type AddReservationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buildingOptions: string[];
  onCreated: (item: MonitoringReservation) => void;
};

const initialForm = {
  building: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  roomId: "",
  borrowerName: "",
  borrowerIdentifier: "",
  borrowerEmail: "",
  borrowerPhone: "",
  activityName: "",
  purposeDetail: "",
};

export default function AddReservationModal({
  isOpen,
  onClose,
  buildingOptions,
  onCreated,
}: AddReservationModalProps) {
  const [form, setForm] = useState(initialForm);
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [isCheckingRooms, setIsCheckingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedRoom = useMemo(
    () => roomOptions.find((room) => room.room_id === form.roomId) ?? null,
    [roomOptions, form.roomId]
  );

  const hasSelectedBuilding = !!form.building;
  const hasCompleteSchedule =
    hasSelectedBuilding && !!form.startDate && !!form.endDate && !!form.startTime && !!form.endTime;

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setRoomOptions([]);
      setErrorMessage("");
      setIsCheckingRooms(false);
      setIsSubmitting(false);
      return;
    }

    if (!hasSelectedBuilding) {
      setRoomOptions([]);
      return;
    }

    const abortController = new AbortController();

    const fetchRooms = async () => {
      setIsCheckingRooms(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams({
          building: form.building,
        });

        if (hasCompleteSchedule) {
          params.set("startDate", form.startDate);
          params.set("endDate", form.endDate);
          params.set("startTime", form.startTime);
          params.set("endTime", form.endTime);
        }

        const response = await fetch(`/api/rooms?${params.toString()}`, {
          signal: abortController.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal mengecek ketersediaan ruangan");
        }

        setRoomOptions(Array.isArray(data) ? (data as RoomOption[]) : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setRoomOptions([]);
        setErrorMessage(error instanceof Error ? error.message : "Gagal mengecek ketersediaan ruangan");
      } finally {
        setIsCheckingRooms(false);
      }
    };

    fetchRooms();

    return () => {
      abortController.abort();
    };
  }, [
    isOpen,
    hasSelectedBuilding,
    hasCompleteSchedule,
    form.building,
    form.startDate,
    form.endDate,
    form.startTime,
    form.endTime,
  ]);

  useEffect(() => {
    if (form.roomId && !roomOptions.some((item) => item.room_id === form.roomId)) {
      setForm((prev) => ({ ...prev, roomId: "" }));
    }
  }, [roomOptions, form.roomId]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getTextToneClass = (value: string) => (value ? "text-slate-900" : "text-slate-500");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.roomId) {
      setErrorMessage("Pilih ruangan yang tersedia terlebih dahulu.");
      return;
    }

    if (!form.borrowerName || !form.borrowerEmail || !form.borrowerPhone || !form.activityName) {
      setErrorMessage("Mohon lengkapi data peminjam dan detail kegiatan.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: form.roomId,
          startDate: form.startDate,
          endDate: form.endDate,
          startTime: form.startTime,
          endTime: form.endTime,
          borrowerName: form.borrowerName,
          borrowerIdentifier: form.borrowerIdentifier,
          borrowerEmail: form.borrowerEmail,
          borrowerPhone: form.borrowerPhone,
          activityName: form.activityName,
          purposeDetail: form.purposeDetail,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal menambahkan pengajuan");
      }

      onCreated(payload.data as MonitoringReservation);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menambahkan pengajuan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tambah Pengajuan Reservasi</h2>
            <p className="text-sm text-slate-500">Isi jadwal, pilih ruangan kosong, lalu lengkapi data peminjam.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Tutup form"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-5">
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Jadwal dan Ruangan</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Gedung</span>
                <select
                  value={form.building}
                  onChange={(event) => handleChange("building", event.target.value)}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 ${getTextToneClass(form.building)}`}
                  required
                >
                  <option value="">Pilih gedung</option>
                  {buildingOptions.map((building) => (
                    <option key={building} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Ruangan Tersedia</span>
                <select
                  value={form.roomId}
                  onChange={(event) => handleChange("roomId", event.target.value)}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 ${getTextToneClass(form.roomId)}`}
                  disabled={!hasSelectedBuilding || isCheckingRooms}
                  required
                >
                  <option value="">
                    {!hasSelectedBuilding
                      ? "Silakan pilih gedung terlebih dahulu"
                      : isCheckingRooms
                        ? "Mengecek ruangan..."
                        : "Pilih ruangan"}
                  </option>
                  {roomOptions.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      {room.room_name} - {room.room_locDetail}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Tanggal Mulai</span>
                <div className="relative">
                  <Calendar size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => handleChange("startDate", event.target.value)}
                    className={`w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 ${getTextToneClass(form.startDate)}`}
                    required
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Tanggal Selesai</span>
                <div className="relative">
                  <Calendar size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => handleChange("endDate", event.target.value)}
                    min={form.startDate || undefined}
                    className={`w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 ${getTextToneClass(form.endDate)}`}
                    required
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Jam Mulai</span>
                <div className="relative">
                  <Clock size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) => handleChange("startTime", event.target.value)}
                    className={`w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 ${getTextToneClass(form.startTime)}`}
                    required
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Jam Selesai</span>
                <div className="relative">
                  <Clock size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) => handleChange("endTime", event.target.value)}
                    className={`w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 ${getTextToneClass(form.endTime)}`}
                    required
                  />
                </div>
              </label>
            </div>

            {selectedRoom ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                Ruangan tersedia: {selectedRoom.room_name} ({selectedRoom.room_capacity} orang)
              </p>
            ) : null}

            {hasCompleteSchedule && !isCheckingRooms && roomOptions.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                Tidak ada ruangan kosong pada jadwal tersebut. Silakan ubah tanggal atau jam.
              </p>
            ) : null}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Data Peminjam</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Nama Lengkap</span>
                <div className="relative">
                  <User size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={form.borrowerName}
                    onChange={(event) => handleChange("borrowerName", event.target.value)}
                    className={`w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 placeholder:text-slate-400 ${getTextToneClass(form.borrowerName)}`}
                    placeholder="Nama peminjam"
                    required
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">NIM/NIP (opsional)</span>
                <input
                  type="text"
                  value={form.borrowerIdentifier}
                  onChange={(event) => handleChange("borrowerIdentifier", event.target.value)}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 placeholder:text-slate-400 ${getTextToneClass(form.borrowerIdentifier)}`}
                  placeholder="Nomor identitas"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Email</span>
                <div className="relative">
                  <Mail size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={form.borrowerEmail}
                    onChange={(event) => handleChange("borrowerEmail", event.target.value)}
                    className={`w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 placeholder:text-slate-400 ${getTextToneClass(form.borrowerEmail)}`}
                    placeholder="Email akun user terdaftar"
                    required
                  />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-600">Nomor Telepon</span>
                <div className="relative">
                  <Phone size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={form.borrowerPhone}
                    onChange={(event) => handleChange("borrowerPhone", event.target.value.replace(/\D/g, ""))}
                    className={`w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 placeholder:text-slate-400 ${getTextToneClass(form.borrowerPhone)}`}
                    placeholder="Nomor telepon"
                    required
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Detail Kegiatan</h3>
            <div className="space-y-3">
              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-600">Nama Kegiatan</span>
                <input
                  type="text"
                  value={form.activityName}
                  onChange={(event) => handleChange("activityName", event.target.value)}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 placeholder:text-slate-400 ${getTextToneClass(form.activityName)}`}
                  placeholder="Nama kegiatan"
                  required
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-slate-600">Alasan Peminjaman</span>
                <textarea
                  value={form.purposeDetail}
                  onChange={(event) => handleChange("purposeDetail", event.target.value)}
                  rows={3}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 placeholder:text-slate-400 ${getTextToneClass(form.purposeDetail)}`}
                  placeholder="Jelaskan singkat tujuan peminjaman"
                />
              </label>
            </div>
          </section>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCheckingRooms}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
