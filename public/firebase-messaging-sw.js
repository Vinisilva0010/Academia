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

console.log('[firebase-messaging-sw.js] Service Worker iniciado e Firebase configurado');

// Service Worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] 📥 Service Worker instalando...');
  // Forçar ativação imediata, pulando a fase de "waiting"
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] ✅ Service Worker ativando...');
  // Assumir controle de todos os clients imediatamente
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[firebase-messaging-sw.js] ✅ Service Worker assumiu controle de todos os clients');
    })
  );
});

// Listener para mensagens do cliente (ex: SKIP_WAITING)
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] 📨 Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[firebase-messaging-sw.js] 🚀 Pulando fase de waiting...');
    self.skipWaiting();
  }
});

// Handle background messages (quando o app está fechado)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 📨 Mensagem recebida em background:', payload);

  // Extrair título e corpo da notificação
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Immersion Fit';
  const notificationBody = payload.notification?.body || payload.data?.body || 'Você tem uma nova mensagem';
  
  // Preparar opções da notificação
  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: payload.data?.messageId || payload.data?.senderId || `Immersion Fit-${Date.now()}`,
    requireInteraction: false,
    silent: false,
    data: {
      ...payload.data,
      click_action: payload.fcmOptions?.link || '/',
      url: payload.data?.url || '/',
      // Preservar dados originais
      messageId: payload.data?.messageId,
      senderId: payload.data?.senderId,
      receiverId: payload.data?.receiverId
    },
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    // Configurações adicionais para melhor compatibilidade
    renotify: true,
    dir: 'ltr',
    lang: 'pt-BR'
  };

  console.log('[firebase-messaging-sw.js] 🚀 Exibindo notificação:', notificationTitle);
  
  // Exibir a notificação
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[firebase-messaging-sw.js] ✅ Notificação exibida com sucesso');
    })
    .catch((error) => {
      console.error('[firebase-messaging-sw.js] ❌ Erro ao exibir notificação:', error);
    });
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

