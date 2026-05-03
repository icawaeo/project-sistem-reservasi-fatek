export type MonitoringReservation = {
  id: string;
  createdAt: string;
  startTime: string;
  endTime: string;
  activityName: string;
  purpose: string;
  status: string;
  documentUrl: string | null;
  decisionDocumentUrl?: string | null;
  user: {
    name: string;
    userType: "STUDENT" | "STAFF" | "PUBLIC";
    identifier: string | null;
    email: string;
  };
  room: {
    name: string;
    building: string;
    location: string;
  };
};