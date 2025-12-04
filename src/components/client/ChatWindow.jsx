import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, AlertCircle, Paperclip, Image as ImageIcon, Loader2, Check, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToConversation, sendMessage, markMessagesAsRead } from '../../utils/messages'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { uploadChatImage, isValidImageFile } from '../../utils/imageUpload'
import ImageModal from '../ImageModal'

export default function ChatWindow({ onClose }) {
  // --- LÓGICA (MANTIDA 100% ORIGINAL) ---
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [adminInfo, setAdminInfo] = useState(null)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [modalImage, setModalImage] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('role', '==', 'admin'))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          const adminDoc = snapshot.docs[0]
          const adminData = { uid: adminDoc.id, ...adminDoc.data() }
          setAdminInfo(adminData)
        } else {
          setError('Personal Trainer não encontrado')
        }
      } catch (error) {
        setError('Erro ao carregar chat')
      }
    }
    if (currentUser) {
      fetchAdminInfo()
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !adminInfo) return
    let hasMarkedAsRead = false
    const unsubscribe = subscribeToConversation(
      currentUser.uid,
      adminInfo.uid,
      (conversationMessages) => {
        setMessages(conversationMessages)
        const unreadFromAdmin = conversationMessages.filter(
          msg => msg.senderId === adminInfo.uid && 
                 msg.receiverId === currentUser.uid && 
                 !msg.read
        )
        if (unreadFromAdmin.length > 0 && !hasMarkedAsRead) {
          hasMarkedAsRead = true
          markMessagesAsRead(currentUser.uid, adminInfo.uid)
            .then(() => {
              setTimeout(() => { hasMarkedAsRead = false }, 2000)
            })
            .catch(() => { hasMarkedAsRead = false })
        }
      }
    )
    const markTimer = setTimeout(() => {
      markMessagesAsRead(currentUser.uid, adminInfo.uid).catch(() => {})
    }, 500)
    return () => {
      clearTimeout(markTimer)
      unsubscribe()
    }
  }, [currentUser, adminInfo])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

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
    if ((!newMessage.trim() && !selectedImage) || !currentUser || !adminInfo || loading || uploading) return

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
      
      const result = await sendMessage(currentUser.uid, adminInfo.uid, newMessage || '', imageUrl)
      
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
    } catch (error) {
      return ''
    }
  }

  // --- RENDERIZAÇÃO VISUAL (PREMIUM CHAT) ---
  return (
    <div className="fixed bottom-20 right-4 sm:right-6 w-[90vw] sm:w-96 h-[600px] max-h-[80vh] bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      {/* Header com Gradiente Sutil */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-zinc-900 via-zinc-800/50 to-zinc-900">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                 <User className="w-5 h-5 text-gray-300" />
              </div>
            </div>
            {/* Status Indicator */}
            {adminInfo && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse"></div>
            )}
          </div>
          <div>
            <h3 className="font-black uppercase text-white text-sm tracking-wide">
              {adminInfo?.name || 'Personal Trainer'}
            </h3>
            <div className="flex items-center gap-1.5">
               <span className={`w-1.5 h-1.5 rounded-full ${adminInfo ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                 {adminInfo ? 'Online agora' : 'Offline'}
               </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/50 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
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
            <p className="text-sm text-gray-300 font-bold">Chat Iniciado</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
              Tire suas dúvidas diretamente com seu treinador aqui.
            </p>
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
                  className={`max-w-[85%] rounded-2xl p-3 relative group transition-all ${
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
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {message.text}
                    </p>
                  )}
                  
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span className="text-[10px] font-medium">
                      {formatTime(message.timestamp)}
                    </span>
                    {isMine && (
                       <Check className={`w-3 h-3 ${message.read ? 'text-white' : 'text-blue-200/50'}`} />
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input */}
      <div className="p-3 bg-zinc-900 border-t border-white/5">
        
        {/* Preview de Imagem (Flutuante) */}
        {previewImage && (
          <div className="absolute bottom-20 left-4 right-4 bg-zinc-800 p-2 rounded-xl border border-zinc-700 shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
               <img src={previewImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover bg-black" />
               <div className="text-xs">
                  <p className="text-white font-bold">Imagem selecionada</p>
                  <p className="text-gray-400">Pronta para enviar</p>
               </div>
            </div>
            <button 
              onClick={handleRemoveImage}
              className="p-1.5 bg-zinc-700 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => !loading && !uploading && adminInfo && fileInputRef.current?.click()}
            disabled={loading || uploading || !adminInfo}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-neon-blue rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 bg-zinc-800 rounded-xl flex items-center border border-transparent focus-within:border-neon-blue/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={adminInfo ? "Digite sua mensagem..." : "Conectando..."}
              className="flex-1 bg-transparent text-white px-4 py-3 outline-none text-sm placeholder-zinc-500"
              disabled={loading || uploading || !adminInfo}
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploading || (!newMessage.trim() && !selectedImage) || !adminInfo}
            className="p-3 bg-neon-blue hover:bg-cyan-300 text-black rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
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