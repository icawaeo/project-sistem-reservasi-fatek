export const USER_ROLES = {
	ADMIN: "ADMIN",
	ADMIN_DEKAN: "ADMIN_DEKAN",
	ADMIN_WD2: "ADMIN_WD2",
	KAJUR: "KAJUR",
	KAPRODI: "KAPRODI",
	KEPALA_LAB: "KEPALA_LAB",
	SUPERADMIN: "SUPERADMIN",
	USER: "USER",
} as const;

export type UserRoleValue = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_TYPES = {
	USER: "USER",
	STAFF: "STAFF",
} as const;

export type UserTypeValue = (typeof USER_TYPES)[keyof typeof USER_TYPES];
