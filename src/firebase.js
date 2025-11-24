// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDtX7wRTzktqhYKO1L3_OnO0vgWhV7BUWc",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "apexfit-pro.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "apexfit-pro",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "apexfit-pro.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "83621648258",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:83621648258:web:d56d0600de8e9bfd22a19b"
};

// Validar configuração
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
    console.error('❌ Erro: Variáveis de ambiente do Firebase não configuradas. Crie um arquivo .env na raiz do projeto.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging (FCM)
// Only initialize in browser environment
let messaging = null;
if (typeof window !== 'undefined' && 'Notification' in window) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging initialization error:', error);
  }
}
export { messaging };

export default app;



