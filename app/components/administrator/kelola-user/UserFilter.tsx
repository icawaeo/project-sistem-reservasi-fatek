"use client";

import { useState } from "react";
import { Filter, Search } from "lucide-react";
import type { UserRoleFilter } from "./user-types";
import { USER_ROLE_OPTIONS } from "./user-types";

type UserFilterProps = {
  search: string;
  selectedRole: UserRoleFilter;
  selectedVerification: "ALL" | "VERIFIED" | "UNVERIFIED";
  totalUsers: number;
  onAddUser: () => void;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: UserRoleFilter) => void;
  onVerificationChange: (value: "ALL" | "VERIFIED" | "UNVERIFIED") => void;
};

export default function UserFilter({
  search,
  selectedRole,
  selectedVerification,
  totalUsers,
  onAddUser,
  onSearchChange,
  onRoleChange,
  onVerificationChange,
}: UserFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="mt-4">
      <div className="mb-3">
        <label className="relative w-full">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari nama atau email user"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
          />
        </label>
      </div>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen((v) => !v)}
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-900 transition-colors ${
                isFilterOpen ? "bg-slate-100" : "bg-white hover:bg-slate-50"
              }`}
            >
              <Filter size={16} className="text-slate-500" />
              Filter Role, Verifikasi
            </button>

            {isFilterOpen ? (
              <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 shadow-md lg:w-md">
                <div className="space-y-2">
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-700">Role</span>
                    <select
                      value={selectedRole}
                      onChange={(event) => onRoleChange(event.target.value as UserRoleFilter)}
                      className="w-2/3 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none"
                    >
                      <option value="ALL">Semua Role</option>
                      {USER_ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-700">Verifikasi</span>
                    <select
                      value={selectedVerification}
                      onChange={(event) =>
                        onVerificationChange(event.target.value as "ALL" | "VERIFIED" | "UNVERIFIED")
                      }
                      className="w-2/3 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none"
                    >
                      <option value="ALL">Semua Verifikasi</option>
                      <option value="VERIFIED">Sudah Terverifikasi</option>
                      <option value="UNVERIFIED">Belum Terverifikasi</option>
                    </select>
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden h-11 shrink-0 items-center rounded-lg border border-slate-200 px-3 text-sm text-slate-600 lg:inline-flex">
          {totalUsers} User
        </div>
      </div>

      <div className="mt-3 w-full lg:hidden">
        <div className="mb-2 flex h-11 w-full items-center rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
          {totalUsers} User
        </div>

        <button
          type="button"
          onClick={onAddUser}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Tambah User
        </button>
      </div>
    </div>
  );
}
