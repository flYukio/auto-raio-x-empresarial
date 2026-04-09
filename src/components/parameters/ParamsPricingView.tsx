import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, FileText, Plus, Edit2, Trash2, X, Save, Loader2, Search, ChevronUp, ChevronDown, Power, PowerOff, Table, Server } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingRole {
  id: string;
  area: string;
  type: 'MOE' | 'MOI';
  role: string;
  base_salary: number;
  hr_rate: number;
  base_salary_1?: number;
  base_salary_2?: number;
  base_salary_3?: number;
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
  const [fx1Salary, setFx1Salary] = useState<number | ''>('');
  const [fx2Salary, setFx2Salary] = useState<number | ''>('');
  const [fx3Salary, setFx3Salary] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  // Auto-calculate ranges logic
  useEffect(() => {
    if (baseSalary !== '' && hrRate !== '') {
      const b = Number(baseSalary);
      const r = Number(hrRate);
      
      // Calculate according to user's desired logic: Base * Mult * Rate
      setFx1Salary(Math.round(calculateFx(b, r, type, 0.8)));
      setFx2Salary(Math.round(calculateFx(b, r, type, 1.0)));
      setFx3Salary(Math.round(calculateFx(b, r, type, 1.2)));
    }
  }, [baseSalary, hrRate, type]);

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
      setFx1Salary(role.base_salary_1 || '');
      setFx2Salary(role.base_salary_2 || '');
      setFx3Salary(role.base_salary_3 || '');
      setIsActive(role.active !== false);
    } else {
      setEditingRole(null);
      setArea('');
      setType('MOI');
      setRoleName('');
      setBaseSalary('');
      setHrRate('');
      setFx1Salary('');
      setFx2Salary('');
      setFx3Salary('');
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
        base_salary_1: Number(fx1Salary),
        base_salary_2: Number(fx2Salary),
        base_salary_3: Number(fx3Salary),
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
                <th className="px-4 py-3 font-medium text-right text-primary">fx2 (100%)</th>
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
                    <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(r.base_salary_1 || 0)}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(r.base_salary_2 || 0)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(r.base_salary_3 || 0)}</td>
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
                    <label className="block text-sm font-medium text-text-secondary mb-1">Valor Base Salário</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-medium">R$</span>
                      <input
                        type="text"
                        value={baseSalary !== '' ? Number(baseSalary).toLocaleString('pt-BR') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setBaseSalary(val ? parseInt(val) : '');
                        }}
                        required
                        className="w-full bg-element-bg border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                        placeholder="0"
                      />
                    </div>
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

                <div className="md:col-span-2">
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <h4 className="text-sm font-bold mb-3 text-primary">Faixas Salariais (Calculadas Automaticamente)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] text-text-secondary uppercase mb-1">fx1 (80% + RH)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">R$</span>
                          <input
                            type="text"
                            value={fx1Salary !== '' ? Number(fx1Salary).toLocaleString('pt-BR') : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setFx1Salary(val ? parseInt(val) : '');
                            }}
                            className="w-full bg-surface border border-border-subtle rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-primary uppercase mb-1 font-bold">fx2 (100% + RH)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 text-xs">R$</span>
                          <input
                            type="text"
                            value={fx2Salary !== '' ? Number(fx2Salary).toLocaleString('pt-BR') : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setFx2Salary(val ? parseInt(val) : '');
                            }}
                            className="w-full bg-surface border border-primary/30 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-secondary uppercase mb-1">fx3 (120% + RH)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">R$</span>
                          <input
                            type="text"
                            value={fx3Salary !== '' ? Number(fx3Salary).toLocaleString('pt-BR') : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setFx3Salary(val ? parseInt(val) : '');
                            }}
                            className="w-full bg-surface border border-border-subtle rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-3 italic">
                      {type === 'MOI' 
                        ? '* Para MOI, os valores acima já contemplam a Taxa de RH acumulada.' 
                        : '* Para MOE, a Taxa de RH é ignorada conforme regra de negócio.'}
                    </p>
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

const agingTiers = [
  { id: 1, label: '0-90 dias', fee: 8 },
  { id: 2, label: '91-180 dias', fee: 12 },
  { id: 3, label: '181-360 dias', fee: 18 },
  { id: 4, label: '+360 dias', fee: 25 },
];

