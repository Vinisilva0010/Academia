import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Criar ou atualizar documento de usuário no Firestore
 * @param {string} uid - UID do usuário
 * @param {object} userData - Dados do usuário (role é obrigatório)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const createOrUpdateUser = async (uid, userData) => {
  try {
    // Validar que a role está presente e é válida
    if (!userData.role || !['admin', 'client'].includes(userData.role)) {
      return {
        success: false,
        error: 'Role deve ser "admin" ou "client"'
      }
    }

    const userRef = doc(db, 'users', uid)
    
    // Verificar se o documento já existe
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      // Atualizar apenas os campos fornecidos
      await setDoc(userRef, {
        ...userSnap.data(),
        ...userData,
        updatedAt: new Date()
      }, { merge: true })
    } else {
      // Criar novo documento
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: false }) // Não usar merge na criação inicial
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário:', error)
    return {
      success: false,
      error: error.message || 'Erro ao salvar usuário no Firestore'
    }
  }
}

/**
 * Buscar dados do usuário no Firestore
 * @param {string} uid - UID do usuário
 * @returns {Promise<object|null>}
 */
export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return {
        uid,
        ...userSnap.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}

