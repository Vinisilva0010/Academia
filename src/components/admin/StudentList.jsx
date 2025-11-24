import { useEffect, useState } from 'react'
import { Users, AlertCircle, CheckCircle, Mail, User, Edit } from 'lucide-react'
import { getAllStudents } from '../../utils/admin'

export default function StudentList({ onSelectStudent, onEditPlan }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    const studentsList = await getAllStudents()
    setStudents(studentsList)
    setLoading(false)
  }

  const pendingStudents = students.filter(s => s.status === 'pending')
  const activeStudents = students.filter(s => s.status === 'active')

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="animate-pulse text-gray-400">Carregando alunos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-neon-blue" />
            <div>
              <p className="text-2xl font-black text-white">{students.length}</p>
              <p className="text-sm text-gray-400 uppercase">Total de Alunos</p>
            </div>
          </div>
        </div>

        <div className="card border-yellow-500 border-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-black text-yellow-500">{pendingStudents.length}</p>
              <p className="text-sm text-gray-400 uppercase">Aguardando</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-neon-green" />
            <div>
              <p className="text-2xl font-black text-white">{activeStudents.length}</p>
              <p className="text-sm text-gray-400 uppercase">Alunos Ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Alunos */}
      <div>
        <h3 className="text-2xl font-black uppercase mb-4">LISTA DE ALUNOS</h3>
        
        {students.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum aluno cadastrado ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => {
              const isPending = student.status === 'pending'
              const isActive = student.status === 'active'
              
              return (
                <div
                  key={student.uid}
                  className={`card cursor-pointer transition-all hover:scale-105 ${
                    isPending
                      ? 'border-yellow-500 border-2 shadow-lg shadow-yellow-500/20'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800 rounded-lg">
                        <User className="w-5 h-5 text-neon-blue" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-white">
                          {student.name || 'Aluno'}
                        </h4>
                        <p className="text-sm text-gray-400">{student.email}</p>
                      </div>
                    </div>
                    {isPending && (
                      <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {isPending ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold text-yellow-500 uppercase">
                          Aguardando Plano
                        </span>
                      </>
                    ) : isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        <span className="text-sm font-bold text-neon-green uppercase">
                          Ativo
                        </span>
                      </>
                    ) : null}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isActive && onEditPlan) {
                        onEditPlan(student)
                      } else {
                        onSelectStudent(student)
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 ${
                      isPending 
                        ? 'btn-primary' 
                        : isActive
                        ? 'btn-secondary'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase px-4 py-2 rounded-lg border border-zinc-700 transition-colors'
                    }`}
                  >
                    {isPending ? (
                      <>
                        Criar Plano
                      </>
                    ) : isActive ? (
                      <>
                        <Edit className="w-4 h-4" />
                        Editar Plano
                      </>
                    ) : (
                      <>
                        Ver Detalhes
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
