import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Flame, ChevronRight, Trophy } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Componente de Calendário de Streak (Frequência de Treinos)
 * Versão: Cyberpunk Premium
 */
export default function StreakCalendar() {
  // --- LÓGICA (MANTIDA ORIGINAL) ---
  const { currentUser } = useAuth()
  const [workoutDays, setWorkoutDays] = useState([]) 
  const [streakCount, setStreakCount] = useState(0) 
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('week') 

  useEffect(() => {
    if (!currentUser) return

    const loadWorkoutDays = async () => {
      setLoading(true)
      try {
        const logsRef = collection(db, 'users', currentUser.uid, 'workout_logs')
        const logsSnapshot = await getDocs(logsRef)
        const days = []
        
        logsSnapshot.forEach((doc) => {
          const logData = doc.data()
          if (logData.date && logData.completedExerciseIds && logData.completedExerciseIds.length > 0) {
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

        const uniqueDays = [...new Set(days)]
        uniqueDays.sort((a, b) => new Date(b) - new Date(a))
        setWorkoutDays(uniqueDays)

        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay()) 
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
    const interval = setInterval(loadWorkoutDays, 60000)
    return () => clearInterval(interval)
  }, [currentUser])

  const getWeekDays = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) 
    
    const days = []
    const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
    
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

  const getMonthDays = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    const days = []
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split('T')[0]
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      const hasWorkout = workoutDays.includes(dateStr)
      
      days.push({
        date: dateStr,
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
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-8 w-1/3 bg-zinc-800 rounded mb-2"></div>
        <div className="h-20 bg-zinc-800 rounded-xl"></div>
      </div>
    )
  }

  const weekDays = getWeekDays()
  const monthDays = getMonthDays()
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // --- RENDERIZAÇÃO VISUAL (PREMIUM) ---
  return (
    <div className="w-full">
      
      {/* 1. Header do Calendário */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-neon-blue/10 rounded-lg border border-neon-blue/20">
             <CalendarIcon className="w-4 h-4 text-neon-blue" />
          </div>
          <h4 className="text-sm font-black uppercase tracking-wider text-white">
            FREQUÊNCIA
          </h4>
        </div>
        
        {/* Toggle Button Estilizado */}
        <button
          onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
          className="group flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-white uppercase transition-colors bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-600"
        >
          {viewMode === 'week' ? 'Ver Mês' : 'Ver Semana'}
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 2. Banner de Streak (Fogo) */}
      <div className="mb-6 relative overflow-hidden rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-900/10 to-red-900/10 p-4 group">
        <div className="absolute inset-0 bg-orange-500/5 blur-xl group-hover:bg-orange-500/10 transition-all duration-500" />
        
        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-full border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    <Flame className="w-6 h-6 text-orange-500 animate-pulse fill-orange-500/20" />
                </div>
                <div>
                    <h5 className="text-white font-black italic text-lg leading-none">
                        {streakCount} {streakCount === 1 ? 'DIA' : 'DIAS'}
                    </h5>
                    <p className="text-[10px] font-bold text-orange-400/80 uppercase tracking-wide mt-1">
                        FOCO TOTAL NESTA SEMANA
                    </p>
                </div>
            </div>
            
            {/* Ícone de Troféu Decorativo */}
            <Trophy className="w-12 h-12 text-zinc-800/50 absolute right-2 -bottom-2 rotate-12" />
        </div>
      </div>

      {/* 3. Visualização Semanal (Cápsulas) */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {weekDays.map((day) => (
            <div
              key={day.date}
              className={`
                relative flex flex-col items-center justify-center py-3 px-1 rounded-2xl border transition-all duration-300
                ${day.isToday 
                  ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_10px_rgba(6,182,212,0.2)] scale-105 z-10' 
                  : day.hasWorkout
                  ? 'border-emerald-500/30 bg-emerald-900/20'
                  : 'border-zinc-800 bg-zinc-900/40 opacity-60'
                }
              `}
            >
              {/* Dia da Semana */}
              <span className={`text-[9px] font-black tracking-tighter mb-2 ${
                day.isToday ? 'text-neon-blue' : 'text-zinc-500'
              }`}>
                {day.dayName}
              </span>

              {/* Indicador (Círculo ou Check) */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                ${day.hasWorkout
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110'
                  : day.isToday
                  ? 'bg-transparent border-2 border-neon-blue text-neon-blue'
                  : 'bg-zinc-800 text-zinc-600'
                }
              `}>
                {day.hasWorkout ? (
                  <Flame className="w-4 h-4 fill-black" />
                ) : (
                  <span className="text-xs font-bold">{day.dateObj.getDate()}</span>
                )}
              </div>
              
              {/* Brilho no fundo se treinou */}
              {day.hasWorkout && (
                 <div className="absolute inset-0 bg-emerald-500/10 blur-md rounded-2xl -z-10" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. Visualização Mensal (Data Grid) */}
      {viewMode === 'month' && (
        <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800">
          <div className="mb-4 flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
             <h5 className="text-xs font-bold text-white uppercase tracking-widest">
                {monthName}
             </h5>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((header, idx) => (
              <div key={idx} className="text-[10px] font-bold text-zinc-600 py-1">
                {header}
              </div>
            ))}
            
            {monthDays[0] && Array.from({ length: monthDays[0].dateObj.getDay() }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}
            
            {monthDays.map((day) => (
              <div
                key={day.date}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-xs font-bold relative transition-all
                  ${day.isToday
                    ? 'text-neon-blue border border-neon-blue/50 bg-neon-blue/10'
                    : day.hasWorkout
                    ? 'text-white bg-emerald-500/20' // Green background for workout days
                    : 'text-zinc-600 hover:bg-zinc-800'
                  }
                `}
              >
                {day.dayNumber}
                
                {/* Ponto brilhante se treinou */}
                {day.hasWorkout && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}