export function isLabBuilding(buildingName: string): boolean {
  if (!buildingName) return false;
  return buildingName.toLowerCase().includes("lab");
}

const buildingColorMap: Record<string, string> = {
  "Gedung Dekanat Fakultas Teknik": "from-sky-900 to-sky-700",
  "Gedung Jurusan Teknik Sipil": "from-blue-900 to-blue-700",
  "Gedung Jurusan Teknik Arsitektur": "from-slate-800 to-slate-600",
  "Gedung Jurusan Teknik Elektro": "from-green-800 to-green-600",
  "Gedung Jurusan Teknik Mesin": "from-indigo-900 to-indigo-700",
  "Gedung Laboratorium Fakultas Teknik": "from-lime-900 to-lime-700",
};

export function getBuildingGradient(buildingName: string): string {
  if (!buildingName) return "from-slate-700 via-slate-600 to-slate-800";
  return buildingColorMap[buildingName] ?? "from-slate-700 via-slate-600 to-slate-800";
}
