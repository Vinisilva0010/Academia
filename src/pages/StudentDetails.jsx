import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Mail, Calendar, Target, AlertCircle, CheckCircle, Dumbbell, Utensils, TrendingUp } from 'lucide-react'
import { getStudentData } from '../utils/admin'
import { getStudentPlan } from '../utils/plans'
import Avatar from '../components/Avatar'
import PlanCreator from '../components/admin/PlanCreator'
import PerformanceTab from '../components/admin/PerformanceTab'
import DirectChatWindow from '../components/admin/DirectChatWindow'
import AdminChatWindow from '../components/admin/ChatWindow'

export default function StudentDetails() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [studentData, setStudentData] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [createMode, setCreateMode] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState('plano') // 'plano' ou 'performance'
  const [showChat, setShowChat] = useState(false)
  const [chatInitialMessage, setChatInitialMessage] = useState('')

  useEffect(() => {
    loadStudentData()
  }, [studentId])

  const loadStudentData = async () => {
    if (!studentId) return

    setLoading(true)
    try {
      const data = await getStudentData(studentId)
      setStudentData(data)

      // Carregar plano se existir
      if (data && data.status === 'active') {
        const planData = await getStudentPlan(studentId)
        setPlan(planData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlan = () => {
    setEditMode(true)
  }

  const handleCreatePlan = () => {
    setCreateMode(true)
  }

  const handleClosePlanCreator = () => {
    setEditMode(false)
    setCreateMode(false)
    setRefreshKey(prev => prev + 1)
    loadStudentData()
  }

  const handlePlanSuccess = () => {
    handleClosePlanCreator()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pure-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-gray-400">Carregando dados do aluno...</div>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-pure-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Aluno não encontrado</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 btn-primary"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const assessment = studentData.assessment
  const isPending = studentData.status === 'pending'
  const isActive = studentData.status === 'active'

  return (
    <div className="min-h-screen bg-pure-black">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold uppercase">Voltar</span>
          </button>
          
          <div className="flex items-center gap-6">
            <Avatar 
              name={studentData.name || studentData.email} 
              photoUrl={studentData.photoUrl}
              size="2xl"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-black uppercase text-white mb-2">
                {studentData.name || 'Aluno'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{studentData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isPending ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-500 font-bold">Aguardando Plano</span>
                    </>
                  ) : isActive ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-neon-green font-bold">Ativo</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            {isActive && (
              <button
                onClick={handleEditPlan}
                className="btn-primary flex items-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Editar Plano
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Abas */}
        {isActive && plan && (
          <div className="mb-6 border-b border-zinc-800">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('plano')}
                className={`px-6 py-3 font-bold uppercase transition-all relative ${
                  activeTab === 'plano'
                    ? 'text-neon-green'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Plano
                </div>
                {activeTab === 'plano' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green shadow-glow-green" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-6 py-3 font-bold uppercase transition-all relative ${
                  activeTab === 'performance'
                    ? 'text-neon-green'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance
                </div>
                {activeTab === 'performance' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-green shadow-glow-green" />
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'plano' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda - Informações Pessoais */}
            <div className="lg:col-span-1 space-y-6">
            {/* Anamnese */}
            {assessment && (
              <div className="card">
                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-neon-green" />
                  Anamnese
                </h3>
                
                <div className="space-y-3">
                  {assessment.peso && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Peso</p>
                      <p className="text-white font-bold">{assessment.peso} kg</p>
                    </div>
                  )}
                  
                  {assessment.altura && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Altura</p>
                      <p className="text-white font-bold">{assessment.altura} cm</p>
                    </div>
                  )}
                  
                  {assessment.objetivo && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Objetivo</p>
                      <p className="text-white font-bold">{assessment.objetivo}</p>
                    </div>
                  )}
                  
                  {assessment.diasDisponiveis && assessment.diasDisponiveis.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase mb-2">Dias Disponíveis</p>
                      <div className="flex flex-wrap gap-2">
                        {assessment.diasDisponiveis.map((dia, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-neon-green/10 border border-neon-green/30 rounded-lg text-neon-green text-sm font-bold"
                          >
                            {dia.split('-')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {assessment.lesoes && assessment.lesoes !== 'Nenhuma' && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Lesões/Limitações</p>
                      <p className="text-white text-sm">{assessment.lesoes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="card">
              <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-neon-green" />
                Status
              </h3>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Cadastro</p>
                  <p className="text-white text-sm">
                    {studentData.createdAt?.toDate 
                      ? new Date(studentData.createdAt.toDate()).toLocaleDateString('pt-BR')
                      : 'Não disponível'}
                  </p>
                </div>
                
                {plan?.createdAt && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Plano Criado</p>
                    <p className="text-white text-sm">
                      {plan.createdAt.toDate 
                        ? new Date(plan.createdAt.toDate()).toLocaleDateString('pt-BR')
                        : 'Não disponível'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita - Plano */}
          <div className="lg:col-span-2 space-y-6">
            {isPending ? (
              <div className="card text-center py-12">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase text-yellow-500 mb-2">
                  Aguardando Criação do Plano
                </h3>
                <p className="text-gray-400 mb-6">
                  Este aluno completou a anamnese e está aguardando a criação do plano personalizado.
                </p>
                <button
                  onClick={handleCreatePlan}
                  className="btn-primary"
                >
                  Criar Plano
                </button>
              </div>
            ) : plan ? (
              <>
                {/* Treinos */}
                {plan.trainings && plan.trainings.length > 0 && (
                  <div className="card">
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-neon-green" />
                      Treinos ({plan.trainings.length})
                    </h3>
                    
                    <div className="space-y-3">
                      {plan.trainings.map((training, index) => (
                        <div
                          key={index}
                          className="bg-zinc-800 border border-zinc-700 rounded-lg p-4"
                        >
                          <h4 className="font-black uppercase text-white mb-2">
                            {training.name}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {training.exercises?.length || 0} exercício(s)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dieta */}
                {plan.diet && (
                  <div className="card">
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-neon-green" />
                      Dieta
                    </h3>
                    
                    {Array.isArray(plan.diet) ? (
                      <div className="space-y-3">
                        {plan.diet.map((meal, index) => (
                          <div
                            key={index}
                            className="bg-zinc-800 border border-zinc-700 rounded-lg p-4"
                          >
                            <h4 className="font-bold text-white mb-1">
                              {meal.title || `Refeição ${index + 1}`}
                            </h4>
                            {meal.time && (
                              <p className="text-xs text-gray-400 mb-2">{meal.time}</p>
                            )}
                            <p className="text-sm text-gray-300">
                              {meal.items?.length || 0} alimento(s)
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Dieta configurada</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-400">Plano não encontrado</p>
              </div>
            )}
          </div>
        </div>
        ) : activeTab === 'performance' ? (
          <PerformanceTab
            studentId={studentId}
            studentName={studentData.name || studentData.email}
            navigateToChat={(message) => {
              setChatInitialMessage(message)
              setShowChat(true)
            }}
          />
        ) : null}
      </main>

      {/* Modal de Criação/Edição de Plano */}
      {(editMode || createMode) && studentData && (
        <PlanCreator
          student={studentData}
          onClose={handleClosePlanCreator}
          onSuccess={handlePlanSuccess}
          editMode={editMode}
        />
      )}

      {/* Chat Window quando necessário */}
      {showChat && studentData && (
        <DirectChatWindow
          student={studentData}
          initialMessage={chatInitialMessage}
          onClose={() => {
            setShowChat(false)
            setChatInitialMessage('')
          }}
        />
      )}
    </div>
  )
}

