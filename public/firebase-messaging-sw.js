// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker.
firebase.initializeApp({
  apiKey: 'AIzaSyBovwG2ruH-px77kz0LKERdx3jClg3qjaM',
  authDomain: 'sistem-reservasi-fatek.firebaseapp.com',
  projectId: 'sistem-reservasi-fatek',
  storageBucket: 'sistem-reservasi-fatek.firebasestorage.app',
  messagingSenderId: '507222124734',
  appId: '1:507222124734:web:415066582cc6faf13356ef',
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle incoming messages while the app is in the background.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Notifikasi Baru';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});