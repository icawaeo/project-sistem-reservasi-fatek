export type BuildingStatus = "aktif" | "maintenance";

export type BuildingItem = {
  id: string;
  name: string;
  operationalDays: string[];
  openTime: string;
  closeTime: string;
  imageUrl: string | null;
  status: BuildingStatus;
};

export type BuildingPayload = {
  name: string;
  operationalDays: string[];
  openTime: string;
  closeTime: string;
  imageUrl: string | null;
  status: BuildingStatus;
};
