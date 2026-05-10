import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if already initialized
  firebaseApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} catch (error) {
  // If already initialized, get the existing app
  firebaseApp = initializeApp();
}

export const firebaseAdminApp = firebaseApp;
export const messaging = getMessaging(firebaseAdminApp);