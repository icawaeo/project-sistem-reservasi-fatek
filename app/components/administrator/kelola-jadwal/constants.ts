import type { ScheduleFormState } from "./types";

export const TYPE_OPTIONS = [
  { value: "KULIAH", label: "Kuliah" },
  { value: "PRAKTIKUM", label: "Praktikum" },
  { value: "UJIAN", label: "Ujian" },
  { value: "RAPAT_RUTIN", label: "Rapat Rutin" },
  { value: "BLOKIR_MANUAL", label: "Blokir Manual" },
];

export const TYPE_STYLE: Record<string, { card: string; border: string; text: string }> = {
  KULIAH: {
    card: "bg-blue-50 hover:bg-blue-100",
    border: "bg-blue-500",
    text: "text-slate-900",
  },
  PRAKTIKUM: {
    card: "bg-blue-50 hover:bg-blue-100",
    border: "bg-blue-500",
    text: "text-slate-900",
  },
  UJIAN: {
    card: "bg-blue-50 hover:bg-blue-100",
    border: "bg-blue-500",
    text: "text-slate-900",
  },
  RAPAT_RUTIN: {
    card: "bg-blue-50 hover:bg-blue-100",
    border: "bg-blue-500",
    text: "text-slate-900",
  },
  BLOKIR_MANUAL: {
    card: "bg-blue-50 hover:bg-blue-100",
    border: "bg-blue-500",
    text: "text-slate-900",
  },
};

export const INITIAL_FORM: ScheduleFormState = {
  title: "",
  type: "KULIAH",
  date: "",
  startTime: "",
  endTime: "",
  roomId: "",
  programScope: "",
};

export const FIELD_CLASS_NAME =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400";

export const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
