import { Clock, Sparkles } from 'lucide-react'

export default function PendingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock className="w-32 h-32 text-neon-blue opacity-20 animate-pulse" />
          </div>
          <div className="relative">
            <Clock className="w-32 h-32 text-neon-blue mx-auto animate-spin-slow" />
            <Sparkles className="w-8 h-8 text-neon-green absolute -top-2 -right-2 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-4xl font-black uppercase mb-4">
          AGUARDE...
        </h2>
        
        <div className="card max-w-lg mx-auto">
          <p className="text-xl text-gray-300 mb-2">
            O Personal está analisando seus dados
          </p>
          <p className="text-lg text-gray-400">
            para montar o treino perfeito para você!
          </p>
          
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Em breve você receberá seu plano personalizado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



