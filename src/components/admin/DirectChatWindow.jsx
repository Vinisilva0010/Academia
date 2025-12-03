import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Search, ChevronLeft, Image as ImageIcon, Loader2, User } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { sendMessage, markMessagesAsRead } from '../../utils/messages';
import { uploadChatImage } from '../../utils/imageUpload';
import Avatar from '../client/Avatar'; // Ajuste o caminho se seu Avatar estiver em outro lugar

export default function DirectChatWindow({ onClose }) {
  const { currentUser } = useAuth();
  
  // --- ESTADOS ---
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // 1. BUSCAR ALUNOS (LISTA LATERAL)
  useEffect(() => {
    const usersRef = collection(db, 'users');
    // Pega só quem é aluno
    const q = query(usersRef, where('role', '==', 'client'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
    });

    return () => unsubscribe();
  }, []);

  // 2. CARREGAR MENSAGENS (QUANDO CLICA NO ALUNO)
  useEffect(() => {
    if (!selectedStudent || !currentUser) return;

    // Listener de mensagens
    const msgsRef = collection(db, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtra só a conversa com esse aluno específico
      const conversation = allMessages.filter(msg => 
        (msg.senderId === currentUser.uid && msg.receiverId === selectedStudent.uid) ||
        (msg.senderId === selectedStudent.uid && msg.receiverId === currentUser.uid)
      );
      
      setMessages(conversation);
      
      // Marca como lida se for do aluno
      const unread = conversation.filter(m => m.senderId === selectedStudent.uid && !m.read);
      if (unread.length > 0) {
        markMessagesAsRead(currentUser.uid, selectedStudent.uid);
      }
    });

    return () => unsubscribe();
  }, [selectedStudent, currentUser]);

  // Scroll automático para baixo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- FUNÇÕES DE AÇÃO ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !uploading) return;

    const text = newMessage;
    setNewMessage(''); // Limpa input rápido

    try {
      await sendMessage(currentUser.uid, selectedStudent.uid, text);
    } catch (error) {
      console.error("Erro envio:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadChatImage(file, currentUser.uid);
      if (result.success) {
        await sendMessage(currentUser.uid, selectedStudent.uid, '', result.url);
      }
    } catch (error) {
      console.error("Erro upload:", error);
    } finally {
      setUploading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.name || s.email).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- RENDERIZAÇÃO RESPONSIVA ---
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
      
      {/* Container Principal (Janelão) */}
      <div className="bg-black w-full h-full md:w-[95%] md:h-[90vh] md:rounded-2xl border border-zinc-800 flex overflow-hidden shadow-2xl relative">
        
        {/* Botão Fechar Geral (Só aparece no Desktop ou se não tiver conversa aberta no mobile) */}
        <button 
          onClick={onClose} 
          className={`absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-zinc-400 hover:text-white hover:bg-red-500/20 transition-all ${selectedStudent ? 'hidden md:block' : 'block'}`}
        >
          <X size={24} />
        </button>

        {/* =======================================================
            LADO ESQUERDO: LISTA DE ALUNOS
            (Some no mobile se tiver aluno selecionado)
           ======================================================= */}
        <div className={`w-full md:w-1/3 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all absolute md:relative inset-0 z-20 
          ${selectedStudent ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Header da Lista */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center h-16">
            <h2 className="font-black text-white uppercase tracking-wider text-lg">Mensagens</h2>
            {/* Botão Fechar Mobile (Só aparece aqui se não tiver chat aberto) */}
            <button onClick={onClose} className="md:hidden text-zinc-400"><X size={24}/></button>
          </div>

          {/* Busca */}
          <div className="p-3 bg-zinc-900">
            <div className="bg-black border border-zinc-700 rounded-xl flex items-center px-3 py-3">
              <Search size={18} className="text-zinc-500"/>
              <input 
                placeholder="Buscar aluno..." 
                className="bg-transparent border-none outline-none text-white text-sm ml-2 w-full placeholder-zinc-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Lista Rolável */}
          <div className="flex-1 overflow-y-auto">
            {filteredStudents.map(student => (
              <div 
                key={student.uid}
                onClick={() => setSelectedStudent(student)}
                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-zinc-800 transition-colors border-b border-zinc-800/30 
                  ${selectedStudent?.uid === student.uid ? 'bg-zinc-800 border-l-4 border-l-emerald-500' : ''}`}
              >
                <Avatar name={student.name || student.email} photoUrl={student.photoUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{student.name || 'Aluno'}</h4>
                  <p className="text-xs text-zinc-500 truncate">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =======================================================
            LADO DIREITO: CHAT DA CONVERSA
            (Aparece no mobile ocupando tudo quando seleciona alguém)
           ======================================================= */}
        <div className={`w-full md:w-2/3 bg-black flex flex-col absolute md:relative inset-0 z-30 transition-all 
          ${selectedStudent ? 'flex' : 'hidden md:flex'}`}
        >
          {selectedStudent ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center gap-3 h-16 shadow-md z-10">
                {/* Botão Voltar (Só Mobile) */}
                <button onClick={() => setSelectedStudent(null)} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white">
                  <ChevronLeft size={28} />
                </button>
                
                <Avatar name={selectedStudent.name || ''} photoUrl={selectedStudent.photoUrl} size="sm" />
                <div>
                  <h3 className="font-bold text-white text-sm uppercase">{selectedStudent.name || 'Aluno'}</h3>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online
                  </p>
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/50">
                {messages.length === 0 && (
                  <div className="text-center text-zinc-600 mt-10 text-sm">Nenhuma mensagem. Diga olá! 👋</div>
                )}
                
                {messages.map(msg => {
                  const isMe = msg.senderId === currentUser.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm 
                        ${isMe 
                          ? 'bg-emerald-600 text-white rounded-tr-sm' 
                          : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                        }`}
                      >
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="Anexo" className="rounded-lg mb-2 max-h-48 object-cover border border-black/20" />
                        )}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                        <span className="text-[10px] opacity-60 block text-right mt-1">
                          {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Envio */}
              <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-900 flex gap-2 items-center">
                <label className="p-2 text-zinc-400 hover:text-emerald-500 cursor-pointer transition-colors">
                  <ImageIcon size={24} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                </label>
                
                <div className="flex-1 relative">
                  <input 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-full pl-4 pr-10 py-3 text-white text-sm focus:border-emerald-500 outline-none transition-all placeholder-zinc-600"
                    placeholder="Digite sua mensagem..."
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() && !uploading} 
                  className="p-3 bg-emerald-500 rounded-full text-black hover:bg-emerald-400 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-emerald-500/20"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
                </button>
              </form>
            </>
          ) : (
            /* Tela Vazia (Desktop) - Quando não tem ninguém selecionado */
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 opacity-50 bg-black">
              <User size={80} className="mb-4 text-zinc-800" />
              <p className="text-lg font-bold uppercase tracking-widest">Selecione um aluno</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}