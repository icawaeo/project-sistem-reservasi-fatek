

export type CampusMapPointData = {
  name: string;
  shortUrl: string;
  embedUrl: string;
};

export const mapPoints = [
  {
    name: "Gedung Jurusan Teknik Arsitektur",
    shortUrl: "https://maps.app.goo.gl/8ASpjWXVgejtJDpp8",
    embedUrl: "https://www.google.com/maps?q=1.4594425,124.8258652&z=20&output=embed",
  },
  {
    name: "Gedung Jurusan Teknik Sipil",
    shortUrl: "https://maps.app.goo.gl/Wy4THU5oW6AgfFYp6",
    embedUrl: "https://www.google.com/maps?q=1.4579273,124.8263909&z=20&output=embed",
  },
  {
    name: "Gedung Jurusan Teknik Elektro",
    shortUrl: "https://maps.app.goo.gl/RvMEgxESAGU3VdaBA",
    embedUrl: "https://www.google.com/maps?q=1.4597494,124.8260556&z=20&output=embed",
  },
  {
    name: "Gedung Dekanat Fakultas Teknik",
    shortUrl: "https://maps.app.goo.gl/bhCMCT9FgmDjqsrx9",
    embedUrl: "https://www.google.com/maps?q=1.4590842,124.8255351&z=20&output=embed",
  },
  {
    name: "Gedung Jurusan Teknik Mesin",
    shortUrl: "https://maps.app.goo.gl/wVNVkJSfc59D7PSVA",
    embedUrl: "https://www.google.com/maps?q=1.4585082,124.8256701&z=20&output=embed",
  },
  {
    name: "Gedung Laboratorium Fakultas Teknik",
    shortUrl: "https://maps.app.goo.gl/ucabMNHxz87jdxDP6",
    embedUrl: "https://www.google.com/maps?q=1.4583367,124.8255388&z=20&output=embed",
  },
] satisfies CampusMapPointData[];

export const allMapView = {
  name: "Lihat Semua",
  shortUrl:
    "https://www.google.com/maps/dir/?api=1&origin=1.4594425,124.8258652&destination=1.4583367,124.8255388&travelmode=walking&waypoints=1.4579273,124.8263909|1.4597494,124.8260556|1.4590842,124.8255351|1.4585082,124.8256701",
  embedUrl: "https://www.google.com/maps?q=Fakultas+Teknik+Universitas+Sam+Ratulangi&z=18&output=embed",
} satisfies CampusMapPointData;
