"use client";

import dynamic from "next/dynamic";

import type { SidebarProps } from "./Sidebar";

const Sidebar = dynamic(() => import("./Sidebar"), {
  ssr: false,
  loading: () => <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex" />,
});

export default function SidebarClientOnly(props: SidebarProps) {
  return <Sidebar {...props} />;
}
