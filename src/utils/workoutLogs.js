import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Gerar ID único para um exercício baseado no treino e índice
 * @param {string} trainingName - Nome do treino
 * @param {number} exerciseIndex - Índice do exercício
 * @returns {string}
 */
export const getExerciseId = (trainingName, exerciseIndex) => {
  return `${trainingName}_${exerciseIndex}`
}

/**
 * Buscar log de treino do dia
 * @param {string} userId - UID do usuário
 * @param {string} trainingName - Nome do treino
 * @param {string} date - Data no formato YYYY-MM-DD (opcional, usa hoje se não fornecido)
 * @returns {Promise<object|null>}
 */
export const getWorkoutLog = async (userId, trainingName, date = null) => {
  try {
    const today = date || new Date().toISOString().split('T')[0]
    const logId = `${today}_${trainingName}`
    
    const logRef = doc(db, 'users', userId, 'workout_logs', logId)
    const logSnap = await getDoc(logRef)
    
    if (logSnap.exists()) {
      return {
        id: logSnap.id,
        ...logSnap.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao buscar log de treino:', error)
    return null
  }
}

/**
 * Verificar se exercício está concluído hoje
 * @param {string} userId - UID do usuário
 * @param {string} trainingName - Nome do treino
 * @param {number} exerciseIndex - Índice do exercício
 * @param {string} date - Data no formato YYYY-MM-DD (opcional)
 * @returns {Promise<boolean>}
 */
export const isExerciseCompletedToday = async (userId, trainingName, exerciseIndex, date = null) => {
  try {
    const log = await getWorkoutLog(userId, trainingName, date)
    if (!log || !log.completedExerciseIds) return false
    
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    return log.completedExerciseIds.includes(exerciseId)
  } catch (error) {
    console.error('Erro ao verificar exercício concluído:', error)
    return false
  }
}

/**
 * Marcar exercício como concluído no log de hoje
 * @param {string} userId - UID do usuário
 * @param {string} trainingName - Nome do treino
 * @param {number} exerciseIndex - Índice do exercício
 * @param {object} exerciseData - Dados do exercício { weight?: number, reps?: number }
 * @param {string} date - Data no formato YYYY-MM-DD (opcional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markExerciseAsCompleted = async (userId, trainingName, exerciseIndex, exerciseData = {}, date = null) => {
  try {
    const today = date || new Date().toISOString().split('T')[0]
    const logId = `${today}_${trainingName}`
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    
    const logRef = doc(db, 'users', userId, 'workout_logs', logId)
    const logSnap = await getDoc(logRef)
    
    let completedExerciseIds = []
    let exerciseDetails = {}
    
    if (logSnap.exists()) {
      const logData = logSnap.data()
      completedExerciseIds = logData.completedExerciseIds || []
      exerciseDetails = logData.exerciseDetails || {}
      
      // Se já está concluído, atualizar apenas os dados (weight/reps)
      if (completedExerciseIds.includes(exerciseId)) {
        exerciseDetails[exerciseId] = {
          weight: exerciseData.weight !== undefined ? Number(exerciseData.weight) : exerciseDetails[exerciseId]?.weight,
          reps: exerciseData.reps !== undefined ? Number(exerciseData.reps) : exerciseDetails[exerciseId]?.reps,
          completedAt: serverTimestamp()
        }
        
        await setDoc(logRef, {
          exerciseDetails,
          updatedAt: serverTimestamp()
        }, { merge: true })
        
        return { success: true }
      }
    }
    
    // Adicionar exercício à lista
    completedExerciseIds.push(exerciseId)
    
    // Salvar dados do exercício (weight e reps)
    exerciseDetails[exerciseId] = {
      weight: exerciseData.weight !== undefined ? Number(exerciseData.weight) : null,
      reps: exerciseData.reps !== undefined ? Number(exerciseData.reps) : null,
      completedAt: serverTimestamp()
    }
    
    // Salvar/atualizar log
    await setDoc(logRef, {
      userId,
      date: today,
      trainingName,
      completedExerciseIds,
      exerciseDetails,
      updatedAt: serverTimestamp()
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Erro ao marcar exercício como concluído:', error)
    return {
      success: false,
      error: error.message || 'Erro ao marcar exercício'
    }
  }
}

/**
 * Desmarcar exercício (remover do log de hoje)
 * @param {string} userId - UID do usuário
 * @param {string} trainingName - Nome do treino
 * @param {number} exerciseIndex - Índice do exercício
 * @param {string} date - Data no formato YYYY-MM-DD (opcional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const unmarkExerciseAsCompleted = async (userId, trainingName, exerciseIndex, date = null) => {
  try {
    const today = date || new Date().toISOString().split('T')[0]
    const logId = `${today}_${trainingName}`
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    
    const logRef = doc(db, 'users', userId, 'workout_logs', logId)
    const logSnap = await getDoc(logRef)
    
    if (!logSnap.exists()) {
      return { success: true } // Já não está marcado
    }
    
    const logData = logSnap.data()
    let completedExerciseIds = logData.completedExerciseIds || []
    let exerciseDetails = logData.exerciseDetails || {}
    
    // Remover exercício da lista
    completedExerciseIds = completedExerciseIds.filter(id => id !== exerciseId)
    
    // Remover dados do exercício
    if (exerciseDetails[exerciseId]) {
      delete exerciseDetails[exerciseId]
    }
    
    // Se não há mais exercícios, deletar o documento
    if (completedExerciseIds.length === 0) {
      await setDoc(logRef, {
        completedExerciseIds: [],
        exerciseDetails: {},
        updatedAt: serverTimestamp()
      }, { merge: true })
      // Ou poderia deletar o documento completamente
    } else {
      // Atualizar com lista sem o exercício
      await setDoc(logRef, {
        completedExerciseIds,
        exerciseDetails,
        updatedAt: serverTimestamp()
      }, { merge: true })
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao desmarcar exercício:', error)
    return {
      success: false,
      error: error.message || 'Erro ao desmarcar exercício'
    }
  }
}

/**
 * Buscar dados de um exercício específico (weight e reps) do log de hoje
 * @param {string} userId - UID do usuário
 * @param {string} trainingName - Nome do treino
 * @param {number} exerciseIndex - Índice do exercício
 * @param {string} date - Data no formato YYYY-MM-DD (opcional)
 * @returns {Promise<{weight: number|null, reps: number|null}>}
 */
export const getExerciseData = async (userId, trainingName, exerciseIndex, date = null) => {
  try {
    const log = await getWorkoutLog(userId, trainingName, date)
    if (!log || !log.exerciseDetails) {
      return { weight: null, reps: null }
    }
    
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    const exerciseData = log.exerciseDetails[exerciseId] || {}
    
    return {
      weight: exerciseData.weight || null,
      reps: exerciseData.reps || null
    }
  } catch (error) {
    console.error('Erro ao buscar dados do exercício:', error)
    return { weight: null, reps: null }
  }
}

/**
 * Subscrever log de treino do dia em tempo real
 * @param {string} userId - UID do usuário
 * @param {string} trainingName - Nome do treino
 * @param {Function} callback - Callback chamado quando log muda
 * @param {string} date - Data no formato YYYY-MM-DD (opcional)
 * @returns {Function} Função para cancelar o listener
 */
export const subscribeToWorkoutLog = (userId, trainingName, callback, date = null) => {
  if (!userId || !trainingName) {
    return () => {}
  }

  const today = date || new Date().toISOString().split('T')[0]
  const logId = `${today}_${trainingName}`
  
  const logRef = doc(db, 'users', userId, 'workout_logs', logId)

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
      console.error('Erro ao subscrever log de treino:', error)
      callback(null)
    }
  )

  return unsubscribe
}


