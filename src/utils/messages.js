import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Enviar uma mensagem
 * @param {string} senderId - UID do remetente
 * @param {string} receiverId - UID do destinatário
 * @param {string} text - Texto da mensagem
 * @returns {Promise<{success: boolean, error?: string, messageId?: string}>}
 */
export const sendMessage = async (senderId, receiverId, text) => {
  try {
    console.log('[sendMessage] Iniciando envio:', { senderId, receiverId, text: text.substring(0, 50) })
    
    if (!senderId || !receiverId) {
      console.error('[sendMessage] IDs inválidos:', { senderId, receiverId })
      return {
        success: false,
        error: 'IDs de usuário inválidos'
      }
    }

    if (!text.trim()) {
      return {
        success: false,
        error: 'A mensagem não pode estar vazia'
      }
    }

    const messagesRef = collection(db, 'messages')
    const messageData = {
      text: text.trim(),
      senderId,
      receiverId,
      timestamp: serverTimestamp(),
      read: false
    }
    
    console.log('[sendMessage] Dados da mensagem:', messageData)
    
    const docRef = await addDoc(messagesRef, messageData)
    
    console.log('[sendMessage] Mensagem enviada com sucesso:', docRef.id)

    return {
      success: true,
      messageId: docRef.id
    }
  } catch (error) {
    console.error('[sendMessage] Erro ao enviar mensagem:', error)
    console.error('[sendMessage] Detalhes:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    })
    return {
      success: false,
      error: error.message || 'Erro ao enviar mensagem'
    }
  }
}

/**
 * Buscar conversa entre dois usuários
 * Usa duas queries separadas e combina os resultados
 * @param {string} userId1 - UID do primeiro usuário
 * @param {string} userId2 - UID do segundo usuário
 * @param {Function} callback - Callback chamado quando mensagens mudam
 * @returns {Function} Função para cancelar o listener
 */
export const subscribeToConversation = (userId1, userId2, callback) => {
  if (!userId1 || !userId2) {
    console.warn('[subscribeToConversation] IDs inválidos:', { userId1, userId2 })
    callback([])
    return () => {}
  }

  console.log('[subscribeToConversation] Iniciando subscription:', { userId1, userId2 })

  const messagesRef = collection(db, 'messages')
  let unsubscribe1 = null
  let unsubscribe2 = null
  let messages1 = []
  let messages2 = []
  
  const updateMessages = () => {
    // Combinar mensagens de ambas as queries
    const allMessages = [...messages1, ...messages2]
    
    // Remover duplicatas (caso haja)
    const uniqueMessages = allMessages.reduce((acc, msg) => {
      if (!acc.find(m => m.id === msg.id)) {
        acc.push(msg)
      }
      return acc
    }, [])
    
    // Ordenar por timestamp
    uniqueMessages.sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0
      return timeA - timeB
    })
    
    console.log('[subscribeToConversation] Mensagens atualizadas:', uniqueMessages.length)
    callback(uniqueMessages)
  }

  // Query 1: Mensagens onde userId1 enviou para userId2
  const q1 = query(
    messagesRef,
    where('senderId', '==', userId1),
    where('receiverId', '==', userId2),
    orderBy('timestamp', 'asc')
  )

  unsubscribe1 = onSnapshot(
    q1,
    (snapshot) => {
      messages1 = []
      snapshot.forEach((doc) => {
        messages1.push({
          id: doc.id,
          ...doc.data()
        })
      })
      console.log('[subscribeToConversation] Query 1:', messages1.length, 'mensagens')
      updateMessages()
    },
    (error) => {
      console.error('[subscribeToConversation] Erro na query 1:', error)
      console.error('[subscribeToConversation] Detalhes do erro:', {
        code: error.code,
        message: error.message,
        userId1,
        userId2
      })
      
      // Se for erro de índice, mostrar mensagem útil
      if (error.code === 'failed-precondition') {
        console.error('[subscribeToConversation] ERRO: Índice composto necessário no Firestore!')
        console.error('[subscribeToConversation] Crie um índice composto com os campos: senderId (Ascending), receiverId (Ascending), timestamp (Ascending)')
      }
      
      messages1 = []
      updateMessages()
    }
  )

  // Query 2: Mensagens onde userId2 enviou para userId1
  const q2 = query(
    messagesRef,
    where('senderId', '==', userId2),
    where('receiverId', '==', userId1),
    orderBy('timestamp', 'asc')
  )

  unsubscribe2 = onSnapshot(
    q2,
    (snapshot) => {
      messages2 = []
      snapshot.forEach((doc) => {
        messages2.push({
          id: doc.id,
          ...doc.data()
        })
      })
      console.log('[subscribeToConversation] Query 2:', messages2.length, 'mensagens')
      updateMessages()
    },
    (error) => {
      console.error('[subscribeToConversation] Erro na query 2:', error)
      console.error('[subscribeToConversation] Detalhes do erro:', {
        code: error.code,
        message: error.message,
        userId1,
        userId2
      })
      
      if (error.code === 'failed-precondition') {
        console.error('[subscribeToConversation] ERRO: Índice composto necessário no Firestore!')
        console.error('[subscribeToConversation] Crie um índice composto com os campos: senderId (Ascending), receiverId (Ascending), timestamp (Ascending)')
      }
      
      messages2 = []
      updateMessages()
    }
  )

  // Retornar função para cancelar ambos os listeners
  return () => {
    console.log('[subscribeToConversation] Cancelando subscriptions')
    if (unsubscribe1) unsubscribe1()
    if (unsubscribe2) unsubscribe2()
  }
}

