import { Clock } from "lucide-react";

export type OccupiedRoomCard = {
  name: string;
  building: string;
  time: string;
  activity: string;
};

type OccupiedRoomsSectionProps = {
  rooms: OccupiedRoomCard[];
};

export default function OccupiedRoomsSection({ rooms }: OccupiedRoomsSectionProps) {
  const visibleRooms = rooms.slice(0, 4);

  if (visibleRooms.length === 0) {
    return (
      <section className="w-full bg-white px-4 pb-10 pt-64 sm:px-6 lg:px-8 xl:px-10 md:pt-48">
        <div className="mx-auto w-full max-w-none">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 rounded-full bg-slate-900" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Live Updates
                </div>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  Ruangan yang Sedang Digunakan Hari Ini
                </h2>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-sm font-semibold text-slate-500 md:flex">
              <span>Lihat Semua Status</span>
              <span aria-hidden="true" className="text-lg leading-none">
                &rarr;
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-12 text-center shadow-md">
            <p className="text-slate-500">Belum ada data peminjaman yang tersedia</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white px-4 pb-10 pt-28 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-none">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1.5 rounded-full bg-slate-900" />
            <div>
              {/* <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
                Live Updates
              </div> */}
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Ruangan yang Sedang Digunakan Hari Ini
              </h2>
            </div>
          </div>

          {/* <div className="hidden items-center gap-2 text-sm font-semibold text-slate-500 md:flex">
            <span>Lihat Semua Status</span>
            <span aria-hidden="true" className="text-lg leading-none">
              &rarr;
            </span>
          </div> */}
        </div>

        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2 no-scrollbar">
          {visibleRooms.map((room) => (
            <div
              key={room.name}
              className="min-h-47 min-w-70 flex-1 basis-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-md transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-1 ring-red-200">
                  <Clock size={18} />
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-red-600 ring-1 ring-red-200">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Digunakan
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
                  {room.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{room.building}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kegiatan:</span>
                  <span className="font-semibold text-slate-800">{room.activity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu:</span>
                  <span className="font-semibold text-slate-800">{room.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

