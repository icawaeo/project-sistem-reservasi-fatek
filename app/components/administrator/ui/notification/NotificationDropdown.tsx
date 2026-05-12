"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
};

function timeAgo(dateString: string) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(dateString));
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      await fetch(`/api/notifications?id=${id}&action=read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // silent
    }
  }

  async function handleMarkAllAsRead() {
    try {
      // mark all unread
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/notifications?id=${id}&action=read`, { method: "PATCH" })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-80 max-h-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-slate-500" />
          <span className="text-sm font-bold text-slate-900">Notifikasi</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
          >
            <CheckCheck size={12} />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-slate-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={24} className="mx-auto text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 ${
                item.isRead ? "bg-white" : "bg-blue-50/60"
              }`}
            >
              <div
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  item.isRead ? "bg-transparent" : "bg-blue-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 leading-snug">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-600 leading-snug line-clamp-2">{item.body}</p>
                <p className="mt-1 text-[10px] text-slate-400">{timeAgo(item.createdAt)}</p>
              </div>
              {!item.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(item.id)}
                  className="mt-1 shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Tandai sudah dibaca"
                >
                  <Check size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}