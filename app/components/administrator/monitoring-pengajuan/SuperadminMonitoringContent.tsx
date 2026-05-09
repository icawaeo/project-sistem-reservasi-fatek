"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import type { AdminReservationRecord, AdminRole } from "@/app/components/administrator/monitoring-pengajuan/reservation-types";
import type { MonitoringReservation } from "./monitoring-types";
import AddReservationModal from "./AddReservationModal";
import MonitoringSection from "../dashboard/MonitoringSection";
import UniversalReservationTable from "@/app/components/administrator/ui/UniversalReservationTable";

export type SuperadminMonitoringContentProps = {
  lastSync: string;
  buildingOptions?: string[];
  initialData?: MonitoringReservation[];
  adminData?: AdminReservationRecord[];
  adminMode?: boolean;
  adminRole?: AdminRole;
};

export default function SuperadminMonitoringContent({
  initialData = [],
  adminData = [],
  buildingOptions = [],
  lastSync,
  adminMode = false,
  adminRole = "ADMIN",
}: SuperadminMonitoringContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [superadminData, setSuperadminData] = useState<MonitoringReservation[]>(initialData);
  const [adminTableData, setAdminTableData] = useState<AdminReservationRecord[]>(adminData);

  const sortedBuildings = useMemo(
    () => [...buildingOptions].sort((left, right) => left.localeCompare(right, "id")),
    [buildingOptions],
  );

  const handleCreated = (newReservation: MonitoringReservation) => {
    setSuperadminData((prev) => [newReservation, ...prev]);
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setSuperadminData((prev) => prev.filter((item) => item.id !== deletedId));
  };

  const handleAdminStatusUpdated = (id: string, updates: Partial<AdminReservationRecord>) => {
    setAdminTableData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  return (
    <main className="p-4 lg:p-7">
      {adminMode ? (
        <UniversalReservationTable
          data={adminTableData}
          mode="admin"
          adminRole={adminRole}
          onStatusUpdated={handleAdminStatusUpdated}
        />
      ) : (
        <MonitoringSection
          data={superadminData}
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
      )}

      {!adminMode ? (
        <AddReservationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          buildingOptions={sortedBuildings}
          onCreated={handleCreated}
        />
      ) : null}
    </main>
  );
}
