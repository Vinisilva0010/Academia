import { useState, useEffect } from 'react'
import { 
  Save, 
  Scale, 
  Ruler, 
  Target, 
  Calendar, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  Moon,
  Droplet,
  Utensils,
  Pill,
  Wine,
  Dumbbell,
  Activity,
  Camera,
  CheckCircle2
} from 'lucide-react'
import { saveAssessment, updateUserStatus } from '../../utils/assessments'
import { useAuth } from '../../contexts/AuthContext'

export default function AnamneseForm({ onSave, onFormStart, onFormComplete }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const totalSteps = 4

  // Notificar que o formulário começou assim que o componente é montado
  useEffect(() => {
    if (onFormStart) {
      onFormStart()
    }
    
    // Cleanup: notificar que o formulário foi concluído quando o componente desmontar
    // (mas apenas se não foi submetido com sucesso)
    return () => {
      if (onFormComplete && !isSubmitted) {
        // Só chama se não foi submetido (caso contrário será chamado no handleSubmit)
        onFormComplete()
      }
    }
  }, []) // Executa apenas uma vez quando monta

  // Manter o formulário ativo enquanto não foi submetido
  // Isso previne redirecionamentos automáticos enquanto o usuário está preenchendo
  useEffect(() => {
    if (!isSubmitted && onFormStart) {
      onFormStart()
    }
  }, [currentStep, isSubmitted, onFormStart]) // Reforça a cada mudança de passo
  
  const [formData, setFormData] = useState({
    // Passo 1: Biometria e Estilo de Vida
    dataNascimento: '',
    genero: '',
    peso: '',
    altura: '',
    nivelAtividadeTrabalho: '',
    qualidadeSono: '',
    horasSono: '',
    consumoAgua: '',
    
    // Passo 2: Nutrição e Preferências
    refeicoesPorDia: '',
    alergias: '',
    alimentosPreferidos: '',
    suplementos: '',
    ingestaoAlcool: '',
    
    // Passo 3: Histórico de Treino e Saúde
    estaTreinando: '',
    tempoTreino: '',
    localTreino: '',
    lesoes: '',
    medicamentos: '',
    
    // Campos legados mantidos para compatibilidade
    objetivo: '',
    diasDisponiveis: []
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

  // Calcular idade a partir da data de nascimento
  const calcularIdade = () => {
    if (!formData.dataNascimento) return null
    const hoje = new Date()
    const nascimento = new Date(formData.dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mes = hoje.getMonth() - nascimento.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return idade
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDiaToggle = (dia) => {
    setFormData(prev => ({
      ...prev,
      diasDisponiveis: prev.diasDisponiveis.includes(dia)
        ? prev.diasDisponiveis.filter(d => d !== dia)
        : [...prev.diasDisponiveis, dia]
    }))
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.dataNascimento && formData.genero && formData.peso && formData.altura
      case 2:
        return formData.refeicoesPorDia
      case 3:
        return true // Passo 3 não tem campos obrigatórios além do legado
      case 4:
        return true // Passo 4 é apenas informativo
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        setError('')
      }
    } else {
      setError('Por favor, preencha todos os campos obrigatórios')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Proteção: prevenir múltiplos submits e garantir que está no último passo
    if (isSubmitted || loading || currentStep !== totalSteps) {
      return
    }

    setError('')
    setLoading(true)
    setIsSubmitted(true)

    // Validação final
    if (!validateStep(1) || !formData.objetivo || formData.diasDisponiveis.length === 0) {
      setError('Por favor, complete todos os passos obrigatórios')
      setLoading(false)
      setIsSubmitted(false)
      return
    }

    try {
      const idade = calcularIdade()
      
      // Salvar anamnese completa
      const assessmentResult = await saveAssessment(currentUser.uid, {
        // Passo 1
        dataNascimento: formData.dataNascimento,
        idade: idade || null,
        genero: formData.genero,
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        nivelAtividadeTrabalho: formData.nivelAtividadeTrabalho || null,
        qualidadeSono: formData.qualidadeSono ? parseInt(formData.qualidadeSono) : null,
        horasSono: formData.horasSono ? parseFloat(formData.horasSono) : null,
        consumoAgua: formData.consumoAgua ? parseFloat(formData.consumoAgua) : null,
        
        // Passo 2
        refeicoesPorDia: formData.refeicoesPorDia ? parseInt(formData.refeicoesPorDia) : null,
        alergias: formData.alergias || null,
        alimentosPreferidos: formData.alimentosPreferidos || null,
        suplementos: formData.suplementos || null,
        ingestaoAlcool: formData.ingestaoAlcool || null,
        
        // Passo 3
        estaTreinando: formData.estaTreinando || null,
        tempoTreino: formData.estaTreinando === 'Sim' ? (formData.tempoTreino || null) : null,
        localTreino: formData.localTreino || null,
        lesoes: formData.lesoes || 'Nenhuma',
        medicamentos: formData.medicamentos || null,
        
        // Campos legados (mantidos para compatibilidade)
        objetivo: formData.objetivo,
        diasDisponiveis: formData.diasDisponiveis
      })

      if (!assessmentResult.success) {
        throw new Error(assessmentResult.error)
      }

      // Atualizar status do usuário para 'pending'
      const statusResult = await updateUserStatus(currentUser.uid, 'pending')

      if (!statusResult.success) {
        throw new Error(statusResult.error)
      }

      // Aguardar um pouco antes de chamar o callback para garantir que tudo foi salvo
      await new Promise(resolve => setTimeout(resolve, 500))

      // Notificar que o formulário foi concluído
      if (onFormComplete) {
        onFormComplete()
      }

      // Chamar callback para atualizar estado
      if (onSave) {
        await onSave()
      }
      
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Erro ao salvar anamnese')
      setLoading(false)
      setIsSubmitted(false)
    }
  }

  const renderProgressBar = () => {
    const progress = (currentStep / totalSteps) * 100
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold uppercase text-gray-400">
            Passo {currentStep} de {totalSteps}
          </span>
          <span className="text-sm font-bold text-neon-blue">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-green to-neon-blue transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-8 h-8 text-neon-blue" />
        <div>
          <h3 className="text-2xl font-black uppercase">Biometria e Estilo de Vida</h3>
          <p className="text-gray-400 text-sm">Informações básicas sobre você</p>
        </div>
      </div>

      {/* Data de Nascimento */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Calendar className="w-5 h-5 text-neon-blue" />
          Data de Nascimento *
        </label>
        <input
          type="date"
          value={formData.dataNascimento}
          onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
          disabled={loading}
          required
        />
        {formData.dataNascimento && calcularIdade() !== null && (
          <p className="text-sm text-gray-400 mt-1">Idade: {calcularIdade()} anos</p>
        )}
      </div>

      {/* Gênero */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <User className="w-5 h-5 text-neon-green" />
          Gênero *
        </label>
        <select
          value={formData.genero}
          onChange={(e) => handleInputChange('genero', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
          disabled={loading}
          required
        >
          <option value="">Selecione</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Outro">Outro</option>
          <option value="Prefiro não informar">Prefiro não informar</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            onChange={(e) => handleInputChange('peso', e.target.value)}
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
            onChange={(e) => handleInputChange('altura', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
            placeholder="Ex: 175"
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Nível de Atividade no Trabalho */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Activity className="w-5 h-5 text-neon-blue" />
          Nível de Atividade no Trabalho
        </label>
        <select
          value={formData.nivelAtividadeTrabalho}
          onChange={(e) => handleInputChange('nivelAtividadeTrabalho', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
          disabled={loading}
        >
          <option value="">Selecione</option>
          <option value="Sedentário">Sedentário</option>
          <option value="Leve">Leve</option>
          <option value="Moderado">Moderado</option>
          <option value="Pesado">Pesado</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Qualidade do Sono */}
        <div>
          <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
            <Moon className="w-5 h-5 text-neon-green" />
            Qualidade do Sono (0-10)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.qualidadeSono}
            onChange={(e) => handleInputChange('qualidadeSono', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
            placeholder="Ex: 7"
            disabled={loading}
          />
        </div>

        {/* Horas de Sono */}
        <div>
          <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
            <Moon className="w-5 h-5 text-neon-blue" />
            Horas de Sono Médias
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            value={formData.horasSono}
            onChange={(e) => handleInputChange('horasSono', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
            placeholder="Ex: 7.5"
            disabled={loading}
          />
        </div>
      </div>

      {/* Consumo de Água */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Droplet className="w-5 h-5 text-neon-blue" />
          Consumo de Água Diário (L)
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={formData.consumoAgua}
          onChange={(e) => handleInputChange('consumoAgua', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
          placeholder="Ex: 2.5"
          disabled={loading}
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Utensils className="w-8 h-8 text-neon-green" />
        <div>
          <h3 className="text-2xl font-black uppercase">Nutrição e Preferências</h3>
          <p className="text-gray-400 text-sm">Conte-nos sobre seus hábitos alimentares</p>
        </div>
      </div>

      {/* Refeições por Dia */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Utensils className="w-5 h-5 text-neon-blue" />
          Quantas refeições prefere fazer por dia? *
        </label>
        <select
          value={formData.refeicoesPorDia}
          onChange={(e) => handleInputChange('refeicoesPorDia', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
          disabled={loading}
          required
        >
          <option value="">Selecione</option>
          <option value="2">2 refeições</option>
          <option value="3">3 refeições</option>
          <option value="4">4 refeições</option>
          <option value="5">5 refeições</option>
          <option value="6">6 refeições</option>
        </select>
      </div>

      {/* Alergias */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Alimentos que NÃO gosta / Alergias
        </label>
        <textarea
          value={formData.alergias}
          onChange={(e) => handleInputChange('alergias', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none"
          rows="3"
          placeholder="Ex: Não gosto de peixe. Tenho alergia a camarão e amendoim..."
          disabled={loading}
        />
        <p className="text-xs text-gray-400 mt-1">Importante: Informe qualquer alergia ou intolerância alimentar</p>
      </div>

      {/* Alimentos Preferidos */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Utensils className="w-5 h-5 text-neon-green" />
          Alimentos Preferidos
        </label>
        <textarea
          value={formData.alimentosPreferidos}
          onChange={(e) => handleInputChange('alimentosPreferidos', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none"
          rows="3"
          placeholder="Ex: Frango grelhado, batata doce, aveia, banana..."
          disabled={loading}
        />
        <p className="text-xs text-gray-400 mt-1">Vamos tentar incluir seus alimentos favoritos na dieta quando possível</p>
      </div>

      {/* Suplementos */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Pill className="w-5 h-5 text-neon-blue" />
          Uso de Suplementos
        </label>
        <textarea
          value={formData.suplementos}
          onChange={(e) => handleInputChange('suplementos', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none"
          rows="2"
          placeholder="Ex: Whey Protein, Creatina, Multivitamínico..."
          disabled={loading}
        />
      </div>

      {/* Ingestão de Álcool */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Wine className="w-5 h-5 text-neon-green" />
          Ingestão de Álcool
        </label>
        <select
          value={formData.ingestaoAlcool}
          onChange={(e) => handleInputChange('ingestaoAlcool', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
          disabled={loading}
        >
          <option value="">Selecione</option>
          <option value="Nunca">Nunca</option>
          <option value="Raramente (1x/mês)">Raramente (1x/mês)</option>
          <option value="Ocasionalmente (2-3x/mês)">Ocasionalmente (2-3x/mês)</option>
          <option value="Frequentemente (1-2x/semana)">Frequentemente (1-2x/semana)</option>
          <option value="Regularmente (3+ vezes/semana)">Regularmente (3+ vezes/semana)</option>
        </select>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Dumbbell className="w-8 h-8 text-neon-blue" />
        <div>
          <h3 className="text-2xl font-black uppercase">Histórico de Treino e Saúde</h3>
          <p className="text-gray-400 text-sm">Seu histórico físico e restrições</p>
        </div>
      </div>

      {/* Você está treinando atualmente? */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-3 uppercase text-sm tracking-wide">
          <Dumbbell className="w-5 h-5 text-neon-green" />
          Você está treinando atualmente? *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="estaTreinando"
              value="Sim"
              checked={formData.estaTreinando === 'Sim'}
              onChange={(e) => handleInputChange('estaTreinando', e.target.value)}
              disabled={loading}
              className="w-5 h-5 text-neon-blue bg-zinc-800 border-zinc-700 focus:ring-neon-blue focus:ring-2"
            />
            <span className="text-white font-medium group-hover:text-neon-green transition-colors">
              Sim
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="estaTreinando"
              value="Não"
              checked={formData.estaTreinando === 'Não'}
              onChange={(e) => handleInputChange('estaTreinando', e.target.value)}
              disabled={loading}
              className="w-5 h-5 text-neon-blue bg-zinc-800 border-zinc-700 focus:ring-neon-blue focus:ring-2"
            />
            <span className="text-white font-medium group-hover:text-neon-green transition-colors">
              Não
            </span>
          </label>
        </div>
      </div>

      {/* Tempo de Treino - Condicional */}
      {formData.estaTreinando === 'Sim' && (
        <div>
          <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
            <Dumbbell className="w-5 h-5 text-neon-blue" />
            Tempo de Treino
          </label>
          <select
            value={formData.tempoTreino}
            onChange={(e) => handleInputChange('tempoTreino', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
            disabled={loading}
          >
            <option value="">Selecione</option>
            <option value="Sedentário">Sedentário</option>
            <option value="Menos de 1 ano">Menos de 1 ano</option>
            <option value="1-3 anos">1-3 anos</option>
            <option value="Mais de 3 anos">Mais de 3 anos</option>
          </select>
        </div>
      )}

      {/* Local de Treino */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Dumbbell className="w-5 h-5 text-neon-blue" />
          Local de Treino
        </label>
        <select
          value={formData.localTreino}
          onChange={(e) => handleInputChange('localTreino', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
          disabled={loading}
        >
          <option value="">Selecione</option>
          <option value="Academia Completa">Academia Completa</option>
          <option value="Condomínio">Condomínio</option>
          <option value="Em Casa">Em Casa</option>
          <option value="Calistenia">Calistenia</option>
        </select>
      </div>

      {/* Lesões ou Dores Crônicas */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Lesões ou Dores Crônicas
        </label>
        <textarea
          value={formData.lesoes}
          onChange={(e) => handleInputChange('lesoes', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none"
          rows="4"
          placeholder="Descreva qualquer lesão, limitação ou observação importante. Se não houver, deixe em branco."
          disabled={loading}
        />
        <p className="text-xs text-red-400 mt-1">Para a sua própria segurança, detalhe qualquer dor ou lesão</p>
      </div>

      {/* Medicamentos */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Pill className="w-5 h-5 text-neon-blue" />
          Uso de Medicamentos
        </label>
        <textarea
          value={formData.medicamentos}
          onChange={(e) => handleInputChange('medicamentos', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none"
          rows="2"
          placeholder="Ex: Uso medicamentos para pressão alta, diabetes..."
          disabled={loading}
        />
      </div>

      {/* Objetivo (Campo Legado - Mantido) */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Target className="w-5 h-5 text-neon-green" />
          Objetivo Principal *
        </label>
        <select
          value={formData.objetivo}
          onChange={(e) => handleInputChange('objetivo', e.target.value)}
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

      {/* Dias Disponíveis (Campo Legado - Mantido) */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 uppercase text-sm tracking-wide">
          <Calendar className="w-5 h-5 text-neon-blue" />
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
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="w-8 h-8 text-neon-green" />
        <div>
          <h3 className="text-2xl font-black uppercase">Fotos do Físico</h3>
          <p className="text-gray-400 text-sm">Documentação visual (opcional)</p>
        </div>
      </div>

      <div className="card bg-zinc-800/50 border-2 border-dashed border-zinc-700 text-center py-12">
        <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
        <h4 className="text-xl font-black uppercase mb-2 text-gray-300">
          Envio de Fotos
        </h4>
        <p className="text-gray-400 mb-4 max-w-md mx-auto">
          O envio de fotos será solicitado pelo chat posteriormente, se necessário.
        </p>
        <p className="text-sm text-gray-500">
          Você poderá compartilhar fotos diretamente com seu personal trainer através do chat quando solicitado.
        </p>
      </div>

      {/* Resumo Final */}
      <div className="card bg-neon-green/10 border border-neon-green/30">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-neon-green flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black uppercase text-neon-green mb-2">
              Pronto para Finalizar!
            </h4>
            <p className="text-gray-300 text-sm">
              Revise todas as informações preenchidas. Ao clicar em "Salvar Anamnese", seu formulário será enviado e você aguardará a criação do seu plano personalizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="mb-8">
          <h2 className="text-3xl font-black uppercase mb-2">
            FORMULÁRIO DE ANAMNESE
          </h2>
          <p className="text-gray-300">
            Preencha suas informações em 4 passos para criarmos o melhor plano para você
          </p>
        </div>

        {renderProgressBar()}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Renderizar passo atual */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Navegação */}
          <div className="flex gap-4 pt-6 border-t border-zinc-800">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase px-6 py-3 rounded-lg border border-zinc-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
            )}

            <div className="flex-1" />

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="flex items-center justify-center gap-2 btn-primary"
              >
                Próximo
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || isSubmitted}
                onClick={(e) => {
                  e.preventDefault()
                  handleSubmit(e)
                }}
                className="flex items-center justify-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
