import { useState, useEffect } from 'react'
import { Clock, Loader2, Utensils, CheckCircle2, Circle, Apple } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getStudentPlan } from '../../utils/plans'
import { subscribeToMealLog, markMealAsCompleted, unmarkMealAsCompleted, isMealCompletedToday } from '../../utils/mealLogs'

export default function DietTab() {
  const { currentUser } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mealLog, setMealLog] = useState(null)
  const [updating, setUpdating] = useState(false)

  // Data de hoje (YYYY-MM-DD)
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

  // Subscrever log de refeições do dia
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

  // Alternar estado de conclusão da refeição
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
      <div className="card text-center py-12">
        <Loader2 className="w-12 h-12 text-neon-blue mx-auto mb-4 animate-spin" />
        <p className="text-gray-400">Carregando dieta...</p>
      </div>
    )
  }

  // Nova estrutura: array de refeições
  let meals = plan?.diet || []
  
  // Backward compatibility: Se for objeto antigo, converter
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

  // Calcular progresso de refeições
  const completedCount = mealLog?.completedMealIds?.length || 0
  const totalMeals = meals.length
  const progressPercentage = totalMeals > 0 ? Math.round((completedCount / totalMeals) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-black uppercase mb-2">
          PLANO ALIMENTAR
        </h3>
        <p className="text-gray-300">
          Suas refeições do dia
        </p>
      </div>

      {/* Barra de Progresso */}
      {hasMeals && totalMeals > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Apple className="w-5 h-5 text-neon-green" />
              <span className="text-sm font-bold uppercase text-gray-300">
                Refeições de Hoje
              </span>
            </div>
            <span className="text-sm font-black text-white">
              {completedCount}/{totalMeals} refeições
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-6 overflow-hidden border border-zinc-700 relative">
            <div
              className="h-full bg-gradient-to-r from-neon-green to-neon-blue transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage > 15 && (
                <span className="text-xs font-black text-white">
                  {progressPercentage}%
                </span>
              )}
            </div>
            {progressPercentage <= 15 && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-400">
                {progressPercentage}%
              </span>
            )}
          </div>
        </div>
      )}

      {hasMeals ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meals.map((meal, mealIndex) => {
            const completed = isMealCompletedToday(mealLog, mealIndex)
            const items = meal.items || []
            const macros = meal.macros || {}

            return (
              <div
                key={mealIndex}
                className={`card transition-all ${
                  completed
                    ? 'border-neon-green bg-zinc-800/50'
                    : 'border-zinc-800'
                }`}
              >
                {/* Header da Refeição */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-3 rounded-lg border ${
                      completed
                        ? 'bg-neon-green/10 border-neon-green'
                        : 'bg-zinc-800 border-zinc-700'
                    }`}>
                      <Utensils className={`w-6 h-6 ${
                        completed ? 'text-neon-green' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">{meal.time}</span>
                      </div>
                      <h4 className={`text-lg font-black uppercase ${
                        completed ? 'text-neon-green line-through' : 'text-white'
                      }`}>
                        {meal.title || `Refeição ${mealIndex + 1}`}
                      </h4>
                    </div>
                  </div>
                  {/* Botão de Check */}
                  <button
                    onClick={() => handleToggleMeal(mealIndex)}
                    disabled={updating}
                    className={`flex-shrink-0 p-2 rounded-full transition-all ${
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
                </div>

                {/* Tabela/Lista de Alimentos */}
                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-bold">
                                {item.name || 'Alimento'}
                              </span>
                              {item.quantity && item.unit && (
                                <span className="bg-zinc-700 text-gray-300 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                  {item.quantity}{item.unit}
                                </span>
                              )}
                            </div>
                            {item.substitution && item.substitution.trim() && (
                              <p className="text-xs text-gray-400 italic mt-1">
                                Opção de troca: {item.substitution}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhum alimento cadastrado
                  </div>
                )}

                {/* Macros no rodapé */}
                {(macros.kcal || macros.protein || macros.carbs || macros.fat) && (
                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {macros.kcal && (
                        <span className="flex items-center gap-1">
                          <Apple className="w-3 h-3" />
                          {macros.kcal}kcal
                        </span>
                      )}
                      {macros.protein && (
                        <span>P: {macros.protein}g</span>
                      )}
                      {macros.carbs && (
                        <span>C: {macros.carbs}g</span>
                      )}
                      {macros.fat && (
                        <span>G: {macros.fat}g</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Utensils className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">Nenhuma dieta cadastrada ainda</p>
          <p className="text-sm text-gray-500 mt-2">
            Aguarde o Personal criar seu plano alimentar
          </p>
        </div>
      )}
    </div>
  )
}
