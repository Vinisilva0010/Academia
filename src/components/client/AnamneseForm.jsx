import { useState, useEffect } from 'react'
import { 
  Save, Scale, Ruler, Target, Calendar, AlertCircle, Loader2, ChevronRight, 
  ChevronLeft, User, Moon, Droplet, Utensils, Pill, Wine, Dumbbell, Activity, 
  Camera, CheckCircle2
} from 'lucide-react'
import { uploadProfileImage } from '../../utils/imageUpload'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { saveAssessment, updateUserStatus } from '../../utils/assessments'
import { useAuth } from '../../contexts/AuthContext'

export default function AnamneseForm({ onSave, onFormStart, onFormComplete }) {
  const { currentUser } = useAuth()
  
  // --- ESTADOS DO FORMULÁRIO ---
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // --- ESTADOS DA FOTO (NOVO) ---
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  // --- TRAVA DE SEGURANÇA (NOVO) ---
  // Impede que cliques rápidos pulem etapas sem querer
  const [isNavigating, setIsNavigating] = useState(false)

  const totalSteps = 4

  // Notificar montagem
  useEffect(() => {
    if (onFormStart) onFormStart()
    return () => {
      if (onFormComplete && !isSubmitted) onFormComplete()
    }
  }, [])

  useEffect(() => {
    if (!isSubmitted && onFormStart) onFormStart()
  }, [currentStep, isSubmitted, onFormStart])

  // --- DADOS (SEU CÓDIGO MANTIDO) ---
  const [formData, setFormData] = useState({
    dataNascimento: '', genero: '', peso: '', altura: '', nivelAtividadeTrabalho: '',
    qualidadeSono: '', horasSono: '', consumoAgua: '',
    refeicoesPorDia: '', alergias: '', alimentosPreferidos: '', suplementos: '', ingestaoAlcool: '',
    estaTreinando: '', tempoTreino: '', localTreino: '', lesoes: '', medicamentos: '',
    objetivo: '', diasDisponiveis: []
  })

  const objetivos = ['Perda de Peso', 'Ganho de Massa', 'Condicionamento Físico', 'Força e Resistência', 'Definição Muscular']
  const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']

  const calcularIdade = () => {
    if (!formData.dataNascimento) return null
    const hoje = new Date()
    const nascimento = new Date(formData.dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mes = hoje.getMonth() - nascimento.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--
    return idade
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDiaToggle = (dia) => {
    setFormData(prev => ({
      ...prev,
      diasDisponiveis: prev.diasDisponiveis.includes(dia)
        ? prev.diasDisponiveis.filter(d => d !== dia)
        : [...prev.diasDisponiveis, dia]
    }))
  }

  // --- VALIDAÇÃO ---
  const validateStep = (step) => {
    switch (step) {
      case 1: return formData.dataNascimento && formData.genero && formData.peso && formData.altura
      case 2: return formData.refeicoesPorDia
      default: return true
    }
  }

  // --- NAVEGAÇÃO SEGURA (AQUI CORRIGE O PULO) ---
  const nextStep = () => {
    if (isNavigating) return; // Se estiver travado, ignora o clique

    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setIsNavigating(true); // Ativa trava
        setCurrentStep(currentStep + 1);
        setError('');
        // Destrava só depois de 800ms
        setTimeout(() => setIsNavigating(false), 800);
      }
    } else {
      setError('Por favor, preencha todos os campos obrigatórios')
    }
  }

  const prevStep = () => {
    if (isNavigating) return;
    if (currentStep > 1) {
      setIsNavigating(true);
      setCurrentStep(currentStep - 1);
      setError('');
      setTimeout(() => setIsNavigating(false), 800);
    }
  }

  // --- ENVIO DO FORMULÁRIO (COM FOTO) ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 🔥 TRAVA CRÍTICA: Se tentar enviar no passo 3, cancela!
    if (currentStep !== 4 || isNavigating) return;

    if (isSubmitted || loading) return

    setLoading(true)
    setIsSubmitted(true)

    try {
      // 1. UPLOAD DA FOTO (Se tiver selecionado)
      if (photoFile) {
        const uploadResult = await uploadProfileImage(photoFile, currentUser.uid)
        if (uploadResult.success) {
          // Salva URL no usuário
          await updateDoc(doc(db, 'users', currentUser.uid), {
            photoUrl: uploadResult.url
          })
        }
      }

      const idade = calcularIdade()
      
      // 2. SALVAR DADOS
      const assessmentResult = await saveAssessment(currentUser.uid, {
        ...formData,
        idade: idade || null,
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        qualidadeSono: formData.qualidadeSono ? parseInt(formData.qualidadeSono) : null,
        horasSono: formData.horasSono ? parseFloat(formData.horasSono) : null,
        consumoAgua: formData.consumoAgua ? parseFloat(formData.consumoAgua) : null,
        refeicoesPorDia: formData.refeicoesPorDia ? parseInt(formData.refeicoesPorDia) : null,
        lesoes: formData.lesoes || 'Nenhuma'
      })

      if (!assessmentResult.success) throw new Error(assessmentResult.error)

      // 3. MUDAR STATUS
      const statusResult = await updateUserStatus(currentUser.uid, 'pending')
      if (!statusResult.success) throw new Error(statusResult.error)

      await new Promise(resolve => setTimeout(resolve, 500))

      if (onFormComplete) onFormComplete()
      if (onSave) await onSave()
      
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Erro ao salvar: ' + err.message)
      setLoading(false)
      setIsSubmitted(false)
    }
  }

  // --- RENDERIZADORES ---
  const renderProgressBar = () => {
    const progress = (currentStep / totalSteps) * 100
    return (
      <div className="mb-8">
        <div className="flex justify-between mb-2 text-xs font-bold uppercase text-zinc-500">
          <span>Passo {currentStep} de {totalSteps}</span>
          <span className="text-emerald-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <User className="w-8 h-8 text-emerald-500" />
        <h3 className="text-xl font-black text-white">Biometria</h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <input type="date" value={formData.dataNascimento} onChange={e => handleInputChange('dataNascimento', e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" required />
        <select value={formData.genero} onChange={e => handleInputChange('genero', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" required>
          <option value="">Gênero</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" step="0.1" placeholder="Peso (kg)" value={formData.peso} onChange={e => handleInputChange('peso', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" required />
          <input type="number" step="0.1" placeholder="Altura (cm)" value={formData.altura} onChange={e => handleInputChange('altura', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" required />
        </div>
      </div>
      {/* Nível de Atividade */}
      <div>
        <label className="text-white font-bold mb-2 block text-sm">Nível de Atividade no Trabalho</label>
        <select value={formData.nivelAtividadeTrabalho} onChange={e => handleInputChange('nivelAtividadeTrabalho', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500">
          <option value="">Selecione</option>
          <option value="Sedentário">Sedentário</option>
          <option value="Leve">Leve</option>
          <option value="Moderado">Moderado</option>
          <option value="Pesado">Pesado</option>
        </select>
      </div>
      {/* Sono e Água */}
      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="Qualidade Sono (0-10)" value={formData.qualidadeSono} onChange={e => handleInputChange('qualidadeSono', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" />
        <input type="number" placeholder="Água (Litros)" value={formData.consumoAgua} onChange={e => handleInputChange('consumoAgua', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <Utensils className="w-8 h-8 text-emerald-500" />
        <h3 className="text-xl font-black text-white">Nutrição</h3>
      </div>
      
      {/* Refeições */}
      <select value={formData.refeicoesPorDia} onChange={e => handleInputChange('refeicoesPorDia', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" required>
        <option value="">Refeições por dia</option>
        <option value="2">2 refeições</option>
        <option value="3">3 refeições</option>
        <option value="4">4 refeições</option>
        <option value="5">5+ refeições</option>
      </select>

      {/* Alergias */}
      <textarea value={formData.alergias} onChange={e => handleInputChange('alergias', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 h-24 resize-none" placeholder="Alergias ou o que não gosta..." />

      {/* Alimentos Preferidos */}
      <textarea value={formData.alimentosPreferidos} onChange={e => handleInputChange('alimentosPreferidos', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 h-24 resize-none" placeholder="Alimentos preferidos..." />

      {/* Suplementos - CORRIGIDO (Tirei o 'block') */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 text-sm">
          <Pill className="w-4 h-4 text-emerald-500" /> Você consome suplementos?
        </label>
        <textarea 
          value={formData.suplementos} 
          onChange={e => handleInputChange('suplementos', e.target.value)} 
          className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 h-20 resize-none" 
          placeholder="Ex: Whey, Creatina, Multivitamínico..." 
        />
      </div>

      {/* Álcool - CORRIGIDO (Tirei o 'block') */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 text-sm">
          <Wine className="w-4 h-4 text-emerald-500" /> Ingestão de Álcool
        </label>
        <select 
          value={formData.ingestaoAlcool} 
          onChange={e => handleInputChange('ingestaoAlcool', e.target.value)} 
          className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500"
        >
          <option value="">Selecione</option>
          <option value="Nunca">Nunca</option>
          <option value="Raramente (1x/mês)">Raramente (1x/mês)</option>
          <option value="Ocasionalmente (2-3x/mês)">Ocasionalmente (2-3x/mês)</option>
          <option value="Frequentemente">Frequentemente</option>
          <option value="Regularmente (3+ vezes/semana)">Regularmente</option>
        </select>
      </div>
    </div>
  )

  
  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Dumbbell className="w-8 h-8 text-emerald-500" />
        <div>
          <h3 className="text-2xl font-black uppercase text-white">Histórico de Treino e Saúde</h3>
          <p className="text-zinc-400 text-sm">Seu histórico físico e restrições</p>
        </div>
      </div>

      {/* Pergunta: Treina Atualmente? */}
      <div>
        <label className="text-white font-bold mb-3 block text-sm">Você está treinando atualmente? *</label>
        <div className="flex gap-4">
          {['Sim', 'Não'].map(opt => (
            <button 
              key={opt} 
              type="button" 
              onClick={() => handleInputChange('estaTreinando', opt)} 
              className={`flex-1 p-3 rounded-xl border font-bold transition-all ${
                formData.estaTreinando === opt 
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
                : 'border-zinc-700 bg-zinc-900 text-zinc-500'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Condicional: Tempo de Treino */}
      {formData.estaTreinando === 'Sim' && (
        <div className="animate-fade-in">
          <label className="text-white font-bold mb-2 block text-sm">Há quanto tempo?</label>
          <select value={formData.tempoTreino} onChange={e => handleInputChange('tempoTreino', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500">
            <option value="">Selecione</option>
            <option value="Menos de 6 meses">Menos de 6 meses</option>
            <option value="6 meses a 1 ano">6 meses a 1 ano</option>
            <option value="Mais de 1 ano">Mais de 1 ano</option>
            <option value="Mais de 3 anos">Mais de 3 anos</option>
          </select>
        </div>
      )}

      {/* Local de Treino */}
      <div>
        <label className="text-white font-bold mb-2 block text-sm">Local de Treino</label>
        <select value={formData.localTreino} onChange={e => handleInputChange('localTreino', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500">
          <option value="">Selecione</option>
          <option value="Academia Completa">Academia Completa</option>
          <option value="Condomínio">Condomínio</option>
          <option value="Em Casa">Em Casa</option>
          <option value="Crossfit/Funcional">Crossfit/Funcional</option>
        </select>
      </div>

      {/* Medicamentos - CORRIGIDO (Tirei o 'block') */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 text-sm">
          <Pill className="w-4 h-4 text-emerald-500" /> Uso de Medicamentos
        </label>
        <textarea 
          value={formData.medicamentos} 
          onChange={e => handleInputChange('medicamentos', e.target.value)} 
          className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 h-20 resize-none" 
          placeholder="Ex: Pressão alta, Diabetes..." 
        />
      </div>

      {/* Lesões - CORRIGIDO (Tirei o 'block') */}
      <div>
        <label className="flex items-center gap-2 text-white font-bold mb-2 text-sm">
          <AlertCircle className="w-4 h-4 text-red-500" /> Lesões ou Dores Crônicas
        </label>
        <textarea 
          value={formData.lesoes} 
          onChange={e => handleInputChange('lesoes', e.target.value)} 
          className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500 h-24 resize-none" 
          placeholder="Descreva qualquer dor ou lesão..." 
        />
        <p className="text-xs text-red-400 mt-1 font-bold">Para sua própria segurança, detalhe qualquer restrição.</p>
      </div>

      {/* Objetivos e Dias (Legado) */}
      <div className="pt-4 border-t border-zinc-800">
        <label className="text-white font-bold mb-2 block text-sm">Objetivo Principal *</label>
        <select value={formData.objetivo} onChange={e => handleInputChange('objetivo', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-emerald-500" required>
          <option value="">Selecione</option>
          {objetivos.map(obj => <option key={obj} value={obj}>{obj}</option>)}
        </select>
      </div>

      <div>
        <label className="text-white font-bold mb-2 block text-sm">Dias Disponíveis *</label>
        <div className="grid grid-cols-4 gap-2">
          {diasSemana.map(dia => (
            <button 
              key={dia} 
              type="button" 
              onClick={() => handleDiaToggle(dia)} 
              className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                formData.diasDisponiveis.includes(dia) 
                ? 'bg-emerald-500 border-emerald-500 text-black' 
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {dia.split('-')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
  // --- PASSO 4 CORRIGIDO (COM BOTÃO DE CÂMERA E PREVIEW) ---
  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in text-center">
      <div className="mb-4">
        <h3 className="text-2xl font-black text-white mb-1 uppercase">Sua Identidade</h3>
        <p className="text-zinc-400 text-sm">Adicione uma foto para seu perfil</p>
      </div>

      <div className="relative group w-40 h-40 mx-auto">
        <div className={`w-full h-full rounded-full border-4 flex items-center justify-center overflow-hidden bg-zinc-900 ${photoPreview ? 'border-emerald-500' : 'border-zinc-700 border-dashed'}`}>
          {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover"/> : <Camera className="w-12 h-12 text-zinc-600"/>}
        </div>
        <label className="absolute bottom-0 right-0 bg-emerald-500 p-3 rounded-full cursor-pointer hover:scale-110 transition-all shadow-lg text-black">
          <Camera size={20} />
          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files[0];
            if(file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
          }}/>
        </label>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 text-left">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-emerald-500 font-bold text-sm uppercase">Tudo Pronto!</h4>
          <p className="text-zinc-400 text-xs mt-1">Ao clicar em Salvar, seus dados serão enviados.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-black border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-2xl font-black text-white uppercase mb-6 text-center">Ficha Inicial</h2>
        
        {renderProgressBar()}

        <form 
          className="space-y-6" 
          noValidate 
          // 🔥 BLOQUEIO DE ENTER (Agora dentro da tag correta)
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault() }}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

          <div className="flex gap-4 pt-4 border-t border-zinc-800 mt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading || isNavigating}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
              >
                <ChevronLeft size={18}/> Voltar
              </button>
            )}
            
            <button
              type="button"
              // Lógica corrigida: Se é último passo = Submit, senão = Next
              onClick={currentStep === totalSteps ? handleSubmit : nextStep}
              // TRAVA OS BOTÕES SE ESTIVER NAVEGANDO (isNavigating)
              disabled={loading || isNavigating || isSubmitted}
              className={`flex-1 py-3 font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${
                currentStep === totalSteps 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20' 
                : 'bg-white hover:bg-gray-200 text-black'
              }`}
            >
              {loading ? (
                <><Loader2 className="animate-spin"/> Salvando...</>
              ) : currentStep === totalSteps ? (
                <><Save size={18}/> Salvar Ficha</>
              ) : (
                <>Próximo <ChevronRight size={18}/></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}