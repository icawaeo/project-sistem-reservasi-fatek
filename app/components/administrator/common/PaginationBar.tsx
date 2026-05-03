"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationItem } from "./pagination";

type PaginationBarProps = {
  currentPage: number;
  totalPages: number;
  pageItems: PaginationItem[];
  onPageChange: (page: number) => void;
  summary: ReactNode;
};

export default function PaginationBar({
  currentPage,
  totalPages,
  pageItems,
  onPageChange,
  summary,
}: PaginationBarProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {summary}

      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        {pageItems.map((item, index) => {
          if (typeof item !== "number") {
            return (
              <span key={`${item}-${index}`} className="px-1 text-slate-400">
                ...
              </span>
            );
          }

          const isActive = item === currentPage;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 font-semibold transition-colors ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
              aria-label={`Halaman ${item}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
