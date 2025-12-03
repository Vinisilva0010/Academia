import { useState, useEffect, useCallback } from 'react'
import { messaging } from '../firebase'
import { getToken, onMessage } from 'firebase/messaging'
import { saveFCMToken, removeFCMToken, isNotificationSupported, getNotificationPermission } from '../utils/notifications'
import { useAuth } from '../contexts/AuthContext'

// Chave VAPID Fixa (Para evitar erro de .env)
const VAPID_KEY = "BLiizzjXylh39OBojoYlnz6_ELZQgeDokF3SdqedGzd8BL2XJdGjJVpJjLiEuEiQEGnPCj7TjqhDriTQLOMSf-0";

export const useNotification = () => {
  const { currentUser } = useAuth()
  const [permission, setPermission] = useState('default')
  const [fcmToken, setFcmToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [foregroundMessage, setForegroundMessage] = useState(null)

  // 1. Função para registrar e pegar o Service Worker ATIVO
  const getServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service Worker não suportado');

    // Tenta pegar um registro existente
    let registration = await navigator.serviceWorker.getRegistration();

    // Se não existir ou estiver quebrado, registra de novo explicitamente
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    // Espera ele ficar ativo (o pulo do gato para evitar o erro "no active SW")
    await navigator.serviceWorker.ready;
    
    return registration;
  };

  // 2. Verificar permissão inicial
  useEffect(() => {
    const checkPermission = async () => {
      if (!isNotificationSupported()) {
        setPermission('denied')
        return
      }
      const currentPermission = await getNotificationPermission()
      setPermission(currentPermission)
    }
    checkPermission()
  }, [])

  // 3. Solicitar permissão (Manual)
  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported()) {
      return { success: false, error: 'Não suportado' }
    }

    setLoading(true)
    setError(null)

    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        throw new Error('Permissão negada')
      }

      // GARANTIR QUE O SW ESTÁ PRONTO ANTES DE PEDIR TOKEN
      console.log('🔄 Preparando Service Worker...');
      const registration = await getServiceWorker();

      console.log('🔑 Pedindo Token FCM...');
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration // <--- ISSO CONSERTA O ERRO!
      });

      if (token) {
        console.log('✅ Token recebido:', token);
        setFcmToken(token)
        if (currentUser) {
          await saveFCMToken(currentUser.uid, token)
        }
        return { success: true, token }
      }
    } catch (err) {
      console.error('❌ Erro notificação:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  // 4. Listener para mensagens com App Aberto
  useEffect(() => {
    if (!messaging || permission !== 'granted') return

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('🔔 Mensagem em Foreground:', payload)
      setForegroundMessage({
        title: payload.notification?.title || 'Immersion Fit',
        body: payload.notification?.body || 'Nova mensagem',
        data: payload.data || {}
      })
      setTimeout(() => setForegroundMessage(null), 6000)
    })

    return () => unsubscribe()
  }, [messaging, permission])

  return {
    permission,
    fcmToken,
    loading,
    error,
    foregroundMessage,
    requestPermission,
    clearForegroundMessage: () => setForegroundMessage(null)
  }
}