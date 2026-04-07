"use client";

import { useMemo, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import BuildingFormModal from "./BuildingFormModal";
import BuildingTable from "./BuildingTable";
import type { BuildingItem, BuildingPayload } from "./building-types";

type BuildingManagementContentProps = {
  initialBuildings: BuildingItem[];
};

const buildErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
};

export default function BuildingManagementContent({ initialBuildings }: BuildingManagementContentProps) {
  const [buildings, setBuildings] = useState<BuildingItem[]>(initialBuildings);
  const [search, setSearch] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingItem | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredBuildings = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase();

    if (!loweredSearch) {
      return buildings;
    }

    return buildings.filter((building) => {
      const dayText = building.operationalDays.join(" ").toLowerCase();
      const operationalText = `${building.openTime} ${building.closeTime}`;

      return (
        building.name.toLowerCase().includes(loweredSearch) ||
        dayText.includes(loweredSearch) ||
        operationalText.includes(loweredSearch)
      );
    });
  }, [buildings, search]);

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
    setFeedback({ type: "success", message: "Gedung berhasil ditambahkan." });
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
    setFeedback({ type: "success", message: "Data gedung berhasil diperbarui." });
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
      setFeedback({ type: "success", message: "Gedung berhasil dihapus." });
      setDeletingBuilding(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus gedung.",
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="space-y-5 p-4 lg:p-7">
      <section className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Gedung</h2>
            <p className="text-sm text-slate-500">Kelola data gedung dan waktu operasional untuk reservasi.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Plus size={16} />
            Tambah Gedung
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
          <label className="relative w-full md:max-w-sm">
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

          <span className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
            <Building2 size={15} className="text-slate-500" />
            {filteredBuildings.length} Gedung
          </span>
        </div>

        {feedback ? (
          <div
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-4">
          <BuildingTable
            buildings={filteredBuildings}
            onEdit={setEditingBuilding}
            onDelete={setDeletingBuilding}
          />
        </div>
      </section>

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
