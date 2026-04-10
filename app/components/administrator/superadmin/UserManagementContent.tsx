"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import UserFilter from "./UserFilter";
import UserFormModal from "./UserFormModal";
import UserTable from "./UserTable";
import type { UserItem, UserPayload, UserRoleFilter } from "./user-types";

type UserManagementContentProps = {
  initialUsers: UserItem[];
};

const ITEMS_PER_PAGE = 10;

const buildErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
};

export default function UserManagementContent({ initialUsers }: UserManagementContentProps) {
  const { pushToast } = useToast();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [resendCooldownByUserId, setResendCooldownByUserId] = useState<Record<string, number>>(() => {
    return initialUsers.reduce<Record<string, number>>((acc, user) => {
      if (user.resendCooldownSeconds > 0) {
        acc[user.id] = user.resendCooldownSeconds;
      }

      return acc;
    }, {});
  });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "umum" | "unsrat">("ALL");
  const [selectedRole, setSelectedRole] = useState<UserRoleFilter>("ALL");
  const [selectedVerification, setSelectedVerification] = useState<"ALL" | "VERIFIED" | "UNVERIFIED">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const filteredUsers = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesCategory = selectedCategory === "ALL" || user.userCategory === selectedCategory;
      const matchesRole = selectedRole === "ALL" || user.role === selectedRole;
      const matchesVerification =
        selectedVerification === "ALL" ||
        (selectedVerification === "VERIFIED" ? user.isVerified : !user.isVerified);

      if (!matchesCategory || !matchesRole || !matchesVerification) {
        return false;
      }

      if (!loweredSearch) {
        return true;
      }

      return user.name.toLowerCase().includes(loweredSearch) || user.email.toLowerCase().includes(loweredSearch);
    });
  }, [users, search, selectedCategory, selectedRole, selectedVerification]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const availableIds = new Set(filteredUsers.map((user) => user.id));
    setSelectedIds((prev) => prev.filter((id) => availableIds.has(id)));
  }, [filteredUsers]);

  useEffect(() => {
    const hasActiveCooldown = Object.values(resendCooldownByUserId).some((value) => value > 0);

    if (!hasActiveCooldown) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldownByUserId((prev) => {
        const next: Record<string, number> = {};

        for (const [userId, seconds] of Object.entries(prev)) {
          if (seconds > 1) {
            next[userId] = seconds - 1;
          }
        }

        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldownByUserId]);

  const handleCreateUser = async (payload: UserPayload) => {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response, "Gagal menambahkan user."));
    }

    const created = await response.json();
    const createdUser: UserItem = created.user;

    setUsers((prev) => [createdUser, ...prev]);
    setCurrentPage(1);

    if (created.inviteEmailSent) {
      pushToast({
        type: "success",
        message: "User berhasil ditambahkan. Link set password telah dikirim ke email user.",
      });
      return;
    }

    if (typeof created.setupUrl === "string" && created.setupUrl.trim()) {
      pushToast({
        type: "success",
        message: `User berhasil ditambahkan. SMTP belum aktif, gunakan link manual ini: ${created.setupUrl}`,
        durationMs: 8000,
      });
      return;
    }

    pushToast({ type: "success", message: "User berhasil ditambahkan." });
  };

  const handleUpdateUser = async (payload: UserPayload) => {
    if (!editingUser) {
      return;
    }

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response, "Gagal memperbarui user."));
    }

    const updatedUser: UserItem = await response.json();

    setUsers((prev) => prev.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
    setEditingUser(null);
    pushToast({ type: "success", message: "Data user berhasil diperbarui." });
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) {
      return;
    }

    setIsDeletingSingle(true);

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response, "Gagal menghapus user."));
      }

      setUsers((prev) => prev.filter((item) => item.id !== deletingUser.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingUser.id));
      setDeletingUser(null);
      pushToast({ type: "success", message: "User berhasil dihapus." });
    } catch (error) {
      throw error;
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleSendVerificationLink = async (user: UserItem) => {
    if ((resendCooldownByUserId[user.id] ?? 0) > 0) {
      return;
    }

    const response = await fetch(`/api/admin/users/${user.id}/send-verification-link`, {
      method: "POST",
    });

    const payload = await response.json();

    if (typeof payload?.retryAfterSeconds === "number" && payload.retryAfterSeconds > 0) {
      setResendCooldownByUserId((prev) => ({
        ...prev,
        [user.id]: Math.ceil(payload.retryAfterSeconds),
      }));
    }

    if (!response.ok) {
      throw new Error(
        typeof payload?.error === "string" && payload.error.trim()
          ? payload.error
          : "Gagal mengirim link verifikasi."
      );
    }

    if (payload.inviteEmailSent) {
      pushToast({ type: "success", message: `Link verifikasi berhasil dikirim ke ${user.email}.` });
      return;
    }

    if (typeof payload.setupUrl === "string" && payload.setupUrl.trim()) {
      pushToast({
        type: "success",
        message: `SMTP belum aktif. Gunakan link verifikasi manual: ${payload.setupUrl}`,
        durationMs: 8000,
      });
      return;
    }

    pushToast({ type: "success", message: "Link verifikasi berhasil dibuat." });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    setIsDeletingBulk(true);

    try {
      const response = await fetch("/api/admin/users/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response, "Gagal menghapus user terpilih."));
      }

      const body = await response.json();
      const deletedIds: string[] = Array.isArray(body?.deletedIds) ? body.deletedIds : [];

      setUsers((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      pushToast({ type: "success", message: `${deletedIds.length} user berhasil dihapus.` });
    } catch (error) {
      throw error;
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const toggleSelectAllCurrentPage = () => {
    const pageIds = paginatedUsers.map((user) => user.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
  };

  const toggleSelectUser = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  };

  return (
    <main className="space-y-5 p-4 lg:p-7">
      <section className="rounded-xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar User</h2>
            <p className="text-sm text-slate-500">Kelola akun user, role, dan hak akses pengguna.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Plus size={16} />
            Tambah User
          </button>
        </div>

        <UserFilter
          search={search}
          selectedCategory={selectedCategory}
          selectedRole={selectedRole}
          selectedVerification={selectedVerification}
          totalUsers={filteredUsers.length}
          onSearchChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          onCategoryChange={(value) => {
            setSelectedCategory(value);
            setCurrentPage(1);
          }}
          onRoleChange={(value) => {
            setSelectedRole(value);
            setCurrentPage(1);
          }}
          onVerificationChange={(value) => {
            setSelectedVerification(value);
            setCurrentPage(1);
          }}
        />

        {selectedIds.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
            <p className="text-amber-800">{selectedIds.length} user dipilih.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-md border border-amber-300 px-3 py-1.5 font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              >
                Batal Pilih
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-rose-700"
              >
                <Trash2 size={14} />
                Hapus Terpilih
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <UserTable
            users={paginatedUsers}
            selectedIds={selectedIds}
            onToggleSelectAll={toggleSelectAllCurrentPage}
            onToggleSelectUser={toggleSelectUser}
            onEdit={setEditingUser}
            onDelete={setDeletingUser}
            resendCooldownByUserId={resendCooldownByUserId}
            onSendVerificationLink={(user) => {
              handleSendVerificationLink(user).catch((error) => {
                pushToast({
                  type: "error",
                  message: error instanceof Error ? error.message : "Gagal mengirim link verifikasi.",
                });
              });
            }}
          />
        </div>

        {filteredUsers.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <p>
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} dari {filteredUsers.length} user
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                    page === currentPage
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <UserFormModal
        isOpen={isCreateModalOpen}
        mode="create"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      <UserFormModal
        isOpen={Boolean(editingUser)}
        mode="edit"
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUpdateUser}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(deletingUser)}
        title="Hapus User"
        description={deletingUser ? `User ${deletingUser.name} akan dihapus.` : ""}
        onCancel={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        isLoading={isDeletingSingle}
      />

      <DeleteConfirmationModal
        isOpen={isBulkDeleteOpen}
        title="Hapus User Terpilih"
        description={`Total ${selectedIds.length} user akan dihapus.`}
        onCancel={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        isLoading={isDeletingBulk}
      />
    </main>
  );
}
