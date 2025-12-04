import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, User, Users, AlertCircle, Paperclip, Loader2, Menu, Search, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToConversation, sendMessage, markMessagesAsRead } from '../../utils/messages'
import { getAllStudents } from '../../utils/admin'
import { uploadChatImage, isValidImageFile } from '../../utils/imageUpload'
import ImageModal from '../ImageModal'

export default function AdminChatWindow({ onClose, initialStudent = null, initialMessage = '' }) {
  // --- LÓGICA (MANTIDA 100% ORIGINAL) ---
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
  
  // Estado para controlar a Sidebar no Mobile
  const [showMobileSidebar, setShowMobileSidebar] = useState(!initialStudent) // Se não tem aluno, mostra a lista
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (initialStudent && !selectedStudent) {
      setSelectedStudent(initialStudent)
      setShowMobileSidebar(false) // Fecha sidebar se já veio com aluno
    }
  }, [initialStudent])

  useEffect(() => {
    if (initialStudent) return
    const loadStudents = async () => {
      const studentsList = await getAllStudents()
      setStudents(studentsList)
      if (studentsList.length > 0 && !selectedStudent) {
        // No mobile, não seleciona auto para obrigar a ver a lista
        if (window.innerWidth > 768) {
            setSelectedStudent(studentsList[0])
        }
      }
    }
    loadStudents()
  }, [initialStudent])

  useEffect(() => {
    if (initialMessage && inputRef.current) {
      setNewMessage(initialMessage)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [initialMessage, selectedStudent])

  useEffect(() => {
    if (!currentUser || !selectedStudent) {
      setMessages([])
      return
    }
    let hasMarkedAsRead = false
    const unsubscribe = subscribeToConversation(
      currentUser.uid,
      selectedStudent.uid,
      (conversationMessages) => {
        setMessages(conversationMessages)
        const unreadFromStudent = conversationMessages.filter(
          msg => msg.senderId === selectedStudent.uid && 
                 msg.receiverId === currentUser.uid && 
                 !msg.read
        )
        if (unreadFromStudent.length > 0 && !hasMarkedAsRead) {
          hasMarkedAsRead = true
          markMessagesAsRead(currentUser.uid, selectedStudent.uid)
            .then(() => setTimeout(() => { hasMarkedAsRead = false }, 2000))
            .catch(() => { hasMarkedAsRead = false })
        }
      }
    )
    const markTimer = setTimeout(() => {
      markMessagesAsRead(currentUser.uid, selectedStudent.uid).catch(() => {})
    }, 500)
    return () => {
      clearTimeout(markTimer)
      unsubscribe()
    }
  }, [currentUser, selectedStudent])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedStudent && !showMobileSidebar) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [selectedStudent, showMobileSidebar])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isValidImageFile(file)) {
      setError('Imagem inválida (Max 5MB)')
      return
    }
    setSelectedImage(file)
    setError('')
    const reader = new FileReader()
    reader.onloadend = () => setPreviewImage(reader.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setPreviewImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || !currentUser || !selectedStudent || loading || uploading) return
    setLoading(true)
    setError('')
    let imageUrl = null
    try {
      if (selectedImage) {
        setUploading(true)
        try {
          const uploadResult = await uploadChatImage(selectedImage, currentUser.uid)
          if (!uploadResult.success) throw new Error(uploadResult.error)
          imageUrl = uploadResult.url
        } catch (uploadError) {
          setError('Erro no upload da imagem')
          setLoading(false)
          setUploading(false)
          return
        } finally {
          setUploading(false)
        }
      }
      const result = await sendMessage(currentUser.uid, selectedStudent.uid, newMessage || '', imageUrl)
      if (result.success) {
        setNewMessage('')
        handleRemoveImage()
        inputRef.current?.focus()
      } else {
        setError(result.error || 'Erro ao enviar')
      }
    } catch (error) {
      setError('Erro ao enviar mensagem')
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
    } catch (error) { return '' }
  }

  const handleStudentClick = (student) => {
    setSelectedStudent(student)
    setShowMobileSidebar(false) // Esconde a lista no mobile ao selecionar
  }

  // --- RENDERIZAÇÃO VISUAL (RESPONSIVA & CYBERPUNK) ---
  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 sm:w-[900px] sm:h-[700px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 sm:rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header Unificado */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-zinc-900 via-zinc-800/50 to-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          {/* Botão Mobile para abrir lista */}
          <button 
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="sm:hidden p-2 -ml-2 text-neon-blue hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="p-2 bg-neon-blue/10 rounded-lg border border-neon-blue/20">
            <MessageCircle className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h3 className="font-black uppercase text-white text-sm tracking-wide">
              {selectedStudent ? selectedStudent.name : 'Central de Mensagens'}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden sm:block">
              Área do Treinador
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- LISTA DE ALUNOS (SIDEBAR) --- */}
        {/* No mobile: desliza por cima. No desktop: fixa na esquerda */}
        <div className={`
            absolute inset-y-0 left-0 w-[280px] bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 z-20 transition-transform duration-300 ease-in-out sm:relative sm:translate-x-0 sm:w-64 sm:bg-zinc-950/50
            ${showMobileSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full sm:translate-x-0'}
        `}>
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-bold uppercase">Buscar Aluno</span>
            </div>
          </div>
          
          <div className="overflow-y-auto h-full pb-20 custom-scrollbar">
            {students.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Nenhum aluno encontrado</p>
                </div>
            ) : (
                students.map((student) => (
                <button
                    key={student.uid}
                    onClick={() => handleStudentClick(student)}
                    className={`w-full p-4 text-left transition-all border-b border-white/5 relative group
                    ${selectedStudent?.uid === student.uid 
                        ? 'bg-white/5' 
                        : 'hover:bg-white/5'
                    }`}
                >
                    {/* Indicador Ativo */}
                    {selectedStudent?.uid === student.uid && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                    )}

                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                            selectedStudent?.uid === student.uid ? 'bg-neon-blue text-black border-neon-blue' : 'bg-zinc-800 text-gray-400 border-zinc-700'
                        }`}>
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${selectedStudent?.uid === student.uid ? 'text-white' : 'text-gray-300'}`}>
                                {student.name || 'Aluno'}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate font-mono">
                                {student.email}
                            </p>
                        </div>
                    </div>
                </button>
                ))
            )}
          </div>
        </div>

        {/* Overlay para fechar sidebar no mobile */}
        {showMobileSidebar && (
            <div 
                className="absolute inset-0 bg-black/50 z-10 sm:hidden backdrop-blur-sm"
                onClick={() => setShowMobileSidebar(false)}
            />
        )}

        {/* --- ÁREA DE CHAT --- */}
        <div className="flex-1 flex flex-col bg-zinc-900/30 w-full">
          {selectedStudent ? (
            <>
              {/* Header do Aluno no Chat (Apenas Desktop ou quando lista fechada) */}
              <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3 shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs text-zinc-400">Conversando com <strong className="text-white">{selectedStudent.name}</strong></span>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-neon-blue" />
                    </div>
                    <p className="text-sm text-gray-300 font-bold">Histórico Vazio</p>
                    <p className="text-xs text-gray-500 mt-1">Envie a primeira mensagem para este aluno.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.senderId === currentUser?.uid // Admin é "Mine"
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 relative group transition-all ${
                            isMine
                              ? 'bg-gradient-to-br from-neon-blue to-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/10'
                              : 'bg-zinc-800 border border-zinc-700 text-gray-200 rounded-tl-sm'
                          }`}
                        >
                          {message.imageUrl && (
                            <div className="mb-2 overflow-hidden rounded-lg">
                              <img
                                src={message.imageUrl}
                                alt="Anexo"
                                className="max-w-full max-h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                onClick={() => setModalImage(message.imageUrl)}
                              />
                            </div>
                          )}
                          {message.text && (
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                          )}
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                            <span className="text-[10px] font-medium">{formatTime(message.timestamp)}</span>
                            {isMine && <Check className={`w-3 h-3 ${message.read ? 'text-white' : 'text-blue-200/50'}`} />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-zinc-900 border-t border-white/5">
                {previewImage && (
                  <div className="absolute bottom-20 left-4 right-4 bg-zinc-800 p-2 rounded-xl border border-zinc-700 shadow-xl flex items-center justify-between z-30">
                    <div className="flex items-center gap-3">
                      <img src={previewImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover bg-black" />
                      <div className="text-xs">
                        <p className="text-white font-bold">Imagem selecionada</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveImage} className="p-1.5 bg-zinc-700 hover:text-red-400 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSend} className="flex gap-2 items-end">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  
                  <button
                    type="button"
                    onClick={() => !loading && !uploading && fileInputRef.current?.click()}
                    disabled={loading || uploading}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-neon-blue rounded-xl transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin text-neon-blue" /> : <Paperclip className="w-5 h-5" />}
                  </button>

                  <div className="flex-1 bg-zinc-800 rounded-xl flex items-center border border-transparent focus-within:border-neon-blue/50 transition-colors">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Mensagem para ${selectedStudent.name.split(' ')[0]}...`}
                      className="flex-1 bg-transparent text-white px-4 py-3 outline-none text-sm placeholder-zinc-500"
                      disabled={loading || uploading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || uploading || (!newMessage.trim() && !selectedImage)}
                    className="p-3 bg-neon-blue hover:bg-cyan-300 text-black rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                 <Users className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Selecione um Aluno</h3>
              <p className="text-sm text-zinc-500 max-w-xs">
                Toque no menu <span className="inline-block align-middle"><Menu className="w-3 h-3" /></span> para ver a lista de alunos e iniciar o atendimento.
              </p>
            </div>
          )}
        </div>
      </div>

      {modalImage && <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />}
    </div>
  )
}