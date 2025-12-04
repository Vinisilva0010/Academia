import { Scan, Activity, Lock, CheckCircle2, Terminal } from 'lucide-react'

export default function PendingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Grid Animado */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Luz de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-blue/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-lg">
        
        {/* SCANNER CENTRAL */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Anéis Pulsantes */}
            <div className="absolute inset-0 border-2 border-neon-blue/30 rounded-full animate-[ping_3s_linear_infinite]" />
            <div className="absolute inset-4 border border-neon-blue/50 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-0 border-t-2 border-neon-blue rounded-full animate-spin" />
            
            {/* Ícone Central */}
            <div className="relative z-10 bg-black p-4 rounded-full border border-zinc-800">
              <Scan className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          
          <h2 className="mt-6 text-3xl font-black uppercase text-white tracking-widest text-center">
            ANALISANDO PERFIL
          </h2>
          <p className="text-neon-blue font-mono text-xs mt-2 animate-pulse">
            SYSTEM_ID: ZANVEXIS_PROTOCOL_V4
          </p>
        </div>

        {/* CARTÃO DE STATUS (VIDRO) */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Faixa de "Cuidado" no topo */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50" />

          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <Lock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm uppercase">Acesso Restrito</h3>
                <p className="text-zinc-400 text-xs">O Personal está configurando seu protocolo.</p>
              </div>
            </div>

            {/* Fake System Log (Para dar imersão) */}
            <div className="bg-black/40 rounded-xl p-4 font-mono text-xs space-y-2 border border-white/5">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                <span>Dados biométricos recebidos...</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                <span>Anamnese sincronizada...</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
                <Terminal className="w-3 h-3" />
                <span>Gerando periodização de treino...</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <div className="w-3 h-3 rounded-full border border-zinc-700" />
                <span>Aguardando validação do coach...</span>
              </div>
            </div>
          </div>

          {/* Footer com Dica */}
          <div className="mt-6 flex items-start gap-3 bg-neon-blue/5 p-3 rounded-xl border border-neon-blue/10">
            <Activity className="w-5 h-5 text-neon-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-neon-blue uppercase mb-1">Enquanto você espera:</p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Mantenha-se hidratado. A preparação para um grande resultado começa antes mesmo do primeiro treino.
              </p>
            </div>
          </div>

        </div>
        
        <p className="text-center text-zinc-600 text-[10px] uppercase tracking-widest mt-8 font-bold">
          Empresa Zanvexis.com - Todos os direitos reservados
        </p>

      </div>
    </div>
  )
}