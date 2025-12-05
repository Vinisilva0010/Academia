import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function EvaluationSection({ studentId }) {
  const [evaluations, setEvaluations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [type, setType] = useState('Neuromotora');
  const [notes, setNotes] = useState('');

  // Carregar histórico
  useEffect(() => {
    const ref = collection(db, 'users', studentId, 'evaluations');
    const q = query(ref, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvaluations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [studentId]);

  const handleSave = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'users', studentId, 'evaluations'), {
        type,
        notes,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('pt-BR')
      });
      setShowForm(false);
      setNotes('');
    } catch (error) {
      alert("Erro ao salvar avaliação");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Excluir este registro?")) {
      await deleteDoc(doc(db, 'users', studentId, 'evaluations', id));
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Botão Nova Avaliação */}
      {!showForm && (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-emerald-500 hover:border-emerald-500 transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase"
        >
          <Plus size={18} /> Nova Avaliação Técnica
        </button>
      )}

      {/* Formulário de Cadastro */}
      {showForm && (
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-white font-bold">Registrar Avaliação</h4>
            <button onClick={() => setShowForm(false)} className="text-xs text-red-400 hover:underline">Cancelar</button>
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-bold block mb-1">TIPO DE AVALIAÇÃO</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-black border border-zinc-700 p-2 rounded-lg text-white text-sm outline-none focus:border-emerald-500"
            >
              <option value="Neuromotora">Neuromotora (Força/Flexibilidade)</option>
              <option value="Postural">Postural (Desvios/Simetria)</option>
              <option value="Morfológica">Morfológica (Medidas/Dobras)</option>
              <option value="Anamnese Extra">Outros / Anamnese Extra</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-bold block mb-1">PARECER TÉCNICO</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white text-sm h-32 resize-none outline-none focus:border-emerald-500"
              placeholder="Descreva os resultados, medidas ou observações..."
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-sm transition-all"
          >
            {loading ? 'Salvando...' : 'Salvar Registro no Arquivo'}
          </button>
        </div>
      )}

      {/* Lista de Histórico */}
      <div className="space-y-3 pt-4">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Histórico de Registros</h4>
        
        {evaluations.length === 0 ? (
          <p className="text-center text-zinc-600 text-xs py-4">Nenhuma avaliação registrada ainda.</p>
        ) : (
          evaluations.map(item => (
            <div key={item.id} className="bg-black border border-zinc-800 p-4 rounded-xl group hover:border-zinc-700 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'Neuromotora' ? 'bg-blue-500' : 
                    item.type === 'Postural' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`} />
                  <span className="text-emerald-500 font-bold text-sm">{item.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 flex items-center gap-1"><Calendar size={12}/> {item.date}</span>
                  <button onClick={() => handleDelete(item.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{item.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}