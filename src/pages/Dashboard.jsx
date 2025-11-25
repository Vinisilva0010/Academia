import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Dumbbell } from 'lucide-react'
import ProtectedRoute from '../components/ProtectedRoute'
import AnamneseForm from '../components/client/AnamneseForm'
import PendingScreen from '../components/client/PendingScreen'
import DashboardTabs from '../components/client/DashboardTabs'
import ChatButton from '../components/client/ChatButton'
import NotificationPrompt from '../components/NotificationPrompt'
import Toast from '../components/Toast'
import { useNotification } from '../hooks/useNotification'
import { getAssessment } from '../utils/assessments'

function DashboardContent() {
  const { userProfile, logout, currentUser, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formInProgress, setFormInProgress] = useState(false)
  
  // Notificações
  const { foregroundMessage, clearForegroundMessage } = useNotification()

  // Buscar anamnese ao carregar - apenas uma vez
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
    setIsSaving(true)
    setFormInProgress(false) // Formulário foi concluído
    try {
      // Aguardar um pouco para garantir que tudo foi salvo no Firestore
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Recarregar dados do usuário e anamnese
      if (currentUser) {
        const assessmentData = await getAssessment(currentUser.uid)
        setAssessment(assessmentData)
        
        // Recarregar perfil do usuário para pegar status atualizado
        await refreshProfile()
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Determinar o estado do cliente
  const getClientState = () => {
    if (!userProfile || loading) return 'loading'
    
    // PROTEÇÃO CRÍTICA: Se o formulário está em progresso, SEMPRE mostrar formulário
    // Isso impede que o Dashboard mude de tela enquanto o usuário está preenchendo
    if (formInProgress) {
      return 'anamnese'
    }
    
    // PRIORIDADE 1: Se status é 'new', SEMPRE mostrar formulário (mesmo se tiver assessment parcial)
    // Isso garante que o usuário possa completar o formulário mesmo se houver dados parciais
    if (userProfile.status === 'new') {
      return 'anamnese'
    }
    
    // PRIORIDADE 2: Se não tem anamnese, mostrar formulário
    if (!assessment) {
      return 'anamnese'
    }
    
    // PRIORIDADE 3: Se tem anamnese mas status é pending (APENAS se o formulário NÃO estiver em progresso)
    // Verificação adicional para garantir que não mudamos de tela enquanto o usuário está preenchendo
    if (userProfile.status === 'pending' && !formInProgress && !isSaving) {
      return 'pending'
    }
    
    // PRIORIDADE 4: Se status é active, mostrar dashboard
    if (userProfile.status === 'active') {
      return 'active'
    }
    
    // Default: mostrar anamnese
    return 'anamnese'
  }

  const clientState = getClientState()

  if (loading || isSaving) {
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
              <h1 className="text-2xl font-black uppercase">IMMERSION FIT</h1>
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
                BEM-VINDO AO IMMERSION FIT
              </h2>
              <p className="text-gray-300">
                Vamos começar preenchendo seu perfil
              </p>
            </div>
            <AnamneseForm 
              onSave={handleAnamneseSave}
              onFormStart={() => setFormInProgress(true)}
              onFormComplete={() => setFormInProgress(false)}
            />
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
            
            {/* Prompt de Notificações */}
            <NotificationPrompt />
            
            <DashboardTabs />
          </div>
        )}
      </main>

      {/* Chat Button - Mostrar apenas quando estiver ativo */}
      {clientState === 'active' && <ChatButton />}

      {/* Toast para mensagens em foreground */}
      {foregroundMessage && (
        <Toast
          message={foregroundMessage}
          onClose={clearForegroundMessage}
        />
      )}
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
