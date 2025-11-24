import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Marcar refeição como concluída no log de hoje
 * @param {string} userId - UID do usuário
 * @param {number} mealIndex - Índice da refeição no array de diet
 * @param {string} date - Data no formato YYYY-MM-DD (opcional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markMealAsCompleted = async (userId, mealIndex, date = null) => {
  try {
    const today = date || new Date().toISOString().split('T')[0]
    const logId = `${today}_meals`
    
    const logRef = doc(db, 'users', userId, 'meal_logs', logId)
    const logSnap = await getDoc(logRef)
    
    let completedMealIds = []
    
    if (logSnap.exists()) {
      const logData = logSnap.data()
      completedMealIds = logData.completedMealIds || []
      
      // Se já está concluído, não fazer nada
      if (completedMealIds.includes(mealIndex)) {
        return { success: true }
      }
    }
    
    // Adicionar refeição à lista
    completedMealIds.push(mealIndex)
    
    // Salvar/atualizar log
    await setDoc(logRef, {
      userId,
      date: today,
      completedMealIds,
      updatedAt: serverTimestamp()
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Erro ao marcar refeição como concluída:', error)
    return {
      success: false,
      error: error.message || 'Erro ao marcar refeição'
    }
  }
}

/**
 * Desmarcar refeição (remover do log de hoje)
 * @param {string} userId - UID do usuário
 * @param {number} mealIndex - Índice da refeição
 * @param {string} date - Data no formato YYYY-MM-DD (opcional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const unmarkMealAsCompleted = async (userId, mealIndex, date = null) => {
  try {
    const today = date || new Date().toISOString().split('T')[0]
    const logId = `${today}_meals`
    
    const logRef = doc(db, 'users', userId, 'meal_logs', logId)
    const logSnap = await getDoc(logRef)
    
    if (!logSnap.exists()) {
      return { success: true } // Já não está marcado
    }
    
    const logData = logSnap.data()
    let completedMealIds = logData.completedMealIds || []
    
    // Remover refeição da lista
    completedMealIds = completedMealIds.filter(id => id !== mealIndex)
    
    // Salvar/atualizar log
    await setDoc(logRef, {
      completedMealIds,
      updatedAt: serverTimestamp()
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Erro ao desmarcar refeição:', error)
    return {
      success: false,
      error: error.message || 'Erro ao desmarcar refeição'
    }
  }
}

/**
 * Subscrever log de refeições do dia em tempo real
 * @param {string} userId - UID do usuário
 * @param {Function} callback - Callback chamado quando log muda
 * @param {string} date - Data no formato YYYY-MM-DD (opcional)
 * @returns {Function} Função para cancelar o listener
 */
export const subscribeToMealLog = (userId, callback, date = null) => {
  if (!userId) {
    return () => {}
  }

  const today = date || new Date().toISOString().split('T')[0]
  const logId = `${today}_meals`
  
  const logRef = doc(db, 'users', userId, 'meal_logs', logId)

  const unsubscribe = onSnapshot(
    logRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const logData = {
          id: snapshot.id,
          ...snapshot.data()
        }
        callback(logData)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Erro ao subscrever log de refeições:', error)
      callback(null)
    }
  )

  return unsubscribe
}

/**
 * Verificar se refeição está concluída hoje
 * @param {object} mealLog - Log de refeições do dia
 * @param {number} mealIndex - Índice da refeição
 * @returns {boolean}
 */
export const isMealCompletedToday = (mealLog, mealIndex) => {
  if (!mealLog || !mealLog.completedMealIds) return false
  return mealLog.completedMealIds.includes(mealIndex)
}



