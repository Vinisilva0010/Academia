import { useEffect } from 'react'
import { X, Bell, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react'

export default function Toast({ message, onClose, autoClose = 5000 }) {
  useEffect(() => {
    if (autoClose && message) {
      const timer = setTimeout(() => {
        onClose()
      }, autoClose)

      return () => clearTimeout(timer)
    }
  }, [message, autoClose, onClose])

  if (!message) return null

  const getIcon = () => {
    if (message.type === 'success') {
      return <CheckCircle className="w-5 h-5 text-neon-green" />
    }
    if (message.type === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-500" />
    }
    if (message.data?.type === 'message' || message.title?.includes('mensagem')) {
      return <MessageCircle className="w-5 h-5 text-neon-blue" />
    }
    return <Bell className="w-5 h-5 text-neon-green" />
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right max-w-md w-full">
      <div className="card bg-zinc-900 border border-neon-blue/50 shadow-lg shadow-neon-blue/20 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-black uppercase text-white text-sm mb-1">
            {message.title || 'ApexFit Pro'}
          </h4>
          <p className="text-gray-300 text-sm">
            {message.body || message.message || 'Você tem uma nova notificação'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

