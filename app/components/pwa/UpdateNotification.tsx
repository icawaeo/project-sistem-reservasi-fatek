'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/app/components/providers/PWAProvider';
import { RefreshCw } from 'lucide-react';

export default function UpdateNotification() {
  const { isUpdateAvailable, updateApp } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10001,
          width: 'auto',
          maxWidth: 'calc(100% - 32px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px 12px 20px',
            borderRadius: '16px',
            background: 'rgba(30, 64, 175, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(30, 64, 175, 0.35)',
            color: '#fff',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          <RefreshCw
            size={18}
            strokeWidth={2.5}
            style={{ animation: 'spin 2s linear infinite' }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Versi baru tersedia
          </span>
          <button
            onClick={updateApp}
            style={{
              padding: '6px 16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            Perbarui
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
}
