"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import type {
  ReservationDisplayStatus,
  ReservationDraftSnapshot,
  ReservationRecord,
  SortOrder,
} from "./_types";
import {
  getCurrentReservation,
  getReservationDisplayStatus,
} from "../utils/reservation";

import LatestSubmissionSection from "./LatestSubmissionSection";
import HistorySection from "./HistorySection";

type FilterStatus = "ALL" | ReservationDisplayStatus;

type Props = {
  initialReservations: ReservationRecord[];
  initialSort: SortOrder;
  serverNow: string;
};

export default function RiwayatClient({ initialReservations, initialSort, serverNow }: Props) {
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSort);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [latestDraftSnapshot, setLatestDraftSnapshot] = useState<ReservationDraftSnapshot | null>(null);
  const [serverClock, setServerClock] = useState(() => new Date(serverNow));

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

  useEffect(() => {
    const serverStartedAt = new Date(serverNow).getTime();
    const clientStartedAt = Date.now();

    const updateServerClock = () => {
      setServerClock(new Date(serverStartedAt + (Date.now() - clientStartedAt)));
    };

    updateServerClock();
    const intervalId = window.setInterval(updateServerClock, 30_000);

    return () => window.clearInterval(intervalId);
  }, [serverNow]);

  const sortedNewest = useMemo(() => {
    return [...initialReservations].sort(
      (a, b) => new Date(b.res_startTime).getTime() - new Date(a.res_startTime).getTime()
    );
  }, [initialReservations]);

  const sortedOldest = useMemo(() => {
    return [...sortedNewest].reverse();
  }, [sortedNewest]);

  const sortedReservations = sortOrder === "newest" ? sortedNewest : sortedOldest;

  const latestCurrentSubmission = useMemo(() => {
    return getCurrentReservation(sortedReservations, serverClock);
  }, [sortedReservations, serverClock]);

  const historyItems = useMemo(() => {
    let items = sortedReservations;

    if (latestCurrentSubmission) {
      items = items.filter((item) => item.res_id !== latestCurrentSubmission.res_id);
    }

    if (filterStatus !== "ALL") {
      items = items.filter((item) => getReservationDisplayStatus(item, serverClock) === filterStatus);
    }

    return items;
  }, [sortedReservations, latestCurrentSubmission, filterStatus, serverClock]);

  const handleSortOrderChange = useCallback((value: SortOrder) => {
    setSortOrder(value);
  }, []);

  const handleFilterStatusChange = useCallback((value: FilterStatus) => {
    setFilterStatus(value);
  }, []);

  return (
    <>
      <LatestSubmissionSection
        reservation={latestCurrentSubmission}
        draftSnapshot={latestDraftSnapshot}
        serverNow={serverClock}
      />

      <HistorySection
        items={historyItems}
        sortOrder={sortOrder}
        filterStatus={filterStatus}
        serverNow={serverClock}
        onSortOrderChange={handleSortOrderChange}
        onFilterStatusChange={handleFilterStatusChange}
      />
    </>
  );
}
