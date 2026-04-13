import { Clock } from "lucide-react";

export type OccupiedRoomCard = {
  name: string;
  building: string;
  time: string;
};

type OccupiedRoomsSectionProps = {
  rooms: OccupiedRoomCard[];
};

export default function OccupiedRoomsSection({ rooms }: OccupiedRoomsSectionProps) {
  return (
    <section className="mt-64 md:mt-48 px-6 md:px-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-slate-900 rounded-full" />
        <h2 className="text-sm md:text-base font-bold tracking-widest text-slate-900 uppercase">
          Ruangan yang Sedang Digunakan Hari Ini
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div
            key={room.name}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] md:text-[11px] lg:text-xs font-bold text-red-600 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Sedang Digunakan
              </span>
              <div className="h-7 w-7 rounded-lg bg-slate-100 grid place-items-center">
                <Clock size={14} className="text-slate-500" />
              </div>
            </div>

            <div className="font-bold text-slate-900 text-sm md:text-base leading-tight">{room.name}</div>
            <div className="text-xs md:text-sm text-slate-500 mt-1 leading-tight">{room.building}</div>
            <div className="mt-3 flex items-center gap-1.5 text-xs md:text-sm text-slate-500">
              <Clock size={12} />
              {room.time}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
