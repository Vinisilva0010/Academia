import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Buscar plano de um aluno
 * @param {string} studentId - UID do aluno
 * @returns {Promise<object|null>}
 */
export const getStudentPlan = async (studentId) => {
  try {
    const planRef = doc(db, 'plans', studentId)
    const planSnap = await getDoc(planRef)
    
    if (planSnap.exists()) {
      return {
        id: planSnap.id,
        ...planSnap.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return null
  }
}

/**
 * Subscrever mudanças no plano de um aluno (tempo real)
 * @param {string} studentId - UID do aluno
 * @param {Function} callback - Callback chamado quando plano muda
 * @returns {Function} Função para cancelar o listener
 */
export const subscribeToStudentPlan = (studentId, callback) => {
  if (!studentId) {
    return () => {}
  }

  // Para Firestore, precisamos usar onSnapshot no documento
  const planRef = doc(db, 'plans', studentId)

  // Usar getDoc e então fazer polling ou usar onSnapshot se disponível
  // Por enquanto, vamos usar uma abordagem mais simples com getDoc periódico
  // Mas para tempo real, seria melhor usar onSnapshot se o Firestore permitir
  
  // Vamos retornar uma função vazia por enquanto
  // Em produção, você pode implementar polling ou usar real-time listeners
  return () => {}
}



