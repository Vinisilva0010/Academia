import { useState, useEffect } from 'react'
import { TrendingUp, Scale, Calendar, Plus, Loader2, AlertCircle, X, History } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToWeightHistory, addWeightRecord } from '../../utils/weightHistory'

export default function EvolutionTab() {
  // --- LÓGICA (MANTIDA 100% ORIGINAL) ---
  const { currentUser } = useAuth()
  const [weightHistory, setWeightHistory] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) return
    const unsubscribe = subscribeToWeightHistory(currentUser.uid, (records) => {
      setWeightHistory(records)
    })
    return unsubscribe
  }, [currentUser])

  const handleAddWeight = async (e) => {
    e.preventDefault()
    setError('')
    if (!newWeight || parseFloat(newWeight) <= 0) {
      setError('Por favor, insira um peso válido')
      return
    }
    setLoading(true)
    const result = await addWeightRecord(currentUser.uid, parseFloat(newWeight))
    if (result.success) {
      setNewWeight('')
      setShowAddModal(false)
    } else {
      setError(result.error || 'Erro ao registrar peso')
    }
    setLoading(false)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const formatDateFull = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    })
  }

  const maxWeight = weightHistory.length > 0 
    ? Math.max(...weightHistory.map(h => h.weight))
    : 0
  const minWeight = weightHistory.length > 0
    ? Math.min(...weightHistory.map(h => h.weight))
    : 0
  const range = maxWeight - minWeight || 1

  const getBarHeight = (weight) => {
    if (range === 0) return 50
    return ((weight - minWeight) / range) * 100
  }

  // --- RENDERIZAÇÃO VISUAL (PREMIUM) ---
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black uppercase text-white tracking-tighter">
            EVOLUÇÃO FÍSICA
          </h3>
          <p className="text-zinc-400 text-sm">Análise de dados corporais.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center gap-2 bg-neon-blue text-black px-4 py-2 rounded-xl font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span className="hidden sm:inline">NOVO REGISTRO</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* GRÁFICO HERO */}
        {weightHistory.length > 0 ? (
          <div className="relative bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 overflow-hidden">
            {/* Grid de Fundo Decorativo */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            <div className="relative z-10">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neon-blue" />
                Curva de Progresso
              </h4>

              {/* Área do Gráfico */}
              <div className="flex items-end justify-between gap-2 h-64 pb-2">
                {weightHistory.map((entry, index) => {
                  const height = getBarHeight(entry.weight)
                  // Calcula opacidade baseada na antiguidade (mais recentes mais brilhantes)
                  const opacity = 0.5 + (index / weightHistory.length) * 0.5
                  
                  return (
                    <div key={entry.id || index} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip Flutuante (aparece no hover) */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-zinc-700 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20">
                        {entry.weight}kg em {formatDate(entry.date)}
                      </div>

                      {/* Barra do Gráfico */}
                      <div className="relative w-full flex items-end justify-center h-[200px]">
                        <div
                          className="w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out cursor-pointer group-hover:brightness-125"
                          style={{
                            height: `${Math.max(height, 5)}%`, // Mínimo de 5% para não sumir
                            background: 'linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%)',
                            boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                            opacity: opacity
                          }}
                        />
                      </div>
                      
                      {/* Data no Eixo X */}
                      <span className="text-[10px] text-zinc-600 font-mono group-hover:text-white transition-colors">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
            <Scale className="w-16 h-16 text-zinc-700 mx-auto mb-4 animate-pulse" />
            <p className="text-zinc-400 font-bold">Nenhum dado coletado</p>
            <p className="text-sm text-zinc-600 mt-2">Inicie seu monitoramento hoje.</p>
          </div>
        )}

        {/* ESTATÍSTICAS (HUD) */}
        {weightHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card Peso Atual */}
            <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-neon-blue/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Scale className="w-12 h-12 text-neon-blue" />
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Peso Atual</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-mono">
                  {weightHistory[weightHistory.length - 1]?.weight}
                </span>
                <span className="text-sm font-bold text-neon-blue">kg</span>
              </div>
            </div>

            {/* Card Diferença */}
            <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-12 h-12 text-purple-500" />
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Balanço Total</p>
              <div className={`flex items-baseline gap-1 font-mono text-3xl font-black ${
                weightHistory[0]?.weight > weightHistory[weightHistory.length - 1]?.weight
                  ? 'text-emerald-400' // Perdeu peso (Bom)
                  : weightHistory[0]?.weight < weightHistory[weightHistory.length - 1]?.weight
                  ? 'text-rose-400' // Ganhou peso
                  : 'text-white'
              }`}>
                {weightHistory.length > 1 ? (
                  <>
                    {weightHistory[0]?.weight > weightHistory[weightHistory.length - 1]?.weight ? '-' : '+'}
                    {Math.abs(weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight).toFixed(1)}
                    <span className="text-sm font-bold ml-1 text-zinc-500">kg</span>
                  </>
                ) : '0.0'}
              </div>
            </div>

            {/* Card Registros */}
            <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-12 h-12 text-emerald-500" />
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Registros</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-mono">
                  {weightHistory.length}
                </span>
                <span className="text-sm font-bold text-zinc-500">medições</span>
              </div>
            </div>
          </div>
        )}

        {/* LISTA DE HISTÓRICO (DATA LOG) */}
        {weightHistory.length > 0 && (
          <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
               <History className="w-4 h-4 text-zinc-400" />
               <h4 className="text-sm font-bold text-white uppercase">Log de Registros</h4>
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {weightHistory.slice().reverse().map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-white/5 transition-colors last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-300 font-mono">
                        {formatDateFull(entry.date)}
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase font-bold">
                        Medição Manual
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-700">
                    <span className="font-black text-white font-mono">{entry.weight}</span>
                    <span className="text-xs text-zinc-500">kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE ADICIONAR PESO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
            {/* Efeito Glow Topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-blue via-purple-500 to-neon-blue" />

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase text-white">Nova Medição</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewWeight('')
                  setError('')
                }}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWeight} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neon-blue uppercase tracking-wider">
                  Peso Atual (kg)
                </label>
                <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      className="w-full bg-black border border-zinc-700 text-white text-3xl font-black font-mono rounded-xl px-4 py-4 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue placeholder-zinc-800 text-center"
                      placeholder="00.0"
                      autoFocus
                      disabled={loading}
                    />
                    <Scale className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-700" />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 flex items-center gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase py-4 rounded-xl transition-colors text-sm"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-neon-blue hover:bg-cyan-300 text-black font-black uppercase py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>SALVAR <Plus className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}