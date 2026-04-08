"use client";

import { Filter, Search } from "lucide-react";
import type { UserRoleFilter } from "./user-types";
import { USER_ROLE_OPTIONS } from "./user-types";

type UserFilterProps = {
  search: string;
  selectedCategory: "ALL" | "umum" | "unsrat";
  selectedRole: UserRoleFilter;
  selectedVerification: "ALL" | "VERIFIED" | "UNVERIFIED";
  totalUsers: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: "ALL" | "umum" | "unsrat") => void;
  onRoleChange: (value: UserRoleFilter) => void;
  onVerificationChange: (value: "ALL" | "VERIFIED" | "UNVERIFIED") => void;
};

export default function UserFilter({
  search,
  selectedCategory,
  selectedRole,
  selectedVerification,
  totalUsers,
  onSearchChange,
  onCategoryChange,
  onRoleChange,
  onVerificationChange,
}: UserFilterProps) {
  return (
    <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
      <label className="relative w-full md:max-w-sm">
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

      <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
        <Filter size={15} className="text-slate-500" />
        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value as "ALL" | "umum" | "unsrat")}
          className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
        >
          <option value="ALL">Semua Jenis User</option>
          <option value="umum">Umum</option>
          <option value="unsrat">Unsrat</option>
        </select>
      </label>

      <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
        <Filter size={15} className="text-slate-500" />
        <select
          value={selectedRole}
          onChange={(event) => onRoleChange(event.target.value as UserRoleFilter)}
          className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
        >
          <option value="ALL">Semua Role</option>
          {USER_ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </label>

      <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
        <Filter size={15} className="text-slate-500" />
        <select
          value={selectedVerification}
          onChange={(event) =>
            onVerificationChange(event.target.value as "ALL" | "VERIFIED" | "UNVERIFIED")
          }
          className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
        >
          <option value="ALL">Semua Verifikasi</option>
          <option value="VERIFIED">Sudah Terverifikasi</option>
          <option value="UNVERIFIED">Belum Terverifikasi</option>
        </select>
      </label>

      <span className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
        {totalUsers} User
      </span>
    </div>
  );
}
