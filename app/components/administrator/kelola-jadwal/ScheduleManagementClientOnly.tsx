"use client";

import dynamic from "next/dynamic";

import type { ScheduleManagementContentProps } from "./types";

const ScheduleManagementContent = dynamic(() => import("./ScheduleManagementContent"), {
  ssr: false,
  loading: () => (
    <main className="min-h-[calc(100vh-80px)] bg-white">
      <div className="mx-auto max-w-none">
        <header className="flex h-[69px] items-center border-b border-slate-200 bg-white px-4">
          <div className="h-5 w-40 rounded bg-slate-100" />
        </header>
        <div className="grid grid-cols-7 border-b border-slate-200">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-16 border-r border-slate-200 last:border-r-0" />
          ))}
        </div>
      </div>
    </main>
  ),
});

export default function ScheduleManagementClientOnly(props: ScheduleManagementContentProps) {
  return <ScheduleManagementContent {...props} />;
}
