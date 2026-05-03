import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: "base" | "lg";
  className?: string;
};

export default function SectionHeader({
  title,
  description,
  actions,
  size = "base",
  className,
}: SectionHeaderProps) {
  const titleClassName = size === "lg" ? "text-lg" : "text-base";

  if (actions) {
    return (
      <div className={`flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between ${className ?? ""}`.trim()}>
        <div>
          <h2 className={`${titleClassName} font-bold text-slate-900`}>{title}</h2>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
        <div className="shrink-0">{actions}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className={`${titleClassName} font-bold text-slate-900`}>{title}</h2>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
