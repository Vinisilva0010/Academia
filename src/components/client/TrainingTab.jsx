import { useState, useEffect, useCallback } from 'react'
import { Play, Dumbbell, Loader2, CheckCircle2, Circle, Weight, Repeat, Trophy } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getStudentPlan } from '../../utils/plans'
import { 
  markExerciseAsCompleted, 
  unmarkExerciseAsCompleted, 
  subscribeToWorkoutLog,
  getExerciseId
} from '../../utils/workoutLogs'
import VideoPlayer from '../VideoPlayer'
import StreakCalendar from './StreakCalendar'
import { useLanguage } from '../../contexts/LanguageContext' 

export default function TrainingTab() {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [activeTrainingTab, setActiveTrainingTab] = useState(0)
  const [workoutLogs, setWorkoutLogs] = useState({}) 
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 })
  const [updating, setUpdating] = useState(false)
  const [exerciseInputs, setExerciseInputs] = useState({})
  const today = new Date().toISOString().split('T')[0]

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

  useEffect(() => {
    if (!currentUser || !plan || !plan.trainings) return
    const unsubscribes = []
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
    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [currentUser, plan, today])

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
          newInputs[exerciseId] = { weight: '', reps: '' }
        }
      })
    })
    setExerciseInputs(newInputs)
  }, [workoutLogs, plan])

  useEffect(() => {
    if (plan) {
      updateProgress(plan)
    }
  }, [plan, workoutLogs, updateProgress])

  const isExerciseCompletedToday = (trainingName, exerciseIndex) => {
    const log = workoutLogs[trainingName]
    if (!log || !log.completedIds) return false
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    return log.completedIds.includes(exerciseId)
  }

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

  const saveExerciseData = async (trainingIndex, exerciseIndex) => {
    if (!currentUser || !plan || updating) return
    const training = plan.trainings[trainingIndex]
    const trainingName = training.name
    const exerciseId = getExerciseId(trainingName, exerciseIndex)
    const isCompleted = isExerciseCompletedToday(trainingName, exerciseIndex)
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
        result = await unmarkExerciseAsCompleted(
          currentUser.uid,
          trainingName,
          exerciseIndex,
          today
        )
      } else {
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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-neon-blue animate-spin mb-4" />
        {/* TROQUE O TEXTO FIXO POR ISSO: */}
        <p className="text-zinc-500 font-bold animate-pulse">{t('general', 'loading')}</p>
      </div>
    )
  }

  // --- PREPARAÇÃO DE DADOS VISUAIS ---
  const trainings = plan?.trainings || []
  const activeTraining = trainings[activeTrainingTab] || null
  const exercises = activeTraining?.exercises || []
  const currentWorkoutName = activeTraining?.name;
  const totalExercises = exercises.length;
  const completedCount = workoutLogs[currentWorkoutName]?.completedIds?.length || 0;
  const dailyProgress = totalExercises === 0 ? 0 : Math.round((completedCount / totalExercises) * 100);

  // --- RENDERIZAÇÃO VISUAL (AQUI ESTÁ A MÁGICA DO DESIGN) ---
  return (
    <div className="pb-20 space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Header & Calendar Wrapper */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
           
            <h3 className="text-2xl font-black italic text-white tracking-tighter">
              {t('training', 'title')}
            </h3>
            
            <p className="text-zinc-400 text-sm">{t('training', 'subtitle')}</p>
          </div>
          <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
        </div>
        
        {/* Envelopando o Calendar em um card Glass */}
        <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4">
           <StreakCalendar />
        </div>
      </div>

      {/* 2. BARRA DE PROGRESSO HERO (LÍQUIDO) */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-purple-500/5 pointer-events-none" />
        
        <div className="p-6 relative z-10">
        <div className="flex justify-between items-end mb-4">
            <div>
              {/* TROQUE 'Meta do Dia' POR: */}
              <p className="text-[10px] font-black tracking-[0.2em] text-neon-blue uppercase mb-1">
                {t('training', 'todayGoal')}
              </p>
              {/* TROQUE A MENSAGEM DE STATUS POR: */}
              <h2 className="text-3xl font-black italic text-white tracking-tighter">
                {dailyProgress === 100 ? t('training', 'completed') : t('training', 'inProgress')}
              </h2>
            </div>
          </div>

          {/* O Tubo de Progresso */}
          <div className="h-6 bg-black/50 rounded-full border border-white/5 overflow-hidden relative">
            {/* O Líquido */}
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(6,182,212,0.6)]"
              style={{ width: `${dailyProgress}%` }}
            >
              <div className="absolute right-0 top-0 h-full w-[2px] bg-white blur-[2px]" />
            </div>
          </div>
          <div className="flex justify-between mt-3 text-xs font-bold text-zinc-500">
             
             <span>{t('training', 'start')}</span>
             <span className={dailyProgress === 100 ? 'text-neon-green' : ''}>
               {completedCount}/{totalExercises} {t('training', 'exercises')}
             </span>
          </div>
        </div>
      </div>

      {/* 3. CONTEÚDO DOS TREINOS */}
      {trainings.length > 0 ? (
        <div>
          {/* NAVEGAÇÃO HORIZONTAL DE TREINOS (Estilo Chips) */}
          <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide mb-2">
            {trainings.map((training, index) => {
               const isActive = activeTrainingTab === index
               return (
                <button
                  key={index}
                  onClick={() => setActiveTrainingTab(index)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-full font-bold uppercase text-xs tracking-wider transition-all duration-300 whitespace-nowrap border
                    ${isActive 
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' 
                      : 'bg-zinc-900/80 text-zinc-500 border-zinc-800 hover:border-zinc-600'
                    }
                  `}
                >
                  <Dumbbell className={`w-4 h-4 ${isActive ? 'fill-black' : ''}`} />
                  {training.name}
                </button>
               )
            })}
          </div>

          {/* LISTA DE EXERCÍCIOS */}
          {activeTraining && (
            <div className="space-y-4">
              {exercises.length > 0 ? (
                exercises.map((exercicio, index) => {
                  const completed = isExerciseCompletedToday(activeTraining.name, index)
                  const exerciseId = getExerciseId(activeTraining.name, index)
                  const exerciseData = exerciseInputs[exerciseId] || { weight: '', reps: '' }
                  
                  return (
                    <div
                      key={index}
                      className={`
                        relative overflow-hidden rounded-2xl p-5 transition-all duration-300 border group
                        ${completed 
                          ? 'bg-emerald-900/10 border-emerald-500/30 opacity-70' 
                          : 'bg-zinc-900/60 backdrop-blur-sm border-white/5 hover:border-neon-blue/30 hover:bg-zinc-900/80'
                        }
                      `}
                    >
                      {/* Borda lateral colorida para indicar status */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${completed ? 'bg-emerald-500' : 'bg-zinc-700 group-hover:bg-neon-blue'}`} />

                      <div className="flex gap-4">
                        {/* Checkbox Customizado Grande */}
                        <button
                          onClick={() => handleToggleExercise(activeTrainingTab, index)}
                          disabled={updating}
                          className={`
                            flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 border-2
                            ${completed
                              ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                              : 'bg-black/20 border-zinc-700 hover:border-neon-blue'
                            }
                          `}
                        >
                           {completed ? <CheckCircle2 className="w-8 h-8 text-white" /> : <div className="w-4 h-4 rounded-full bg-zinc-700 group-hover:bg-neon-blue transition-colors" />}
                        </button>

                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <h4 className={`text-lg font-black uppercase leading-tight ${completed ? 'text-zinc-400 line-through decoration-emerald-500/50' : 'text-white'}`}>
                                  {exercicio.name}
                                </h4>
                                <p className="text-xs text-neon-blue font-bold mt-1 tracking-wide">
                                  {exercicio.sets} SÉRIES
                                </p>
                             </div>
                             
                             {/* Botão de Vídeo (Pequeno e discreto) */}
                             {exercicio.videoUrl && (
                                <button 
                                  onClick={() => handleWatchVideo(exercicio.videoUrl)}
                                  className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                </button>
                             )}
                          </div>

                          {/* Inputs Estilizados (Displays Digitais) */}
                          <div className={`grid grid-cols-2 gap-3 mt-4 transition-opacity ${completed ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                             {/* Peso */}
                             <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex items-center gap-2 focus-within:border-neon-blue/50 transition-colors">
                                <Weight className="w-4 h-4 text-zinc-500" />
                                <input 
                                  type="number" 
                                  placeholder="Kg"
                                  value={exerciseData.weight || ''}
                                  onChange={(e) => handleInputChange(activeTraining.name, index, 'weight', e.target.value)}
                                  onBlur={() => saveExerciseData(activeTrainingTab, index)}
                                  className="bg-transparent w-full text-white font-mono text-sm outline-none placeholder-zinc-700"
                                />
                             </div>
                             
                             {/* Repetições */}
                             <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex items-center gap-2 focus-within:border-purple-500/50 transition-colors">
                                <Repeat className="w-4 h-4 text-zinc-500" />
                                <input 
                                  type="number" 
                                  placeholder="Reps"
                                  value={exerciseData.reps || ''}
                                  onChange={(e) => handleInputChange(activeTraining.name, index, 'reps', e.target.value)}
                                  onBlur={() => saveExerciseData(activeTrainingTab, index)}
                                  className="bg-transparent w-full text-white font-mono text-sm outline-none placeholder-zinc-700"
                                />
                             </div>
                          </div>
                          
                          {exercicio.recommendedWeight && (
                            <p className="text-[10px] text-zinc-500 mt-2 text-right">
                              Meta: <span className="text-white">{exercicio.recommendedWeight}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                  <p className="text-zinc-500">Nenhum exercício neste treino.</p>
                </div>
              )}
            </div>
          )}
        </div>
     ) : (
      <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-white/5">
        <Dumbbell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        
        <h3 className="text-xl font-bold text-white mb-2">{t('training', 'noPlan')}</h3>
        <p className="text-zinc-500">{t('training', 'waitPlan')}</p>
      </div>
    )}

      {/* Video Modal */}
      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  )
}