/**
 * Buscar mensagens não lidas para um usuário
 * @param {string} userId - UID do usuário
 * @param {Function} callback - Callback chamado quando mensagens não lidas mudam
 * @returns {Function} Função para cancelar o listener
 */
export const subscribeToUnreadMessages = (userId, callback) => {
  if (!userId) {
    console.warn('[subscribeToUnreadMessages] userId inválido')
    callback([])
    return () => {}
  }

  console.log('[subscribeToUnreadMessages] Iniciando subscription para:', userId)

  const messagesRef = collection(db, 'messages')
  const q = query(
    messagesRef,
    where('receiverId', '==', userId),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages = []
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        })
      })
      console.log('[subscribeToUnreadMessages] Mensagens não lidas:', messages.length)
      callback(messages)
    },
    (error) => {
      console.error('[subscribeToUnreadMessages] Erro ao buscar mensagens não lidas:', error)
      console.error('[subscribeToUnreadMessages] Detalhes:', {
        code: error.code,
        message: error.message
      })
      
      if (error.code === 'failed-precondition') {
        console.error('[subscribeToUnreadMessages] ERRO: Índice composto necessário!')
        console.error('[subscribeToUnreadMessages] Crie um índice: receiverId (Ascending), read (Ascending), timestamp (Descending)')
      }
      
      callback([])
    }
  )

  return unsubscribe
}

/**
 * Marcar mensagens como lidas
 * @param {string} userId - UID do usuário que está marcando como lida
 * @param {string} otherUserId - UID do outro usuário na conversa
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markMessagesAsRead = async (userId, otherUserId) => {
  try {
    console.log('[markMessagesAsRead] Marcando mensagens como lidas:', { userId, otherUserId })
    
    const messagesRef = collection(db, 'messages')
    const q = query(
      messagesRef,
      where('senderId', '==', otherUserId),
      where('receiverId', '==', userId),
      where('read', '==', false)
    )

    const snapshot = await getDocs(q)
    const updatePromises = []

    snapshot.forEach((doc) => {
      updatePromises.push(
        updateDoc(doc.ref, { read: true })
      )
    })

    await Promise.all(updatePromises)
    console.log('[markMessagesAsRead] Mensagens marcadas como lidas:', updatePromises.length)

    return { success: true }
  } catch (error) {
    console.error('[markMessagesAsRead] Erro ao marcar mensagens como lidas:', error)
    return {
      success: false,
      error: error.message || 'Erro ao marcar mensagens como lidas'
    }
  }
}

/**
 * Buscar todos os alunos que têm conversa com o admin
 * @param {string} adminId - UID do admin
 * @returns {Promise<Array>}
 */
export const getConversationPartners = async (adminId) => {
  try {
    const messagesRef = collection(db, 'messages')
    
    // Buscar todas as mensagens onde admin está envolvido
    const q = query(
      messagesRef,
      where('senderId', '==', adminId)
    )

    const snapshot = await getDocs(q)
    const partners = new Set()

    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.receiverId) {
        partners.add(data.receiverId)
      }
    })

    // Também buscar mensagens recebidas do admin
    const qReceived = query(
      messagesRef,
      where('receiverId', '==', adminId)
    )

    const snapshotReceived = await getDocs(qReceived)
    snapshotReceived.forEach((doc) => {
      const data = doc.data()
      if (data.senderId) {
        partners.add(data.senderId)
      }
    })

    return Array.from(partners)
  } catch (error) {
    console.error('Erro ao buscar parceiros de conversa:', error)
    return []
  }
}
