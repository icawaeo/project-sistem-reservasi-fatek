"use client";

import { useMemo, useState } from "react";
import { Building2, Filter, Plus, Search } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import SectionCard from "@/app/components/administrator/ui/SectionCard";
import SectionHeader from "@/app/components/administrator/ui/SectionHeader";
import { buildErrorMessage } from "@/app/components/administrator/ui/http";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import BuildingFormModal from "./BuildingFormModal";
import type { BuildingItem, BuildingPayload } from "./building-types";
import BuildingTable from "./BuildingTable";

type BuildingManagementContentProps = {
  initialBuildings: BuildingItem[];
};

export default function BuildingManagementContent({ initialBuildings }: BuildingManagementContentProps) {
  const { pushToast } = useToast();
  const [buildings, setBuildings] = useState<BuildingItem[]>(initialBuildings);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "aktif" | "maintenance">("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingItem | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredBuildings = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase();

    return buildings.filter((building) => {
      const matchStatus = selectedStatus === "ALL" || building.status === selectedStatus;

      if (!matchStatus) {
        return false;
      }

      if (!loweredSearch) {
        return true;
      }

      const dayText = building.operationalDays.join(" ").toLowerCase();
      const operationalText = `${building.openTime} ${building.closeTime}`;
      const statusText = building.status.toLowerCase();

      return (
        building.name.toLowerCase().includes(loweredSearch) ||
        dayText.includes(loweredSearch) ||
        operationalText.includes(loweredSearch) ||
        statusText.includes(loweredSearch)
      );
    });
  }, [buildings, search, selectedStatus]);

  const sortByName = (items: BuildingItem[]) => [...items].sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateBuilding = async (payload: BuildingPayload) => {
    const response = await fetch("/api/admin/buildings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response, "Gagal menambahkan gedung."));
    }

    const createdBuilding: BuildingItem = await response.json();

    setBuildings((prev) => sortByName([...prev, createdBuilding]));
    pushToast({ type: "success", message: "Gedung berhasil ditambahkan." });
  };

  const handleUpdateBuilding = async (payload: BuildingPayload) => {
    if (!editingBuilding) {
      return;
    }

    const response = await fetch(`/api/admin/buildings/${editingBuilding.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response, "Gagal memperbarui gedung."));
    }

    const updatedBuilding: BuildingItem = await response.json();

    setBuildings((prev) => sortByName(prev.map((item) => (item.id === updatedBuilding.id ? updatedBuilding : item))));
    setEditingBuilding(null);
    pushToast({ type: "success", message: "Data gedung berhasil diperbarui." });
  };

  const handleDeleteBuilding = async () => {
    if (!deletingBuilding) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/buildings/${deletingBuilding.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response, "Gagal menghapus gedung."));
      }

      setBuildings((prev) => prev.filter((building) => building.id !== deletingBuilding.id));
      pushToast({ type: "success", message: "Gedung berhasil dihapus." });
      setDeletingBuilding(null);
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
          title="Daftar Gedung"
          description="Kelola data gedung dan waktu operasional untuk reservasi."
          actions={
            <div className="hidden md:block">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex w-auto items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <Plus size={16} />
                Tambah Gedung
              </button>
            </div>
          }
        />

        <div className="mt-4">
          {/* Search input on its own row */}
          <div className="mb-3">
            <label className="relative w-full">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama gedung atau jadwal operasional"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
              />
            </label>
          </div>

          {/* Filter button and building count row */}
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
                  Semua Status
                </button>

                {isFilterOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-lg bg-white p-3 shadow-md md:w-80">
                    <label className="flex w-full items-center justify-between gap-3">
                      <span className="text-sm text-slate-700">Status</span>
                      <select
                        value={selectedStatus}
                        onChange={(event) => {
                          setSelectedStatus(event.target.value as "ALL" | "aktif" | "maintenance");
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

            {/* Desktop building count inline */}
            <div className="hidden md:inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
              <Building2 size={16} className="text-slate-500" />
              {filteredBuildings.length} Gedung
            </div>
          </div>

          {/* Mobile: building count below filter and add button below that */}
          <div className="mt-3 w-full md:hidden">
            <div className="mb-2">
              <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <Building2 size={16} className="text-slate-500" />
                {filteredBuildings.length} Gedung
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <Plus size={16} />
              Tambah Gedung
            </button>
          </div>
        </div>

        <div className="mt-4">
          <BuildingTable buildings={filteredBuildings} onEdit={setEditingBuilding} onDelete={setDeletingBuilding} />
        </div>
      </SectionCard>

      <BuildingFormModal
        isOpen={isCreateModalOpen}
        mode="create"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateBuilding}
      />

      <BuildingFormModal
        isOpen={Boolean(editingBuilding)}
        mode="edit"
        building={editingBuilding}
        onClose={() => setEditingBuilding(null)}
        onSubmit={handleUpdateBuilding}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(deletingBuilding)}
        title="Hapus Gedung"
        description={deletingBuilding ? `Gedung ${deletingBuilding.name} akan dihapus.` : ""}
        onCancel={() => setDeletingBuilding(null)}
        onConfirm={handleDeleteBuilding}
        isLoading={isDeleting}
      />
    </main>
  );
}
