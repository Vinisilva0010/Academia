import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, User, Users, AlertCircle, Paperclip, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToConversation, sendMessage, markMessagesAsRead } from '../../utils/messages'
import { getAllStudents } from '../../utils/admin'
import { uploadChatImage, isValidImageFile } from '../../utils/imageUpload'
import ImageModal from '../ImageModal'

export default function AdminChatWindow({ onClose, initialStudent = null, initialMessage = '' }) {
  const { currentUser } = useAuth()
  const [selectedStudent, setSelectedStudent] = useState(initialStudent || null)
  const [students, setStudents] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState(initialMessage || '')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [modalImage, setModalImage] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Definir aluno inicial se passado via props
  useEffect(() => {
    if (initialStudent && !selectedStudent) {
      setSelectedStudent(initialStudent)
    }
  }, [initialStudent])

  // Carregar lista de alunos (apenas se não passou aluno inicial)
  useEffect(() => {
    if (initialStudent) {
      // Se passou aluno inicial, não precisa carregar lista completa
      return
    }

    const loadStudents = async () => {
      console.log('[AdminChatWindow] Carregando alunos...')
      const studentsList = await getAllStudents()
      setStudents(studentsList)
      console.log('[AdminChatWindow] Alunos carregados:', studentsList.length)
      
      // Selecionar primeiro aluno por padrão se houver
      if (studentsList.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsList[0])
      }
    }
    loadStudents()
  }, [initialStudent])

  // Preencher mensagem inicial quando passar via props
  useEffect(() => {
    if (initialMessage && inputRef.current) {
      setNewMessage(initialMessage)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 200)
    }
  }, [initialMessage, selectedStudent])

  // Subscrever mensagens quando selecionar aluno
  useEffect(() => {
    if (!currentUser || !selectedStudent) {
      console.log('[AdminChatWindow] Aguardando usuário ou aluno selecionado')
      setMessages([])
      return
    }

    console.log('[AdminChatWindow] Iniciando subscription:', {
      adminId: currentUser.uid,
      studentId: selectedStudent.uid
    })

    const unsubscribe = subscribeToConversation(
      currentUser.uid,
      selectedStudent.uid,
      (conversationMessages) => {
        console.log('[AdminChatWindow] Mensagens recebidas:', conversationMessages.length)
        setMessages(conversationMessages)
        
        // Marcar mensagens como lidas quando chat abrir ou receber novas mensagens
        if (conversationMessages.length > 0) {
          markMessagesAsRead(selectedStudent.uid, currentUser.uid).catch(err => {
            console.error('[AdminChatWindow] Erro ao marcar como lida:', err)
          })
        }
      }
    )

    // Marcar mensagens como lidas imediatamente quando o chat abrir ou aluno selecionado mudar
    markMessagesAsRead(selectedStudent.uid, currentUser.uid).catch(err => {
      console.error('[AdminChatWindow] Erro ao marcar como lida na abertura:', err)
    })

    return () => {
      console.log('[AdminChatWindow] Limpando subscription')
      unsubscribe()
    }
  }, [currentUser, selectedStudent])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus no input quando selecionar aluno
  useEffect(() => {
    if (selectedStudent) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [selectedStudent])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isValidImageFile(file)) {
      setError('Por favor, selecione uma imagem válida (JPG, PNG, GIF, WebP) com no máximo 5MB')
      return
    }

    setSelectedImage(file)
    setError('')

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || !currentUser || !selectedStudent || loading || uploading) {
      console.warn('[AdminChatWindow] Tentativa de envio bloqueada')
      return
    }

    setLoading(true)
    setError('')
    let imageUrl = null

    try {
      // Upload de imagem se houver
      if (selectedImage) {
        setUploading(true)
        console.log('[AdminChatWindow] Iniciando upload da imagem...')
        
        try {
          const uploadResult = await uploadChatImage(selectedImage, currentUser.uid)
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Erro ao fazer upload da imagem')
          }

          imageUrl = uploadResult.url
          console.log('[AdminChatWindow] Upload concluído:', imageUrl)
        } catch (uploadError) {
          console.error('[AdminChatWindow] Erro no upload:', uploadError)
          let errorMsg = uploadError.message || 'Erro ao fazer upload da imagem'
          
          // Melhorar mensagem de erro de CORS
          if (errorMsg.includes('CORS') || errorMsg.includes('ERR_FAILED')) {
            errorMsg = 'Erro de configuração: Configure as regras do Firebase Storage. Veja FIREBASE_STORAGE_RULES.md'
          }
          
          setError(errorMsg)
          setLoading(false)
          setUploading(false)
          return
        } finally {
          setUploading(false)
        }
      }
      
      console.log('[AdminChatWindow] Enviando mensagem:', {
        senderId: currentUser.uid,
        receiverId: selectedStudent.uid,
        text: newMessage.substring(0, 50),
        hasImage: !!imageUrl
      })
      
      // CRÍTICO: Admin envia para aluno
      const result = await sendMessage(currentUser.uid, selectedStudent.uid, newMessage || '', imageUrl)
      
      if (result.success) {
        console.log('[AdminChatWindow] Mensagem enviada com sucesso')
        setNewMessage('')
        handleRemoveImage()
        inputRef.current?.focus()
      } else {
        console.error('[AdminChatWindow] Erro ao enviar:', result.error)
        setError(result.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('[AdminChatWindow] Erro inesperado:', error)
      setError(error.message || 'Erro ao enviar mensagem')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return ''
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-[500px] h-[700px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-blue/20 rounded-lg">
            <MessageCircle className="w-5 h-5 text-neon-blue" />
          </div>
          <h3 className="font-black uppercase text-white text-sm">Chat com Alunos</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de Alunos - Ocultar se passou aluno inicial */}
        {!initialStudent && (
          <div className="w-48 border-r border-zinc-800 overflow-y-auto bg-zinc-950">
          <div className="p-3 border-b border-zinc-800 bg-zinc-900">
            <p className="text-xs font-bold uppercase text-gray-400">Alunos</p>
          </div>
          {students.map((student) => (
            <button
              key={student.uid}
              onClick={() => setSelectedStudent(student)}
              className={`w-full p-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-900 ${
                selectedStudent?.uid === student.uid ? 'bg-zinc-800 border-l-2 border-neon-blue' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neon-green" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {student.name || 'Aluno'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {student.email}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {students.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum aluno</p>
            </div>
          )}
          </div>
        )}

        {/* Chat Area */}
        <div className={initialStudent ? "w-full flex flex-col" : "flex-1 flex flex-col"}>
          {selectedStudent ? (
            <>
              {/* Header do Aluno Selecionado */}
              <div className="p-3 border-b border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-neon-green" />
                  <div>
                    <p className="text-sm font-bold text-white">
                      {selectedStudent.name || 'Aluno'}
                    </p>
                    <p className="text-xs text-gray-400">{selectedStudent.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                  <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-3 flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs">{error}</span>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-xs mt-1">Comece uma conversa com {selectedStudent.name || 'o aluno'}!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.senderId === currentUser?.uid
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isMine
                              ? 'bg-neon-blue text-white'
                              : 'bg-zinc-800 text-gray-200'
                          }`}
                        >
                          {message.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={message.imageUrl}
                                alt="Imagem enviada"
                                className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setModalImage(message.imageUrl)}
                              />
                            </div>
                          )}
                          {message.text && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                          )}
                          <p
                            className={`text-xs mt-1 ${
                              isMine ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-lg">
                {/* Preview da imagem */}
                {previewImage && (
                  <div className="mb-3 relative inline-block">
                    <div className="relative border border-zinc-700 rounded-lg p-2 bg-zinc-800">
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="max-w-32 max-h-32 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={loading || uploading}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors disabled:opacity-50"
                          title="Remover imagem"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {uploading && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-neon-green">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Enviando imagem...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!loading && !uploading) {
                        fileInputRef.current?.click()
                      }
                    }}
                    disabled={loading || uploading}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={uploading ? "Enviando imagem..." : "Anexar imagem"}
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-neon-green" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue"
                    disabled={loading || uploading}
                  />
                  <button
                    type="submit"
                    disabled={loading || uploading || (!newMessage.trim() && !selectedImage)}
                    className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecione um aluno para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Imagem */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  )
}
