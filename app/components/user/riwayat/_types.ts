export type SortOrder = "newest" | "oldest";

export type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | string;
export type ReservationDisplayStatus = "PENDING" | "APPROVED" | "ONGOING" | "REJECTED" | "COMPLETED";

export type ReservationRecord = {
  res_id: string;
  res_date: string;
  res_startTime: string;
  res_endTime: string;
  res_status: ReservationStatus;
  res_purpose: string;
  res_documentUrl: string | null;
  res_decisionDocumentUrl: string | null;
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
