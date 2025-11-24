import { useState } from 'react'
import { 
  Save, 
  Scale, 
  Ruler, 
  Target, 
  Calendar, 
  AlertCircle,
  Loader2 
} from 'lucide-react'
import { saveAssessment, updateUserStatus } from '../../utils/assessments'
import { useAuth } from '../../contexts/AuthContext'

export default function AnamneseForm({ onSave }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    peso: '',
    altura: '',
    objetivo: '',
    diasDisponiveis: [],
    lesoes: ''
  })

  const objetivos = [
    'Perda de Peso',
    'Ganho de Massa',
    'Condicionamento Físico',
    'Força e Resistência',
    'Definição Muscular'
  ]

  const diasSemana = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ]

  const handleDiaToggle = (dia) => {
    setFormData(prev => ({
      ...prev,
      diasDisponiveis: prev.diasDisponiveis.includes(dia)
        ? prev.diasDisponiveis.filter(d => d !== dia)
        : [...prev.diasDisponiveis, dia]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validação
    if (!formData.peso || !formData.altura || !formData.objetivo || formData.diasDisponiveis.length === 0) {
      setError('Por favor, preencha todos os campos obrigatórios')
      setLoading(false)
      return
    }

    try {
      // Salvar anamnese
      const assessmentResult = await saveAssessment(currentUser.uid, {
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        objetivo: formData.objetivo,
        diasDisponiveis: formData.diasDisponiveis,
        lesoes: formData.lesoes || 'Nenhuma'
      })

      if (!assessmentResult.success) {
        throw new Error(assessmentResult.error)
      }

      // Atualizar status do usuário para 'pending'
      const statusResult = await updateUserStatus(currentUser.uid, 'pending')

      if (!statusResult.success) {
        throw new Error(statusResult.error)
      }

      // Chamar callback para atualizar estado
      if (onSave) {
        onSave()
      }
    } catch (err) {
      setError(err.message || 'Erro ao salvar anamnese')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="mb-8">
          <h2 className="text-3xl font-black uppercase mb-2">
            FORMULÁRIO DE ANAMNESE
          </h2>
          <p className="text-gray-300">
            Preencha suas informações para que possamos criar o melhor treino para você
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Peso */}
          <div>
            <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
              <Scale className="w-5 h-5 text-neon-blue" />
              Peso (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.peso}
              onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
              placeholder="Ex: 75.5"
              disabled={loading}
              required
            />
          </div>

          {/* Altura */}
          <div>
            <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
              <Ruler className="w-5 h-5 text-neon-green" />
              Altura (cm) *
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.altura}
              onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
              placeholder="Ex: 175"
              disabled={loading}
              required
            />
          </div>

          {/* Objetivo */}
          <div>
            <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
              <Target className="w-5 h-5 text-neon-blue" />
              Objetivo *
            </label>
            <select
              value={formData.objetivo}
              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
              disabled={loading}
              required
            >
              <option value="">Selecione um objetivo</option>
              {objetivos.map(obj => (
                <option key={obj} value={obj} className="bg-zinc-800">
                  {obj}
                </option>
              ))}
            </select>
          </div>

          {/* Dias Disponíveis */}
          <div>
            <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
              <Calendar className="w-5 h-5 text-neon-green" />
              Dias Disponíveis para Treino *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {diasSemana.map(dia => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => handleDiaToggle(dia)}
                  disabled={loading}
                  className={`px-4 py-3 rounded-lg border transition-all ${
                    formData.diasDisponiveis.includes(dia)
                      ? 'bg-neon-blue border-neon-blue text-white shadow-glow-blue'
                      : 'bg-zinc-800 border-zinc-700 text-gray-300 hover:border-neon-blue'
                  }`}
                >
                  {dia.split('-')[0]}
                </button>
              ))}
            </div>
            {formData.diasDisponiveis.length === 0 && (
              <p className="text-sm text-gray-400 mt-2">Selecione pelo menos um dia</p>
            )}
          </div>

          {/* Lesões */}
          <div>
            <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
              <AlertCircle className="w-5 h-5 text-neon-blue" />
              Lesões ou Limitações
            </label>
            <textarea
              value={formData.lesoes}
              onChange={(e) => setFormData({ ...formData, lesoes: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none"
              rows="4"
              placeholder="Descreva qualquer lesão, limitação ou observação importante..."
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Anamnese
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}



