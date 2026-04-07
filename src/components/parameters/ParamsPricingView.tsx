import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, FileText, Plus, Edit2, Trash2, X, Save, Loader2, Search, ChevronUp, ChevronDown, Power, PowerOff, Table } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingRole {
  id: string;
  area: string;
  type: 'MOE' | 'MOI';
  role: string;
  base_salary: number;
  hr_rate: number;
  active: boolean;
}

function PricingRolesManager() {
  const [roles, setRoles] = useState<PricingRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<PricingRole | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [area, setArea] = useState('');
  const [type, setType] = useState<'MOE' | 'MOI'>('MOI');
  const [roleName, setRoleName] = useState('');
  const [baseSalary, setBaseSalary] = useState<number | ''>('');
  const [hrRate, setHrRate] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  // Filter and Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PricingRole; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pricing_roles')
        .select('*')
        .order('area', { ascending: true })
        .order('role', { ascending: true });
      
      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error('Erro ao buscar cargos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role?: PricingRole) => {
    if (role) {
      setEditingRole(role);
      setArea(role.area);
      setType(role.type);
      setRoleName(role.role);
      setBaseSalary(role.base_salary);
      setHrRate(role.hr_rate);
      setIsActive(role.active !== false);
    } else {
      setEditingRole(null);
      setArea('');
      setType('MOI');
      setRoleName('');
      setBaseSalary('');
      setHrRate('');
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !roleName || baseSalary === '' || hrRate === '') return;

    setIsSaving(true);
    try {
      const payload = {
        area,
        type,
        role: roleName,
        base_salary: Number(baseSalary),
        hr_rate: Number(hrRate),
        active: isActive
      };

      if (editingRole) {
        const { error } = await supabase
          .from('pricing_roles')
          .update(payload)
          .eq('id', editingRole.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pricing_roles')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchRoles();
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar cargo:', err);
      alert('Erro ao salvar cargo. Verifique se a tabela pricing_roles existe no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActiveStatus = async (role: PricingRole) => {
    try {
      const { error } = await supabase
        .from('pricing_roles')
        .update({ active: !role.active })
        .eq('id', role.id);
      
      if (error) throw error;
      await fetchRoles();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status do cargo.');
    }
  };

  const calculateFx = (base: number, hrRate: number, type: 'MOE' | 'MOI', multiplier: number) => {
    if (type === 'MOI') {
      return base * multiplier * hrRate;
    } else {
      return base * multiplier;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSort = (key: keyof PricingRole) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedRoles = React.useMemo(() => {
    let result = [...roles];

    if (!showInactive) {
      result = result.filter(role => role.active !== false);
    }

    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(
        (role) =>
          role.area.toLowerCase().includes(lowercasedSearch) ||
          role.role.toLowerCase().includes(lowercasedSearch)
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [roles, searchTerm, sortConfig, showInactive]);

  const SortIndicator = ({ columnKey }: { columnKey: keyof PricingRole }) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline-block ml-1" /> : <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold">Cadastro de Cargos e Salários</h3>
          <p className="text-text-secondary text-sm">Gerencie os cargos, salários base e taxas de RH.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-border-subtle bg-element-bg text-primary focus:ring-primary"
            />
            Mostrar inativos
          </label>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por área ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-element-bg border border-border-subtle rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo Cargo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-element-bg border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3 font-medium cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('area')}>
                  Área <SortIndicator columnKey="area" />
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('type')}>
                  Tipo <SortIndicator columnKey="type" />
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('role')}>
                  Cargo <SortIndicator columnKey="role" />
                </th>
                <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('base_salary')}>
                  Valor Base <SortIndicator columnKey="base_salary" />
                </th>
                <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleSort('hr_rate')}>
                  Taxa RH <SortIndicator columnKey="hr_rate" />
                </th>
                <th className="px-4 py-3 font-medium text-right">fx1 (80%)</th>
                <th className="px-4 py-3 font-medium text-right">fx2 (100%)</th>
                <th className="px-4 py-3 font-medium text-right">fx3 (120%)</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRoles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-text-secondary">
                    {searchTerm ? 'Nenhum cargo encontrado para a busca.' : 'Nenhum cargo cadastrado.'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedRoles.map((r) => (
                  <tr key={r.id} className={`border-b border-border-subtle hover:bg-element-hover/50 transition-colors ${r.active === false ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">{r.area}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${r.type === 'MOI' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.role}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(r.base_salary)}</td>
                    <td className="px-4 py-3 text-right">{r.hr_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(calculateFx(r.base_salary, r.hr_rate, r.type, 0.8))}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(calculateFx(r.base_salary, r.hr_rate, r.type, 1.0))}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(calculateFx(r.base_salary, r.hr_rate, r.type, 1.2))}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${r.active !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {r.active !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(r)}
                          className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActiveStatus(r)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            r.active !== false 
                              ? 'text-text-secondary hover:text-rose-500 hover:bg-rose-500/10' 
                              : 'text-text-secondary hover:text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                          title={r.active !== false ? 'Inativar' : 'Ativar'}
                        >
                          {r.active !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              className="bg-surface border border-border-subtle rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-border-subtle">
                <h3 className="text-lg font-bold">{editingRole ? 'Editar Cargo' : 'Novo Cargo'}</h3>
                <button onClick={handleCloseModal} className="text-text-secondary hover:text-text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Área</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      required
                      className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Ex: Operações"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'MOE' | 'MOI')}
                      className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="MOI">MOI (Mão de Obra Indireta)</option>
                      <option value="MOE">MOE (Mão de Obra Estratégica/Direta)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Cargo</label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      required
                      className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Ex: Analista Sênior"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Valor Base Salário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value ? Number(e.target.value) : '')}
                      required
                      className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Taxa de RH (Valor)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={hrRate}
                      onChange={(e) => setHrRate(e.target.value ? Number(e.target.value) : '')}
                      required
                      className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Ex: 1.5"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded border-border-subtle bg-element-bg text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-sm font-medium text-text-primary">Cargo Ativo</span>
                    </label>
                  </div>
                </div>

                {/* Preview dos cálculos */}
                {(baseSalary !== '' && hrRate !== '') && (
                  <div className="mt-6 p-4 bg-element-bg rounded-xl border border-border-subtle">
                    <h4 className="text-sm font-medium mb-3 text-text-secondary">Preview dos Cálculos</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-surface rounded-lg border border-border-subtle">
                        <div className="text-xs text-text-secondary mb-1">fx1 (80%)</div>
                        <div className="font-medium">{formatCurrency(calculateFx(Number(baseSalary), Number(hrRate), type, 0.8))}</div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="text-xs text-primary mb-1">fx2 (100%)</div>
                        <div className="font-bold text-primary">{formatCurrency(calculateFx(Number(baseSalary), Number(hrRate), type, 1.0))}</div>
                      </div>
                      <div className="p-3 bg-surface rounded-lg border border-border-subtle">
                        <div className="text-xs text-text-secondary mb-1">fx3 (120%)</div>
                        <div className="font-medium">{formatCurrency(calculateFx(Number(baseSalary), Number(hrRate), type, 1.2))}</div>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary mt-3">
                      {type === 'MOI' 
                        ? 'Cálculo MOI: Valor Base * Percentual * Taxa RH' 
                        : 'Cálculo MOE: Valor Base * Percentual (Taxa RH ignorada)'}
                    </p>
                  </div>
                )}

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
                    {isSaving ? 'Salvando...' : 'Salvar'}
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

const pricingTiers = [
  { id: 1, min: 0, max: 1000, franchise: 8312, unit: 8.303, excess: 2.491 },
  { id: 2, min: 1001, max: 3000, franchise: 8312, unit: 8.303, excess: 2.491 },
  { id: 3, min: 3001, max: 5000, franchise: 13291, unit: 4.430, excess: 1.941 },
  { id: 4, min: 5001, max: 10000, franchise: 17171, unit: 3.434, excess: 1.520 },
  { id: 5, min: 10001, max: 25000, franchise: 24769, unit: 2.477, excess: 1.204 },
  { id: 6, min: 25001, max: 50000, franchise: 42828, unit: 1.713, excess: 0.906 },
  { id: 7, min: 50001, max: 100000, franchise: 65477, unit: 1.310, excess: 0.718 },
  { id: 8, min: 100001, max: 200000, franchise: 101376, unit: 1.014, excess: 0.568 },
  { id: 9, min: 200001, max: 300000, franchise: 158175, unit: 0.791, excess: 0.450 },
  { id: 10, min: 300001, max: 400000, franchise: 203175, unit: 0.677, excess: 0.450 },
];

function PricingSimulator({ model }: { model: 'cascata' | 'serrote' | 'block' }) {
  const [volume, setVolume] = useState<number>(1500);
  const [hasFranchise, setHasFranchise] = useState<boolean>(true);
  const [contractedTierId, setContractedTierId] = useState<number>(2);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderSimulationResult = () => {
    if (model === 'serrote') {
      const tier = pricingTiers.find(t => volume >= t.min && volume <= t.max) || pricingTiers[pricingTiers.length - 1];
      let total = 0;
      let explanation = '';

      if (hasFranchise) {
        if (tier.id === 1) {
          total = tier.franchise;
          explanation = `Faixa 1: Regra para o final da faixa. Valor fixo da franquia = ${formatCurrency(total)}.`;
        } else {
          const excessVolume = volume - tier.min;
          const excessCost = excessVolume * tier.excess;
          total = tier.franchise + excessCost;
          explanation = `Faixa ${tier.id}: Franquia (${formatCurrency(tier.franchise)}) + Excedente (${excessVolume.toLocaleString('pt-BR')} un. × ${formatCurrency(tier.excess)} = ${formatCurrency(excessCost)})`;
        }
      } else {
        total = volume * tier.unit;
        explanation = `Faixa ${tier.id} (Sem Franquia): ${volume.toLocaleString('pt-BR')} un. × ${formatCurrency(tier.unit)} (Valor Unitário) = ${formatCurrency(total)}`;
      }

      return (
        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <div className="text-sm text-primary mb-1">Receita Estimada</div>
          <div className="text-2xl font-bold text-primary mb-2">{formatCurrency(total)}</div>
          <div className="text-xs text-text-secondary">{explanation}</div>
        </div>
      );
    }

    if (model === 'cascata') {
      let remaining = volume;
      let total = 0;
      let breakdown = [];

      for (const tier of pricingTiers) {
        if (remaining <= 0) break;
        const tierCapacity = tier.id === 1 ? tier.max : (tier.max - tier.min + 1);
        const volumeInTier = Math.min(remaining, tierCapacity);
        const cost = volumeInTier * tier.excess;
        total += cost;
        remaining -= volumeInTier;
        breakdown.push(`Faixa ${tier.id}: ${volumeInTier.toLocaleString('pt-BR')} un. × ${formatCurrency(tier.excess)} = ${formatCurrency(cost)}`);
      }

      let explanation = breakdown.join(' | ');
      if (hasFranchise && total < pricingTiers[0].franchise) {
        total = pricingTiers[0].franchise;
        explanation += ` -> Aplicada franquia mínima de ${formatCurrency(total)}`;
      }

      return (
        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <div className="text-sm text-primary mb-1">Receita Estimada</div>
          <div className="text-2xl font-bold text-primary mb-2">{formatCurrency(total)}</div>
          <div className="text-xs text-text-secondary">{explanation}</div>
        </div>
      );
    }

    if (model === 'block') {
      const tier = pricingTiers.find(t => t.id === contractedTierId)!;
      let total = tier.franchise;
      let explanation = `Bloco contratado: Faixa ${tier.id} (até ${tier.max.toLocaleString('pt-BR')} un.) = ${formatCurrency(tier.franchise)}`;

      if (volume > tier.max) {
        const excessVolume = volume - tier.max;
        const excessCost = excessVolume * tier.excess;
        total += excessCost;
        explanation += ` + Excedente (${excessVolume.toLocaleString('pt-BR')} un. × ${formatCurrency(tier.excess)} = ${formatCurrency(excessCost)})`;
      }

      return (
        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <div className="text-sm text-primary mb-1">Receita Estimada</div>
          <div className="text-2xl font-bold text-primary mb-2">{formatCurrency(total)}</div>
          <div className="text-xs text-text-secondary">{explanation}</div>
        </div>
      );
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text-secondary mb-1">Volume Simulado</label>
          <input
            type="number"
            min="0"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        
        {(model === 'cascata' || model === 'serrote') && (
          <div className="flex items-center h-10">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={hasFranchise}
                onChange={(e) => setHasFranchise(e.target.checked)}
                className="rounded border-border-subtle bg-element-bg text-primary focus:ring-primary w-4 h-4"
              />
              Com Franquia Mínima
            </label>
          </div>
        )}

        {model === 'block' && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Bloco Contratado</label>
            <select
              value={contractedTierId}
              onChange={(e) => setContractedTierId(Number(e.target.value))}
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            >
              {pricingTiers.map(t => (
                <option key={t.id} value={t.id}>Faixa {t.id} (até {t.max.toLocaleString('pt-BR')})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {renderSimulationResult()}

      <div className="overflow-x-auto mt-4 border border-border-subtle rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-surface border-b border-border-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Faixa</th>
              <th className="px-4 py-3 font-medium text-right">Faixa Inicial</th>
              <th className="px-4 py-3 font-medium text-right">Faixa Final</th>
              <th className="px-4 py-3 font-medium text-right">($) Valor Franquia</th>
              <th className="px-4 py-3 font-medium text-right">($) Unitário</th>
              <th className="px-4 py-3 font-medium text-right">($) Unitário Excedente</th>
            </tr>
          </thead>
          <tbody>
            {pricingTiers.map((t) => {
              let rowClass = 'hover:bg-element-hover/50';
              
              if (model === 'cascata') {
                if (volume >= t.min && volume <= t.max) {
                  rowClass = 'bg-emerald-500/20'; // Faixa final atingida
                } else if (volume > t.max) {
                  rowClass = 'bg-emerald-500/10'; // Faixas anteriores preenchidas
                }
              } else if (model === 'serrote' && volume >= t.min && volume <= t.max) {
                rowClass = 'bg-primary/10';
              } else if (model === 'block' && t.id === contractedTierId) {
                rowClass = 'bg-primary/10';
              }
              
              return (
                <tr key={t.id} className={`border-b border-border-subtle transition-colors ${rowClass}`}>
                  <td className="px-4 py-2 font-medium">Faixa {t.id}</td>
                  <td className="px-4 py-2 text-right">{t.min.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2 text-right">{t.max.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(t.franchise)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(t.unit)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(t.excess)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PricingModelsManager() {
  const [expandedModel, setExpandedModel] = useState<'cascata' | 'serrote' | 'block' | null>(null);

  const toggleModel = (model: 'cascata' | 'serrote' | 'block') => {
    setExpandedModel(prev => prev === model ? null : model);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">Modelos de Tabelas</h3>
        <p className="text-text-secondary text-sm">Selecione um modelo para ver os conceitos, comportamentos e o simulador.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cascata Card */}
        <button 
          onClick={() => toggleModel('cascata')}
          className={`p-4 text-left border rounded-2xl transition-all ${
            expandedModel === 'cascata' 
              ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
              : 'bg-element-bg border-border-subtle hover:border-blue-500/30 hover:bg-blue-500/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expandedModel === 'cascata' ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
              <Table className="w-5 h-5" />
            </div>
            <h4 className={`text-lg font-bold ${expandedModel === 'cascata' ? 'text-blue-500' : 'text-text-primary'}`}>Cascata</h4>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">Preço unitário diminui por faixa, desconto aplicado apenas às unidades daquela faixa.</p>
        </button>

        {/* Serrote Card */}
        <button 
          onClick={() => toggleModel('serrote')}
          className={`p-4 text-left border rounded-2xl transition-all ${
            expandedModel === 'serrote' 
              ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
              : 'bg-element-bg border-border-subtle hover:border-emerald-500/30 hover:bg-emerald-500/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expandedModel === 'serrote' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <Table className="w-5 h-5" />
            </div>
            <h4 className={`text-lg font-bold ${expandedModel === 'serrote' ? 'text-emerald-500' : 'text-text-primary'}`}>Serrote</h4>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">Preço unitário diminui por faixa, preço da faixa atingida aplicado a todas as unidades.</p>
        </button>

        {/* Block Price Card */}
        <button 
          onClick={() => toggleModel('block')}
          className={`p-4 text-left border rounded-2xl transition-all ${
            expandedModel === 'block' 
              ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
              : 'bg-element-bg border-border-subtle hover:border-purple-500/30 hover:bg-purple-500/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expandedModel === 'block' ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-500'}`}>
              <Table className="w-5 h-5" />
            </div>
            <h4 className={`text-lg font-bold ${expandedModel === 'block' ? 'text-purple-500' : 'text-text-primary'}`}>Block Price</h4>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">Valor fixo por um pacote de volume, com valor adicional por unidade excedente.</p>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {expandedModel === 'cascata' && (
          <motion.div
            key="cascata"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-element-bg border border-blue-500/20 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-blue-500">Cascata (Tiered Pricing)</h4>
                <button onClick={() => setExpandedModel(null)} className="p-2 hover:bg-surface rounded-lg text-text-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4 text-sm text-text-secondary">
                <p>
                  <strong className="text-text-primary">Conceito:</strong> No modelo Cascata, o preço unitário diminui à medida que o volume atinge novas faixas (tiers), mas o desconto é aplicado apenas às unidades que caem dentro daquela faixa específica. O custo total é a soma do custo de cada faixa preenchida.
                </p>
                <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                  <strong className="text-text-primary block mb-2">Simulador Cascata:</strong>
                  <PricingSimulator model="cascata" />
                </div>
                <p>
                  <strong className="text-text-primary">Franquia:</strong> Este modelo pode ser configurado <strong>com franquia mínima</strong> (ex: o cliente paga por no mínimo 50 unidades, mesmo que use menos) ou <strong>sem franquia</strong> (paga exatamente o que usar).
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {expandedModel === 'serrote' && (
          <motion.div
            key="serrote"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-element-bg border border-emerald-500/20 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-emerald-500">Serrote (Volume Pricing)</h4>
                <button onClick={() => setExpandedModel(null)} className="p-2 hover:bg-surface rounded-lg text-text-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4 text-sm text-text-secondary">
                <p>
                  <strong className="text-text-primary">Conceito:</strong> No modelo Serrote, a franquia mínima sempre é sobre o volume da faixa inicial, só na primeira faixa que a regra é para o final da faixa. Se o usuário exceder a quantidade da faixa inicial, o sistema calcula o excedente e multiplica pelo valor unitário excedente.
                </p>
                <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                  <strong className="text-text-primary block mb-2">Simulador Serrote:</strong>
                  <PricingSimulator model="serrote" />
                </div>
                <p>
                  <strong className="text-text-primary">Franquia:</strong> Este modelo pode ser configurado <strong>com franquia mínima</strong> ou <strong>sem franquia</strong>.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {expandedModel === 'block' && (
          <motion.div
            key="block"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-element-bg border border-purple-500/20 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-purple-500">Block Price</h4>
                <button onClick={() => setExpandedModel(null)} className="p-2 hover:bg-surface rounded-lg text-text-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4 text-sm text-text-secondary">
                <p>
                  <strong className="text-text-primary">Conceito:</strong> No modelo Block Price, o cliente paga um valor fixo (mensalidade ou preço único) que dá direito a um "bloco" ou pacote de volume (ex: até X unidades). Se o cliente ultrapassar esse volume, ele pode pagar um valor adicional por unidade excedente ou precisar contratar um novo bloco.
                </p>
                <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                  <strong className="text-text-primary block mb-2">Simulador Block Price:</strong>
                  <PricingSimulator model="block" />
                </div>
                <p>
                  <strong className="text-text-primary">Franquia:</strong> Por definição, o valor do bloco já atua como uma <strong>franquia mínima</strong> (o cliente paga o valor do bloco mesmo se usar zero unidades). No entanto, a estrutura de blocos adicionais ou excedentes pode variar.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ParamsPricingView({ userPermissions }: { userPermissions: string[] }) {
  const [activeTab, setActiveTab] = useState<'cargos' | 'dafs' | 'modelos'>('cargos');

  if (!userPermissions.includes('Parâmetros - Pricing')) {
    return <div className="p-8 text-center text-rose-400">Acesso negado.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('cargos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'cargos' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Cargos e Salários
        </button>
        <button
          onClick={() => setActiveTab('dafs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'dafs' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
          }`}
        >
          <FileText className="w-4 h-4" /> Cadastro de DAF's
        </button>
        <button
          onClick={() => setActiveTab('modelos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'modelos' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
          }`}
        >
          <Table className="w-4 h-4" /> Modelos de Tabelas
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-2xl border border-border-subtle"
      >
        {activeTab === 'cargos' ? (
          <PricingRolesManager />
        ) : activeTab === 'modelos' ? (
          <PricingModelsManager />
        ) : (
          <div>
            <h3 className="text-lg font-bold mb-4">Cadastro de DAF's</h3>
            <p className="text-text-secondary text-sm">Página em construção...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
