import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Salvar token FCM do usuário no Firestore
 * @param {string} userId - UID do usuário
 * @param {string} fcmToken - Token FCM do dispositivo
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const saveFCMToken = async (userId, fcmToken) => {
  try {
    if (!userId || !fcmToken) {
      return {
        success: false,
        error: 'userId e fcmToken são obrigatórios'
      }
    }

    const userRef = doc(db, 'users', userId)
    
    await setDoc(userRef, {
      fcmToken,
      fcmTokenUpdatedAt: new Date()
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar token FCM:', error)
    return {
      success: false,
      error: error.message || 'Erro ao salvar token de notificação'
    }
  }
}

/**
 * Remover token FCM do usuário
 * @param {string} userId - UID do usuário
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeFCMToken = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId)
    
    await setDoc(userRef, {
      fcmToken: null,
      fcmTokenUpdatedAt: null
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Erro ao remover token FCM:', error)
    return {
      success: false,
      error: error.message || 'Erro ao remover token de notificação'
    }
  }
}

/**
 * Verificar se notificações são suportadas no navegador
 * @returns {boolean}
 */
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 
         'Notification' in window && 
         'serviceWorker' in navigator &&
         'PushManager' in window
}

/**
 * Verificar se permissão de notificação foi concedida
 * @returns {Promise<'granted' | 'denied' | 'default'>}
 */
export const getNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return 'denied'
  }
  
  return Notification.permission
}





