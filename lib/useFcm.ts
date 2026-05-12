'use client';

import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebaseClient';
import { useSession } from 'next-auth/react';

export function useFcm() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status !== 'authenticated' || !session) return;

    // Request permission and get token
    requestForToken()
      .then((token) => {
        if (!token) return;

        // Send token to backend
        fetch('/api/user/fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch((err) => {
          console.error('Error saving FCM token:', err);
        });
      })
      .catch((err) => {
        console.error('Error getting FCM token:', err);
      });

    // Listen for foreground messages
    const unsubscribe = onMessageListener((payload) => {
      console.log('FCM foreground message received:', payload);
      // Show browser notification for foreground messages
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'Notifikasi Baru', {
          body: payload.notification.body || '',
          icon: '/favicon.ico',
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [session, status]);
}