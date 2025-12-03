import { useEffect, useState } from 'react'
import { Users, AlertCircle, CheckCircle, Mail, User, Edit, Trash2, Loader2 } from 'lucide-react'
import { getAllStudents, deleteStudent } from '../../utils/admin'
import Avatar from '../Avatar'
import { useNavigate } from 'react-router-dom'


export default function StudentList({ onSelectStudent, onEditPlan }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    const studentsList = await getAllStudents()
    setStudents(studentsList)
    setLoading(false)
  }

  const handleDeleteClick = (student) => {
    setDeleteConfirm(student)
    setError('')
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm(null)
    setError('')
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    setDeletingId(deleteConfirm.uid)
    setError('')

    try {
      const result = await deleteStudent(deleteConfirm.uid)
      
      if (result.success) {
        // Remover aluno da lista localmente
        setStudents(prev => prev.filter(s => s.uid !== deleteConfirm.uid))
        setDeleteConfirm(null)
        // Recarregar lista para garantir consistência
        await loadStudents()
      } else {
        setError(result.error || 'Erro ao deletar aluno')
      }
    } catch (err) {
      setError(err.message || 'Erro ao deletar aluno')
    } finally {
      setDeletingId(null)
    }
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
                  onClick={() => navigate(`/admin/student/${student.uid}`)}
                  className={`card cursor-pointer transition-all hover:scale-105 hover:border-neon-green/50 ${
                    isPending
                      ? 'border-yellow-500 border-2 shadow-lg shadow-yellow-500/20'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar 
                        name={student.name || student.email} 
                        photoUrl={student.photoUrl}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black uppercase text-white truncate">
                          {student.name || 'Aluno'}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(student)
                        }}
                        disabled={deletingId === student.uid}
                        className="p-2 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 rounded-lg text-red-400 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Excluir aluno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                      } else if (isPending) {
                        onSelectStudent(student)
                      }
                      // Caso contrário, o clique no card já leva para detalhes
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

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase text-white">
                  Excluir Aluno
                </h3>
                <p className="text-sm text-gray-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Você está prestes a excluir permanentemente:
              </p>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <p className="font-bold text-white">
                  {deleteConfirm.name || 'Aluno'}
                </p>
                <p className="text-sm text-gray-400">{deleteConfirm.email}</p>
              </div>
              <p className="text-sm text-red-400 mt-4">
                ⚠️ Todos os dados relacionados serão deletados:
              </p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1 list-disc list-inside">
                <li>Perfil do usuário</li>
                <li>Anamnese e avaliações</li>
                <li>Planos de treino e dieta</li>
                <li>Histórico de treinos e refeições</li>
                <li>Mensagens do chat</li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deletingId === deleteConfirm.uid}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold uppercase rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId === deleteConfirm.uid}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId === deleteConfirm.uid ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
