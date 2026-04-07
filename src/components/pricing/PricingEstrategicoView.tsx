import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ArrowLeft, 
  Users, 
  Server, 
  FileText, 
  DollarSign, 
  BarChart3, 
  TrendingUp, 
  Briefcase, 
  Package, 
  Save, 
  Loader2, 
  Cloud, 
  Trash2, 
  Calendar, 
  Info, 
  X,
  XCircle,
  FileSpreadsheet,
  ChevronLeft,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingEstrategicoViewProps {
  userPermissions: string[];
}

export function PricingEstrategicoView({ userPermissions }: PricingEstrategicoViewProps) {
  const [view, setView] = useState<'overview' | 'new-bc' | 'monthly-details'>('overview');
  const [activeStep, setActiveStep] = useState<number>(1);
  
  // Centralized state for Business Case data
  const [bcData, setBcData] = useState({
    id: '' as string,
    name: '',
    description: '',
    painPoints: '',
    startDate: new Date().toISOString().substring(0, 7), // YYYY-MM
    model: 'cascata' as 'cascata' | 'serrote' | 'block' | 'license' | 'success_fee',
    targetClients: 0,
    avgVolume: 0,
    contractMonths: 12,
    resources: [] as any[]
  });

  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [inflationIndices, setInflationIndices] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Selection states for Step 2
  const [tempArea, setTempArea] = useState<string>('Sustentação');
  const [tempCustomArea, setTempCustomArea] = useState<string>('');
  const [tempRoleId, setTempRoleId] = useState<string>('');
  const [lastSavedData, setLastSavedData] = useState<string>('');
  
  const [allBusinessCases, setAllBusinessCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local states for large numeric inputs to avoid formatting flicker while typing
  const [localTargetClients, setLocalTargetClients] = useState('');
  const [localAvgVolume, setLocalAvgVolume] = useState('');
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});

  const PREDEFINED_AREAS = [
    'Sustentação',
    'Desenvolvimento',
    'Operações',
    'Produtos (PO)',
    'Consultoria',
    'Comercial',
    'Customer Success (CS)',
    'Parcerias'
  ];

  // Load initial data
  const fetchData = async () => {
    setIsLoading(true);
    const { data: roles } = await supabase.from('pricing_roles').select('*').eq('active', true);
    const { data: indices } = await supabase.from('inflation_indices').select('*').order('year', { ascending: true });
    if (roles) setAvailableRoles(roles);
    if (indices) setInflationIndices(indices);
    await fetchBusinessCases();
    setIsLoading(false);
  };

  const fetchBusinessCases = async () => {
    const { data, error } = await supabase
      .from('business_cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setAllBusinessCases(data);
    }
    if (error) console.error('Erro ao buscar Business Cases:', error);
  };

  // Sync lastSavedData and local inputs when bcData changes from external sources (loading/reset)
  React.useEffect(() => {
    if (view === 'new-bc') {
      if (bcData.id) {
        setLastSavedData(JSON.stringify(bcData));
      }
      // Sync local display values when data is loaded or reset
      setLocalTargetClients(formatNumber(bcData.targetClients));
      setLocalAvgVolume(formatNumber(bcData.avgVolume));
    }
  }, [bcData.id, view]);

  const isDirty = JSON.stringify(bcData) !== lastSavedData;

  React.useEffect(() => {
    fetchData();
  }, []);

  const formatNumber = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const calculateTotalBCLTV = (bc: any) => {
    const resources = bc.resources || [];
    if (resources.length === 0) return 0;
    
    // Support both DB naming (snake_case) and state naming (camelCase)
    const startDateStr = bc.start_date || bc.startDate;
    if (!startDateStr) return 0;
    
    const [startYear, startMonth] = startDateStr.split('-').map(Number);
    let totalLTV = 0;
    let accumulatedIPCAFactor = 1.0;
    const contractMonths = bc.contract_months || bc.contractMonths || 12;

    for (let m = 0; m < contractMonths; m++) {
      const monthIdx = (startMonth - 1 + m) % 12;
      const year = startYear + Math.floor((startMonth - 1 + m) / 12);
      const isJanuary = monthIdx === 0;

      if (isJanuary && m > 0) {
        const index = inflationIndices.find(idx => idx.year === year - 1 && !idx.month);
        if (index) {
          accumulatedIPCAFactor *= (1 + (index.value / 100));
        }
      }

      let monthCost = 0;
      resources.forEach((r: any) => {
        if ((m + 1 >= (r.start_month || 1)) && (m + 1 <= (r.end_month || contractMonths))) {
          const f = r.selected_faixa || 2;
          const salary = f === 1 ? (r.base_salary_1 || (r.base_salary * 0.8 * (r.hr_rate || 1))) : 
                         f === 3 ? (r.base_salary_3 || (r.base_salary * 1.2 * (r.hr_rate || 1))) :
                         (r.base_salary_2 || (r.base_salary * (r.hr_rate || 1)));
          monthCost += salary * (r.qty || 1) * ((r.allocation || 100) / 100);
        }
      });
      totalLTV += monthCost * accumulatedIPCAFactor;
    }
    return totalLTV;
  };

  const parseNumber = (val: string) => {
    if (!val) return 0;
    // Remove dots (thousands separators pt-BR)
    // Replace comma with dot (decimal separator normalized)
    const clean = val.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  if (!userPermissions.includes('Pricing Estratégico')) {
    return <div className="p-8 text-center text-rose-400">Acesso negado.</div>;
  }

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral - Business Cases</h2>
          <p className="text-text-secondary text-sm">Acompanhe e gerencie todos os seus Business Cases.</p>
        </div>
        <button
          onClick={() => {
            setBcData({
              id: '',
              name: '',
              description: '',
              painPoints: '',
              startDate: new Date().toISOString().substring(0, 7),
              model: 'cascata',
              targetClients: 0,
              avgVolume: 0,
              contractMonths: 12,
              resources: []
            });
            setActiveStep(1);
            setView('new-bc');
          }}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Criar um Novo BC
        </button>
      </div>

      {/* Indicadores Dinâmicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm mb-1">BCs Iniciados</div>
            <div className="text-2xl font-display font-bold">{allBusinessCases.length}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm mb-1">Margem Média</div>
            <div className="text-2xl font-display font-bold">--</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm mb-1">Custo Estimado Pessoal (LTV)</div>
            <div className="text-2xl font-display font-bold">
              R$ {formatNumber(allBusinessCases.reduce((acc, bc) => acc + calculateTotalBCLTV(bc), 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de BCs Real */}
      <div className="glass-panel p-6 rounded-xl border border-border-subtle">
        <h3 className="text-lg font-bold mb-4">Seus Projetos em Desenvolvimento</h3>
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-secondary">
             <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-20" />
             <p className="text-sm">Carregando seus Business Cases...</p>
          </div>
        ) : allBusinessCases.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-secondary border border-dashed border-border-subtle rounded-xl bg-element-bg/30">
             <Briefcase className="w-10 h-10 mb-2 opacity-10" />
             <p className="text-sm">Nenhum Business Case encontrado.</p>
             <button 
               onClick={() => {
                 setBcData({
                   id: '',
                   name: '',
                   description: '',
                   painPoints: '',
                   startDate: new Date().toISOString().substring(0, 7),
                   model: 'cascata',
                   targetClients: 0,
                   avgVolume: 0,
                   contractMonths: 12,
                   resources: []
                 });
                 setActiveStep(1);
                 setView('new-bc');
               }}
               className="mt-4 text-primary font-bold text-xs uppercase hover:underline"
             >
               Começar meu primeiro BC agora
             </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-text-secondary uppercase tracking-widest bg-element-bg border-b border-border-subtle">
                <tr>
                  <th className="px-4 py-4 font-bold">Nome do Business Case / Status</th>
                  <th className="px-4 py-4 font-bold text-center">Modelo</th>
                  <th className="px-4 py-4 font-bold text-right">LTV Pessoal</th>
                  <th className="px-4 py-4 font-bold text-center">Data Criado</th>
                  <th className="px-4 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {allBusinessCases.map((bc) => {
                  const ltv = calculateTotalBCLTV(bc);

                  return (
                    <tr key={bc.id} className="border-b border-border-subtle hover:bg-element-hover/50 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-text-primary text-sm uppercase">{bc.name || 'Sem Nome'}</div>
                          <div className="flex items-center gap-2">
                             <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                               bc.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-500' :
                               bc.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-500' :
                               'bg-primary/10 text-primary'
                             }`}>
                               {bc.status || 'Draft'}
                             </span>
                             <span className="text-[10px] text-text-secondary line-clamp-1">{bc.description || 'Nenhum detalhe adicional.'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-[10px] uppercase font-bold text-text-secondary">
                        {bc.model}
                      </td>
                      <td className="px-4 py-4 text-right font-bold tabular-nums text-primary">
                        R$ {formatNumber(ltv)}
                      </td>
                      <td className="px-4 py-4 text-center text-text-secondary text-[10px]">
                        {new Date(bc.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              setBcData({
                                id: bc.id,
                                name: bc.name || '',
                                description: bc.description || '',
                                painPoints: bc.pain_points || '',
                                startDate: bc.start_date || new Date().toISOString().substring(0, 7),
                                model: bc.model || 'cascata',
                                targetClients: bc.target_clients || 0,
                                avgVolume: bc.avg_volume || 0,
                                contractMonths: bc.contract_months || 12,
                                resources: bc.resources || []
                              });
                              setActiveStep(1);
                              setView('new-bc');
                            }}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
                            title="Continuar Editando"
                          >
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Abrir</span>
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('Deseja realmente excluir este Business Case?')) {
                                const { error } = await supabase.from('business_cases').delete().eq('id', bc.id);
                                if (!error) fetchBusinessCases();
                              }
                            }}
                            className="p-2 text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderNewBC = () => {
    const steps = [
      { id: 1, name: 'Produto', icon: Package },
      { id: 2, name: 'Recursos (MOE e MOI)', icon: Users },
      { id: 3, name: 'Infraestrutura (TI)', icon: Server },
      { id: 4, name: 'DAF', icon: FileText },
      { id: 5, name: 'Investimento', icon: DollarSign },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('overview')}
            className="p-2 rounded-xl bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Novo Business Case</h2>
            <p className="text-text-secondary text-sm">Preencha as informações para construir o Business Case.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="glass-panel p-4 rounded-xl border border-border-subtle">
          <div className="flex flex-wrap md:flex-nowrap justify-between gap-2">
            {steps.map((step) => {
              const isActive = activeStep === step.id;
              const isPast = activeStep > step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center md:justify-start ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : isPast 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-element-bg text-text-secondary hover:bg-element-hover'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{step.name}</span>
                  <span className="md:hidden">{step.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="glass-panel p-6 rounded-xl border border-border-subtle min-h-[400px]">
          {activeStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-1">Informações do Produto</h3>
                <p className="text-text-secondary text-sm">Defina o escopo geral deste Business Case.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome do Business Case / Projeto</label>
                  <input
                    type="text"
                    value={bcData.name}
                    onChange={(e) => setBcData({ ...bcData, name: e.target.value })}
                    placeholder="Ex: Novo Produto de Recuperação Portuária"
                    className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Modelo de Precificação Pretendido</label>
                  <select
                    value={bcData.model}
                    onChange={(e) => setBcData({ ...bcData, model: e.target.value as any })}
                    className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="cascata">Cascata (Tiered Pricing)</option>
                    <option value="serrote">Serrote (Volume Pricing)</option>
                    <option value="block">Block Price (Preço Fixo / Bloco)</option>
                    <option value="license">Licença de Uso (SaaS / Mensalidade)</option>
                    <option value="success_fee">Success Fee (Recuperação de Crédito)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Prazo do Contrato (Meses)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={bcData.contractMonths}
                      onChange={(e) => setBcData({ ...bcData, contractMonths: parseInt(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="w-12 text-center font-bold text-primary">{bcData.contractMonths}m</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Mês de Início do Contrato</label>
                  <input
                    type="month"
                    value={bcData.startDate}
                    onChange={(e) => setBcData({ ...bcData, startDate: e.target.value })}
                    className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Quantidade de Clientes Prevista</label>
                  <input
                    type="text"
                    value={localTargetClients || formatNumber(bcData.targetClients)}
                    onChange={(e) => setLocalTargetClients(e.target.value)}
                    onBlur={() => {
                      const num = parseNumber(localTargetClients);
                      setBcData(prev => ({ ...prev, targetClients: num }));
                      setLocalTargetClients(formatNumber(num));
                    }}
                    className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Volume Médio Mensal p/ Cliente</label>
                  <input
                    type="text"
                    value={localAvgVolume || formatNumber(bcData.avgVolume)}
                    onChange={(e) => setLocalAvgVolume(e.target.value)}
                    onBlur={() => {
                      const num = parseNumber(localAvgVolume);
                      setBcData(prev => ({ ...prev, avgVolume: num }));
                      setLocalAvgVolume(formatNumber(num));
                    }}
                    className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Descrição da Solução (O que o produto faz?)</label>
                  <textarea
                    value={bcData.description}
                    onChange={(e) => setBcData({ ...bcData, description: e.target.value })}
                    placeholder="Descreva as principais características e funcionalidades da solução..."
                    rows={3}
                    className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Dores que Resolve (Pain Points)</label>
                  <textarea
                    value={bcData.painPoints}
                    onChange={(e) => setBcData({ ...bcData, painPoints: e.target.value })}
                    placeholder="Quais problemas de negócio ou ineficiências esta solução elimina? (Ex: Redução de 20% em fraudes...)"
                    rows={3}
                    className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex gap-4 mt-8">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-primary">Volumetria Total Projetada</h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Este BC está sendo construído para suportar um volume mensal total de <strong>{formatNumber(bcData.targetClients * bcData.avgVolume)} transações/unidades</strong>.
                  </p>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={() => saveBusinessCase()}
                    disabled={!isDirty || isSaving}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:grayscale shadow-lg shadow-primary/20"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Progresso
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-3 bg-element-bg/30 p-3 rounded-2xl border border-border-subtle">
                   <div className="flex-1 min-w-[180px]">
                      <label className="block text-[10px] text-text-secondary uppercase font-bold mb-1 ml-1">1. Selecione a Área do Projeto</label>
                      <select 
                        value={tempArea}
                        onChange={(e) => setTempArea(e.target.value)}
                        className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      >
                        {PREDEFINED_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        <option value="Outro">Outra (Nova Área)...</option>
                      </select>
                   </div>

                   {tempArea === 'Outro' && (
                     <div className="flex-1 min-w-[180px]">
                        <label className="block text-[10px] text-text-secondary uppercase font-bold mb-1 ml-1">Nome da Nova Área</label>
                        <input 
                          type="text"
                          value={tempCustomArea}
                          onChange={(e) => setTempCustomArea(e.target.value)}
                          placeholder="Ex: Novos Negócios"
                          className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                     </div>
                   )}

                   <div className="flex-[2] min-w-[240px]">
                      <label className="block text-[10px] text-text-secondary uppercase font-bold mb-1 ml-1">2. Selecione o Cargo</label>
                      <select 
                        value={tempRoleId}
                        onChange={(e) => setTempRoleId(e.target.value)}
                        className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      >
                        <option value="">Selecione um Cargo...</option>
                        {availableRoles.map(role => (
                          <option key={role.id} value={role.id}>
                            [{role.type}] {role.role} - R$ {formatNumber(role.base_salary)}
                          </option>
                        ))}
                      </select>
                   </div>

                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => saveBusinessCase()}
                       disabled={!isDirty || isSaving}
                       className="px-6 py-2 bg-surface border border-primary/30 text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                     >
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                       Salvar
                     </button>

                     <button 
                       onClick={() => {
                         if (!tempRoleId) return;
                         const role = availableRoles.find(r => r.id === tempRoleId);
                         if (role) {
                           const finalArea = tempArea === 'Outro' ? tempCustomArea : tempArea;
                           if (!finalArea) return alert('Por favor, defina o nome da área.');

                           setBcData({
                             ...bcData,
                             resources: [...bcData.resources, { 
                               ...role, 
                               id: `${role.id}-${Date.now()}`, // Unique ID for this instance in resources
                               area: finalArea, 
                               qty: 1,
                                allocation: 100,
                               start_month: 1,
                               end_month: bcData.contractMonths,
                               selected_faixa: 2 // Faixa 2 (100%) como padrão
                             }]
                           });
                           // Reset selections
                           setTempRoleId('');
                         }
                       }}
                       disabled={!tempRoleId}
                       className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                     >
                       <Plus className="w-4 h-4" /> Adicionar
                     </button>
                   </div>
              </div>

              {bcData.resources.length === 0 ? (
                <div className="p-8 border border-border-subtle border-dashed rounded-xl flex flex-col items-center justify-center text-text-secondary bg-element-bg/50">
                  <Users className="w-8 h-8 mb-2 opacity-20" />
                  <p>Nenhum recurso adicionado ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-text-secondary uppercase tracking-wider border-b border-border-subtle bg-element-bg/20">
                      <tr>
                        <th className="px-2 py-4 font-bold">Cargo</th>
                        <th className="px-2 py-4 font-bold">Área</th>
                        <th className="px-2 py-4 font-bold">Faixa</th>
                        <th className="px-2 py-4 font-bold text-center">Mês Início</th>
                        <th className="px-2 py-4 font-bold text-center">Mês Fim</th>
                        <th className="px-2 py-4 font-bold text-center">Tipo</th>
                        <th className="px-2 py-4 font-bold text-right">Custo (RH)</th>
                        <th className="px-2 py-4 font-bold text-center">HC</th>
                        <th className="px-2 py-4 font-bold text-center text-primary">(%) Dedicação</th>
                        <th className="px-2 py-4 font-bold text-right">Mensal Ativo</th>
                        <th className="px-2 py-4 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Group resources by area
                        const groups: Record<string, any[]> = {};
                        bcData.resources.forEach((res, idx) => {
                          const area = res.area || 'Outros';
                          if (!groups[area]) groups[area] = [];
                          groups[area].push({ ...res, originalIndex: idx });
                        });

                        return Object.entries(groups).map(([area, resources]) => {
                          const isExpanded = expandedAreas[area] !== false; // default to expanded
                          const areaTotalHC = resources.reduce((sum, r) => sum + (r.qty * ((r.allocation || 100) / 100)), 0);
                          
                          // Correctly calculate total area cost based on each role's faixa-based salary
                          const areaTotalCost = resources.reduce((sum, r) => {
                            const f = r.selected_faixa || 2;
                            const salary = f === 1 ? (r.base_salary_1 || (r.base_salary * 0.8 * (r.hr_rate || 1))) : 
                                         f === 3 ? (r.base_salary_3 || (r.base_salary * 1.2 * (r.hr_rate || 1))) :
                                         (r.base_salary_2 || (r.base_salary * (r.hr_rate || 1)));
                            return sum + (salary * r.qty * ((r.allocation || 100) / 100));
                          }, 0);

                          return (
                            <React.Fragment key={area}>
                              {/* Group Header Row */}
                              <tr 
                                onClick={() => setExpandedAreas(prev => ({ ...prev, [area]: !isExpanded }))}
                                className="cursor-pointer bg-primary/10 hover:bg-primary/20 border-b border-border-subtle transition-colors"
                              >
                                <td colSpan={7} className="px-3 py-3">
                                   <div className="flex items-center gap-3">
                                      <ChevronLeft className={`w-4 h-4 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-0'}`} />
                                      <span className="text-[11px] font-black uppercase text-primary tracking-widest">{area}</span>
                                   </div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                   <span className="text-[12px] font-black text-primary bg-primary/20 px-2 py-0.5 rounded-full">{areaTotalHC.toFixed(1)} HC</span>
                                </td>
                                <td></td>
                                <td className="px-2 py-3 text-right">
                                   <span className="text-[12px] font-black text-primary">R$ {formatNumber(areaTotalCost)}</span>
                                </td>
                                <td className="px-2 py-3"></td>
                              </tr>

                              {/* Child Rows (Drill down) */}
                              {isExpanded && resources.map((res) => {
                                const index = res.originalIndex;
                                const getSalaryByFaixa = (r: any) => {
                                  const f = r.selected_faixa || 2;
                                  if (f === 1) return r.base_salary_1 || (r.base_salary * 0.8 * (r.hr_rate || 1));
                                  if (f === 3) return r.base_salary_3 || (r.base_salary * 1.2 * (r.hr_rate || 1));
                                  return r.base_salary_2 || (r.base_salary * (r.hr_rate || 1));
                                };
                                const unitCost = getSalaryByFaixa(res);
                                return (
                                  <tr key={res.id} className="border-b border-border-subtle hover:bg-element-hover/30 transition-colors group">
                                    <td className="px-2 py-4 font-medium text-[10px] uppercase whitespace-nowrap">
                                       <div className="flex flex-col pl-4 border-l-2 border-primary/20 bg-primary/5">
                                         <span className="mb-1">{res.role}</span>
                                         <span className="text-[8px] text-text-secondary normal-case font-normal">Base: {formatNumber(res.base_salary)}</span>
                                       </div>
                                    </td>
                                    <td className="px-2 py-4">
                                       <div className="w-32">
                                         <input 
                                           type="text"
                                           value={res.area || ''}
                                           onChange={(e) => {
                                             const newRes = [...bcData.resources];
                                             newRes[index].area = e.target.value;
                                             setBcData({ ...bcData, resources: newRes });
                                           }}
                                           placeholder="Área..."
                                           className="text-[10px] bg-element-bg border border-border-subtle rounded px-2 py-1 w-full uppercase focus:border-primary outline-none font-bold"
                                         />
                                       </div>
                                    </td>
                                    <td className="px-2 py-4">
                                       <div className="flex bg-element-bg border border-border-subtle rounded-lg p-0.5 w-fit">
                                         {[1, 2, 3].map(f => (
                                           <button
                                             key={f}
                                             onClick={() => {
                                               const newRes = [...bcData.resources];
                                               newRes[index].selected_faixa = f;
                                               setBcData({ ...bcData, resources: newRes });
                                             }}
                                             className={`px-2 py-1 text-[9px] font-bold rounded transition-colors ${res.selected_faixa === f ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
                                           >
                                             Fx{f}
                                           </button>
                                         ))}
                                       </div>
                                    </td>
                                    <td className="px-2 py-4">
                                      <div className="flex flex-col items-center">
                                        <input 
                                          type="number"
                                          min="0"
                                          max={bcData.contractMonths}
                                          value={res.start_month || 1}
                                          onChange={(e) => {
                                            const newRes = [...bcData.resources];
                                            newRes[index].start_month = parseFloat(e.target.value) || 0;
                                            setBcData({ ...bcData, resources: newRes });
                                          }}
                                          className="w-16 bg-element-bg border border-border-subtle rounded-lg px-2 py-1 text-center font-bold text-[10px] focus:ring-1 focus:ring-primary outline-none"
                                        />
                                      </div>
                                    </td>
                                    <td className="px-2 py-4 relative">
                                      <div className="flex flex-col items-center">
                                        <input 
                                          type="number"
                                          min="0"
                                          max={bcData.contractMonths}
                                          value={res.end_month || bcData.contractMonths}
                                          onChange={(e) => {
                                            const newRes = [...bcData.resources];
                                            newRes[index].end_month = parseInt(e.target.value) || bcData.contractMonths;
                                            setBcData({ ...bcData, resources: newRes });
                                          }}
                                          className={`w-16 bg-element-bg border rounded-lg px-2 py-1 text-center font-bold text-[10px] focus:ring-1 focus:ring-primary outline-none ${res.end_month < bcData.contractMonths ? 'border-amber-500/50' : 'border-border-subtle'}`}
                                        />
                                        {res.end_month < bcData.contractMonths && (
                                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-amber-500" title="Rampa encerrada antes do fim do contrato">
                                            <AlertCircle className="w-3 h-3" />
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-4 text-center">
                                      <span className={`px-2 py-1 rounded-full text-[9px] font-bold tracking-tight ${res.type === 'MOE' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                        {res.type}
                                      </span>
                                    </td>
                                     <td className="px-2 py-4 text-right text-[10px] font-medium tabular-nums whitespace-nowrap">R$ {formatNumber(unitCost)}</td>
                                     <td className="px-2 py-4">
                                       <div className="flex justify-center">
                                         <input 
                                           type="number"
                                           min="0"
                                           step="any"
                                           value={res.qty}
                                           onChange={(e) => {
                                             const newRes = [...bcData.resources];
                                             newRes[index].qty = parseFloat(e.target.value) || 0;
                                             setBcData({ ...bcData, resources: newRes });
                                           }}
                                           className="w-20 bg-element-bg border border-border-subtle rounded-lg px-2 py-1.5 text-center font-bold text-[10px] focus:ring-1 focus:ring-primary outline-none"
                                         />
                                       </div>
                                     </td>
                                     <td className="px-2 py-4">
                                       <div className="flex justify-center">
                                         <div className="relative w-20">
                                           <input 
                                             type="number"
                                             min="0"
                                             max="100"
                                             step="any"
                                             value={res.allocation || 100}
                                             onChange={(e) => {
                                               const newRes = [...bcData.resources];
                                               newRes[index].allocation = parseFloat(e.target.value) || 0;
                                               setBcData({ ...bcData, resources: newRes });
                                             }}
                                             className="w-full bg-element-bg border border-border-subtle rounded-lg px-2 py-1.5 text-center font-bold text-[10px] focus:ring-1 focus:ring-primary outline-none"
                                           />
                                         </div>
                                       </div>
                                     </td>
                                     <td className="px-2 py-4 text-right font-bold text-primary whitespace-nowrap text-[10px] tabular-nums">
                                       R$ {formatNumber(unitCost * res.qty * ((res.allocation || 100) / 100))}
                                     </td>
                                    <td className="px-2 py-4 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {res.end_month < bcData.contractMonths && (
                                          <button 
                                            onClick={() => {
                                               const nextStart = res.end_month + 1;
                                               if (nextStart > bcData.contractMonths) return;
                                               
                                               setBcData({
                                                 ...bcData,
                                                 resources: [...bcData.resources, {
                                                   ...res,
                                                   id: `${res.id}-ramp-${Date.now()}`,
                                                   start_month: nextStart,
                                                   end_month: bcData.contractMonths,
                                                   allocation: res.allocation || 100,
                                                 }]
                                               });
                                            }}
                                            className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                            title="Clique para completar o restante do contrato com este cargo"
                                          >
                                            <PlusCircle className="w-4 h-4" />
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => {
                                            const newRes = bcData.resources.filter((_, i) => i !== index);
                                            setBcData({ ...bcData, resources: newRes });
                                          }}
                                          className="p-1.5 text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resumo de Projeção com IPCA */}
              {bcData.resources.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="glass-panel p-5 rounded-2xl border border-primary/20 bg-primary/5">
                    <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                       <TrendingUp className="w-4 h-4" /> Projeção de Custo de Equipe (LTV)
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                         <span className="text-text-secondary">Custo Mensal Inicial:</span>
                         <span className="font-bold">R$ {formatNumber(bcData.resources.reduce((acc, r) => {
                           const f = r.selected_faixa || 2;
                           const salary = f === 1 ? (r.base_salary_1 || (r.base_salary * 0.8 * (r.hr_rate || 1))) : 
                                          f === 3 ? (r.base_salary_3 || (r.base_salary * 1.2 * (r.hr_rate || 1))) :
                                          (r.base_salary_2 || (r.base_salary * (r.hr_rate || 1)));
                           return acc + (salary * r.qty * ((r.allocation || 100) / 100));
                         }, 0))}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                         <span className="text-text-secondary">Total Acumulado ({bcData.contractMonths}m):</span>
                         <span className="font-bold text-primary text-lg">R$ {formatNumber(calculateLTVResources())}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-primary/10 flex items-center gap-2 text-[10px] text-text-secondary">
                         <Info className="w-3 h-3" />
                         Os valores incluem reajuste automático de IPCA em Janeiro conforme seus parâmetros.
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-border-subtle bg-element-bg/20">
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                       <Calendar className="w-4 h-4" /> Evolução Anual do Custo Mensal
                    </h4>
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
                        {getYearlyCostEvolution().map((yearData: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-border-subtle last:border-0 hover:bg-white/5 transition-colors group">
                             <div className="flex flex-col">
                                <span className="font-medium text-text-primary">Ano {yearData.year} (Mês {yearData.monthStart} a {yearData.monthEnd})</span>
                                <span className="text-[9px] text-text-secondary uppercase font-bold tracking-tighter">
                                   Alocação: {yearData.headcount.toFixed(1)} profissional(is)
                                </span>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5">
                                   <span className="text-[8px] text-text-secondary uppercase font-black tracking-tighter">Mensal:</span>
                                   <span className="font-bold text-text-primary text-xs">R$ {formatNumber(yearData.monthlyCost)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                   <span className="text-[8px] text-text-secondary uppercase font-black tracking-tighter">Total:</span>
                                   <span className="font-bold text-primary text-xs">R$ {formatNumber(yearData.totalCost)}</span>
                                </div>
                             </div>
                          </div>
                        ))}
                    </div>
                    <button 
                      onClick={() => setView('monthly-details')}
                      className="w-full mt-4 py-2 border border-border-subtle rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-element-hover transition-colors flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet className="w-3 h-3" /> Ver Detalhamento Mensal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeStep === 3 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Infraestrutura (TI)</h3>
              <p className="text-text-secondary text-sm mb-6">Especifique os custos de infraestrutura e tecnologia.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de Infraestrutura em construção...
              </div>
            </div>
          )}
          {activeStep === 4 && (
            <div>
              <h3 className="text-lg font-bold mb-4">DAF (Despesa atrelada ao Faturamento)</h3>
              <p className="text-text-secondary text-sm mb-6">Configure as despesas que variam de acordo com o faturamento.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de DAF em construção...
              </div>
            </div>
          )}
          {activeStep === 5 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Investimento</h3>
              <p className="text-text-secondary text-sm mb-6">Determine o valor de investimento inicial para construir o produto.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de Investimento em construção...
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Salvando rascunho...</>}
            {saveStatus === 'saved' && <><Cloud className="w-3 h-3 text-emerald-500" /> Rascunho salvo no banco</>}
            {saveStatus === 'error' && <><Cloud className="w-3 h-3 text-rose-500" /> Erro ao salvar</>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              disabled={activeStep === 1 || isSaving}
              className="px-4 py-2 bg-element-bg border border-border-subtle rounded-xl text-sm font-medium hover:bg-element-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={async () => {
                if (activeStep < 5) {
                  const saved = await saveBusinessCase();
                  if (saved) {
                    setActiveStep(prev => prev + 1);
                  }
                } else {
                  const saved = await saveBusinessCase();
                  if (saved) {
                    alert('Business Case concluído com sucesso!');
                    setView('overview');
                  }
                }
              }}
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : activeStep === 5 ? <Save className="w-4 h-4" /> : null}
              {activeStep === 5 ? 'Concluir e Salvar' : 'Próximo'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const saveBusinessCase = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const payload = {
        name: bcData.name,
        description: bcData.description,
        pain_points: bcData.painPoints,
        start_date: bcData.startDate,
        model: bcData.model,
        target_clients: bcData.targetClients,
        avg_volume: bcData.avgVolume,
        contract_months: bcData.contractMonths,
        resources: bcData.resources,
        status: 'Em Construção'
      };

      if (bcData.id) {
        // Update
        const { error } = await supabase
          .from('business_cases')
          .update(payload)
          .eq('id', bcData.id);
        if (error) throw error;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('business_cases')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setBcData(prev => ({ ...prev, id: data.id }));
        }
      }

      setLastSavedData(JSON.stringify(bcData));
      setSaveStatus('saved');
      fetchBusinessCases(); // Refresh global list
      return true;
    } catch (err) {
      console.error('Erro ao salvar Business Case:', err);
      setSaveStatus('error');
      alert('Erro ao salvar progresso. Verifique a conexão com o banco de dados.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const calculateLTVResources = () => calculateTotalBCLTV(bcData);

  const getYearlyCostEvolution = () => {
    const years: Record<number, { monthlyCosts: number[], headcounts: number[], monthStart: number, monthEnd: number }> = {};
    const [startYear, startMonth] = bcData.startDate.split('-').map(Number);
    
    for (let m = 0; m < bcData.contractMonths; m++) {
      const monthIdx = (startMonth - 1 + m) % 12;
      const currentYear = startYear + Math.floor((startMonth - 1 + m) / 12);
      
      if (!years[currentYear]) {
        years[currentYear] = {
          monthlyCosts: [],
          headcounts: [],
          monthStart: m + 1,
          monthEnd: m + 1
        };
      }
      
      // Calculate monthly cost for this month
      let monthCost = bcData.resources
        .filter(r => (m + 1 >= (r.start_month || 1)) && (m + 1 <= (r.end_month || bcData.contractMonths)))
        .reduce((acc, r) => {
          const f = r.selected_faixa || 2;
          const salary = f === 1 ? (r.base_salary_1 || (r.base_salary * 0.8 * (r.hr_rate || 1))) : 
                         f === 3 ? (r.base_salary_3 || (r.base_salary * 1.2 * (r.hr_rate || 1))) :
                         (r.base_salary_2 || (r.base_salary * (r.hr_rate || 1)));
          return acc + (salary * r.qty * ((r.allocation || 100) / 100));
        }, 0);
      
      // Calculate headcount for this month (FTE)
      const headcount = bcData.resources
        .filter(r => (m + 1 >= (r.start_month || 1)) && (m + 1 <= (r.end_month || bcData.contractMonths)))
        .reduce((acc, r) => acc + (r.qty * ((r.allocation || 100) / 100)), 0);

      // Apply IPCA factor for elapsed years
      for (let y = startYear; y < currentYear; y++) {
        const index = inflationIndices.find(idx => idx.year === y && !idx.month);
        if (index) monthCost *= (1 + (index.value / 100));
      }

      years[currentYear].monthlyCosts.push(monthCost);
      years[currentYear].headcounts.push(headcount);
      years[currentYear].monthEnd = m + 1;
    }
    
    return Object.entries(years).sort((a,b) => Number(a[0]) - Number(b[0])).map(([year, data]) => ({
      year: Number(year),
      monthlyCost: data.monthlyCosts.reduce((a, b) => a + b, 0) / data.monthlyCosts.length,
      totalCost: data.monthlyCosts.reduce((a, b) => a + b, 0),
      headcount: data.headcounts.reduce((a, b) => a + b, 0) / data.headcounts.length,
      monthStart: data.monthStart,
      monthEnd: data.monthEnd
    }));
  };

  const renderMonthlyDetailsPage = () => {
    const months = getDetailedMonthlyTimeline();
    const uniqueAreas: string[] = Array.from(new Set(bcData.resources.map(r => r.area))).sort() as string[];

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('new-bc')}
              className="p-2 rounded-xl bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">Projeção Mensal de Pessoal</h2>
              <p className="text-text-secondary text-[11px]">Detalhamento por área e reajuste IPCA acumulado.</p>
            </div>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl border border-primary/20 bg-primary/5">
              <div className="text-[9px] text-text-secondary uppercase font-bold tracking-widest mb-0.5">Investimento Total LTV</div>
              <div className="text-lg font-display font-bold text-primary">R$ {formatNumber(calculateLTVResources())}</div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="bg-element-bg border-b border-border-subtle">
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest sticky left-0 bg-element-bg z-10 w-28 border-r border-border-subtle/50">Mês/Ano</th>
                  {uniqueAreas.map(area => (
                    <th key={area} className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-right min-w-[100px]">
                      {area || 'N/A'}
                    </th>
                  ))}
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-center">HC Total</th>
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-center">IPCA</th>
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-right bg-primary/5 text-primary">Total Mensal</th>
                </tr>
              </thead>
              <tbody>
                {(months as any[]).map((item, i) => (
                  <tr key={i} className={`border-b border-border-subtle/30 hover:bg-element-hover/50 transition-colors ${item.isJanuary ? 'bg-primary/5' : ''}`}>
                    <td className="py-1.5 px-4 font-bold sticky left-0 bg-surface border-r border-border-subtle/50">{item.dateLabel}</td>
                    {uniqueAreas.map((area: string) => (
                      <td key={area} className="py-1.5 px-4 text-right font-medium text-text-secondary">
                        R$ {formatNumber(item.areaCosts[area] || 0)}
                      </td>
                    ))}
                    <td className="py-1.5 px-4 text-center">
                       <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[9px]">
                         {item.totalHC.toFixed(1)}
                       </span>
                    </td>
                    <td className="py-1.5 px-4 text-center">
                      {item.appliedIPCA > 0 ? (
                        <div className="flex flex-col items-center">
                           <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[9px]">
                            +{item.appliedIPCA}%
                           </span>
                           <span className="text-[7px] uppercase text-emerald-500 mt-0.5 font-bold">Reajuste</span>
                        </div>
                      ) : (
                        <span className="text-text-secondary text-[9px]">--</span>
                      )}
                    </td>
                    <td className="py-1.5 px-4 text-right font-bold text-primary bg-primary/5">
                      R$ {formatNumber(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
                  <tfoot className="bg-element-bg font-bold">
                 <tr>
                    <td className="py-3 px-4 sticky left-0 bg-element-bg border-r border-border-subtle/50 uppercase text-[9px]">TOTAIS LTV</td>
                    {uniqueAreas.map((area: string) => {
                      const areaTotal = (months as any[]).reduce((acc: number, m: any) => acc + (m.areaCosts[area] || 0), 0);
                      return (
                        <td key={area} className="py-3 px-4 text-right text-primary text-[10px]">R$ {formatNumber(areaTotal)}</td>
                      )
                    })}
                    <td className="py-3 px-4 text-center text-text-secondary text-[10px]">--</td>
                    <td></td>
                    <td className="py-3 px-4 text-right text-primary bg-primary/10 text-base">R$ {formatNumber(calculateLTVResources())}</td>
                 </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
           <button 
             onClick={() => setView('new-bc')}
             className="px-6 py-2.5 bg-element-bg border border-border-subtle rounded-xl text-sm font-bold hover:bg-element-hover transition-colors flex items-center gap-2"
           >
             <ArrowLeft className="w-4 h-4" /> Voltar ao Business Case
           </button>
        </div>
      </motion.div>
    );
  };

  const getDetailedMonthlyTimeline = (): any[] => {
    const timeline: any[] = [];
    const [startYear, startMonth] = bcData.startDate.split('-').map(Number);
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const uniqueAreas = Array.from(new Set(bcData.resources.map(r => r.area))) as string[];
    
    // Accumulator for IPCA factor per year
    let accumulatedIPCAFactor = 1.0;

    for (let m = 0; m < bcData.contractMonths; m++) {
      const monthIdx = (startMonth - 1 + m) % 12;
      const yearOffset = Math.floor((startMonth - 1 + m) / 12);
      const year = startYear + yearOffset;
      const isJanuary = monthIdx === 0;

      // Apply IPCA if it's January (and not the first month of contract or first year)
      let appliedIPCA = 0;
      if (isJanuary && m > 0) {
        const index = inflationIndices.find(idx => idx.year === year - 1 && !idx.month);
        if (index) {
          appliedIPCA = index.value;
          accumulatedIPCAFactor *= (1 + (appliedIPCA / 100));
        }
      }

      const areaCosts: Record<string, number> = {};
      let totalMonth = 0;
      let totalHC = 0;

      uniqueAreas.forEach((area: string) => {
        const activeResources = bcData.resources
          .filter(r => r.area === area && (m + 1 >= (r.start_month || 1)) && (m + 1 <= (r.end_month || bcData.contractMonths)));
        
        const costForArea = activeResources.reduce((acc, r) => {
          const f = r.selected_faixa || 2;
          const salary = f === 1 ? (r.base_salary_1 || (r.base_salary * 0.8 * (r.hr_rate || 1))) : 
                         f === 3 ? (r.base_salary_3 || (r.base_salary * 1.2 * (r.hr_rate || 1))) :
                         (r.base_salary_2 || (r.base_salary * (r.hr_rate || 1)));
          return acc + (salary * r.qty * ((r.allocation || 100) / 100));
        }, 0);
        const hcForArea = activeResources.reduce((acc, r) => acc + (r.qty * ((r.allocation || 100) / 100)), 0);
        
        const projectedAreaCost = costForArea * accumulatedIPCAFactor;
        areaCosts[area] = projectedAreaCost;
        totalMonth += projectedAreaCost;
        totalHC += hcForArea;
      });

      timeline.push({
        dateLabel: `${monthsNames[monthIdx]}/${year}`,
        areaCosts,
        appliedIPCA,
        total: totalMonth,
        totalHC,
        isJanuary: isJanuary && m > 0
      });
    }
    return timeline;
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {view === 'overview' && renderOverview()}
        {view === 'new-bc' && renderNewBC()}
        {view === 'monthly-details' && renderMonthlyDetailsPage()}
      </AnimatePresence>
    </div>
  );
}
