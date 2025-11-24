import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Buscar anamnese do usuário
 * @param {string} userId - UID do usuário
 * @returns {Promise<object|null>}
 */
export const getAssessment = async (userId) => {
  try {
    const assessmentRef = doc(db, 'assessments', userId)
    const assessmentSnap = await getDoc(assessmentRef)
    
    if (assessmentSnap.exists()) {
      return {
        id: assessmentSnap.id,
        ...assessmentSnap.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao buscar anamnese:', error)
    return null
  }
}

/**
 * Criar ou atualizar anamnese
 * @param {string} userId - UID do usuário
 * @param {object} assessmentData - Dados da anamnese
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const saveAssessment = async (userId, assessmentData) => {
  try {
    const assessmentRef = doc(db, 'assessments', userId)
    
    await setDoc(assessmentRef, {
      ...assessmentData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar anamnese:', error)
    return {
      success: false,
      error: error.message || 'Erro ao salvar anamnese'
    }
  }
}

/**
 * Atualizar status do usuário
 * @param {string} userId - UID do usuário
 * @param {string} status - 'pending' | 'active'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const userRef = doc(db, 'users', userId)
    
    await setDoc(userRef, {
      status,
      updatedAt: new Date()
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error)
    return {
      success: false,
      error: error.message || 'Erro ao atualizar status'
    }
  }
}

