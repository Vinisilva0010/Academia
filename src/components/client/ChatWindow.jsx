import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToConversation, sendMessage, markMessagesAsRead } from '../../utils/messages'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

export default function ChatWindow({ onClose }) {
  const { currentUser, userProfile } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminInfo, setAdminInfo] = useState(null)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Buscar info do admin
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        console.log('[ChatWindow] Buscando admin...')
        // Buscar primeiro usuário com role 'admin'
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('role', '==', 'admin'))
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          const adminDoc = snapshot.docs[0]
          const adminData = {
            uid: adminDoc.id,
            ...adminDoc.data()
          }
          console.log('[ChatWindow] Admin encontrado:', adminData.uid)
          setAdminInfo(adminData)
        } else {
          console.warn('[ChatWindow] Nenhum admin encontrado')
          setError('Personal Trainer não encontrado')
        }
      } catch (error) {
        console.error('[ChatWindow] Erro ao buscar admin:', error)
        setError('Erro ao carregar chat')
      }
    }

    if (currentUser) {
      fetchAdminInfo()
    }
  }, [currentUser])

  // Subscrever mensagens em tempo real
  useEffect(() => {
    if (!currentUser || !adminInfo) {
      console.log('[ChatWindow] Aguardando currentUser ou adminInfo:', { 
        hasUser: !!currentUser, 
        hasAdmin: !!adminInfo 
      })
      return
    }

    console.log('[ChatWindow] Iniciando subscription de mensagens:', {
      userId: currentUser.uid,
      adminId: adminInfo.uid
    })

    const unsubscribe = subscribeToConversation(
      currentUser.uid,
      adminInfo.uid,
      (conversationMessages) => {
        console.log('[ChatWindow] Mensagens recebidas:', conversationMessages.length)
        setMessages(conversationMessages)
        
        // Marcar mensagens como lidas quando receber novas
        if (conversationMessages.length > 0) {
          markMessagesAsRead(currentUser.uid, adminInfo.uid).catch(err => {
            console.error('[ChatWindow] Erro ao marcar como lida:', err)
          })
        }
      }
    )

    return () => {
      console.log('[ChatWindow] Limpando subscription')
      unsubscribe()
    }
  }, [currentUser, adminInfo])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus no input quando abrir
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser || !adminInfo || loading) {
      console.warn('[ChatWindow] Tentativa de envio bloqueada:', {
        hasMessage: !!newMessage.trim(),
        hasUser: !!currentUser,
        hasAdmin: !!adminInfo,
        loading
      })
      return
    }

    setLoading(true)
    setError('')
    
    console.log('[ChatWindow] Enviando mensagem:', {
      senderId: currentUser.uid,
      receiverId: adminInfo.uid,
      text: newMessage.substring(0, 50)
    })
    
    const result = await sendMessage(currentUser.uid, adminInfo.uid, newMessage)
    
    if (result.success) {
      console.log('[ChatWindow] Mensagem enviada com sucesso')
      setNewMessage('')
      inputRef.current?.focus()
    } else {
      console.error('[ChatWindow] Erro ao enviar:', result.error)
      setError(result.error || 'Erro ao enviar mensagem')
    }
    setLoading(false)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return ''
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-blue/20 rounded-lg">
            <MessageCircle className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h3 className="font-black uppercase text-white text-sm">
              {adminInfo?.name || adminInfo?.email || 'Personal Trainer'}
            </h3>
            <p className="text-xs text-gray-400">
              {adminInfo ? 'Online' : 'Carregando...'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-3 flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">{error}</span>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs mt-1">
              {adminInfo ? 'Envie uma mensagem para começar!' : 'Aguardando carregamento...'}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUser?.uid
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isMine
                      ? 'bg-neon-blue text-white'
                      : 'bg-zinc-800 text-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isMine ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-lg">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={adminInfo ? "Digite sua mensagem..." : "Aguardando..."}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue"
            disabled={loading || !adminInfo}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim() || !adminInfo}
            className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
