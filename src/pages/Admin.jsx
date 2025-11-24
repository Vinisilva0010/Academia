import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Dumbbell } from 'lucide-react'
import ProtectedRoute from '../components/ProtectedRoute'
import StudentList from '../components/admin/StudentList'
import PlanCreator from '../components/admin/PlanCreator'
import AdminChatButton from '../components/admin/ChatButton'
import NotificationPrompt from '../components/NotificationPrompt'
import Toast from '../components/Toast'
import { useNotification } from '../hooks/useNotification'

function AdminContent() {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Notificações
  const { foregroundMessage, clearForegroundMessage } = useNotification()

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/login')
    }
  }

  const handleSelectStudent = (student) => {
    // Modo criação (para alunos pendentes)
    setSelectedStudent(student)
    setEditMode(false)
  }

  const handleEditPlan = (student) => {
    // Modo edição (para alunos ativos)
    setSelectedStudent(student)
    setEditMode(true)
  }

  const handleClosePlanCreator = () => {
    setSelectedStudent(null)
    setEditMode(false)
    // Forçar atualização da lista
    setRefreshKey(prev => prev + 1)
  }

  const handlePlanSuccess = () => {
    // Lista será atualizada automaticamente
    handleClosePlanCreator()
  }

  return (
    <div className="min-h-screen bg-pure-black">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-neon-blue" />
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-black uppercase mb-2">
            PAINEL ADMINISTRATIVO
          </h2>
          <p className="text-gray-300">Gerencie alunos e crie planos de treino</p>
        </div>

        {/* Prompt de Notificações - REMOVIDO: Admin não precisa */}

        {/* Lista de Alunos */}
        <StudentList 
          key={refreshKey}
          onSelectStudent={handleSelectStudent}
          onEditPlan={handleEditPlan}
        />

        {/* Modal de Criação/Edição de Plano */}
        {selectedStudent && (
          <PlanCreator
            student={selectedStudent}
            onClose={handleClosePlanCreator}
            onSuccess={handlePlanSuccess}
            editMode={editMode}
          />
        )}

        {/* Chat Button */}
        <AdminChatButton />

        {/* Toast para mensagens em foreground */}
        {foregroundMessage && (
          <Toast
            message={foregroundMessage}
            onClose={clearForegroundMessage}
          />
        )}
      </main>
    </div>
  )
}

export default function Admin() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminContent />
    </ProtectedRoute>
  )
}
