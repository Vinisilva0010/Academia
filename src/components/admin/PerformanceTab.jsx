import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, MessageCircle, ChevronLeft, ChevronRight, X, Weight, Repeat } from 'lucide-react'
import { getAllWorkoutLogs, getWorkoutLogsByDate } from '../../utils/workoutLogs'
import { getStudentPlan } from '../../utils/plans'
import { getExerciseId } from '../../utils/workoutLogs'

export default function PerformanceTab({ studentId, studentName, onSendReminder, navigateToChat }) {
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedLogs, setSelectedLogs] = useState([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (studentId) {
      loadData()
    }
  }, [studentId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar plano para ter os nomes dos exercícios
      const planData = await getStudentPlan(studentId)
      setPlan(planData)

      // Carregar todos os logs
      const logs = await getAllWorkoutLogs(studentId)
      setWorkoutLogs(logs)
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular último treino
  const getLastWorkoutDate = () => {
    if (workoutLogs.length === 0) return null
    const lastLog = workoutLogs[0] // Já está ordenado por data descendente
    return lastLog.date
  }

  // Verificar se está há mais de 3 dias sem treinar
  const isStudentAbsent = () => {
    const lastDate = getLastWorkoutDate()
    if (!lastDate) return true // Nunca treinou

    const lastWorkout = new Date(lastDate)
    const today = new Date()
    const diffTime = today - lastWorkout
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 3
  }

  // Obter dias com treino para o calendário
  const getWorkoutDates = () => {
    const dates = new Set()
    workoutLogs.forEach(log => {
      if (log.date) {
        dates.add(log.date)
      }
    })
    return dates
  }

  // Renderizar calendário mensal
  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const workoutDates = getWorkoutDates()
    
    const days = []
    
    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        day,
        date: dateStr,
        hasWorkout: workoutDates.has(dateStr)
      })
    }

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black uppercase flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neon-green" />
            {monthNames[month]} {year}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-bold uppercase transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((dayData, index) => {
            if (dayData === null) {
              return <div key={index} className="aspect-square" />
            }

            const { day, date, hasWorkout } = dayData
            const isToday = date === new Date().toISOString().split('T')[0]
            
            return (
              <button
                key={index}
                onClick={() => {
                  if (hasWorkout) {
                    handleDateClick(date)
                  }
                }}
                className={`
                  aspect-square p-1 rounded-lg transition-all
                  ${isToday ? 'bg-neon-green/20 border-2 border-neon-green' : ''}
                  ${hasWorkout ? 'cursor-pointer hover:bg-neon-green/10' : ''}
                  ${!hasWorkout && !isToday ? 'hover:bg-zinc-800' : ''}
                `}
              >
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <span className={`text-sm font-bold ${isToday ? 'text-neon-green' : 'text-white'}`}>
                    {day}
                  </span>
                  {hasWorkout && (
                    <div className="w-2 h-2 bg-neon-green rounded-full mt-1 shadow-glow-green" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Timeline de atividades
  const renderTimeline = () => {
    // Agrupar logs por data
    const logsByDate = {}
    workoutLogs.forEach(log => {
      if (!logsByDate[log.date]) {
        logsByDate[log.date] = []
      }
      logsByDate[log.date].push(log)
    })

    const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a))

    if (sortedDates.length === 0) {
      return (
        <div className="card text-center py-8">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">Nenhum treino registrado ainda</p>
        </div>
      )
    }

    return (
      <div className="card">
        <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-neon-green" />
          Timeline de Atividades
        </h3>

        <div className="space-y-3">
          {sortedDates.map(date => {
            const logs = logsByDate[date]
            const dateObj = new Date(date)
            const formattedDate = dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })

            return (
              <button
                key={date}
                onClick={() => handleDateClick(date)}
                className="w-full text-left bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-neon-green/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-neon-green rounded-full shadow-glow-green" />
                    <div>
                      <p className="font-bold text-white">
                        Dia {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </p>
                      <div className="space-y-1 mt-1">
                        {logs.map((log, index) => (
                          <p key={index} className="text-sm text-neon-green font-semibold">
                            {log.trainingName} Concluído
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Lidar com clique em uma data
  const handleDateClick = async (date) => {
    const logs = await getWorkoutLogsByDate(studentId, date)
    setSelectedLogs(logs)
    setSelectedDate(date)
    setShowDetailsModal(true)
  }

  // Formatar nome do exercício
  const getExerciseName = (trainingName, exerciseIndex) => {
    if (!plan || !plan.trainings) return `Exercício ${exerciseIndex + 1}`
    
    const training = plan.trainings.find(t => t.name === trainingName)
    if (!training || !training.exercises) return `Exercício ${exerciseIndex + 1}`
    
    const exercise = training.exercises[exerciseIndex]
    return exercise?.name || `Exercício ${exerciseIndex + 1}`
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="animate-pulse text-gray-400">Carregando dados de performance...</div>
      </div>
    )
  }

  const absent = isStudentAbsent()
  const lastDate = getLastWorkoutDate()
  const daysSinceLastWorkout = lastDate 
    ? Math.floor((new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      {/* Alerta de Aluno Ausente */}
      {absent && (
        <div className="card bg-yellow-900/20 border-2 border-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <div>
                <h4 className="font-black uppercase text-yellow-500 mb-1">
                  Aluno Ausente
                </h4>
                <p className="text-sm text-gray-300">
                  {lastDate 
                    ? `Último treino há ${daysSinceLastWorkout} dia(s)`
                    : 'Nenhum treino registrado ainda'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (navigateToChat) {
                  const firstName = (studentName || '').split(' ')[0] || 'Aluno'
                  navigateToChat(`Opa ${firstName}, vi que você não treinou nos últimos dias. Aconteceu alguma coisa?`)
                } else if (onSendReminder) {
                  onSendReminder()
                }
              }}
              className="btn-primary flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Enviar Cobrança
            </button>
          </div>
        </div>
      )}

      {/* Calendário */}
      {renderCalendar()}

      {/* Timeline */}
      {renderTimeline()}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedDate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase">
                Detalhes do Treino - {new Date(selectedDate).toLocaleDateString('pt-BR')}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {selectedLogs.map((log, logIndex) => (
                <div key={logIndex} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <h4 className="font-black uppercase text-neon-green mb-3">
                    {log.trainingName}
                  </h4>
                  
                  <div className="space-y-3">
                    {log.completedExerciseIds.map((exerciseId, index) => {
                      const details = log.exerciseDetails[exerciseId] || {}
                      // Extrair índice do exercício do ID (formato: "Treino A_0")
                      const exerciseIndex = parseInt(exerciseId.split('_')[1]) || index
                      const exerciseName = getExerciseName(log.trainingName, exerciseIndex)
                      
                      return (
                        <div key={index} className="flex items-center justify-between bg-zinc-900 rounded-lg p-3">
                          <div className="flex-1">
                            <p className="font-bold text-white">{exerciseName}</p>
                            <div className="flex gap-4 mt-1">
                              {details.weight && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Weight className="w-4 h-4" />
                                  <span>{details.weight} kg</span>
                                </div>
                              )}
                              {details.reps && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Repeat className="w-4 h-4" />
                                  <span>{details.reps} reps</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

