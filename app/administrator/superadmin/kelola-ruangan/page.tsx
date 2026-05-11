import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/administrator/ui/Sidebar";
import Navbar from "@/app/components/administrator/ui/Navbar";
import RoomManagementContent from "@/app/components/administrator/kelola-ruangan/RoomManagementContent";
import type { RoomItem } from "@/app/components/administrator/kelola-ruangan/room-types";

export const dynamic = "force-dynamic";

const normalizeFloor = (value: string) => {
	const trimmed = value.trim();
	const matchedNumber = trimmed.match(/\d+/);

	if (matchedNumber) {
		return matchedNumber[0];
	}

	return trimmed.replace(/^(lantai|lt\.?)/i, "").trim();
};

const formatFloorLabel = (value: string) => {
	const floor = normalizeFloor(value);
	return floor ? `Lantai ${floor}` : "";
};

const parseRoomDetails = (value: string): { floor: string; facilities: string[] } => {
	const parts = value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);

	if (parts.length === 0) {
		return { floor: "", facilities: [] };
	}

	const firstPart = parts[0];
	const hasFloorPrefix = /^(lantai|lt\.?)/i.test(firstPart) || /^\d+$/.test(firstPart);

	if (hasFloorPrefix) {
		return {
			floor: normalizeFloor(firstPart),
			facilities: parts.slice(1),
		};
	}

	return {
		floor: "",
		facilities: parts,
	};
};

const mapRoom = (room: {
	room_id: string;
	room_name: string;
	room_building: string;
	room_capacity: number;
	room_locDetail: string;
	room_imageUrl: string | null;
	room_isActive: boolean;
	labProgram: RoomItem["labProgram"];
	labDepartment: RoomItem["labDepartment"];
}): RoomItem => {
	const details = parseRoomDetails(room.room_locDetail);

	return {
		id: room.room_id,
		name: room.room_name,
		building: room.room_building,
		floor: details.floor,
		capacity: room.room_capacity,
		facilities: details.facilities,
		imageUrl: room.room_imageUrl,
		status: room.room_isActive ? "aktif" : "maintenance",
		labProgram: room.labProgram ?? null,
		labDepartment: room.labDepartment ?? null,
	};
};

export default async function SuperadminKelolaRuanganPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/auth");
	}

	if (!isSuperadminUser(session.user)) {
		redirect("/administrator/admin");
	}

	const rooms = await prisma.room.findMany({
		orderBy: [{ room_id: "desc" }],
	});
	const buildings = await prisma.building.findMany({
		orderBy: [{ building_name: "asc" }],
	});

	const initialRooms = rooms.map(mapRoom);
	const initialBuildings = buildings.map((building: { building_name: any; }) => building.building_name);

	return (
		<div className="min-h-screen bg-slate-100">
			<div className="flex min-h-screen">
				<Sidebar role="superadmin" />

				<div className="flex min-w-0 flex-1 flex-col">
					<Navbar
						pageTitle="Kelola Ruangan"
						pageSubtitle="Manajemen data ruangan berdasarkan gedung"
					/>

					<RoomManagementContent initialRooms={initialRooms} initialBuildings={initialBuildings} />
				</div>
			</div>
		</div>
	);
}
