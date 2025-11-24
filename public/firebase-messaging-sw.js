// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyDtX7wRTzktqhYKO1L3_OnO0vgWhV7BUWc",
  authDomain: "apexfit-pro.firebaseapp.com",
  projectId: "apexfit-pro",
  storageBucket: "apexfit-pro.firebasestorage.app",
  messagingSenderId: "83621648258",
  appId: "1:83621648258:web:d56d0600de8e9bfd22a19b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'ApexFit Pro';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova mensagem',
    icon: 'https://via.placeholder.com/192x192/000000/22c55e?text=AF',
    badge: 'https://via.placeholder.com/96x96/000000/22c55e?text=AF',
    tag: payload.data?.messageId || 'apexfit-notification',
    requireInteraction: false,
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});

