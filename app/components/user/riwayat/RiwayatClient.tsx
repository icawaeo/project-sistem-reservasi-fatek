"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import type {
  ReservationDraftSnapshot,
  ReservationRecord,
  ReservationStatus,
  SortOrder,
} from "./_types";
import { getActiveReservation } from "../utils/reservation";

import LatestSubmissionSection from "./LatestSubmissionSection";
import HistorySection from "./HistorySection";

type FilterStatus = "ALL" | ReservationStatus;

type Props = {
  initialReservations: ReservationRecord[];
  initialSort: SortOrder;
};

export default function RiwayatClient({ initialReservations, initialSort }: Props) {
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSort);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [latestDraftSnapshot, setLatestDraftSnapshot] = useState<ReservationDraftSnapshot | null>(null);

  useEffect(() => {
    const rawDraft = sessionStorage.getItem("reservationDraft");
    if (!rawDraft) return;

    try {
      const parsed = JSON.parse(rawDraft) as ReservationDraftSnapshot;
      setLatestDraftSnapshot(parsed);
    } catch {
      setLatestDraftSnapshot(null);
    }
  }, []);

  const sortedNewest = useMemo(() => {
    return [...initialReservations].sort(
      (a, b) => new Date(b.res_startTime).getTime() - new Date(a.res_startTime).getTime()
    );
  }, [initialReservations]);

  const sortedOldest = useMemo(() => {
    return [...sortedNewest].reverse();
  }, [sortedNewest]);

  const sortedReservations = sortOrder === "newest" ? sortedNewest : sortedOldest;

  const latestActiveSubmission = useMemo(() => {
    return getActiveReservation(sortedReservations);
  }, [sortedReservations]);

  const historyItems = useMemo(() => {
    let items = sortedReservations;

    if (latestActiveSubmission) {
      items = items.filter((item) => item.res_id !== latestActiveSubmission.res_id);
    }

    if (filterStatus !== "ALL") {
      items = items.filter((item) => item.res_status === filterStatus);
    }

    return items;
  }, [sortedReservations, latestActiveSubmission, filterStatus]);

  const handleSortOrderChange = useCallback((value: SortOrder) => {
    setSortOrder(value);
  }, []);

  const handleFilterStatusChange = useCallback((value: FilterStatus) => {
    setFilterStatus(value);
  }, []);

  return (
    <>
      <LatestSubmissionSection reservation={latestActiveSubmission} draftSnapshot={latestDraftSnapshot} />

      <HistorySection
        items={historyItems}
        sortOrder={sortOrder}
        filterStatus={filterStatus}
        onSortOrderChange={handleSortOrderChange}
        onFilterStatusChange={handleFilterStatusChange}
      />
    </>
  );
}
