'use client';

import { useEffect, useState, useCallback, createContext, useContext } from 'react';

// ─── Types ───────────────────────────────────────────────────
interface PWAContextType {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isUpdateAvailable: boolean;
  installApp: () => Promise<void>;
  updateApp: () => void;
  dismissInstall: () => void;
  showInstallPrompt: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  isOnline: true,
  canInstall: false,
  isUpdateAvailable: false,
  installApp: async () => {},
  updateApp: () => {},
  dismissInstall: () => {},
  showInstallPrompt: false,
});

export const usePWA = () => useContext(PWAContext);

// ─── Provider ────────────────────────────────────────────────
export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // ── Register Service Worker ──
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Check installed state
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Online/Offline status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register SW
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        setRegistration(reg);
        console.log('[PWA] Service worker registered:', reg.scope);

        // Check for updates periodically
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                setIsUpdateAvailable(true);
                console.log('[PWA] New version available');
              }
            });
          }
        });

        // Check for updates every 60 minutes
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    };

    registerSW();

    // Listen for SW messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        setIsUpdateAvailable(true);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // ── Install Prompt ──
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);

      // Show install prompt after a short delay (don't interrupt user immediately)
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedAt = dismissed ? parseInt(dismissed, 10) : 0;
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

      // Show again after 7 days if dismissed
      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowInstallPrompt(true), 5000);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if app was installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] App installed successfully');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('[PWA] Install error:', error);
    } finally {
      setDeferredPrompt(null);
      setCanInstall(false);
      setShowInstallPrompt(false);
    }
  }, [deferredPrompt]);

  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload all windows
    window.location.reload();
  }, [registration]);

  const dismissInstall = useCallback(() => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isOnline,
        canInstall,
        isUpdateAvailable,
        installApp,
        updateApp,
        dismissInstall,
        showInstallPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
