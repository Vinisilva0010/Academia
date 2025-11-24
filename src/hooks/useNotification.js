import { useState, useEffect, useCallback } from 'react'
import { messaging } from '../firebase'
import { getToken } from 'firebase/messaging'
import { onMessage } from 'firebase/messaging'
import { saveFCMToken, removeFCMToken, isNotificationSupported, getNotificationPermission } from '../utils/notifications'
import { useAuth } from '../contexts/AuthContext'

// VAPID Key - Substituir pela sua chave do Firebase Console
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'SUBSTITUA_PELA_SUA_VAPID_KEY'

export const useNotification = () => {
  const { currentUser } = useAuth()
  const [permission, setPermission] = useState('default')
  const [fcmToken, setFcmToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [foregroundMessage, setForegroundMessage] = useState(null)

  // Verificar permissão inicial
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

  // Solicitar permissão de notificação
  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported()) {
      setError('Notificações não são suportadas neste navegador')
      return { success: false, error: 'Notificações não são suportadas' }
    }

    setLoading(true)
    setError(null)

    try {
      // Solicitar permissão
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        const errorMsg = 'Permissão de notificação negada'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      // Obter token FCM
      if (!messaging) {
        throw new Error('Firebase Messaging não está inicializado')
      }

      const token = await getToken(messaging, { vapidKey: VAPID_KEY })
      
      if (!token) {
        throw new Error('Não foi possível obter o token FCM')
      }

      setFcmToken(token)

      // Salvar token no Firestore se usuário estiver logado
      if (currentUser) {
        const saveResult = await saveFCMToken(currentUser.uid, token)
        if (!saveResult.success) {
          console.warn('Erro ao salvar token FCM:', saveResult.error)
        }
      }

      return { success: true, token }
    } catch (err) {
      console.error('Erro ao solicitar permissão de notificação:', err)
      const errorMsg = err.message || 'Erro ao ativar notificações'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  // Salvar token quando usuário fizer login
  useEffect(() => {
    const saveTokenOnLogin = async () => {
      if (currentUser && fcmToken && permission === 'granted') {
        await saveFCMToken(currentUser.uid, fcmToken)
      }
    }

    saveTokenOnLogin()
  }, [currentUser, fcmToken, permission])

  // Configurar listener para mensagens em foreground
  useEffect(() => {
    if (!messaging || permission !== 'granted') {
      return
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensagem recebida em foreground:', payload)
      
      // Mostrar toast/mensagem na interface
      setForegroundMessage({
        title: payload.notification?.title || 'ApexFit Pro',
        body: payload.notification?.body || 'Você tem uma nova mensagem',
        data: payload.data || {}
      })

      // Limpar mensagem após 5 segundos
      setTimeout(() => {
        setForegroundMessage(null)
      }, 5000)
    })

    return () => unsubscribe()
  }, [messaging, permission])

  // Desativar notificações
  const disableNotifications = useCallback(async () => {
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    setLoading(true)
    setError(null)

    try {
      // Remover token do Firestore
      const removeResult = await removeFCMToken(currentUser.uid)
      
      if (removeResult.success) {
        setFcmToken(null)
        setPermission('default')
      }

      return removeResult
    } catch (err) {
      console.error('Erro ao desativar notificações:', err)
      const errorMsg = err.message || 'Erro ao desativar notificações'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  return {
    permission,
    fcmToken,
    loading,
    error,
    foregroundMessage,
    requestPermission,
    disableNotifications,
    isSupported: isNotificationSupported(),
    clearForegroundMessage: () => setForegroundMessage(null)
  }
}

