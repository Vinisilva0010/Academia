import { useState } from 'react'
import { Dumbbell, UtensilsCrossed, TrendingUp } from 'lucide-react'
import TrainingTab from './TrainingTab'
import DietTab from './DietTab'
import EvolutionTab from './EvolutionTab'
import { useLanguage } from '../../contexts/LanguageContext'

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('treino')
  const { t } = useLanguage() // <--- ADICIONE ISSO

  
  const tabs = [
    { id: 'treino', label: t('tabs', 'workout'), icon: Dumbbell },
    { id: 'dieta', label: t('tabs', 'diet'), icon: UtensilsCrossed },
    { id: 'evolucao', label: t('tabs', 'evolution'), icon: TrendingUp },
  ]

  return (
    <div className="w-full">
      {/* --- NOVO MENU DE NAVEGAÇÃO PREMIUM --- 
         Mudamos de 'border-b' para um container flutuante estilo Glassmorphism
      */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1.5 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl overflow-x-auto max-w-full">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 ease-out
                  ${isActive 
                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 shadow-[0_0_15px_rgba(0,255,255,0.15)] translate-y-0' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }
                `}
              >
                {/* O ícone brilha levemente quando ativo */}
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : ''}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content - Área de conteúdo com animação suave de entrada */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'treino' && <TrainingTab />}
        {activeTab === 'dieta' && <DietTab />}
        {activeTab === 'evolucao' && <EvolutionTab />}
      </div>
    </div>
  )
}