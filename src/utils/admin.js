import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getAssessment } from './assessments'
import { updateUserStatus } from './assessments'

/**
 * Buscar todos os alunos (usuários com role: 'client')
 * @returns {Promise<Array>}
 */
export const getAllStudents = async () => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('role', '==', 'client'))
    const querySnapshot = await getDocs(q)
    
    const students = []
    querySnapshot.forEach((doc) => {
      students.push({
        uid: doc.id,
        ...doc.data()
      })
    })
    
    return students
  } catch (error) {
    console.error('Erro ao buscar alunos:', error)
    return []
  }
}

/**
 * Buscar dados completos de um aluno (incluindo anamnese)
 * @param {string} studentId - UID do aluno
 * @returns {Promise<object|null>}
 */
export const getStudentData = async (studentId) => {
  try {
    // Buscar dados do usuário
    const userRef = doc(db, 'users', studentId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return null
    }
    
    const userData = {
      uid: userSnap.id,
      ...userSnap.data()
    }
    
    // Buscar anamnese
    const assessment = await getAssessment(studentId)
    
    return {
      ...userData,
      assessment
    }
  } catch (error) {
    console.error('Erro ao buscar dados do aluno:', error)
    return null
  }
}

/**
 * Salvar plano completo (treino + dieta) para um aluno
 * @param {string} studentId - UID do aluno
 * @param {object} planData - Dados do plano { trainings: [], diet: {} }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const savePlan = async (studentId, planData) => {
  try {
    const planRef = doc(db, 'plans', studentId)
    
    await setDoc(planRef, {
      ...planData,
      studentId,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar plano:', error)
    return {
      success: false,
      error: error.message || 'Erro ao salvar plano'
    }
  }
}

/**
 * Ativar aluno e enviar plano
 * @param {string} studentId - UID do aluno
 * @param {object} planData - Dados do plano completo
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const activateStudent = async (studentId, planData) => {
  try {
    // Salvar plano
    const planResult = await savePlan(studentId, planData)
    
    if (!planResult.success) {
      throw new Error(planResult.error)
    }

    // Atualizar status do aluno para 'active'
    const statusResult = await updateUserStatus(studentId, 'active')
    
    if (!statusResult.success) {
      throw new Error(statusResult.error)
    }

    // TODO: Enviar notificação (pode ser implementado depois)
    // Por enquanto, apenas log
    console.log(`Aluno ${studentId} ativado e plano enviado`)

    return { success: true }
  } catch (error) {
    console.error('Erro ao ativar aluno:', error)
    return {
      success: false,
      error: error.message || 'Erro ao ativar aluno'
    }
  }
}

/**
 * Exportar função updateUserStatus para uso no PlanCreator
 */
export { updateUserStatus }

