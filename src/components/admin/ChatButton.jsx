import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import AdminChatWindow from './ChatWindow'

export default function AdminChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-neon-blue rounded-full shadow-glow-blue hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </button>

      {/* Janela de Chat */}
      {isOpen && (
        <AdminChatWindow onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}



