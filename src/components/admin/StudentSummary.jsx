import { 
  User, 
  Scale, 
  Ruler, 
  Target, 
  Calendar, 
  AlertCircle,
  Heart,
  Activity,
  Moon,
  Droplet,
  Utensils,
  Pill,
  Wine,
  Dumbbell,
  Info
} from 'lucide-react'

export default function StudentSummary({ assessment, student }) {
  if (!assessment) {
    return (
      <div className="card bg-yellow-900/20 border border-yellow-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <div>
            <h3 className="font-black uppercase text-yellow-500 mb-1">
              Anamnese Não Preenchida
            </h3>
            <p className="text-gray-400 text-sm">
              O aluno ainda não completou o formulário de anamnese.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Verificar se há alertas (lesões, alergias, medicamentos)
  const hasAlerts = !!(assessment.lesoes && assessment.lesoes !== 'Nenhuma') || 
                     !!(assessment.alergias) || 
                     !!(assessment.medicamentos)

  // Calcular IMC
  const calcularIMC = () => {
    if (assessment.peso && assessment.altura) {
      const alturaMetros = assessment.altura / 100
      const imc = assessment.peso / (alturaMetros * alturaMetros)
      return imc.toFixed(1)
    }
    return null
  }

  const imc = calcularIMC()

  return (
    <div className="space-y-4">
      {/* Card de Perfil */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
          <div className="p-3 bg-neon-blue/20 rounded-lg">
            <User className="w-6 h-6 text-neon-blue" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-white">Perfil</h3>
            <p className="text-sm text-gray-400">Informações básicas do aluno</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessment.idade !== null && assessment.idade !== undefined && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Idade</p>
                <p className="font-bold text-white">{assessment.idade} anos</p>
              </div>
            </div>
          )}

          {assessment.genero && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Gênero</p>
                <p className="font-bold text-white">{assessment.genero}</p>
              </div>
            </div>
          )}

          {assessment.peso && (
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Peso</p>
                <p className="font-bold text-white">{assessment.peso} kg</p>
              </div>
            </div>
          )}

          {assessment.altura && (
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Altura</p>
                <p className="font-bold text-white">{assessment.altura} cm</p>
              </div>
            </div>
          )}

          {imc && (
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="text-xs text-gray-400 uppercase">IMC</p>
                <p className="font-bold text-white">{imc}</p>
              </div>
            </div>
          )}

          {assessment.objetivo && (
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Objetivo</p>
                <p className="font-bold text-white">{assessment.objetivo}</p>
              </div>
            </div>
          )}
        </div>

        {assessment.diasDisponiveis && assessment.diasDisponiveis.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Dias Disponíveis</p>
                <div className="flex flex-wrap gap-2">
                  {assessment.diasDisponiveis.map((dia, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-neon-blue/20 border border-neon-blue/50 rounded-full text-xs font-bold text-neon-blue"
                    >
                      {dia.split('-')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card de Saúde & Restrições - Destacar se houver alertas */}
      <div className={`card ${hasAlerts ? 'border-red-500 border-2 bg-red-900/10' : ''}`}>
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
          <div className={`p-3 rounded-lg ${hasAlerts ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <AlertCircle className={`w-6 h-6 ${hasAlerts ? 'text-red-500' : 'text-yellow-500'}`} />
          </div>
          <div>
            <h3 className={`text-xl font-black uppercase ${hasAlerts ? 'text-red-500' : 'text-white'}`}>
              Saúde & Restrições
              {hasAlerts && <span className="ml-2 text-sm">⚠️ ATENÇÃO</span>}
            </h3>
            <p className="text-sm text-gray-400">Informações importantes para prescrição</p>
          </div>
        </div>

        <div className="space-y-4">
          {assessment.lesoes && assessment.lesoes !== 'Nenhuma' && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase mb-1">Lesões ou Dores Crônicas</p>
                  <p className="font-bold text-white">{assessment.lesoes}</p>
                </div>
              </div>
            </div>
          )}

          {assessment.alergias && (
            <div className={`p-4 rounded-lg ${assessment.alergias ? 'bg-red-900/20 border border-red-800' : 'bg-zinc-800/50 border border-zinc-700'}`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${assessment.alergias ? 'text-red-500' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase mb-1">Alergias / Alimentos que NÃO gosta</p>
                  <p className={`font-bold ${assessment.alergias ? 'text-white' : 'text-gray-400'}`}>
                    {assessment.alergias || 'Nenhuma alergia informada'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {assessment.medicamentos && (
            <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <div className="flex items-start gap-3">
                <Pill className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 uppercase mb-1">Medicamentos</p>
                  <p className="font-bold text-white">{assessment.medicamentos}</p>
                </div>
              </div>
            </div>
          )}

          {!hasAlerts && (
            <div className="text-center py-4 text-gray-400 text-sm">
              Nenhuma restrição ou alerta informado pelo aluno.
            </div>
          )}
        </div>
      </div>

      {/* Card de Rotina */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
          <div className="p-3 bg-neon-green/20 rounded-lg">
            <Activity className="w-6 h-6 text-neon-green" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-white">Rotina e Estilo de Vida</h3>
            <p className="text-sm text-gray-400">Hábitos e preferências do aluno</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.nivelAtividadeTrabalho && (
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Atividade no Trabalho</p>
                <p className="font-bold text-white">{assessment.nivelAtividadeTrabalho}</p>
              </div>
            </div>
          )}

          {assessment.tempoTreino && (
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Tempo de Treino</p>
                <p className="font-bold text-white">{assessment.tempoTreino}</p>
              </div>
            </div>
          )}

          {assessment.localTreino && (
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Local de Treino</p>
                <p className="font-bold text-white">{assessment.localTreino}</p>
              </div>
            </div>
          )}

          {assessment.refeicoesPorDia && (
            <div className="flex items-center gap-3">
              <Utensils className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Refeições por Dia</p>
                <p className="font-bold text-white">{assessment.refeicoesPorDia} refeições</p>
              </div>
            </div>
          )}

          {assessment.qualidadeSono !== null && assessment.qualidadeSono !== undefined && (
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Qualidade do Sono</p>
                <p className="font-bold text-white">{assessment.qualidadeSono}/10</p>
              </div>
            </div>
          )}

          {assessment.horasSono && (
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Horas de Sono</p>
                <p className="font-bold text-white">{assessment.horasSono}h</p>
              </div>
            </div>
          )}

          {assessment.consumoAgua && (
            <div className="flex items-center gap-3">
              <Droplet className="w-5 h-5 text-neon-blue" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Consumo de Água</p>
                <p className="font-bold text-white">{assessment.consumoAgua}L/dia</p>
              </div>
            </div>
          )}

          {assessment.ingestaoAlcool && (
            <div className="flex items-center gap-3">
              <Wine className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Ingestão de Álcool</p>
                <p className="font-bold text-white">{assessment.ingestaoAlcool}</p>
              </div>
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        {(assessment.suplementos || assessment.alimentosPreferidos) && (
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
            {assessment.alimentosPreferidos && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="w-4 h-4 text-neon-green" />
                  <p className="text-xs text-gray-400 uppercase font-bold">Alimentos Preferidos</p>
                </div>
                <p className="text-sm text-gray-300 pl-6">{assessment.alimentosPreferidos}</p>
              </div>
            )}

            {assessment.suplementos && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-neon-blue" />
                  <p className="text-xs text-gray-400 uppercase font-bold">Suplementos</p>
                </div>
                <p className="text-sm text-gray-300 pl-6">{assessment.suplementos}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}






