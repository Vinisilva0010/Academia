import { useState } from 'react'
import { Bell, X, CheckCircle } from 'lucide-react'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../contexts/AuthContext'

export default function NotificationPrompt({ onActivated, onDismissed }) {
  const { userProfile } = useAuth()
  const { permission, loading, requestPermission, isSupported } = useNotification()
  const [dismissed, setDismissed] = useState(false)

  // IMPORTANTE: Mostrar apenas para CLIENTES (não para admin)
  if (userProfile?.role !== 'client') {
    return null
  }

  // Se não for suportado ou já foi concedido, não mostrar
  if (!isSupported || permission === 'granted' || dismissed) {
    return null
  }

  const handleActivate = async () => {
    const result = await requestPermission()
    if (result.success) {
      setDismissed(true)
      if (onActivated) {
        onActivated()
      }
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismissed) {
      onDismissed()
    }
  }

  return (
    <div className="card bg-neon-blue/10 border-2 border-neon-blue/50 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-neon-blue/20 rounded-lg flex-shrink-0">
          <Bell className="w-6 h-6 text-neon-blue" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-black uppercase text-white mb-1">
            Ative as Notificações
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Receba lembretes de treino, mensagens do seu Personal Trainer e atualizações importantes.
          </p>
          
          <button
            onClick={handleActivate}
            disabled={loading || permission === 'granted'}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Ativando...
              </>
            ) : permission === 'granted' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Ativado
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Ativar Notificações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

