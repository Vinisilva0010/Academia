import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Adicionar registro de peso para um usuário
 * @param {string} userId - UID do usuário
 * @param {number} weight - Peso em kg
 * @returns {Promise<{success: boolean, error?: string, recordId?: string}>}
 */
export const addWeightRecord = async (userId, weight) => {
  try {
    if (!weight || weight <= 0) {
      return {
        success: false,
        error: 'Peso inválido'
      }
    }

    const weightHistoryRef = collection(db, 'users', userId, 'weight_history')
    
    const docRef = await addDoc(weightHistoryRef, {
      weight: parseFloat(weight),
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    })

    return {
      success: true,
      recordId: docRef.id
    }
  } catch (error) {
    console.error('Erro ao adicionar registro de peso:', error)
    return {
      success: false,
      error: error.message || 'Erro ao registrar peso'
    }
  }
}

/**
 * Buscar histórico de peso de um usuário
 * @param {string} userId - UID do usuário
 * @param {Function} callback - Callback chamado quando dados mudam
 * @returns {Function} Função para cancelar o listener
 */
export const subscribeToWeightHistory = (userId, callback) => {
  if (!userId) {
    return () => {}
  }

  const weightHistoryRef = collection(db, 'users', userId, 'weight_history')
  const q = query(weightHistoryRef, orderBy('date', 'desc'))

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const records = []
      snapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        })
      })
      // Ordenar por data (mais antigo primeiro para o gráfico)
      records.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
        return dateA - dateB
      })
      callback(records)
    },
    (error) => {
      console.error('Erro ao buscar histórico de peso:', error)
      callback([])
    }
  )

  return unsubscribe
}

/**
 * Buscar histórico de peso (versão estática, sem real-time)
 * @param {string} userId - UID do usuário
 * @returns {Promise<Array>}
 */
export const getWeightHistory = async (userId) => {
  try {
    const weightHistoryRef = collection(db, 'users', userId, 'weight_history')
    const q = query(weightHistoryRef, orderBy('date', 'desc'))
    
    const snapshot = await getDocs(q)
    const records = []
    
    snapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      })
    })

    // Ordenar por data (mais antigo primeiro)
    records.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
      return dateA - dateB
    })

    return records
  } catch (error) {
    console.error('Erro ao buscar histórico de peso:', error)
    return []
  }
}



