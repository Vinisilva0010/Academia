import { useState, useEffect } from 'react'
import { X, User, Scale, Ruler, Target, Calendar, AlertCircle, Plus, Trash2, Save, CheckCircle, Dumbbell, Clock, Utensils } from 'lucide-react'
import { getStudentData, savePlan, updateUserStatus, activateStudent } from '../../utils/admin'
import { getStudentPlan } from '../../utils/plans'
import { doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import StudentSummary from './StudentSummary'
import { exercisesDB, getMuscleGroups, getExercisesByGroup, findExercise } from '../../data/exercisesDB'

export default function PlanCreator({ student, onClose, onSuccess, editMode = false }) {
  const [loading, setLoading] = useState(false)
  const [studentData, setStudentData] = useState(null)
  const [existingPlan, setExistingPlan] = useState(null)
  const [activeTrainingTab, setActiveTrainingTab] = useState(0)
  const [activeTab, setActiveTab] = useState('training') // 'training' ou 'diet'
  const [trainings, setTrainings] = useState([
    { name: 'Treino A', exercises: [] }
  ])
  // Nova estrutura de dieta: array de refeições
  const [meals, setMeals] = useState([
    {
      title: 'Café da Manhã',
      time: '08:00',
      macros: { protein: '', carbs: '', fat: '', kcal: '' },
      items: []
    }
  ])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (student) {
      loadStudentData()
      if (editMode) {
        loadExistingPlan()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, editMode])

  const loadStudentData = async () => {
    setLoading(true)
    const data = await getStudentData(student.uid)
    setStudentData(data)
    setLoading(false)
  }

  const loadExistingPlan = async () => {
    try {
      const plan = await getStudentPlan(student.uid)
      if (plan) {
        setExistingPlan(plan)
        // Carregar treinos existentes
        if (plan.trainings && plan.trainings.length > 0) {
          // Normalizar exercícios: garantir que todos tenham os campos necessários
          const normalizedTrainings = plan.trainings.map(training => ({
            ...training,
            exercises: training.exercises.map(exercise => ({
              name: exercise.name || '',
              muscleGroup: exercise.muscleGroup || (exercise.name ? findExercise(exercise.name) : ''),
              sets: exercise.sets || '',
              recommendedWeight: exercise.recommendedWeight || '',
              videoUrl: exercise.videoUrl || ''
            }))
          }))
          setTrainings(normalizedTrainings)
          setActiveTrainingTab(0)
        }
        // Carregar dieta existente
        if (plan.diet) {
          // Se é array (nova estrutura), usar diretamente
          if (Array.isArray(plan.diet)) {
            setMeals(plan.diet)
          } else {
            // Se é objeto antigo (backward compatibility), converter
            const convertedMeals = []
            if (plan.diet.breakfast) {
              convertedMeals.push({
                title: 'Café da Manhã',
                time: '08:00',
                macros: {},
                items: formatLegacyDietText(plan.diet.breakfast)
              })
            }
            if (plan.diet.lunch) {
              convertedMeals.push({
                title: 'Almoço',
                time: '12:00',
                macros: {},
                items: formatLegacyDietText(plan.diet.lunch)
              })
            }
            if (plan.diet.snack) {
              convertedMeals.push({
                title: 'Lanche da Tarde',
                time: '15:30',
                macros: {},
                items: formatLegacyDietText(plan.diet.snack)
              })
            }
            if (plan.diet.dinner) {
              convertedMeals.push({
                title: 'Jantar',
                time: '19:00',
                macros: {},
                items: formatLegacyDietText(plan.diet.dinner)
              })
            }
            if (convertedMeals.length > 0) {
              setMeals(convertedMeals)
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar plano existente:', error)
    }
  }

  // Função auxiliar para converter texto legado em items
  const formatLegacyDietText = (text) => {
    if (!text || !text.trim()) return []
    const items = text.split(/[\n,]/).map(item => item.trim()).filter(Boolean)
    return items.map(item => ({
      name: item,
      quantity: '',
      unit: 'g',
      substitution: ''
    }))
  }

  const addTraining = () => {
    const trainingLetters = ['A', 'B', 'C', 'D', 'E', 'F']
    const nextLetter = trainingLetters[trainings.length] || String.fromCharCode(65 + trainings.length)
    const newTraining = { name: `Treino ${nextLetter}`, exercises: [] }
    setTrainings([...trainings, newTraining])
    setActiveTrainingTab(trainings.length)
  }

  const removeTraining = (index) => {
    if (trainings.length > 1) {
      const newTrainings = trainings.filter((_, i) => i !== index)
      setTrainings(newTrainings)
      if (activeTrainingTab >= newTrainings.length) {
        setActiveTrainingTab(newTrainings.length - 1)
      } else if (activeTrainingTab === index && index > 0) {
        setActiveTrainingTab(index - 1)
      }
    }
  }

  const updateTrainingName = (index, newName) => {
    const updated = [...trainings]
    updated[index].name = newName
    setTrainings(updated)
  }

  const addExercise = (trainingIndex) => {
    const updatedTrainings = [...trainings]
    updatedTrainings[trainingIndex].exercises.push({
      name: '',
      muscleGroup: '',
      sets: '',
      recommendedWeight: '',
      videoUrl: ''
    })
    setTrainings(updatedTrainings)
  }

  const removeExercise = (trainingIndex, exerciseIndex) => {
    const updatedTrainings = [...trainings]
    updatedTrainings[trainingIndex].exercises = updatedTrainings[trainingIndex].exercises.filter(
      (_, i) => i !== exerciseIndex
    )
    setTrainings(updatedTrainings)
  }

  const updateExercise = (trainingIndex, exerciseIndex, field, value) => {
    const updatedTrainings = [...trainings]
    updatedTrainings[trainingIndex].exercises[exerciseIndex][field] = value
    setTrainings(updatedTrainings)
  }

  // Funções para gerenciar refeições
  const addMeal = () => {
    setMeals([...meals, {
      title: '',
      time: '12:00',
      macros: { protein: '', carbs: '', fat: '', kcal: '' },
      items: []
    }])
  }

  const removeMeal = (index) => {
    if (meals.length > 1) {
      setMeals(meals.filter((_, i) => i !== index))
    }
  }

  const updateMeal = (index, field, value) => {
    const updated = [...meals]
    updated[index][field] = value
    setMeals(updated)
  }

  const updateMealMacro = (mealIndex, macro, value) => {
    const updated = [...meals]
    updated[mealIndex].macros[macro] = value
    setMeals(updated)
  }

  // Funções para gerenciar alimentos
  const addFoodItem = (mealIndex) => {
    const updated = [...meals]
    updated[mealIndex].items.push({
      name: '',
      quantity: '',
      unit: 'g',
      substitution: ''
    })
    setMeals(updated)
  }

  const removeFoodItem = (mealIndex, itemIndex) => {
    const updated = [...meals]
    updated[mealIndex].items = updated[mealIndex].items.filter((_, i) => i !== itemIndex)
    setMeals(updated)
  }

  const updateFoodItem = (mealIndex, itemIndex, field, value) => {
    const updated = [...meals]
    updated[mealIndex].items[itemIndex][field] = value
    setMeals(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validação básica
    const hasTrainings = trainings.some(t => t.exercises.length > 0)
    if (!hasTrainings) {
      setError('Adicione pelo menos um exercício em um treino')
      setLoading(false)
      return
    }

    try {
      const planData = {
        trainings,
        diet: meals // Nova estrutura: array de refeições
      }

      let result

      if (editMode && existingPlan) {
        // MODO EDIÇÃO: Atualizar plano existente
        const planRef = doc(db, 'plans', student.uid)
        await updateDoc(planRef, {
          trainings: planData.trainings,
          diet: planData.diet,
          updatedAt: new Date()
        })
        result = { success: true }
      } else {
        // MODO CRIAÇÃO: Criar novo plano e ativar aluno
        result = await activateStudent(student.uid, planData)
      }

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 2000)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      setError(err.message || 'Erro ao salvar plano')
      setLoading(false)
    }
  }

  if (loading && !studentData) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-400">Carregando dados do aluno...</div>
          </div>
        </div>
      </div>
    )
  }

  const assessment = studentData?.assessment

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="card max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <h2 className="text-3xl font-black uppercase">
            {editMode ? 'EDITAR PLANO' : 'CRIAR PLANO'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
            <h3 className="text-2xl font-black uppercase mb-2 text-neon-green">
              PLANO {editMode ? 'ATUALIZADO' : 'ENVIADO'} COM SUCESSO!
            </h3>
            <p className="text-gray-300">
              {editMode ? 'O plano foi atualizado com sucesso.' : 'O aluno foi ativado e recebeu o plano.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Resumo Completo do Aluno */}
            <div className="mb-8">
              <StudentSummary assessment={assessment} student={student} />
            </div>

            {/* Abas Treino/Dieta */}
            <div className="border-b border-zinc-800 mb-6">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('training')}
                  className={`px-6 py-3 font-bold uppercase transition-all relative ${
                    activeTab === 'training'
                      ? 'text-neon-blue'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Treinos
                  </div>
                  {activeTab === 'training' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-glow-blue" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('diet')}
                  className={`px-6 py-3 font-bold uppercase transition-all relative ${
                    activeTab === 'diet'
                      ? 'text-neon-blue'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    Dieta
                  </div>
                  {activeTab === 'diet' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-glow-blue" />
                  )}
                </button>
              </div>
            </div>

            {/* Sistema de Abas para Treinos */}
            {activeTab === 'training' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black uppercase flex items-center gap-2">
                    <Dumbbell className="w-6 h-6 text-neon-green" />
                    TREINOS
                  </h3>
                  <button
                    type="button"
                    onClick={addTraining}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Treino
                  </button>
                </div>

                {/* Abas de Treinos */}
                {trainings.length > 0 && (
                  <div className="mb-4">
                    <div className="flex gap-2 border-b border-zinc-800 overflow-x-auto">
                      {trainings.map((training, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveTrainingTab(index)}
                          className={`flex items-center gap-2 px-4 py-3 font-bold uppercase transition-all relative whitespace-nowrap ${
                            activeTrainingTab === index
                              ? 'text-neon-blue'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          <Dumbbell className="w-4 h-4" />
                          {training.name}
                          {activeTrainingTab === index && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-glow-blue" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conteúdo da Aba Ativa */}
                <div className="space-y-6">
                  {trainings.map((training, trainingIndex) => (
                    trainingIndex === activeTrainingTab && (
                      <div key={trainingIndex} className="card bg-zinc-800/50">
                        <div className="flex items-center justify-between mb-4">
                          <input
                            type="text"
                            value={training.name}
                            onChange={(e) => updateTrainingName(trainingIndex, e.target.value)}
                            className="text-xl font-black uppercase bg-transparent border-b-2 border-neon-blue pb-2 text-white focus:outline-none"
                            placeholder="Nome do Treino"
                          />
                          {trainings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTraining(trainingIndex)}
                              className="p-2 hover:bg-red-900/20 rounded-lg text-red-400 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {training.exercises.map((exercise, exerciseIndex) => {
                            // Tentar identificar o grupo muscular do exercício se já tiver nome
                            const currentMuscleGroup = exercise.muscleGroup || (exercise.name ? findExercise(exercise.name) : '')
                            const availableExercises = currentMuscleGroup ? getExercisesByGroup(currentMuscleGroup) : []
                            
                            return (
                              <div
                                key={exerciseIndex}
                                className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-3"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Grupo Muscular */}
                                  <div>
                                    <label className="block text-sm font-bold uppercase text-gray-300 mb-1">
                                      Grupo Muscular
                                    </label>
                                    <select
                                      value={currentMuscleGroup}
                                      onChange={(e) => {
                                        const group = e.target.value
                                        updateExercise(trainingIndex, exerciseIndex, 'muscleGroup', group)
                                        // Limpar o nome do exercício quando mudar o grupo
                                        if (group !== currentMuscleGroup) {
                                          updateExercise(trainingIndex, exerciseIndex, 'name', '')
                                        }
                                      }}
                                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                                    >
                                      <option value="">Selecione o grupo</option>
                                      {getMuscleGroups().map((group) => (
                                        <option key={group} value={group}>
                                          {group}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {/* Exercício */}
                                  <div>
                                    <label className="block text-sm font-bold uppercase text-gray-300 mb-1">
                                      Exercício
                                    </label>
                                    <select
                                      value={exercise.name}
                                      onChange={(e) => updateExercise(trainingIndex, exerciseIndex, 'name', e.target.value)}
                                      disabled={!currentMuscleGroup}
                                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="">
                                        {currentMuscleGroup ? 'Selecione o exercício' : 'Selecione primeiro o grupo'}
                                      </option>
                                      {availableExercises.map((ex) => (
                                        <option key={ex} value={ex}>
                                          {ex}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Séries e Repetições */}
                                  <div>
                                    <label className="block text-sm font-bold uppercase text-gray-300 mb-1">
                                      Séries e Repetições
                                    </label>
                                    <input
                                      type="text"
                                      value={exercise.sets || ''}
                                      onChange={(e) => updateExercise(trainingIndex, exerciseIndex, 'sets', e.target.value)}
                                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                                      placeholder="Ex: 4x8"
                                    />
                                  </div>
                                  {/* Recomendação de Carga/Peso */}
                                  <div>
                                    <label className="block text-sm font-bold uppercase text-gray-300 mb-1">
                                      Recomendação de Carga/Peso
                                    </label>
                                    <input
                                      type="text"
                                      value={exercise.recommendedWeight || ''}
                                      onChange={(e) => updateExercise(trainingIndex, exerciseIndex, 'recommendedWeight', e.target.value)}
                                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                                      placeholder="Ex: 20-25kg"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-bold uppercase text-gray-300 mb-1">
                                    Link do Vídeo (YouTube/Vimeo)
                                  </label>
                                  <input
                                    type="url"
                                    value={exercise.videoUrl || ''}
                                    onChange={(e) => updateExercise(trainingIndex, exerciseIndex, 'videoUrl', e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeExercise(trainingIndex, exerciseIndex)}
                                  className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remover Exercício
                                </button>
                              </div>
                            )
                          })}
                          <button
                            type="button"
                            onClick={() => addExercise(trainingIndex)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold uppercase px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar Exercício
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Formulário de Dieta Profissional */}
            {activeTab === 'diet' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black uppercase flex items-center gap-2">
                    <Utensils className="w-6 h-6 text-neon-green" />
                    DIETA
                  </h3>
                  <button
                    type="button"
                    onClick={addMeal}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Refeição
                  </button>
                </div>

                <div className="space-y-6">
                  {meals.map((meal, mealIndex) => (
                    <div key={mealIndex} className="card bg-zinc-800/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold uppercase text-gray-300 mb-2">
                              Nome da Refeição
                            </label>
                            <input
                              type="text"
                              value={meal.title}
                              onChange={(e) => updateMeal(mealIndex, 'title', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                              placeholder="Ex: Café da Manhã, Pré-Treino"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold uppercase text-gray-300 mb-2 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Horário Sugerido
                            </label>
                            <input
                              type="time"
                              value={meal.time}
                              onChange={(e) => updateMeal(mealIndex, 'time', e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                            />
                          </div>
                        </div>
                        {meals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMeal(mealIndex)}
                            className="ml-4 p-2 hover:bg-red-900/20 rounded-lg text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Macros (Opcional) */}
                      <div className="mb-4 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                          Macros (Opcional)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <input
                              type="number"
                              value={meal.macros.protein}
                              onChange={(e) => updateMealMacro(mealIndex, 'protein', e.target.value)}
                              placeholder="Proteína (g)"
                              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={meal.macros.carbs}
                              onChange={(e) => updateMealMacro(mealIndex, 'carbs', e.target.value)}
                              placeholder="Carbo (g)"
                              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={meal.macros.fat}
                              onChange={(e) => updateMealMacro(mealIndex, 'fat', e.target.value)}
                              placeholder="Gordura (g)"
                              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={meal.macros.kcal}
                              onChange={(e) => updateMealMacro(mealIndex, 'kcal', e.target.value)}
                              placeholder="Kcal Total"
                              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-blue"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Lista de Alimentos */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-bold uppercase text-gray-300">
                            Alimentos
                          </label>
                          <button
                            type="button"
                            onClick={() => addFoodItem(mealIndex)}
                            className="text-sm text-neon-blue hover:text-neon-blue/80 flex items-center gap-1 font-bold uppercase"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar Alimento
                          </button>
                        </div>

                        {meal.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-3"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                                  Nome do Alimento
                                </label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateFoodItem(mealIndex, itemIndex, 'name', e.target.value)}
                                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                                  placeholder="Ex: Arroz Branco"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                                    Quantidade
                                  </label>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateFoodItem(mealIndex, itemIndex, 'quantity', e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                                    placeholder="100"
                                    min="0"
                                    step="0.5"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                                    Unidade
                                  </label>
                                  <select
                                    value={item.unit}
                                    onChange={(e) => updateFoodItem(mealIndex, itemIndex, 'unit', e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                                  >
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="l">L</option>
                                    <option value="fatias">Fatias</option>
                                    <option value="unidades">Unidades</option>
                                    <option value="colheres">Colheres</option>
                                    <option value="xícaras">Xícaras</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                                Opção de Troca (Opcional)
                              </label>
                              <input
                                type="text"
                                value={item.substitution}
                                onChange={(e) => updateFoodItem(mealIndex, itemIndex, 'substitution', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neon-blue"
                                placeholder="Ex: Ou 120g de Batata Doce"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFoodItem(mealIndex, itemIndex)}
                              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remover Alimento
                            </button>
                          </div>
                        ))}

                        {meal.items.length === 0 && (
                          <div className="text-center py-6 text-gray-500 text-sm">
                            Nenhum alimento adicionado. Clique em "Adicionar Alimento" para começar.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase px-6 py-3 rounded-lg border border-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 ${
                  editMode ? 'btn-secondary' : 'btn-primary'
                }`}
              >
                <Save className="w-5 h-5" />
                {loading 
                  ? 'Salvando...' 
                  : editMode 
                    ? 'Salvar Alterações' 
                    : 'Ativar Aluno e Enviar'
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
