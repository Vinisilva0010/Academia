import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Flame } from 'lucide-react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Componente de Calendário de Streak (Frequência de Treinos)
 * Mostra visualmente os dias que o usuário treinou na semana/mês
 */
export default function StreakCalendar() {
  const { currentUser } = useAuth()
  const [workoutDays, setWorkoutDays] = useState([]) // Array de datas no formato YYYY-MM-DD
  const [streakCount, setStreakCount] = useState(0) // Dias treinados na semana
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('week') // 'week' ou 'month'

  useEffect(() => {
    if (!currentUser) return

    const loadWorkoutDays = async () => {
      setLoading(true)
      try {
        // Buscar logs dos últimos 30 dias
        const logsRef = collection(db, 'users', currentUser.uid, 'workout_logs')
        
        // Buscar todos os logs (não há query de range de data fácil, então buscamos todos e filtramos)
        const logsSnapshot = await getDocs(logsRef)
        const days = []
        
        logsSnapshot.forEach((doc) => {
          const logData = doc.data()
          if (logData.date && logData.completedExerciseIds && logData.completedExerciseIds.length > 0) {
            // Verificar se realmente completou exercícios (não apenas criou o log vazio)
            // Converter data para string se for Timestamp
            let dateStr = logData.date
            if (dateStr && typeof dateStr === 'object' && dateStr.toDate) {
              dateStr = dateStr.toDate().toISOString().split('T')[0]
            } else if (dateStr && typeof dateStr === 'object') {
              dateStr = new Date(dateStr).toISOString().split('T')[0]
            }
            if (dateStr) {
              days.push(dateStr)
            }
          }
        })

        // Remover duplicatas (um dia pode ter múltiplos treinos)
        const uniqueDays = [...new Set(days)]
        
        // Ordenar por data (mais recente primeiro)
        uniqueDays.sort((a, b) => new Date(b) - new Date(a))
        
        setWorkoutDays(uniqueDays)

        // Calcular streak da semana atual
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay()) // Domingo como início da semana
        startOfWeek.setHours(0, 0, 0, 0)

        const weekDays = uniqueDays.filter(dateStr => {
          try {
            const date = new Date(dateStr + 'T00:00:00')
            return date >= startOfWeek
          } catch {
            return false
          }
        })

        setStreakCount(weekDays.length)
      } catch (error) {
        console.error('Erro ao carregar dias de treino:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWorkoutDays()

    // Recarregar a cada minuto para atualizar em tempo real
    const interval = setInterval(loadWorkoutDays, 60000)
    return () => clearInterval(interval)
  }, [currentUser])

  // Gerar dias da semana atual
  const getWeekDays = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Domingo = 0
    
    const days = []
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = dayNames[i]
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      const hasWorkout = workoutDays.includes(dateStr)
      
      days.push({
        date: dateStr,
        dayName,
        isToday,
        hasWorkout,
        dateObj: date
      })
    }
    
    return days
  }

  // Gerar dias do mês atual (compacto)
  const getMonthDays = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    const days = []
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = dayNames[date.getDay()]
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      const hasWorkout = workoutDays.includes(dateStr)
      
      days.push({
        date: dateStr,
        dayName,
        dayNumber: i,
        isToday,
        hasWorkout,
        dateObj: date
      })
    }
    
    return days
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <CalendarIcon className="w-5 h-5 text-neon-blue" />
          <h4 className="text-lg font-black uppercase">Frequência de Treinos</h4>
        </div>
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    )
  }

  const weekDays = getWeekDays()
  const monthDays = getMonthDays()
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-neon-blue" />
          <h4 className="text-lg font-black uppercase">Frequência de Treinos</h4>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
          className="text-xs text-gray-400 hover:text-neon-blue transition-colors uppercase font-bold"
        >
          {viewMode === 'week' ? 'Ver Mês' : 'Ver Semana'}
        </button>
      </div>

      {/* Estatística de Streak */}
      <div className="mb-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-neon-green" />
          <span className="text-sm font-bold text-gray-300">
            {streakCount > 0 
              ? `Você treinou ${streakCount} dia${streakCount > 1 ? 's' : ''} essa semana!`
              : 'Comece sua semana treinando hoje!'
            }
          </span>
        </div>
        {workoutDays.length > 0 && (
          <p className="text-xs text-gray-500">
            Total: {workoutDays.length} dia{workoutDays.length > 1 ? 's' : ''} treinado{workoutDays.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Visualização Semanal */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day.date}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                day.isToday
                  ? 'border-neon-blue bg-neon-blue/10 shadow-glow-blue'
                  : day.hasWorkout
                  ? 'border-neon-green bg-neon-green/10'
                  : 'border-zinc-700 bg-zinc-800/50'
              }`}
            >
              <span className={`text-xs font-bold mb-1 ${
                day.isToday ? 'text-neon-blue' : 'text-gray-400'
              }`}>
                {day.dayName}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                day.hasWorkout
                  ? 'bg-neon-green text-white shadow-glow-green'
                  : day.isToday
                  ? 'bg-neon-blue/20 text-neon-blue'
                  : 'bg-zinc-700 text-gray-600'
              }`}>
                {day.hasWorkout ? (
                  <div className="w-3 h-3 rounded-full bg-white" />
                ) : (
                  <span className="text-xs">
                    {day.dateObj.getDate()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visualização Mensal (Compacta) */}
      {viewMode === 'month' && (
        <div>
          <div className="mb-3">
            <h5 className="text-sm font-bold text-gray-300 uppercase mb-2">
              {monthName}
            </h5>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Headers dos dias */}
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((header, idx) => (
              <div key={idx} className="text-xs font-bold text-gray-500 py-1">
                {header}
              </div>
            ))}
            
            {/* Espaços vazios antes do primeiro dia */}
            {monthDays[0] && Array.from({ length: monthDays[0].dateObj.getDay() }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}
            
            {/* Dias do mês */}
            {monthDays.map((day) => (
              <div
                key={day.date}
                className={`h-8 flex items-center justify-center rounded relative ${
                  day.isToday
                    ? 'bg-neon-blue/20 border border-neon-blue'
                    : day.hasWorkout
                    ? 'bg-neon-green/20'
                    : ''
                }`}
                title={day.hasWorkout ? `Treinou em ${day.date}` : ''}
              >
                <span className={`text-xs font-bold ${
                  day.isToday ? 'text-neon-blue' : day.hasWorkout ? 'text-neon-green' : 'text-gray-400'
                }`}>
                  {day.dayNumber}
                </span>
                {day.hasWorkout && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-neon-green shadow-glow-green" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

