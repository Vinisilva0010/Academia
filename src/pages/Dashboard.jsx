import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Dumbbell } from 'lucide-react'
import ProtectedRoute from '../components/ProtectedRoute'
import AnamneseForm from '../components/client/AnamneseForm'
import PendingScreen from '../components/client/PendingScreen'
import DashboardTabs from '../components/client/DashboardTabs'
import ChatButton from '../components/client/ChatButton'
import { getAssessment } from '../utils/assessments'

function DashboardContent() {
  const { userProfile, logout, currentUser, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)

  // Buscar anamnese ao carregar
  useEffect(() => {
    const fetchAssessment = async () => {
      if (currentUser) {
        const assessmentData = await getAssessment(currentUser.uid)
        setAssessment(assessmentData)
        setLoading(false)
      }
    }

    fetchAssessment()
  }, [currentUser])

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/login')
    }
  }

  const handleAnamneseSave = async () => {
    // Recarregar dados do usuário e anamnese
    if (currentUser) {
      const assessmentData = await getAssessment(currentUser.uid)
      setAssessment(assessmentData)
      
      // Recarregar perfil do usuário para pegar status atualizado
      await refreshProfile()
    }
  }

  // Determinar o estado do cliente
  const getClientState = () => {
    if (!userProfile) return 'loading'
    
    // Se status é 'new' ou não tem anamnese, mostrar formulário
    if (userProfile.status === 'new' || !assessment) return 'anamnese'
    
    // Se tem anamnese mas status é pending
    if (userProfile.status === 'pending') return 'pending'
    
    // Se status é active, mostrar dashboard
    if (userProfile.status === 'active') return 'active'
    
    // Default: mostrar anamnese
    return 'anamnese'
  }

  const clientState = getClientState()

  if (loading) {
    return (
      <div className="min-h-screen bg-pure-black flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-neon-blue mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    )
  }

  // Renderizar header apenas se não estiver na tela de espera
  const showHeader = clientState !== 'pending'

  return (
    <div className="min-h-screen bg-pure-black">
      {/* Header */}
      {showHeader && (
        <header className="border-b border-zinc-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-8 h-8 text-neon-green" />
              <h1 className="text-2xl font-black uppercase">APEXFIT PRO</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-300">
                <User className="w-5 h-5" />
                <span className="font-bold">{userProfile?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={clientState === 'pending' ? '' : 'container mx-auto px-4 py-8'}>
        {clientState === 'anamnese' && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-black uppercase mb-2">
                BEM-VINDO AO APEXFIT PRO
              </h2>
              <p className="text-gray-300">
                Vamos começar preenchendo seu perfil
              </p>
            </div>
            <AnamneseForm onSave={handleAnamneseSave} />
          </div>
        )}

        {clientState === 'pending' && <PendingScreen />}

        {clientState === 'active' && (
          <div>
            <div className="mb-8">
              <h2 className="text-4xl font-black uppercase mb-2">
                MEU DASHBOARD
              </h2>
              <p className="text-gray-300">Acompanhe seu progresso</p>
            </div>
            <DashboardTabs />
          </div>
        )}
      </main>

      {/* Chat Button - Mostrar apenas quando estiver ativo */}
      {clientState === 'active' && <ChatButton />}
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute requiredRole="client">
      <DashboardContent />
    </ProtectedRoute>
  )
}
