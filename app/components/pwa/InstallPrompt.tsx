'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/app/components/providers/PWAProvider';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const { canInstall, showInstallPrompt, installApp, dismissInstall } = usePWA();

  if (!canInstall || !showInstallPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'calc(100% - 32px)',
          maxWidth: '480px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 20px 60px rgba(2, 6, 23, 0.18), 0 0 0 1px rgba(30, 64, 175, 0.06)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
            }}
          >
            <Download size={24} color="#fff" />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: '15px',
                color: '#0f172a',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              Install Aplikasi
            </p>
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                margin: '4px 0 0',
                lineHeight: 1.4,
              }}
            >
              Akses lebih cepat langsung dari layar utama
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={installApp}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(30, 64, 175, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(30, 64, 175, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(30, 64, 175, 0.3)';
              }}
            >
              Install
            </button>
            <button
              onClick={dismissInstall}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
              aria-label="Tutup prompt install"
            >
              <X size={16} color="#64748b" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
