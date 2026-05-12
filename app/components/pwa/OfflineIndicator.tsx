'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/app/components/providers/PWAProvider';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const showOffline = !isOnline;
  const showOnline = showReconnected;

  if (!showOffline && !showOnline) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={showOffline ? 'offline' : 'online'}
        initial={{ y: -80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          width: 'auto',
          maxWidth: 'calc(100% - 32px)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '16px',
            background: showOffline
              ? 'rgba(239, 68, 68, 0.92)'
              : 'rgba(34, 197, 94, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: showOffline
              ? '0 8px 32px rgba(239, 68, 68, 0.3)'
              : '0 8px 32px rgba(34, 197, 94, 0.3)',
            color: '#fff',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Status dot animation */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#fff',
              animation: showOffline ? 'blink 1.5s ease-in-out infinite' : 'none',
            }}
          />
          {showOffline ? (
            <WifiOff size={18} strokeWidth={2.5} />
          ) : (
            <Wifi size={18} strokeWidth={2.5} />
          )}
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.01em',
            }}
          >
            {showOffline
              ? 'Anda sedang offline — beberapa fitur mungkin terbatas'
              : 'Koneksi dipulihkan'}
          </span>
        </div>
      </motion.div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </AnimatePresence>
  );
}
