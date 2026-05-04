export type SortOrder = "newest" | "oldest";

export type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

export type ReservationRecord = {
  res_id: string;
  res_startTime: string;
  res_endTime: string;
  res_status: ReservationStatus;
  res_purpose: string;
  res_documentUrl: string | null;
  room: {
    room_name: string;
    room_building: string;
  };
};

export type ReservationDraftSnapshot = {
  purpose?: string;
  reason?: string;
  documentName?: string;
  documentDataUrl?: string | null;
};
