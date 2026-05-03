"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Filter, Plus, Search } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import SectionCard from "@/app/components/administrator/common/SectionCard";
import SectionHeader from "@/app/components/administrator/common/SectionHeader";
import { buildErrorMessage } from "@/app/components/administrator/common/http";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import RoomFormModal from "./RoomFormModal";

import type { RoomItem, RoomPayload } from "./room-types";
import RoomTable from "./RoomTable";

type RoomManagementContentProps = {
  initialRooms: RoomItem[];
  initialBuildings: string[];
};

const sortAlphabetically = (values: string[]) => [...values].sort((a, b) => a.localeCompare(b));
const ITEMS_PER_PAGE = 10;

export default function RoomManagementContent({
  initialRooms,
  initialBuildings,
}: RoomManagementContentProps) {
  const { pushToast } = useToast();
  const [rooms, setRooms] = useState<RoomItem[]>(initialRooms);
  const buildings = useMemo(() => sortAlphabetically(initialBuildings), [initialBuildings]);
  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "aktif" | "maintenance">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRooms = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchBuilding = selectedBuilding === "ALL" || room.building === selectedBuilding;
      const matchStatus = selectedStatus === "ALL" || room.status === selectedStatus;

      if (!matchBuilding || !matchStatus) {
        return false;
      }

      if (!loweredSearch) {
        return true;
      }

      return (
        room.name.toLowerCase().includes(loweredSearch) ||
        room.building.toLowerCase().includes(loweredSearch) ||
        room.floor.toLowerCase().includes(loweredSearch) ||
        room.facilities.some((facility) => facility.toLowerCase().includes(loweredSearch))
      );
    });
  }, [rooms, search, selectedBuilding, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / ITEMS_PER_PAGE));

  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRooms.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRooms, currentPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);

    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCreateRoom = async (payload: RoomPayload) => {
    const response = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response, "Gagal menambahkan ruangan."));
    }

    const createdRoom: RoomItem = await response.json();

    setRooms((prev) => {
      return [createdRoom, ...prev];
    });

    setCurrentPage(1);

    pushToast({ type: "success", message: "Ruangan berhasil ditambahkan." });
  };

  const handleUpdateRoom = async (payload: RoomPayload) => {
    if (!editingRoom) {
      return;
    }

    const response = await fetch(`/api/admin/rooms/${editingRoom.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response, "Gagal memperbarui ruangan."));
    }

    const updatedRoom: RoomItem = await response.json();

    setRooms((prev) => {
      return prev.map((item) => (item.id === updatedRoom.id ? updatedRoom : item));
    });

    setEditingRoom(null);
    pushToast({ type: "success", message: "Data ruangan berhasil diperbarui." });
  };

  const handleDeleteRoom = async () => {
    if (!deletingRoom) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/rooms/${deletingRoom.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response, "Gagal menghapus ruangan."));
      }

      setRooms((prev) => {
        return prev.filter((room) => room.id !== deletingRoom.id);
      });

      pushToast({ type: "success", message: "Ruangan berhasil dihapus." });
      setDeletingRoom(null);
    } catch (error) {
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="space-y-5 overflow-hidden p-4 lg:p-7">
      <SectionCard>
        <SectionHeader
          size="lg"
          title="Daftar Ruangan"
          description="Kelola data ruangan per gedung untuk kebutuhan reservasi."
          actions={
            <div className="hidden md:block">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex w-auto items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <Plus size={16} />
                Tambah Ruangan
              </button>
            </div>
          }
        />

        <div className="mt-4">
          {/* Search input on its own row */}
          <div className="mb-3">
            <label className="relative w-full md:max-w-sm">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama ruangan, gedung, atau fasilitas"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
              />
            </label>
          </div>

          {/* Single filter button row (filters + badge on one line for desktop) */}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((v) => !v)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors ${
                    isFilterOpen ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <Filter size={16} className="text-slate-500" />
                  Filter Gedung & Status
                </button>

                {isFilterOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-lg bg-white p-3 shadow-md md:w-80">
                    <label className="flex w-full items-center justify-between gap-3">
                      <span className="text-sm text-slate-700">Gedung</span>
                      <select
                        value={selectedBuilding}
                        onChange={(event) => {
                          setSelectedBuilding(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="ml-2 w-2/3 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 outline-none"
                      >
                        <option value="ALL">Semua Gedung</option>
                        {buildings.map((building) => (
                          <option key={building} value={building}>
                            {building}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="mt-2 flex w-full items-center justify-between gap-3">
                      <span className="text-sm text-slate-700">Status</span>
                      <select
                        value={selectedStatus}
                        onChange={(event) => {
                          setSelectedStatus(event.target.value as "ALL" | "aktif" | "maintenance");
                          setCurrentPage(1);
                        }}
                        className="ml-2 w-2/3 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 outline-none"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="aktif">Aktif</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop badge inline */}
            <div className="hidden md:inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
              <Building2 size={16} className="text-slate-500" />
              {filteredRooms.length} Ruangan
            </div>
          </div>

          {/* Mobile: badge below filter and Add button below that */}
          <div className="mt-3 w-full md:hidden">
            <div className="mb-2">
              <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <Building2 size={16} className="text-slate-500" />
                {filteredRooms.length} Ruangan
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <Plus size={16} />
              Tambah Ruangan
            </button>
          </div>
        </div>

        <div className="mt-4">
           <RoomTable rooms={paginatedRooms} onEdit={setEditingRoom} onDelete={setDeletingRoom} />
        </div>

        {filteredRooms.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <p>
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredRooms.length)} dari {filteredRooms.length} ruangan
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                    page === currentPage
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        ) : null}
      </SectionCard>

      <RoomFormModal
        isOpen={isCreateModalOpen}
        mode="create"
        buildings={buildings}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoom}
      />

      <RoomFormModal
        isOpen={Boolean(editingRoom)}
        mode="edit"
        room={editingRoom}
        buildings={buildings}
        onClose={() => setEditingRoom(null)}
        onSubmit={handleUpdateRoom}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(deletingRoom)}
        title="Hapus Ruangan"
        description={deletingRoom ? `Ruangan ${deletingRoom.name} akan dihapus.` : ""}
        onCancel={() => setDeletingRoom(null)}
        onConfirm={handleDeleteRoom}
        isLoading={isDeleting}
      />
    </main>
  );
}
