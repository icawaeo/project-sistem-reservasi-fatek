export function isLabBuilding(buildingName: string): boolean {
  if (!buildingName) return false;
  return buildingName.toLowerCase().includes("lab");
}

const buildingDefaultImageMap: Record<string, string> = {
  "Gedung Dekanat Fakultas Teknik": "/images/dekanat.jpeg",
  "Gedung Jurusan Teknik Sipil": "/images/sipil.jpeg",
  "Gedung Jurusan Teknik Arsitektur": "/images/jte.jpeg",
  "Gedung Jurusan Teknik Elektro": "/images/jte.jpeg",
  "Gedung Jurusan Teknik Mesin": "/images/dekanat.jpeg",
  "Gedung Laboratorium Fakultas Teknik": "/images/lab.jpeg",
};

export function getBuildingDefaultImage(buildingName: string): string | null {
  if (!buildingName) return null;
  return buildingDefaultImageMap[buildingName] ?? null;
}

export function isLegacyBuildingDefaultImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false;
  return imageUrl.startsWith("/images/building/");
}

export function resolveRoomDisplayImage(
  imageUrl: string | null | undefined,
  buildingName: string,
): string | null {
  if (!imageUrl || isLegacyBuildingDefaultImage(imageUrl)) {
    return getBuildingDefaultImage(buildingName);
  }

  return imageUrl;
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
