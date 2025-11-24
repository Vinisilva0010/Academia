import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userProfile, loading } = useAuth()

  // Mostrar loading enquanto busca os dados
  if (loading) {
    return (
      <div className="min-h-screen bg-pure-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
      </div>
    )
  }

  // Se não está autenticado, redirecionar para login
  if (!currentUser || !userProfile) {
    return <Navigate to="/login" replace />
  }

  // Se a rota requer uma role específica e o usuário não tem essa role
  if (requiredRole && userProfile.role !== requiredRole) {
    // Redirecionar baseado na role do usuário
    if (userProfile.role === 'admin') {
      return <Navigate to="/admin" replace />
    } else if (userProfile.role === 'client') {
      return <Navigate to="/dashboard" replace />
    }
    // Se não tem role válida, voltar para home
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute



