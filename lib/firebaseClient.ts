import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Get Firebase Messaging instance (browser-only).
 * Returns null on server-side or when messaging is not supported.
 */
function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}

/**
 * Request permission and get FCM token.
 * Call this after user login or when notification permission is needed.
 */
export async function requestForToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    if (!('Notification' in window)) {
      return null;
    }

    if (Notification.permission === 'denied') {
      return null;
    }

    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

    if (permission !== 'granted') {
      return null;
    }

    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messagingInstance, {
      vapidKey: vapidKey || undefined,
    });
    return token;
  } catch (error) {
    console.error('Unable to get FCM token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages (when app is open).
 * Returns a cleanup function to unsubscribe.
 */
export function onMessageListener(callback: (payload: any) => void): (() => void) | null {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return null;

  return onMessage(messagingInstance, callback);
}
