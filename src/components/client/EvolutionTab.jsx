import { useState, useEffect } from 'react'
import { TrendingUp, Scale, Calendar, Plus, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToWeightHistory, addWeightRecord } from '../../utils/weightHistory'

export default function EvolutionTab() {
  const { currentUser } = useAuth()
  const [weightHistory, setWeightHistory] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Subscrever histórico de peso em tempo real
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

  // Calcular valores para o gráfico
  const maxWeight = weightHistory.length > 0 
    ? Math.max(...weightHistory.map(h => h.weight))
    : 0
  const minWeight = weightHistory.length > 0
    ? Math.min(...weightHistory.map(h => h.weight))
    : 0
  const range = maxWeight - minWeight || 1

  const getBarHeight = (weight) => {
    if (range === 0) return 50 // Se todos os pesos forem iguais, altura média
    return ((weight - minWeight) / range) * 100
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black uppercase mb-2">
            EVOLUÇÃO DO PESO
          </h3>
          <p className="text-gray-300">
            Acompanhe seu progresso ao longo do tempo
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Registrar Peso
        </button>
      </div>

      <div className="card">
        {/* Gráfico de Barras Simples */}
        {weightHistory.length > 0 ? (
          <div className="mb-6">
            <div className="flex items-end justify-between gap-2 h-64 pb-8 border-b border-zinc-800">
              {weightHistory.map((entry, index) => {
                const height = getBarHeight(entry.weight)
                return (
                  <div key={entry.id || index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                      <div
                        className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                        style={{
                          height: `${height}%`,
                          minHeight: '10px',
                          background: 'linear-gradient(to top, #10B981, #059669)',
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                        }}
                        title={`${entry.weight} kg - ${formatDateFull(entry.date)}`}
                      />
                    </div>
                    <span className="text-xs text-gray-400 text-center">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6 py-12 text-center border-b border-zinc-800">
            <Scale className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">Nenhum registro de peso ainda</p>
            <p className="text-sm text-gray-500 mt-2">Clique em "Registrar Peso" para começar</p>
          </div>
        )}

        {/* Estatísticas */}
        {weightHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-neon-green" />
                <span className="text-sm text-gray-400 uppercase font-bold">Peso Atual</span>
              </div>
              <p className="text-2xl font-black text-white">
                {weightHistory[weightHistory.length - 1]?.weight} kg
              </p>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-neon-blue" />
                <span className="text-sm text-gray-400 uppercase font-bold">Diferença Total</span>
              </div>
              <p className={`text-2xl font-black ${
                weightHistory[0]?.weight > weightHistory[weightHistory.length - 1]?.weight
                  ? 'text-neon-green'
                  : weightHistory[0]?.weight < weightHistory[weightHistory.length - 1]?.weight
                  ? 'text-red-400'
                  : 'text-white'
              }`}>
                {weightHistory.length > 1 ? (
                  <>
                    {weightHistory[0]?.weight > weightHistory[weightHistory.length - 1]?.weight ? '-' : '+'}
                    {Math.abs(weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight).toFixed(1)} kg
                  </>
                ) : '0.0 kg'}
              </p>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-neon-blue" />
                <span className="text-sm text-gray-400 uppercase font-bold">Registros</span>
              </div>
              <p className="text-2xl font-black text-white">
                {weightHistory.length} {weightHistory.length === 1 ? 'medição' : 'medições'}
              </p>
            </div>
          </div>
        )}

        {/* Histórico em Lista */}
        {weightHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-black uppercase mb-4">Histórico Completo</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {weightHistory.slice().reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{formatDateFull(entry.date)}</span>
                  </div>
                  <span className="font-bold text-white">{entry.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para Adicionar Peso */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase">Registrar Peso</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewWeight('')
                  setError('')
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddWeight} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase text-gray-300 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                  placeholder="Ex: 75.5"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewWeight('')
                    setError('')
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase px-4 py-3 rounded-lg border border-zinc-700 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Registrar
                    </>
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
