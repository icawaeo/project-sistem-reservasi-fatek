"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { UserItem } from "./user-types";
import { categoryLabel, roleLabel } from "./user-types";
import {
  SuperAdminTableCard,
  SuperAdminTableScroll,
  SuperAdminTable,
  SuperAdminTableBody,
} from "../ui/SuperAdminTable";

type UserTableProps = {
  users: UserItem[];
  selectedIds: string[];
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectUser: (id: string) => void;
  onClearSelection: () => void;
  onOpenBulkDelete: () => void;
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
  onSendVerificationLink: (user: UserItem) => void;
  resendCooldownByUserId: Record<string, number>;
};

const formatDate = (value: string) => {
  const date = new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const EmptyState = () => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
    <p className="text-sm font-semibold text-slate-700">Belum ada data user</p>
    <p className="mt-1 text-sm text-slate-500">Tambahkan user pertama untuk mulai mengelola akses.</p>
  </div>
);

export default function UserTable({
  users,
  selectedIds,
  allSelected,
  someSelected,
  onToggleSelectAll,
  onToggleSelectUser,
  onClearSelection,
  onOpenBulkDelete,
  onEdit,
  onDelete,
  onSendVerificationLink,
  resendCooldownByUserId,
}: UserTableProps) {
  if (users.length === 0) {
    return <EmptyState />;
  }

  const selectedSet = new Set(selectedIds);

  return (
    <>
      <div className="hidden lg:block">
        <SuperAdminTableCard className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SuperAdminTableScroll>
            <SuperAdminTable className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-12 px-4 py-3 font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(element) => {
                    if (element) {
                      element.indeterminate = someSelected;
                    }
                  }}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  aria-label="Pilih semua user sesuai filter"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Nama User</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Jenis User</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Tanggal Dibuat</th>
              <th className="px-4 py-3 font-semibold">Verifikasi</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
            {users.map((user) => {
              const isSelected = selectedSet.has(user.id);
              const cooldownSeconds = resendCooldownByUserId[user.id] ?? 0;

              return (
                <tr key={user.id} className={isSelected ? "bg-slate-50/70" : undefined}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectUser(user.id)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      aria-label={`Pilih ${user.name}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{categoryLabel(user.userCategory)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {user.isVerified ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Terverifikasi
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          Belum Terverifikasi
                        </span>
                        <button
                          type="button"
                          onClick={() => onSendVerificationLink(user)}
                          disabled={cooldownSeconds > 0}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cooldownSeconds > 0 ? `Kirim Ulang (${cooldownSeconds}s)` : "Kirim Link"}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(user)}
                        className="rounded-md p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Hapus ${user.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
            </SuperAdminTable>
          </SuperAdminTableScroll>
        </SuperAdminTableCard>
      </div>

      <div className="grid gap-3 lg:hidden">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(element) => {
              if (element) {
                element.indeterminate = someSelected;
              }
            }}
            onChange={onToggleSelectAll}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            aria-label="Pilih semua user sesuai filter"
          />
          <span className="text-sm font-medium text-slate-700">Pilih semua data</span>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
            <p className="text-amber-800">{selectedIds.length} user dipilih.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded-md border border-amber-300 px-3 py-1.5 font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              >
                Batal Pilih
              </button>
              <button
                type="button"
                onClick={onOpenBulkDelete}
                className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-rose-700"
              >
                <Trash2 size={14} />
                Hapus Terpilih
              </button>
            </div>
          </div>
        ) : null}

        {users.map((user) => {
          const isSelected = selectedSet.has(user.id);
          const cooldownSeconds = resendCooldownByUserId[user.id] ?? 0;

          return (
            <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{user.name}</p>
                  <p className="truncate text-sm text-slate-600">{user.email}</p>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelectUser(user.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  aria-label={`Pilih ${user.name}`}
                />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600">
                <p>Jenis: {categoryLabel(user.userCategory)}</p>
                <p>Role: {roleLabel(user.role)}</p>
                <p className="col-span-2">
                  Verifikasi: {user.isVerified ? "Terverifikasi" : "Belum Terverifikasi"}
                </p>
                <p className="col-span-2">Dibuat: {formatDate(user.createdAt)}</p>
              </div>

              {!user.isVerified ? (
                <button
                  type="button"
                  onClick={() => onSendVerificationLink(user)}
                  disabled={cooldownSeconds > 0}
                  className="mt-3 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cooldownSeconds > 0
                    ? `Kirim Ulang Verifikasi (${cooldownSeconds}s)`
                    : "Kirim Link Verifikasi"}
                </button>
              ) : null}

              <div className="mt-3 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(user)}
                  className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label={`Edit ${user.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(user)}
                  className="rounded-md p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Hapus ${user.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
