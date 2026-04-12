export type AdminRole = "ADMIN" | "ADMIN_DEKAN" | "ADMIN_WD2";

export type AdminReservationRecord = {
	id: string;
	createdAt: string;
	processedAt: string | null;
	waitingDekanAt: string | null;
	waitingWd2At: string | null;
	decisionAt: string | null;
	startTime: string;
	endTime: string;
	activityName: string;
	purpose: string;
	rawPurpose: string;
	status: string;
	documentUrl: string | null;
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
