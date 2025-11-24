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

  const notificationTitle = payload.notification?.title || payload.data?.title || 'ApexFit Pro';
  const notificationBody = payload.notification?.body || payload.data?.body || 'Você tem uma nova mensagem';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/icon-192x192.png', // Usar ícone local
    badge: '/icons/icon-192x192.png',
    tag: payload.data?.messageId || payload.data?.senderId || 'apexfit-notification',
    requireInteraction: false,
    data: {
      ...payload.data,
      click_action: payload.fcmOptions?.link || '/',
      url: payload.data?.url || '/'
    },
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || event.notification.data?.click_action || '/';

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, focar nela
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não existe, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

