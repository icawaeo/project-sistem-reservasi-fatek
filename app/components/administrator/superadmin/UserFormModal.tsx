"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { UserItem, UserPayload } from "./user-types";
import { USER_CATEGORY_OPTIONS, USER_ROLE_OPTIONS } from "./user-types";

type UserFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  user?: UserItem | null;
  onClose: () => void;
  onSubmit: (payload: UserPayload) => Promise<void>;
};

type FormState = {
  name: string;
  email: string;
  userCategory: "umum" | "unsrat";
  role: "USER" | "ADMIN" | "ADMIN_DEKAN" | "ADMIN_WD2" | "SUPERADMIN";
};

const initialState: FormState = {
  name: "",
  email: "",
  userCategory: "umum",
  role: "USER",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserFormModal({ isOpen, mode, user, onClose, onSubmit }: UserFormModalProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && user) {
      setForm({
        name: user.name,
        email: user.email,
        userCategory: user.userCategory,
        role: user.role,
      });
      setError(null);
      return;
    }

    setForm(initialState);
    setError(null);
  }, [isOpen, mode, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name) {
      setError("Nama user belum diisi.");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setError("Format email tidak valid.");
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        name,
        email,
        userCategory: form.userCategory,
        role: form.role,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data user.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{mode === "create" ? "Tambah User" : "Edit User"}</h3>
            <p className="text-sm text-slate-500">Atur data user dan role akses sistem.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Nama User</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Nama lengkap user"
              required
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
              placeholder="nama@unsrat.ac.id"
              required
              disabled={mode === "edit"}
            />
            {mode === "edit" ? <p className="text-xs text-slate-500">Email tidak dapat diubah saat edit.</p> : null}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Jenis User</span>
              <select
                value={form.userCategory}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, userCategory: event.target.value as "umum" | "unsrat" }))
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                {USER_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Role</span>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    role: event.target.value as "USER" | "ADMIN" | "ADMIN_DEKAN" | "ADMIN_WD2" | "SUPERADMIN",
                  }))
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {mode === "create" ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
              Sistem akan otomatis mengirim link set kata sandi ke email user.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {isLoading ? "Menyimpan..." : mode === "create" ? "Simpan User" : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
