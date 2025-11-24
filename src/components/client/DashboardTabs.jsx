import { useState } from 'react'
import { Dumbbell, UtensilsCrossed, TrendingUp } from 'lucide-react'
import TrainingTab from './TrainingTab'
import DietTab from './DietTab'
import EvolutionTab from './EvolutionTab'

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('treino')

  const tabs = [
    { id: 'treino', label: 'Treino', icon: Dumbbell },
    { id: 'dieta', label: 'Dieta', icon: UtensilsCrossed },
    { id: 'evolucao', label: 'Evolução', icon: TrendingUp },
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-zinc-800">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-wide transition-all relative ${
                isActive
                  ? 'text-neon-blue'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-glow-blue" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'treino' && <TrainingTab />}
        {activeTab === 'dieta' && <DietTab />}
        {activeTab === 'evolucao' && <EvolutionTab />}
      </div>
    </div>
  )
}



