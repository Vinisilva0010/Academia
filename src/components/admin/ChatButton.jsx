import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToUnreadMessages } from '../../utils/messages'
import AdminChatWindow from './ChatWindow'

export default function AdminChatButton() {
  const { currentUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0)
      return
    }

    console.log('[ChatButton Admin] Iniciando subscription de mensagens não lidas para:', currentUser.uid)

    const unsubscribe = subscribeToUnreadMessages(currentUser.uid, (messages) => {
      const count = messages.length
      console.log('[ChatButton Admin] Mensagens não lidas atualizadas:', count)
      setUnreadCount(count)
    })

    return () => {
      console.log('[ChatButton Admin] Limpando subscription')
      unsubscribe()
    }
  }, [currentUser])

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-neon-blue rounded-full shadow-glow-blue hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 relative"
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-7 h-7 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-black border-2 border-pure-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Janela de Chat */}
      {isOpen && (
        <AdminChatWindow onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}



