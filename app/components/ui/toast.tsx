"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastInput = {
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  durationMs: number;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4500;

const resolveDefaultTitle = (type: ToastType) => {
  switch (type) {
    case "success":
      return "Berhasil";
    case "error":
      return "Kesalahan";
    case "info":
      return "Info";
    case "warning":
      return "Peringatan";
    default:
      return "Info";
  }
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timers = timersRef.current;
    const timer = timers.get(id);
    if (typeof timer === "number") {
      window.clearTimeout(timer);
      timers.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: ToastInput) => {
      const id = generateId();
      const durationMs = Math.max(0, toast.durationMs ?? DEFAULT_DURATION_MS);
      const title = (toast.title ?? resolveDefaultTitle(toast.type)).trim() || resolveDefaultTitle(toast.type);

      const item: ToastItem = {
        id,
        type: toast.type,
        title,
        message: toast.message,
        durationMs,
      };

      setToasts((prev) => [item, ...prev].slice(0, 5));

      if (durationMs > 0) {
        const timeoutId = window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timersRef.current.set(id, timeoutId);
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>.");
  }
  return ctx;
}

type ToastViewportProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-100 flex w-90 max-w-[calc(100vw-2rem)] flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const style = resolveToastStyle(toast.type);
  const Icon = style.icon;

  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-xl border shadow-md transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${style.container}`}
      role="status"
    >
      <div className="flex">
        <div className={`w-2.5 ${style.bar}`} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3">
          <div className={`mt-0.5 rounded-full p-2 ${style.iconBg}`} aria-hidden="true">
            <Icon size={18} className={style.iconText} />
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${style.titleText}`}>{toast.title}</p>
            <p className={`mt-0.5 wrap-break-word text-sm ${style.messageText}`}>{toast.message}</p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className={`-mr-1 -mt-1 rounded-md p-1 ${style.closeButton}`}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function resolveToastStyle(type: ToastType) {
  switch (type) {
    case "success":
      return {
        container: "border-emerald-200 bg-emerald-50",
        bar: "bg-emerald-600",
        icon: CheckCircle2,
        iconBg: "bg-emerald-600",
        iconText: "text-white",
        titleText: "text-slate-900",
        messageText: "text-slate-600",
        closeButton: "text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900",
      };
    case "error":
      return {
        container: "border-rose-200 bg-rose-50",
        bar: "bg-rose-600",
        icon: XCircle,
        iconBg: "bg-rose-600",
        iconText: "text-white",
        titleText: "text-slate-900",
        messageText: "text-slate-600",
        closeButton: "text-rose-700 hover:bg-rose-100 hover:text-rose-900",
      };
    case "warning":
      return {
        container: "border-amber-200 bg-amber-50",
        bar: "bg-amber-600",
        icon: AlertTriangle,
        iconBg: "bg-amber-600",
        iconText: "text-white",
        titleText: "text-slate-900",
        messageText: "text-slate-600",
        closeButton: "text-amber-700 hover:bg-amber-100 hover:text-amber-900",
      };
    case "info":
    default:
      return {
        container: "border-blue-200 bg-blue-50",
        bar: "bg-blue-600",
        icon: Info,
        iconBg: "bg-blue-600",
        iconText: "text-white",
        titleText: "text-slate-900",
        messageText: "text-slate-600",
        closeButton: "text-blue-700 hover:bg-blue-100 hover:text-blue-900",
      };
  }
}
