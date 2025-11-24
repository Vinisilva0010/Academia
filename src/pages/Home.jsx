import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Dumbbell, LogIn } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { userProfile, currentUser } = useAuth()

  const handleGetStarted = () => {
    if (currentUser && userProfile) {
      // Se já está logado, redirecionar para a área apropriada
      if (userProfile.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (userProfile.role === 'client') {
        navigate('/dashboard', { replace: true })
      }
    } else {
      // Se não está logado, ir para login
      navigate('/login')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-8">
        <Dumbbell className="w-12 h-12 text-neon-blue mr-4" />
        <h1 className="text-5xl font-black uppercase tracking-wider">
          APEXFIT PRO
        </h1>
      </div>
      
      <div className="card max-w-2xl mx-auto">
        <h2 className="text-2xl mb-4">BEM-VINDO</h2>
        <p className="text-gray-300 mb-6">
          Sua jornada para o próximo nível de fitness começa aqui.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={handleGetStarted}
            className="btn-primary flex items-center gap-2"
          >
            {currentUser ? (
              <>
                <Dumbbell className="w-5 h-5" />
                Ir para {userProfile?.role === 'admin' ? 'Admin' : 'Dashboard'}
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Começar Agora
              </>
            )}
          </button>
          {!currentUser && (
            <button 
              onClick={() => navigate('/login')}
              className="btn-secondary"
            >
              Fazer Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

