import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, Paperclip, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToConversation, sendMessage, markMessagesAsRead } from '../../utils/messages'
import { uploadChatImage, isValidImageFile } from '../../utils/imageUpload'
import ImageModal from '../ImageModal'

export default function DirectChatWindow({ student, initialMessage = '', onClose }) {
  const { currentUser } = useAuth()
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

  // Preencher mensagem inicial
  useEffect(() => {
    if (initialMessage) {
      setNewMessage(initialMessage)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 200)
    }
  }, [initialMessage])

  // Subscrever mensagens
  useEffect(() => {
    if (!currentUser || !student) return

    const unsubscribe = subscribeToConversation(
      currentUser.uid,
      student.uid,
      (conversationMessages) => {
        setMessages(conversationMessages)
        markMessagesAsRead(student.uid, currentUser.uid).catch(err => {
          console.error('Erro ao marcar como lida:', err)
        })
      }
    )

    return () => unsubscribe()
  }, [currentUser, student])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isValidImageFile(file)) {
      setError('Por favor, selecione uma imagem válida (JPG, PNG, GIF, WebP) com no máximo 5MB')
      return
    }

    setSelectedImage(file)
    setError('')

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
    if ((!newMessage.trim() && !selectedImage) || !currentUser || !student || loading || uploading) {
      return
    }

    setLoading(true)
    setError('')
    let imageUrl = null

    if (selectedImage) {
      setUploading(true)
      const uploadResult = await uploadChatImage(selectedImage, currentUser.uid)
      
      if (!uploadResult.success) {
        setError(uploadResult.error || 'Erro ao fazer upload da imagem')
        setLoading(false)
        setUploading(false)
        return
      }

      imageUrl = uploadResult.url
      setUploading(false)
    }
    
    const result = await sendMessage(currentUser.uid, student.uid, newMessage || '', imageUrl)
    
    if (result.success) {
      setNewMessage('')
      handleRemoveImage()
      inputRef.current?.focus()
    } else {
      setError(result.error || 'Erro ao enviar mensagem')
    }
    setLoading(false)
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

  if (!student) return null

  return (
    <>
      <div className="fixed bottom-24 right-6 w-[450px] h-[650px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-green/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <h3 className="font-black uppercase text-white text-sm">
                {student.name || 'Aluno'}
              </h3>
              <p className="text-xs text-gray-400">{student.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
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
                        ? 'bg-neon-green text-white'
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
                        isMine ? 'text-green-100' : 'text-gray-400'
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
          {previewImage && (
            <div className="mb-2 relative inline-block">
              <div className="relative">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-32 max-h-32 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
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
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Anexar imagem"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
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
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-neon-green"
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
      </div>

      {/* Modal de Imagem */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage}
          onClose={() => setModalImage(null)}
        />
      )}
    </>
  )
}

