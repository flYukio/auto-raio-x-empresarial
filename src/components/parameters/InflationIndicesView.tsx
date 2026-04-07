import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Loader2, 
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InflationIndex {
  id: string;
  year: number;
  month: number | null;
  value: number;
  type: string;
  is_projection: boolean;
}

export function InflationIndicesView() {
  const [indices, setIndices] = useState<InflationIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<InflationIndex | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [value, setValue] = useState<number | ''>('');
  const [isProjection, setIsProjection] = useState(false);

  useEffect(() => {
    fetchIndices();
  }, []);

  const fetchIndices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inflation_indices')
        .select('*')
        .order('year', { ascending: false });
      
      if (error) throw error;
      setIndices(data || []);
    } catch (err) {
      console.error('Erro ao buscar índices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (index?: InflationIndex) => {
    if (index) {
      setEditingIndex(index);
      setYear(index.year);
      setValue(index.value);
      setIsProjection(index.is_projection);
    } else {
      setEditingIndex(null);
      setYear(new Date().getFullYear() + 1);
      setValue('');
      setIsProjection(true);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || value === '') return;

    setIsSaving(true);
    try {
      const payload = {
        year,
        value: Number(value),
        type: 'IPCA',
        is_projection: isProjection,
      };

      if (editingIndex) {
        const { error } = await supabase
          .from('inflation_indices')
          .update(payload)
          .eq('id', editingIndex.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inflation_indices')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchIndices();
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar índice:', err);
      alert('Erro ao salvar índice. Certifique-se de que a tabela inflation_indices foi criada no Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteIndex = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este índice?')) return;
    try {
      const { error } = await supabase
        .from('inflation_indices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchIndices();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Índices de Reajuste (IPCA)</h2>
          <p className="text-text-secondary text-sm">Gerencie os índices inflacionários para projeções de Business Case.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Novo Índice
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {indices.map((idx) => (
              <motion.div
                key={idx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-5 rounded-2xl border border-border-subtle hover:border-primary/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(idx)}
                      className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteIndex(idx.id)}
                      className="p-1.5 text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{idx.year}</span>
                    {idx.is_projection && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                        Projetado
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-bold text-primary">{idx.value}%</span>
                    <span className="text-xs text-text-secondary font-medium uppercase tracking-tighter">IPCA Anual</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-2 text-xs text-text-secondary">
                  <AlertCircle className="w-3 h-3" />
                  {idx.is_projection ? 'Base: Relatório Focus / Projeção' : 'Base: IBGE / Consolidado'}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border-subtle rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-border-subtle">
                <h3 className="text-lg font-bold">{editingIndex ? 'Editar Índice' : 'Novo Índice IPCA'}</h3>
                <button onClick={handleCloseModal} className="text-text-secondary hover:text-text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Ano</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      required
                      className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Ex: 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Índice IPCA (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setValue(e.target.value ? parseFloat(e.target.value) : '')}
                      required
                      className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors font-bold text-primary"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-element-bg/50 rounded-xl border border-border-subtle">
                    <label className="flex items-center gap-2 cursor-pointer grow">
                      <input
                        type="checkbox"
                        checked={isProjection}
                        onChange={(e) => setIsProjection(e.target.checked)}
                        className="rounded border-border-subtle bg-element-bg text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-sm font-medium text-text-primary">Este índice é uma projeção</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Salvando...' : 'Salvar Índice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
