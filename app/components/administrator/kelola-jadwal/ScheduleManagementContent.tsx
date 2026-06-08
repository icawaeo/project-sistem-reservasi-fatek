"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/app/components/ui/toast";

import { INITIAL_FORM } from "./constants";
import ScheduleCalendarGrid from "./ScheduleCalendarGrid";
import ScheduleDateSchedulesModal from "./ScheduleDateSchedulesModal";
import ScheduleFormModal from "./ScheduleFormModal";
import ScheduleToolbar from "./ScheduleToolbar";
import type {
  HolidayEvent,
  RoomOption,
  ScheduleItem,
  ScheduleManagementContentProps,
} from "./types";
import {
  buildCalendarDays,
  getDateYmd,
  getIndonesianWeekday,
  getMonthKey,
  getRoomProgramOptions,
  groupHolidaysByDate,
  groupSchedulesByDate,
  isDateOperational,
} from "./utils";

export default function ScheduleManagementContent({ adminRole, programScope }: ScheduleManagementContentProps) {
  const { pushToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [monthKey, setMonthKey] = useState("");
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayEvent[]>([]);
  const [holidayCalendarError, setHolidayCalendarError] = useState<string | null>(null);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectingDate, setInspectingDate] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedRoom = useMemo(() => rooms.find((room) => room.id === form.roomId) ?? null, [form.roomId, rooms]);
  const selectedFilterRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomFilter) ?? null,
    [rooms, selectedRoomFilter],
  );
  const programOptions = useMemo(() => getRoomProgramOptions(selectedRoom), [selectedRoom]);
  const calendarDays = useMemo(() => (monthKey ? buildCalendarDays(monthKey) : []), [monthKey]);
  const schedulesByDate = useMemo(() => groupSchedulesByDate(schedules), [schedules]);
  const holidaysByDate = useMemo(() => groupHolidaysByDate(holidays), [holidays]);
  const inspectedSchedules = inspectingDate ? schedulesByDate[inspectingDate] ?? [] : [];
  const editingSchedule = editingId ? schedules.find((item) => item.id === editingId) ?? null : null;
  const getDisabledDateReason = useCallback(
    (day: { date: Date }) => {
      const visibleRooms = selectedFilterRoom ? [selectedFilterRoom] : rooms;
      if (visibleRooms.length === 0) return null;
      if (visibleRooms.every((room) => isDateOperational(day.date, room.operationalDays))) return null;

      const weekday = getIndonesianWeekday(day.date);
      return selectedFilterRoom
        ? `${selectedFilterRoom.building} tidak beroperasi pada hari ${weekday}.`
        : `Ada gedung/ruangan yang tidak beroperasi pada hari ${weekday}. Pilih filter ruangan untuk melihat jadwal spesifik.`;
    },
    [rooms, selectedFilterRoom],
  );

  const loadSchedules = async () => {
    if (!monthKey) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ month: monthKey });
      if (selectedRoomFilter) params.set("roomId", selectedRoomFilter);

      const response = await fetch(`/api/admin/room-schedules?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Gagal memuat jadwal ruangan.");

      setRooms(Array.isArray(payload.rooms) ? payload.rooms : []);
      setSchedules(Array.isArray(payload.schedules) ? payload.schedules : []);
      setHolidays(Array.isArray(payload.holidays) ? payload.holidays : []);
      setHolidayCalendarError(
        typeof payload.holidayCalendarError === "string"
          ? payload.holidayCalendarError
          : typeof payload.holidayCalendar?.lastFetchError === "string"
            ? payload.holidayCalendar.lastFetchError
            : null,
      );
    } catch (error) {
      pushToast({ type: "error", message: error instanceof Error ? error.message : "Gagal memuat jadwal ruangan." });
      setSchedules([]);
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    setMonthKey(getMonthKey(today));
    setSelectedDate(getDateYmd(today));
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !monthKey) return;
    void loadSchedules();
  }, [isMounted, monthKey, selectedRoomFilter]);

  const shiftMonth = (delta: number) => {
    const [year, month] = monthKey.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    setMonthKey(getMonthKey(next));
  };

  const openCreateModal = (date = selectedDate) => {
    if (!date) return;

    setEditingId(null);
    setSelectedDate(date);
    setForm({ ...INITIAL_FORM, date, programScope: adminRole === "KAPRODI" ? programScope ?? "" : "" });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingId(item.id);
    setSelectedDate(item.date);
    setForm({
      title: item.title,
      type: item.type,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      roomId: item.room.id,
      programScope: item.programScope ?? "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(editingId ? `/api/admin/room-schedules/${editingId}` : "/api/admin/room-schedules", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Gagal menyimpan jadwal.");

      pushToast({ type: "success", message: editingId ? "Jadwal berhasil diperbarui." : "Jadwal berhasil ditambahkan." });
      closeModal();
      await loadSchedules();
    } catch (error) {
      pushToast({ type: "error", message: error instanceof Error ? error.message : "Gagal menyimpan jadwal." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: ScheduleItem) => {
    if (!confirm(`Hapus jadwal "${item.title}"?`)) return;

    try {
      const response = await fetch(`/api/admin/room-schedules/${item.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Gagal menghapus jadwal.");

      pushToast({ type: "success", message: "Jadwal berhasil dihapus." });
      closeModal();
      await loadSchedules();
    } catch (error) {
      pushToast({ type: "error", message: error instanceof Error ? error.message : "Gagal menghapus jadwal." });
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-white">
      <div className="mx-auto max-w-none">
        {isMounted && monthKey ? (
          <ScheduleToolbar
            monthKey={monthKey}
            rooms={rooms}
            selectedRoomFilter={selectedRoomFilter}
            isFilterOpen={isFilterOpen}
            onShiftMonth={shiftMonth}
            onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
            onRoomFilterChange={setSelectedRoomFilter}
            onCreateSchedule={() => openCreateModal(selectedDate)}
          />
        ) : (
          <header className="flex h-[69px] items-center border-b border-slate-200 bg-white px-4">
            <div className="h-5 w-40 rounded bg-slate-100" />
          </header>
        )}

        <ScheduleCalendarGrid
          calendarDays={calendarDays}
          schedulesByDate={schedulesByDate}
          holidaysByDate={holidaysByDate}
          holidayCalendarError={holidayCalendarError}
          isLoading={isLoading}
          getDisabledReason={getDisabledDateReason}
          onCreateSchedule={openCreateModal}
          onEditSchedule={openEditModal}
          onInspectDate={setInspectingDate}
        />
      </div>

      {isModalOpen ? (
        <ScheduleFormModal
          adminRole={adminRole}
          programScope={programScope}
          rooms={rooms}
          programOptions={programOptions}
          form={form}
          editingId={editingId}
          editingSchedule={editingSchedule}
          isSaving={isSaving}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      ) : null}

      {inspectingDate ? (
        <ScheduleDateSchedulesModal
          inspectingDate={inspectingDate}
          schedules={inspectedSchedules}
          onClose={() => setInspectingDate(null)}
          onEditSchedule={openEditModal}
          onCreateSchedule={openCreateModal}
        />
      ) : null}
    </main>
  );
}
