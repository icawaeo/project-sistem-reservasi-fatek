import type { ReactNode } from "react";

type DashboardStatGridProps = {
  children: ReactNode;
  className?: string;
};

export default function DashboardStatGrid({ children, className }: DashboardStatGridProps) {
  const mergedClassName = `grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4 ${className ?? ""}`.trim();

  return <section className={mergedClassName}>{children}</section>;
}
