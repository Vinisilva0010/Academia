import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collectionGroup,
  writeBatch
} from 'firebase/firestore'
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
 * Deletar todos os documentos de uma subcoleção
 * @param {string} userId - UID do usuário
 * @param {string} subcollectionName - Nome da subcoleção
 * @returns {Promise<number>} Número de documentos deletados
 */
const deleteSubcollection = async (userId, subcollectionName) => {
  try {
    const subcollectionRef = collection(db, 'users', userId, subcollectionName)
    const snapshot = await getDocs(subcollectionRef)
    
    if (snapshot.empty) {
      return 0
    }

    // Firestore batch tem limite de 500 operações
    // Vamos deletar em lotes de 500
    const docs = snapshot.docs
    let deletedCount = 0

    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db)
      const batchDocs = docs.slice(i, i + 500)
      
      batchDocs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref)
      })
      
      await batch.commit()
      deletedCount += batchDocs.length
    }

    return deletedCount
  } catch (error) {
    console.error(`Erro ao deletar subcoleção ${subcollectionName}:`, error)
    return 0
  }
}

/**
 * Deletar aluno e todos os dados relacionados
 * @param {string} studentId - UID do aluno
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deleteStudent = async (studentId) => {
  try {
    console.log(`Iniciando exclusão do aluno ${studentId}...`)

    // 1. Deletar subcoleções primeiro (workout_logs, meal_logs, weight_history)
    console.log('Deletando subcoleções...')
    const [workoutLogsCount, mealLogsCount, weightHistoryCount] = await Promise.all([
      deleteSubcollection(studentId, 'workout_logs'),
      deleteSubcollection(studentId, 'meal_logs'),
      deleteSubcollection(studentId, 'weight_history')
    ])
    
    console.log(`Subcoleções deletadas: workout_logs (${workoutLogsCount}), meal_logs (${mealLogsCount}), weight_history (${weightHistoryCount})`)

    // 2. Deletar mensagens relacionadas ao aluno
    console.log('Deletando mensagens...')
    const messagesRef = collection(db, 'messages')
    const messagesQuery1 = query(
      messagesRef, 
      where('senderId', '==', studentId)
    )
    const messagesQuery2 = query(
      messagesRef, 
      where('receiverId', '==', studentId)
    )

    const [messagesSnap1, messagesSnap2] = await Promise.all([
      getDocs(messagesQuery1),
      getDocs(messagesQuery2)
    ])

    const messageIds = new Set()
    messagesSnap1.forEach((doc) => {
      messageIds.add(doc.id)
    })
    messagesSnap2.forEach((doc) => {
      messageIds.add(doc.id)
    })

    // Deletar mensagens em batches de 500
    if (messageIds.size > 0) {
      const messageDocs = Array.from(messageIds)
      for (let i = 0; i < messageDocs.length; i += 500) {
        const batch = writeBatch(db)
        const batchIds = messageDocs.slice(i, i + 500)
        
        batchIds.forEach((messageId) => {
          const messageRef = doc(db, 'messages', messageId)
          batch.delete(messageRef)
        })
        
        await batch.commit()
      }
      console.log(`${messageIds.size} mensagens deletadas`)
    }

    // 3. Deletar documentos principais (users, assessments, plans)
    console.log('Deletando documentos principais...')
    const mainBatch = writeBatch(db)
    
    // Deletar documento do usuário na coleção users
    const userRef = doc(db, 'users', studentId)
    mainBatch.delete(userRef)

    // Deletar assessment na coleção assessments
    const assessmentRef = doc(db, 'assessments', studentId)
    mainBatch.delete(assessmentRef)

    // Deletar plano na coleção plans
    const planRef = doc(db, 'plans', studentId)
    mainBatch.delete(planRef)

    // Executar batch delete dos documentos principais
    await mainBatch.commit()

    console.log(`Aluno ${studentId} e todos os dados relacionados foram deletados com sucesso!`)
    
    return { 
      success: true,
      message: 'Aluno e todos os dados relacionados foram deletados com sucesso. Nota: O usuário do Firebase Authentication precisa ser deletado manualmente ou via Cloud Function.'
    }
  } catch (error) {
    console.error('Erro ao deletar aluno:', error)
    return {
      success: false,
      error: error.message || 'Erro ao deletar aluno'
    }
  }
}

/**
 * Exportar função updateUserStatus para uso no PlanCreator
 */
export { updateUserStatus }

