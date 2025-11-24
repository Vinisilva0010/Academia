import { useState, useEffect, useCallback } from 'react'
import { Play, Dumbbell, Loader2, CheckCircle2, Circle, Weight, Repeat } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getStudentPlan } from '../../utils/plans'
import { 
  markExerciseAsCompleted, 
  unmarkExerciseAsCompleted, 
  subscribeToWorkoutLog,
  getExerciseId,
  getExerciseData
} from '../../utils/workoutLogs'
import VideoPlayer from '../VideoPlayer'
import StreakCalendar from './StreakCalendar'

export default function TrainingTab() {
  const { currentUser } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [activeTrainingTab, setActiveTrainingTab] = useState(0)
  const [workoutLogs, setWorkoutLogs] = useState({}) // { trainingName: { completedIds: [], exerciseDetails: {} } }
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 })
  const [updating, setUpdating] = useState(false)
  
  // Estado para armazenar weight e reps de cada exercício
  // Estrutura: { "Treino A_0": { weight: 20, reps: 12 }, ... }
  const [exerciseInputs, setExerciseInputs] = useState({})

  // Data de hoje (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0]

  // Função para atualizar progresso baseado nos logs atuais
  const updateProgress = useCallback((planData) => {
    if (!planData) return
    
    let total = 0
    let completed = 0

    planData.trainings.forEach((training) => {
      const trainingName = training.name
      const exercises = training.exercises || []
      const log = workoutLogs[trainingName]
      const completedIds = log?.completedIds || []
      
      exercises.forEach((_, index) => {
        total++
        const exerciseId = getExerciseId(trainingName, index)
        if (completedIds.includes(exerciseId)) {
          completed++
        }
      })
    })

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    setProgress({ completed, total, percentage })
  }, [workoutLogs])

  // Carregar plano
  useEffect(() => {
    const loadPlan = async () => {
      if (!currentUser) return

      setLoading(true)
      const planData = await getStudentPlan(currentUser.uid)
      
      if (planData && planData.trainings && planData.trainings.length > 0) {
        setPlan(planData)
      } else {
        setPlan(null)
        setProgress({ completed: 0, total: 0, percentage: 0 })
      }
      setLoading(false)
    }

    loadPlan()
  }, [currentUser])

  // Subscrever logs de todos os treinos de hoje em tempo real
  useEffect(() => {
    if (!currentUser || !plan || !plan.trainings) return

    const unsubscribes = []

    // Subscrever log de cada treino
    plan.trainings.forEach((training) => {
      const trainingName = training.name
      
      const unsubscribe = subscribeToWorkoutLog(
        currentUser.uid,
        trainingName,
        (logData) => {
          setWorkoutLogs(prev => ({
            ...prev,
            [trainingName]: logData ? {
              completedIds: logData.completedExerciseIds || [],
              exerciseDetails: logData.exerciseDetails || {}
            } : {
              completedIds: [],
              exerciseDetails: {}
            }
          }))
        },
        today
      )
      
      unsubscribes.push(unsubscribe)
    })

    // Cleanup
    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [currentUser, plan, today])

  // Carregar dados salvos (weight/reps) dos exercícios quando logs são atualizados
  useEffect(() => {
    if (!plan) return

    const newInputs = {}

    plan.trainings.forEach((training) => {
      const trainingName = training.name
      const exercises = training.exercises || []
      const log = workoutLogs[trainingName]
      const exerciseDetails = log?.exerciseDetails || {}

      exercises.forEach((_, index) => {
        const exerciseId = getExerciseId(trainingName, index)
        const savedData = exerciseDetails[exerciseId]

        if (savedData) {
          newInputs[exerciseId] = {
            weight: savedData.weight || '',
            reps: savedData.reps || ''
          }
        } else {
          // Inicializar com valores vazios se não existe
          newInputs[exerciseId] = { weight: '', reps: '' }
        }
      })
    })

    setExerciseInputs(newInputs)
  }, [workoutLogs, plan])

  // Atualizar progresso quando logs mudarem
  useEffect(() => {
    if (plan) {
      updateProgress(plan)
    }
  }, [plan, workoutLogs, updateProgress])

  // Verificar se exercício está concluído hoje
  const isExerciseCompletedToday = (trainingName, exerciseIndex) => {
    const log = workoutLogs[trainingName]
    if (!log || !log.completedIds) return false
    
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    return log.completedIds.includes(exerciseId)
  }

  // Atualizar input de weight ou reps
  const handleInputChange = (trainingName, exerciseIndex, field, value) => {
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    setExerciseInputs(prev => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || { weight: '', reps: '' }),
        [field]: value
      }
    }))
  }

  // Salvar dados do exercício automaticamente se já estiver marcado
  const saveExerciseData = async (trainingIndex, exerciseIndex) => {
    if (!currentUser || !plan || updating) return

    const training = plan.trainings[trainingIndex]
    const trainingName = training.name
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    const isCompleted = isExerciseCompletedToday(trainingName, exerciseIndex)

    // Se o exercício está marcado, salvar os dados
    if (isCompleted) {
      const exerciseData = exerciseInputs[exerciseId] || { weight: '', reps: '' }
      
      try {
        await markExerciseAsCompleted(
          currentUser.uid,
          trainingName,
          exerciseIndex,
          {
            weight: exerciseData.weight || null,
            reps: exerciseData.reps || null
          },
          today
        )
      } catch (error) {
        console.error('Erro ao salvar dados do exercício:', error)
      }
    }
  }

  // Alternar estado de conclusão do exercício
  const handleToggleExercise = async (trainingIndex, exerciseIndex) => {
    if (!currentUser || !plan || updating) return

    const training = plan.trainings[trainingIndex]
    const trainingName = training.name
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    const isCompleted = isExerciseCompletedToday(trainingName, exerciseIndex)

    setUpdating(true)

    try {
      let result
      
      if (isCompleted) {
        // Desmarcar: remover do log
        result = await unmarkExerciseAsCompleted(
          currentUser.uid,
          trainingName,
          exerciseIndex,
          today
        )
      } else {
        // Marcar: salvar com weight e reps
        const exerciseData = exerciseInputs[exerciseId] || {}
        result = await markExerciseAsCompleted(
          currentUser.uid,
          trainingName,
          exerciseIndex,
          {
            weight: exerciseData.weight || null,
            reps: exerciseData.reps || null
          },
          today
        )
      }

      if (!result.success) {
        console.error('Erro ao atualizar exercício:', result.error)
      }
      // O progresso será atualizado automaticamente via useEffect quando os logs mudarem
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleWatchVideo = (videoUrl) => {
    if (videoUrl && videoUrl.trim()) {
      setSelectedVideo(videoUrl)
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <Loader2 className="w-12 h-12 text-neon-blue mx-auto mb-4 animate-spin" />
        <p className="text-gray-400">Carregando treinos...</p>
      </div>
    )
  }

  const trainings = plan?.trainings || []
  const activeTraining = trainings[activeTrainingTab] || null
  const exercises = activeTraining?.exercises || []

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-black uppercase mb-2">
          TREINOS DA SEMANA
        </h3>
        <p className="text-gray-300">
          Siga seu plano de treino diário e acompanhe sua evolução
        </p>
      </div>

      {/* Calendário de Streak */}
      <StreakCalendar />

      {/* Barra de Progresso */}
      {trainings.length > 0 && progress.total > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-neon-green" />
              <span className="text-sm font-bold uppercase text-gray-300">
                Progresso de Hoje
              </span>
            </div>
            <span className="text-sm font-black text-white">
              {progress.completed}/{progress.total} exercícios
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-6 overflow-hidden border border-zinc-700 relative">
            <div
              className="h-full bg-gradient-to-r from-neon-green to-neon-blue transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${progress.percentage}%` }}
            >
              {progress.percentage > 15 && (
                <span className="text-xs font-black text-white">
                  {progress.percentage}%
                </span>
              )}
            </div>
            {progress.percentage <= 15 && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-400">
                {progress.percentage}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Abas de Treinos */}
      {trainings.length > 0 ? (
        <div>
          {/* Navegação de Abas */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-zinc-800 overflow-x-auto">
              {trainings.map((training, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTrainingTab(index)}
                  className={`flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-wide transition-all relative whitespace-nowrap ${
                    activeTrainingTab === index
                      ? 'text-neon-blue'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Dumbbell className="w-5 h-5" />
                  {training.name}
                  {activeTrainingTab === index && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-glow-blue" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo do Treino Ativo */}
          {activeTraining && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Dumbbell className="w-6 h-6 text-neon-green" />
                <h4 className="text-xl font-black uppercase">{activeTraining.name}</h4>
              </div>

              {exercises.length > 0 ? (
                <div className="space-y-4">
                  {exercises.map((exercicio, index) => {
                    const completed = isExerciseCompletedToday(activeTraining.name, index)
                    const exerciseId = getExerciseId(activeTraining.name, index)
                    const exerciseData = exerciseInputs[exerciseId] || { weight: '', reps: '' }
                    
                    return (
                      <div
                        key={index}
                        className={`bg-zinc-800 border rounded-lg p-4 transition-all ${
                          completed 
                            ? 'border-neon-green bg-zinc-800/50' 
                            : 'border-zinc-700 hover:border-neon-blue'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Botão de Check */}
                          <button
                            onClick={() => handleToggleExercise(activeTrainingTab, index)}
                            disabled={updating}
                            className={`flex-shrink-0 p-2 rounded-full transition-all mt-1 ${
                              completed
                                ? 'bg-neon-green text-white hover:bg-neon-green/80'
                                : 'bg-zinc-700 text-gray-400 hover:bg-zinc-600 border border-zinc-600'
                            } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={completed ? 'Marcar como não concluído' : 'Marcar como concluído'}
                          >
                            {completed ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>

                          {/* Informações do Exercício */}
                          <div className={`flex-1 min-w-0 ${completed ? 'opacity-75' : ''}`}>
                            <h5 className={`font-bold mb-2 ${completed ? 'line-through text-gray-400' : 'text-white'}`}>
                              {exercicio.name}
                            </h5>
                            <p className="text-sm text-gray-400 mb-3">{exercicio.sets}</p>

                            {/* Inputs de Carga e Reps */}
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              {/* Input de Carga */}
                              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                                <Weight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                  type="number"
                                  placeholder="Carga (kg)"
                                  value={exerciseData.weight || ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : e.target.value
                                    handleInputChange(activeTraining.name, index, 'weight', value)
                                  }}
                                  onBlur={() => {
                                    // Salvar automaticamente ao sair do campo se já está marcado
                                    saveExerciseData(activeTrainingTab, index)
                                  }}
                                  disabled={updating}
                                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                                  min="0"
                                  step="0.5"
                                />
                                <span className="text-xs text-gray-500">kg</span>
                              </div>

                              {/* Input de Reps */}
                              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                                <Repeat className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                  type="number"
                                  placeholder="Reps"
                                  value={exerciseData.reps || ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : e.target.value
                                    handleInputChange(activeTraining.name, index, 'reps', value)
                                  }}
                                  onBlur={() => {
                                    // Salvar automaticamente ao sair do campo se já está marcado
                                    saveExerciseData(activeTrainingTab, index)
                                  }}
                                  disabled={updating}
                                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                                  min="0"
                                  step="1"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Botão de Vídeo */}
                          <div className="flex-shrink-0">
                            {exercicio.videoUrl && exercicio.videoUrl.trim() ? (
                              <button
                                onClick={() => handleWatchVideo(exercicio.videoUrl)}
                                className="btn-secondary flex items-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Ver Vídeo
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">Sem vídeo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Nenhum exercício cadastrado neste treino</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">Nenhum treino cadastrado ainda</p>
          <p className="text-sm text-gray-500 mt-2">
            Aguarde o Personal criar seu plano personalizado
          </p>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  )
}
