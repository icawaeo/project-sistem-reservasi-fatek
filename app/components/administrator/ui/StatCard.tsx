import { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  sublabel?: string;
  color?: "blue" | "amber" | "emerald" | "rose" | "slate";
  iconColor?: "blue" | "amber" | "emerald" | "rose" | "slate";
};

const accentByColor: Record<string, string> = {
  amber: "bg-amber-400",
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
  slate: "bg-slate-400",
};

const iconBgByColor: Record<string, string> = {
  amber: "bg-amber-50",
  blue: "bg-blue-50",
  emerald: "bg-emerald-50",
  rose: "bg-rose-50",
  slate: "bg-slate-50",
};

const iconTextByColor: Record<string, string> = {
  amber: "text-amber-600",
  blue: "text-blue-600",
  emerald: "text-emerald-600",
  rose: "text-rose-600",
  slate: "text-slate-600",
};

export default function StatCard({ icon: Icon, label, value, sublabel, color = "slate", iconColor }: StatCardProps) {
  const resolvedIconColor = iconColor ?? color;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md md:p-5">
      {/* Accent bar */}
      <div className={`absolute inset-x-0 top-0 h-1 ${accentByColor[color] ?? accentByColor.slate}`} />

      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500 md:text-xs md:tracking-[0.12em]">
            {label}
          </p>
          <p className="mt-1.5 text-xl font-bold leading-none tracking-tight text-slate-900 md:mt-2 md:text-3xl">
            {value}
          </p>
          {sublabel && (
            <p className="mt-1.5 text-[10px] font-medium text-slate-500 md:mt-2 md:text-xs">{sublabel}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 md:h-10 md:w-10 md:rounded-xl ${iconBgByColor[resolvedIconColor] ?? iconBgByColor.slate} ${iconTextByColor[resolvedIconColor] ?? iconTextByColor.slate}`}
          >
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
