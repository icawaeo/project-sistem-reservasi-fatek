export type RoomStatus = "aktif" | "maintenance";

export type RoomItem = {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  imageUrl: string | null;
  status: RoomStatus;
};

export type RoomPayload = {
  name: string;
  building: string;
  floor: string;
  capacity: number;
  facilities: string[];
  imageUrl: string | null;
  status: RoomStatus;
};
