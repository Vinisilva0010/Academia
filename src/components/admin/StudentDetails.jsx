import React, { useState } from 'react';
import { X, Save, Clock, ShieldAlert } from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Avatar from '../client/Avatar'; // Importando do caminho certo

export default function StudentDetails({ student, onClose }) {
  const [internalNotes, setInternalNotes] = useState(student.internalNotes || '');
  const [saving, setSaving] = useState(false);

  // Calcula quanto tempo o aluno está na academia
  const calculateDuration = (startDate) => {
    if (!startDate) return 'Recente';
    // Garante que funciona com Timestamp do Firebase ou Data normal
    const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
    if (isNaN(start.getTime())) return 'Data desconhecida';

    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} dias`;
    const months = Math.floor(diffDays / 30);
    return `${months} meses`;
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', student.uid);
      await updateDoc(userRef, { internalNotes });
      alert('Anotação salva!');
    } catch (error) {
      console.error("Erro:", error);
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl h-[90vh] rounded-2xl flex flex-col animate-fade-in shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 z-10">
          <X size={24} />
        </button>

        {/* Cabeçalho com Tempo de Casa */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-4 bg-zinc-950/50 rounded-t-2xl">
          <Avatar name={student.name || student.email} photoUrl={student.photoUrl} size="lg" />
          
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{student.name || 'Aluno'}</h2>
            <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1 font-medium">
              <Clock size={14} className="text-emerald-500" />
              <span>Aluno há: <b className="text-white ml-1">{calculateDuration(student.createdAt)}</b></span>
            </div>
          </div>
        </div>

        {/* Área de Avaliação Privada */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-black border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-emerald-500 font-bold uppercase tracking-wider text-xs">
              <ShieldAlert size={16} />
              <span>Anotações Privadas (Só você vê)</span>
            </div>
            
            <label className="text-white font-bold block mb-2 text-sm">Avaliação & Comportamento</label>
            <textarea 
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-300 h-32 focus:border-emerald-500 focus:outline-none resize-none text-sm"
              placeholder="Ex: Aluno dedicado, mas falta às segundas..."
            />
            
            <div className="flex justify-end mt-3">
              <button 
                onClick={handleSaveNotes}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar Nota'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}