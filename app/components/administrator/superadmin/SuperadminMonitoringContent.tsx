"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import MonitoringSection from "./MonitoringSection";
import AddReservationModal from "@/app/components/administrator/superadmin/AddReservationModal";
import type { MonitoringReservation } from "./types";

type SuperadminMonitoringContentProps = {
  initialData: MonitoringReservation[];
  buildingOptions: string[];
  lastSync: string;
};

export default function SuperadminMonitoringContent({
  initialData,
  buildingOptions,
  lastSync,
}: SuperadminMonitoringContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableData, setTableData] = useState<MonitoringReservation[]>(initialData);

  const sortedBuildings = useMemo(
    () => [...buildingOptions].sort((left, right) => left.localeCompare(right, "id")),
    [buildingOptions]
  );

  const handleCreated = (newReservation: MonitoringReservation) => {
    setTableData((prev) => [newReservation, ...prev]);
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setTableData((prev) => prev.filter((item) => item.id !== deletedId));
  };

  return (
    <main className="p-4 lg:p-7">
      <MonitoringSection
        data={tableData}
        lastSync={lastSync}
        primaryStatusLabel="Menunggu Persetujuan"
        headerAction={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 lg:w-auto"
          >
            <Plus size={16} />
            Tambah Pengajuan
          </button>
        }
        onDeleteSuccess={handleDeleteSuccess}
      />

      <AddReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        buildingOptions={sortedBuildings}
        onCreated={handleCreated}
      />
    </main>
  );
}
