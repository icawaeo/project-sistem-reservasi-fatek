"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";

const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 jam
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "pointerdown"] as const;
const THROTTLE_MS = 30_000; // throttle activity detection per 30 detik

export default function IdleLogoutProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
  }, [handleLogout]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    // Throttle: hanya reset timer jika sudah lewat THROTTLE_MS sejak terakhir
    if (now - lastActivityRef.current < THROTTLE_MS) {
      return;
    }
    lastActivityRef.current = now;
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Hanya aktifkan idle tracking jika user sudah login
    if (!session?.user) {
      return;
    }

    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [session?.user, handleActivity, resetTimer]);

  return <>{children}</>;
}
