export const LAB_PROGRAM_VALUES = [
	"IT",
	"ELEKTRO",
	"ARSITEKTUR",
	"PWK",
	"SIPIL",
	"LINGKUNGAN",
	"MESIN",
] as const;

export type LabProgramValue = (typeof LAB_PROGRAM_VALUES)[number];

export type LabDepartmentValue = "ELEKTRO" | "ARSITEKTUR" | "SIPIL" | "MESIN";