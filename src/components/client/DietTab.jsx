import { useState, useEffect } from 'react'
import { Clock, Loader2, Utensils, CheckCircle2, Circle, Apple, Flame, Wheat, Beef, Droplets } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getStudentPlan } from '../../utils/plans'
import { subscribeToMealLog, markMealAsCompleted, unmarkMealAsCompleted, isMealCompletedToday } from '../../utils/mealLogs'
import { useLanguage } from '../../contexts/LanguageContext'

export default function DietTab() {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mealLog, setMealLog] = useState(null)
  const [updating, setUpdating] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const loadPlan = async () => {
      if (!currentUser) return
      setLoading(true)
      const planData = await getStudentPlan(currentUser.uid)
      setPlan(planData)
      setLoading(false)
    }
    loadPlan()
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    const unsubscribe = subscribeToMealLog(
      currentUser.uid,
      (logData) => {
        setMealLog(logData)
      },
      today
    )
    return () => unsubscribe()
  }, [currentUser, today])

  const handleToggleMeal = async (mealIndex) => {
    if (!currentUser || updating) return
    const completed = isMealCompletedToday(mealLog, mealIndex)
    setUpdating(true)
    try {
      let result
      if (completed) {
        result = await unmarkMealAsCompleted(currentUser.uid, mealIndex, today)
      } else {
        result = await markMealAsCompleted(currentUser.uid, mealIndex, today)
      }
      if (!result.success) {
        console.error('Erro ao atualizar refeição:', result.error)
      }
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-neon-blue animate-spin mb-4" />
       
        <p className="text-zinc-500 font-bold animate-pulse">{t('general', 'loading')}</p>
      </div>
    )
  }

  // --- PREPARAÇÃO DE DADOS ---
  let meals = plan?.diet || []
  
  if (!Array.isArray(meals) && meals && typeof meals === 'object') {
    meals = []
    const mealConfig = [
      { key: 'breakfast', title: 'Café da Manhã', time: '08:00' },
      { key: 'lunch', title: 'Almoço', time: '12:00' },
      { key: 'snack', title: 'Lanche da Tarde', time: '15:30' },
      { key: 'dinner', title: 'Jantar', time: '19:00' }
    ]
    mealConfig.forEach(mealType => {
      if (plan.diet[mealType.key] && plan.diet[mealType.key].trim()) {
        meals.push({
          title: mealType.title,
          time: mealType.time,
          macros: {},
          items: plan.diet[mealType.key].split(/[\n,]/)
            .map(item => item.trim())
            .filter(Boolean)
            .map(item => ({
              name: item,
              quantity: '',
              unit: 'g',
              substitution: ''
            }))
        })
      }
    })
  }
  
  const hasMeals = Array.isArray(meals) && meals.length > 0
  const completedCount = mealLog?.completedMealIds?.length || 0
  const totalMeals = meals.length
  const progressPercentage = totalMeals > 0 ? Math.round((completedCount / totalMeals) * 100) : 0

  // --- RENDERIZAÇÃO VISUAL (PREMIUM) ---
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          {/* TÍTULO TRADUZIDO */}
          <h3 className="text-2xl font-black uppercase text-white tracking-tighter">
            {t('diet', 'title')}
          </h3>
          {/* SUBTÍTULO TRADUZIDO */}
          <p className="text-zinc-400 text-sm">{t('diet', 'subtitle')}</p>
        </div>
        
        {/* Contador Circular Pequeno */}
        <div className="flex flex-col items-end">
           {/* TEXTO 'META DIÁRIA' TRADUZIDO */}
           <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
             {t('diet', 'dailyGoal')}
           </span>
           <span className={`text-2xl font-black ${progressPercentage === 100 ? 'text-neon-green' : 'text-white'}`}>
             {completedCount}/{totalMeals}
           </span>
        </div>
      </div>

      {/* Barra de Progresso Nutricional */}
      {hasMeals && totalMeals > 0 && (
        <div className="relative h-4 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `${progressPercentage}%` }}
          >
             <div className="absolute right-0 top-0 h-full w-[2px] bg-white blur-[1px]" />
          </div>
        </div>
      )}

      {/* Lista de Refeições */}
      {hasMeals ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meals.map((meal, mealIndex) => {
            const completed = isMealCompletedToday(mealLog, mealIndex)
            const items = meal.items || []
            const macros = meal.macros || {}

            return (
              <div
                key={mealIndex}
                className={`
                  relative overflow-hidden rounded-2xl border transition-all duration-300 group
                  ${completed
                    ? 'bg-emerald-900/10 border-emerald-500/30 opacity-75'
                    : 'bg-zinc-900/60 backdrop-blur-md border-white/5 hover:border-neon-blue/30 hover:bg-zinc-900/80'
                  }
                `}
              >
                {/* Borda lateral indicadora */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${completed ? 'bg-emerald-500' : 'bg-zinc-800 group-hover:bg-neon-blue'}`} />

                <div className="p-5 pl-6">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${completed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                           {meal.time}
                        </div>
                      </div>
                      <h4 className={`text-lg font-black uppercase tracking-tight ${completed ? 'text-zinc-400 line-through decoration-emerald-500/50' : 'text-white'}`}>
                        {meal.title || `Refeição ${mealIndex + 1}`}
                      </h4>
                    </div>

                    {/* Botão Check */}
                    <button
                      onClick={() => handleToggleMeal(mealIndex)}
                      disabled={updating}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${completed
                          ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-110'
                          : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                        }
                      `}
                    >
                      {completed ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-zinc-600 group-hover:bg-white transition-colors" />}
                    </button>
                  </div>

                  {/* Lista de Itens */}
                  {items.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-start justify-between text-sm py-2 border-b border-white/5 last:border-0"
                        >
                          <div className="flex-1">
                            <span className={`font-medium ${completed ? 'text-zinc-500' : 'text-zinc-300'}`}>
                              {item.name || 'Alimento'}
                            </span>
                            {item.substitution && item.substitution.trim() && (
                              <p className="text-xs text-zinc-600 mt-0.5 italic">
                                ↺ Troca: {item.substitution}
                              </p>
                            )}
                          </div>
                          
                          {item.quantity && (
                            <span className="ml-3 font-mono text-xs font-bold text-neon-blue bg-neon-blue/10 px-2 py-1 rounded">
                              {item.quantity}{item.unit}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-zinc-600 text-xs italic">
                      Lista vazia
                    </div>
                  )}

                  {/* Footer de Macros (Tags Coloridas) */}
                  {(macros.kcal || macros.protein || macros.carbs || macros.fat) && (
                    <div className="flex flex-wrap gap-2 pt-3 mt-1 border-t border-white/5">
                      {macros.kcal && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-500 font-bold">
                          <Flame className="w-3 h-3" /> {macros.kcal}kcal
                        </div>
                      )}
                      {macros.protein && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-bold">
                          <Beef className="w-3 h-3" /> P: {macros.protein}g
                        </div>
                      )}
                      {macros.carbs && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold">
                          <Wheat className="w-3 h-3" /> C: {macros.carbs}g
                        </div>
                      )}
                      {macros.fat && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-bold">
                          <Droplets className="w-3 h-3" /> G: {macros.fat}g
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
    ) : (
      <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-white/5">
        <Utensils className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        
        <h3 className="text-xl font-bold text-white mb-2">{t('diet', 'empty')}</h3>
        
        <p className="text-zinc-500">{t('diet', 'waitDiet')}</p>
      </div>
    )}
  </div>
  )
}