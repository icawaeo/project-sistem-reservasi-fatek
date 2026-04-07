export type BuildingItem = {
  id: string;
  name: string;
  operationalDays: string[];
  openTime: string;
  closeTime: string;
};

export type BuildingPayload = {
  name: string;
  operationalDays: string[];
  openTime: string;
  closeTime: string;
};
