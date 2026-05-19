export type AdminRole = "ADMIN" | "ADMIN_DEKAN" | "ADMIN_WD2" | "KAJUR" | "KEPALA_LAB";

export type AdminReservationRecord = {
	id: string;
	createdAt: string;
	processedAt: string | null;
	waitingDekanAt: string | null;
	waitingWd2At: string | null;
	waitingKajurAt: string | null;
	waitingKepalaLabAt: string | null;
	decisionAt: string | null;
	flow: "GENERAL" | "LAB_SKRIPSI" | "LAB_LAINNYA";
	startTime: string;
	endTime: string;
	activityName: string;
	purpose: string;
	rawPurpose: string;
	status: string;
	documentUrl: string | null;
	decisionDocumentUrl?: string | null;
	user: {
		name: string;
		userType: "USER" | "STAFF";
		identifier: string | null;
		email: string;
	};
	room: {
		name: string;
		building: string;
		location: string;
	};
};