function PricingSimulator({ model }: { model: 'cascata' | 'serrote' | 'block' | 'license' | 'success_fee' }) {
  const [volume, setVolume] = useState<number>(1500);
  const [hasFranchise, setHasFranchise] = useState<boolean>(true);
  const [contractedTierId, setContractedTierId] = useState<number>(2);

  // States for License model
  const [solutionCost, setSolutionCost] = useState<number>(700);
  const [ebitdaMargin, setEbitdaMargin] = useState<number>(40);
  const [taxRate, setTaxRate] = useState<number>(10.15);

  // States for Success Fee model
  const [portfolioValue, setPortfolioValue] = useState<number>(1000000);
  const [recoveryRate, setRecoveryRate] = useState<number>(15);
  const [installmentMix, setInstallmentMix] = useState<number>(60);
  const [successFeePercent, setSuccessFeePercent] = useState<number>(12);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatUnit = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const renderSimulationResult = () => {
    if (model === 'serrote') {
      const tier = pricingTiers.find(t => volume >= t.min && volume <= t.max) || pricingTiers[pricingTiers.length - 1];
      if (hasFranchise) {
        let total = 0;
        let explanation = '';
        
        if (tier.id === 1) {
          total = tier.unit * tier.max;
          explanation = `Faixa 1: Franquia base (Até ${tier.max.toLocaleString('pt-BR')} un. × ${formatUnit(tier.unit)}) = ${formatCurrency(total)}.`;
        } else {
          // Cumulative cost up to previous tier
          const previousTiers = pricingTiers.slice(0, pricingTiers.indexOf(tier));
          const baseCost = previousTiers.reduce((acc, t, idx) => {
            const prevMax = idx === 0 ? 0 : previousTiers[idx-1].max;
            const capacity = t.max - prevMax;
            const rate = idx === 0 ? t.unit : t.excess; // This depends on business rule, but for Serrote with franchise, let's use the progression
            // Actually, per user formula: Previous Total is the current Franchise
            return acc; // We'll calculate it differently below to match the "Custo Total Faixa" logic
          }, 0);

          // Let's use a simpler recursive-style absolute calculation to match the table
          const getTierTotal = (tId: number): number => {
            const t = pricingTiers.find(p => p.id === tId)!;
            if (t.id === 1) return t.unit * t.max;
            const prevTotal = getTierTotal(t.id - 1);
            const prevMax = pricingTiers.find(p => p.id === t.id - 1)!.max;
            return prevTotal + (t.max - prevMax) * t.excess;
          };

          const franchise = getTierTotal(tier.id - 1);
          const prevTierMax = pricingTiers.find(p => p.id === tier.id - 1)!.max;
          const excessVolume = volume - prevTierMax;
          const excessCost = excessVolume * tier.excess;
          total = franchise + excessCost;
          explanation = `Faixa ${tier.id}: Franquia Acumulada (${formatCurrency(franchise)}) + Excedente (${excessVolume.toLocaleString('pt-BR')} un. × R$ ${formatUnit(tier.excess)} = ${formatCurrency(excessCost)})`;
        }

        return (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="text-sm text-primary mb-1">Receita Estimada</div>
            <div className="text-2xl font-bold text-primary mb-2">{formatCurrency(total)}</div>
            <div className="text-xs text-text-secondary">{explanation}</div>
          </div>
        );
      } else {
        const total = volume * tier.unit;
        const explanation = `Faixa ${tier.id} (Sem Franquia): ${volume.toLocaleString('pt-BR')} un. × R$ ${formatUnit(tier.unit)} = ${formatCurrency(total)}`;
        return (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="text-sm text-primary mb-1">Receita Estimada</div>
            <div className="text-2xl font-bold text-primary mb-2">{formatCurrency(total)}</div>
            <div className="text-xs text-text-secondary">{explanation}</div>
          </div>
        );
      }
    }

    if (model === 'cascata') {
      let remaining = volume;
      let total = 0;
      let breakdown = [];

      for (const tier of pricingTiers) {
        if (remaining <= 0) break;
        const tierCapacity = tier.id === 1 ? tier.max : (tier.max - pricingTiers[pricingTiers.indexOf(tier) - 1].max);
        const volumeInTier = Math.min(remaining, tierCapacity);
        const cost = volumeInTier * tier.unit;
        total += cost;
        remaining -= volumeInTier;
        breakdown.push(`Faixa ${tier.id}: ${volumeInTier.toLocaleString('pt-BR')} un. × R$ ${formatUnit(tier.unit)} = ${formatCurrency(cost)}`);
      }

      let explanation = breakdown.join(' | ');
      const minFranchise = pricingTiers[0].unit * pricingTiers[0].max;
      if (hasFranchise && total < minFranchise) {
        total = minFranchise;
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
        const implicitUnit = tier.franchise / tier.max;
        const excessRate = implicitUnit * 1.3;
        const excessVolume = volume - tier.max;
        const excessCost = excessVolume * excessRate;
        total += excessCost;
        explanation += ` + Excedente (${excessVolume.toLocaleString('pt-BR')} un. × R$ ${formatUnit(excessRate)} = ${formatCurrency(excessCost)})`;
      }

      return (
        <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <div className="text-sm text-primary mb-1">Receita Estimada</div>
          <div className="text-2xl font-bold text-primary mb-2">{formatCurrency(total)}</div>
          <div className="text-xs text-text-secondary">{explanation}</div>
        </div>
      );
    }

    if (model === 'license') {
      const unitPrice = solutionCost / (1 - (ebitdaMargin + taxRate) / 100);
      const total = volume * unitPrice;
      const explanation = `Custo: ${formatCurrency(solutionCost)} | Impostos: ${taxRate}% | Margem EBITDA: ${ebitdaMargin}% | Preço Unitário: ${formatCurrency(unitPrice)}`;

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-surface border border-border-subtle rounded-xl text-center">
              <div className="text-xs text-text-secondary mb-1">Custo Solução</div>
              <div className="text-lg font-bold">{formatCurrency(solutionCost)}</div>
            </div>
            <div className="p-4 bg-surface border border-border-subtle rounded-xl text-center">
              <div className="text-xs text-text-secondary mb-1">Impostos</div>
              <div className="text-lg font-bold text-rose-500">{taxRate}%</div>
            </div>
            <div className="p-4 bg-surface border border-border-subtle rounded-xl text-center">
              <div className="text-xs text-text-secondary mb-1">Margem EBITDA</div>
              <div className="text-lg font-bold text-emerald-500">{ebitdaMargin}%</div>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
              <div className="text-xs text-primary mb-1">Preço Assinatura</div>
              <div className="text-lg font-bold text-primary">{formatCurrency(unitPrice)}</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="text-sm text-primary mb-1">Receita Mensal Estimada</div>
            <div className="text-2xl font-bold text-primary mb-2">{formatCurrency(total)}</div>
            <div className="text-xs text-text-secondary">Cálculo: {volume} licenças × {formatCurrency(unitPrice)}</div>
          </div>
        </div>
      );
    }

    if (model === 'success_fee') {
      const recoveredAmount = portfolioValue * (recoveryRate / 100);
      const totalFee = recoveredAmount * (successFeePercent / 100);
      const immediateRevenue = totalFee * (1 - installmentMix / 100);
      const deferredRevenue = totalFee * (installmentMix / 100);

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-surface border border-border-subtle rounded-xl text-center">
              <div className="text-xs text-text-secondary mb-1">Valor Recuperado Esperado</div>
              <div className="text-lg font-bold text-emerald-500">{formatCurrency(recoveredAmount)}</div>
            </div>
            <div className="p-4 bg-surface border border-border-subtle rounded-xl text-center">
              <div className="text-xs text-text-secondary mb-1">Receita Imediata (Entradas)</div>
              <div className="text-lg font-bold text-primary">{formatCurrency(immediateRevenue)}</div>
            </div>
            <div className="p-4 bg-surface border border-border-subtle rounded-xl text-center">
              <div className="text-xs text-text-secondary mb-1">Receita Diferida (Parcelas)</div>
              <div className="text-lg font-bold text-indigo-400">{formatCurrency(deferredRevenue)}</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="text-sm text-primary mb-1">Receita Total de Success Fee (BPO)</div>
            <div className="text-2xl font-bold text-primary mb-2">{formatCurrency(totalFee)}</div>
            <div className="text-xs text-text-secondary">
              Cálculo: {formatCurrency(portfolioValue)} (Carteira) × {recoveryRate}% (Conversão) × {successFeePercent}% (Taxa)
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        {model !== 'success_fee' ? (
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {model === 'license' ? 'Quantidade de Licenças' : 'Volume Simulado'}
            </label>
            <input
              type="text"
              value={volume.toLocaleString('pt-BR')}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setVolume(val ? parseInt(val) : 0);
              }}
              className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        ) : (
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Valor da Carteira</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-medium">R$</span>
              <input
                type="text"
                value={portfolioValue.toLocaleString('pt-BR')}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPortfolioValue(val ? parseInt(val) : 0);
                }}
                className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {model === 'success_fee' && (
          <>
            <div className="flex-[0.5]">
              <label className="block text-sm font-medium text-text-secondary mb-1">Eficiência</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={recoveryRate}
                  onChange={(e) => setRecoveryRate(Number(e.target.value))}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-4 pr-8 py-2 text-sm focus:outline-none focus:border-primary transition-colors pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>
              </div>
            </div>
            <div className="flex-[0.5]">
              <label className="block text-sm font-medium text-text-secondary mb-1">Fee</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={successFeePercent}
                  onChange={(e) => setSuccessFeePercent(Number(e.target.value))}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-4 pr-8 py-2 text-sm focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">Mix Parcelado</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={installmentMix}
                  onChange={(e) => setInstallmentMix(Number(e.target.value))}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-4 pr-8 py-2 text-sm focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>
              </div>
            </div>
          </>
        )}

        {model === 'license' && (
          <>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">Custo Solução</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-medium">R$</span>
                <input
                  type="text"
                  value={solutionCost.toLocaleString('pt-BR')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setSolutionCost(val ? parseInt(val) : 0);
                  }}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">Impostos</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-4 pr-8 py-2 text-sm focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">Margem EBITDA</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={99 - taxRate}
                  value={ebitdaMargin}
                  onChange={(e) => setEbitdaMargin(Number(e.target.value))}
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-4 pr-8 py-2 text-sm focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>
              </div>
            </div>
          </>
        )}
        
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

      {(model !== 'license' && model !== 'success_fee') && (
        <div className="overflow-x-auto mt-4 border border-border-subtle rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-surface border-b border-border-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Faixa</th>
              <th className="px-4 py-3 font-medium text-right">Faixa Inicial</th>
              <th className="px-4 py-3 font-medium text-right">Faixa Final</th>
              <th className="px-4 py-3 font-medium text-right">($) Valor Franquia Mínima</th>
              {model !== 'cascata' && model !== 'block' && <th className="px-4 py-3 font-medium text-right">($) Receita Total Faixa</th>}
              {model !== 'block' && <th className="px-4 py-3 font-medium text-right">($) Unitário</th>}
              {model !== 'cascata' && <th className="px-4 py-3 font-medium text-right">($) Excedente</th>}
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
                  <td className="px-4 py-2 text-right">
                    {model === 'cascata' 
                      ? formatCurrency(t.id === 1 
                          ? t.unit * t.max 
                          : pricingTiers.slice(0, pricingTiers.indexOf(t)).reduce((acc, prev, idx) => {
                              const prevMaxLimit = idx === 0 ? 0 : pricingTiers[idx-1].max;
                              const capacity = prev.max - prevMaxLimit;
                              return acc + (capacity * prev.unit);
                            }, 0))
                      : model === 'block'
                        ? (
                            <div>
                               {formatCurrency(t.franchise)}
                               <div className="text-[10px] text-text-secondary opacity-70">
                                 (R$ {formatUnit(t.franchise / t.max)} por un.)
                               </div>
                            </div>
                          )
                        : (function getSerroteFranchise(tId: number): string {
                          const getTierTotal = (id: number): number => {
                            const currentT = pricingTiers.find(p => p.id === id)!;
                            if (currentT.id === 1) return currentT.unit * currentT.max;
                            const prevTotal = getTierTotal(currentT.id - 1);
                            const prevMax = pricingTiers.find(p => p.id === currentT.id - 1)!.max;
                            return prevTotal + (currentT.max - prevMax) * currentT.excess;
                          };
                          
                          if (tId === 1) return formatCurrency(pricingTiers[0].unit * pricingTiers[0].max);
                          return formatCurrency(getTierTotal(tId - 1));
                        })(t.id)}
                  </td>
                  {model !== 'cascata' && model !== 'block' && (
                    <td className="px-4 py-2 text-right">
                      {(function getSerroteTotal(tId: number): string {
                          const getTierTotal = (id: number): number => {
                            const currentT = pricingTiers.find(p => p.id === id)!;
                            if (currentT.id === 1) return currentT.unit * currentT.max;
                            const prevTotal = getTierTotal(currentT.id - 1);
                            const prevMax = pricingTiers.find(p => p.id === currentT.id - 1)!.max;
                            return prevTotal + (currentT.max - prevMax) * currentT.excess;
                          };
                          return formatCurrency(getTierTotal(tId));
                        })(t.id)}
                    </td>
                  )}
                  {model !== 'block' && (
                    <td className="px-4 py-2 text-right text-text-secondary">
                      R$ {formatUnit(t.unit)}
                    </td>
                  )}
                  {model !== 'cascata' && (
                    <td className="px-4 py-2 text-right text-text-secondary">
                      R$ {formatUnit(model === 'block' ? (t.franchise / t.max) * 1.3 : t.excess)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

function PricingModelsManager() {
  const [expandedModel, setExpandedModel] = useState<'cascata' | 'serrote' | 'block' | 'license' | 'success_fee' | null>(null);

  const toggleModel = (model: 'cascata' | 'serrote' | 'block' | 'license' | 'success_fee') => {
    setExpandedModel(prev => prev === model ? null : model);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">Modelos de Tabelas</h3>
        <p className="text-text-secondary text-sm">Selecione um modelo para ver os conceitos, comportamentos e o simulador.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

        {/* License Card */}
        <button 
          onClick={() => toggleModel('license')}
          className={`p-4 text-left border rounded-2xl transition-all ${
            expandedModel === 'license' 
              ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
              : 'bg-element-bg border-border-subtle hover:border-amber-500/30 hover:bg-amber-500/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expandedModel === 'license' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-500'}`}>
              <Table className="w-5 h-5" />
            </div>
            <h4 className={`text-lg font-bold ${expandedModel === 'license' ? 'text-amber-500' : 'text-text-primary'}`}>Licença de Uso</h4>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">Custo fixo mensal por licença, estabelecido com margem EBITDA sobre o custo da solução.</p>
        </button>

        {/* Success Fee Card */}
        <button 
          onClick={() => toggleModel('success_fee')}
          className={`p-4 text-left border rounded-2xl transition-all ${
            expandedModel === 'success_fee' 
              ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
              : 'bg-element-bg border-border-subtle hover:border-indigo-500/30 hover:bg-indigo-500/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expandedModel === 'success_fee' ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
              <Table className="w-5 h-5" />
            </div>
            <h4 className={`text-lg font-bold ${expandedModel === 'success_fee' ? 'text-indigo-500' : 'text-text-primary'}`}>Success Fee</h4>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">Remuneração baseada no sucesso da recuperação de ativos. Percentuais variáveis por aging.</p>
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
                  <strong className="text-text-primary">Conceito:</strong> No modelo Serrote, se houver franquia mínima, ela é o custo total acumulado até a faixa anterior. O volume que ultrapassa o limite da faixa anterior (excedente) é cobrado pelo Valor Unitário Excedente da faixa atingida. Sem franquia, aplica-se o Unitário a todas as unidades.
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

        {expandedModel === 'license' && (
          <motion.div
            key="license"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-element-bg border border-amber-500/20 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-amber-500">Licença de Uso (Mensalidade)</h4>
                <button onClick={() => setExpandedModel(null)} className="p-2 hover:bg-surface rounded-lg text-text-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4 text-sm text-text-secondary">
                <p>
                  <strong className="text-text-primary">Conceito:</strong> Este modelo é utilizado para soluções SaaS ou softwares de prateleira onde se paga um valor fixo mensal. O preço de venda é definido aplicando-se uma <strong>Margem EBITDA</strong> sobre o custo de aquisição da solução.
                </p>
                <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                  <strong className="text-text-primary block mb-2">Simulador de Licenciamento:</strong>
                  <PricingSimulator model="license" />
                </div>
                <p>
                  <strong className="text-text-primary">EBITDA:</strong> O cálculo utiliza a fórmula de margem sobre receita, considerando também a incidência de impostos: <code>Preço = Custo / (1 - (Margem% + Impostos%))</code>. Isso garante que a rentabilidade desejada seja preservada após o pagamento de tributos.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {expandedModel === 'success_fee' && (
          <motion.div
            key="success_fee"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-element-bg border border-indigo-500/20 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-indigo-500">Recuperação de Crédito (Success Fee)</h4>
                <button onClick={() => setExpandedModel(null)} className="p-2 hover:bg-surface rounded-lg text-text-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4 text-sm text-text-secondary">
                <p>
                  <strong className="text-text-primary">Conceito:</strong> Modelo focado em performance (BPO de Cobrança). A remuneração é um percentual sobre o valor efetivamente recuperado de uma carteira de inadimplentes. O Success Fee geralmente escala conforme o <strong>Aging</strong> (idade) da dívida.
                </p>
                <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                  <strong className="text-text-primary block mb-2">Simulador de Recuperação:</strong>
                  <PricingSimulator model="success_fee" />
                </div>
                <p>
                  <strong className="text-text-primary">Parcelamento:</strong> Para acordos parcelados, a regra padrão cobra o fee sobre a entrada e, subsequentemente, sobre cada parcela paga. O simulador acima projeta a receita imediata vs. diferida com base no mix de acordos.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InfraItem {
  id: string;
  name: string;
  type: string;
  unit_cost: number;
  active: boolean;
}

function InfraItemsManager() {
  const [items, setItems] = useState<InfraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InfraItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('shared_fixed');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('infra_items')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Erro ao buscar itens de infra:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: InfraItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setType(item.type);
      setUnitCost(item.unit_cost);
      setIsActive(item.active);
    } else {
      setEditingItem(null);
      setName('');
      setType('shared_fixed');
      setUnitCost('');
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || unitCost === '') return;

    setIsSaving(true);
    try {
      const payload = {
        name,
        type,
        unit_cost: Number(unitCost),
        active: isActive
      };

      if (editingItem) {
        const { error } = await supabase.from('infra_items').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('infra_items').insert([payload]);
        if (error) throw error;
      }

      await fetchItems();
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar item de infra:', err);
      alert('Erro ao salvar. Verifique o banco.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActiveStatus = async (item: InfraItem) => {
    try {
      const { error } = await supabase.from('infra_items').update({ active: !item.active }).eq('id', item.id);
      if (error) throw error;
      await fetchItems();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const filteredItems = React.useMemo(() => {
    let result = [...items];
    if (!showInactive) result = result.filter(i => i.active !== false);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(lower) || i.type.toLowerCase().includes(lower));
    }
    return result;
  }, [items, searchTerm, showInactive]);

  const typeLabels: Record<string, string> = {
    'shared_fixed': 'Compartilhado (Rateio %)',
    'variable_api': 'Transacional (Chamada)',
    'batch_instance': 'Fixo (Batch/Mes)',
    'storage_acumulativo': 'Data/Storage Acum.'
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold">Itens de Infraestrutura</h3>
          <p className="text-text-secondary text-sm">Dicionário de custos de nuvem e ferramentas API.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded border-border-subtle bg-element-bg text-primary focus:ring-primary" />
            Mostrar inativos
          </label>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-element-bg border border-border-subtle rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
          <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-element-bg border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Nome do Item</th>
                <th className="px-4 py-3 font-medium">Natureza</th>
                <th className="px-4 py-3 font-medium text-right">Custo Unitário Recomendado</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">Nenhum item encontrado.</td></tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className={`border-b border-border-subtle hover:bg-element-hover/50 ${!item.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-bold">{item.name}</td>
                    <td className="px-4 py-3 font-medium text-text-secondary">{typeLabels[item.type] || item.type}</td>
                    <td className="px-4 py-3 text-right text-primary font-mono font-bold">
                      {item.unit_cost.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4, style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${item.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(item)} className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => toggleActiveStatus(item)} className={`p-1.5 rounded-lg ${item.active ? 'text-text-secondary hover:text-rose-500 hover:bg-rose-500/10' : 'text-text-secondary hover:text-emerald-500 hover:bg-emerald-500/10'}`}>
                          {item.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface border border-border-subtle rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border-subtle">
              <h3 className="text-lg font-bold">{editingItem ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={handleCloseModal} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Item</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Natureza</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="shared_fixed">Compartilhado (Rateio %)</option>
                  <option value="variable_api">Transacional (Chamada)</option>
                  <option value="batch_instance">Fixo (Batch/Mes)</option>
                  <option value="storage_acumulativo">Data/Storage Acumulativo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Custo Unitário</label>
                <input type="number" step="any" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value ? Number(e.target.value) : '')} required className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border-subtle">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium flex items-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export function ParamsPricingView({ userPermissions }: { userPermissions: string[] }) {
  const [activeTab, setActiveTab] = useState<'cargos' | 'dafs' | 'modelos' | 'infra'>('cargos');

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
        <button
          onClick={() => setActiveTab('infra')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'infra' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
          }`}
        >
          <Server className="w-4 h-4" /> Itens de Infra
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
        ) : activeTab === 'infra' ? (
          <InfraItemsManager />
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
