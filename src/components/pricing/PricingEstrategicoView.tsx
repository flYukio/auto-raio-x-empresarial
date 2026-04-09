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
  Search,
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
  AlertTriangle,
  PlusCircle,
  Edit2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PricingEstrategicoViewProps {
  userPermissions: string[];
}

export function PricingEstrategicoView({ userPermissions }: PricingEstrategicoViewProps) {
  const [view, setView] = useState<'overview' | 'new-bc' | 'monthly-details' | 'infra-details'>('overview');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTierModal, setActiveTierModal] = useState<string | null>(null);
  const [bcData, setBcData] = useState({
    id: '' as string,
    sku: '',
    name: '',
    description: '',
    painPoints: '',
    startDate: new Date().toISOString().substring(0, 7), // YYYY-MM
    model: 'cascata' as 'cascata' | 'serrote' | 'block' | 'license' | 'success_fee',
    targetClients: 0,
    avgVolume: 0,
    contractMonths: 12,
    resources: [] as any[],
    infrastructure: {
      cloudBuffer: 0,
      envMultiplier: 1.0,
      items: [] as any[]
    },
    volumeStrategy: {
      type: 'ramp' as 'ramp' | 'manual',
      rampUpMonths: 0,
      safetyBuffer: 0,
      expansionRate: 0,
      churnRate: 0,
      tiers: [
        { id: 't1', name: 'Contas Enterprise (Grandes)', initialCount: 1, finalCount: 5, avgVolume: 25000 },
        { id: 't2', name: 'Middle Market (Médias)', initialCount: 2, finalCount: 15, avgVolume: 8000 },
        { id: 't3', name: 'Small Business (Pequenas)', initialCount: 5, finalCount: 40, avgVolume: 1500 }
      ],
      monthlyOverrides: {} as Record<number, number>
    },
    taxModel: {
      regime: 'lucro_presumido' as 'lucro_presumido' | 'lucro_real' | 'simples_nacional' | 'customizado',
      estadoSede: 'SP',
      issRate: 5.0,
      pisCofinsRate: 8.65,
      reformaTributariaAtiva: false,
      reformaIbsCbsRate: 26.5
    }
  });
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [availableInfraItems, setAvailableInfraItems] = useState<any[]>([]);
  const [inflationIndices, setInflationIndices] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Selection states for Step 2
  const [tempArea, setTempArea] = useState<string>('Sustentação');
  const [tempCustomArea, setTempCustomArea] = useState<string>('');
  const [tempRoleId, setTempRoleId] = useState<string>('');
  
  // Selection state for Step 4 (Infraestrutura)
  const [tempInfraItem, setTempInfraItem] = useState({
    name: '',
    type: 'shared_fixed' as 'shared_fixed' | 'variable_api' | 'batch_instance' | 'storage_acumulativo',
    cost: '', // string for raw input handling before parsing
    premise: '', // represents allocation pct, or qty per client, or mb per client
  });
  
  const [isInfraCatalogOpen, setIsInfraCatalogOpen] = useState(false);
  const [infraCatalogSearch, setInfraCatalogSearch] = useState('');

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
    const { data: infraItems } = await supabase.from('infra_items').select('*').eq('active', true).order('name', { ascending: true });
    if (roles) setAvailableRoles(roles);
    if (indices) setInflationIndices(indices);
    if (infraItems) setAvailableInfraItems(infraItems);
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
    const clean = val.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getMonthlyVolumeDetails = () => {
    const strategy = bcData.volumeStrategy || {} as any;
    const type = strategy.type || 'ramp';
    const rampUpMonths = strategy.rampUpMonths || 0;
    const safetyBuffer = strategy.safetyBuffer || 0;
    const expansionRate = strategy.expansionRate || 0;
    const churnRate = strategy.churnRate || 0;
    const tiers = strategy.tiers && strategy.tiers.length > 0 ? strategy.tiers : [
      { id: 't1', name: 'Contas Enterprise (Grandes)', initialCount: 1, finalCount: 5, avgVolume: 25000 },
      { id: 't2', name: 'Middle Market (Médias)', initialCount: 2, finalCount: 15, avgVolume: 8000 },
      { id: 't3', name: 'Small Business (Pequenas)', initialCount: 5, finalCount: 40, avgVolume: 1500 }
    ];
    const monthlyOverrides = strategy.monthlyOverrides || {};
    const months = bcData.contractMonths;
    const overrideMode = strategy.overrideMode || 'isolated'; // 'isolated' | 'accumulative'
    const data: any[] = [];

    let currentShiftFactor = 1;
    let currentShiftClients = 1;

    for (let m = 1; m <= months; m++) {
      let theoreticalVolume = 0;
      let theoreticalClients = 0;
      const tMix: Record<string, number> = {};

      // Base Theoretical Calculation
      tiers.forEach((tier: any) => {
        let count = tier.initialCount;
        let volume = count * tier.avgVolume;

        if (type === 'ramp') {
          count = tier.initialCount + ((tier.finalCount - tier.initialCount) * (m - 1)) / (months - 1 || 1);
          volume = count * tier.avgVolume;

          if (rampUpMonths > 0) {
            const currentRamp = Math.min(1, m / rampUpMonths);
            volume = volume * currentRamp;
          }

          if (expansionRate > 0) {
            volume = volume * Math.pow(1 + expansionRate / 100, m - 1);
          }

          if (churnRate > 0) {
            volume = volume * Math.pow(1 - churnRate / 100, m - 1);
            count = count * Math.pow(1 - churnRate / 100, m - 1);
          }
        }

        tMix[tier.name] = count;
        theoreticalVolume += volume;
        theoreticalClients += count;
      });

      if (type === 'ramp' && safetyBuffer > 0) {
        theoreticalVolume = theoreticalVolume * (1 - safetyBuffer / 100);
      }

      let finalVolume = theoreticalVolume;
      let finalClients = theoreticalClients;
      let avgTicket = theoreticalClients > 0 ? (theoreticalVolume / theoreticalClients) : (tiers.reduce((acc: any, t: any) => acc + t.avgVolume, 0) / (tiers.length || 1));

      const isClientOverriddenObj = strategy.clientOverrides && strategy.clientOverrides[m] !== undefined;
      // We consider it overridden if it's a number OR an object with keys.
      const isClientOverridden = isClientOverriddenObj && (typeof strategy.clientOverrides[m] === 'number' || Object.keys(strategy.clientOverrides[m]).length > 0);
      const isVolumeOverridden = monthlyOverrides && monthlyOverrides[m] !== undefined;

      let manualVolumeFromTiers = 0;
      let manualClientsFromTiers = 0;

      // 1. Resolve Clients
      if (isClientOverridden) {
        const overridesVal = strategy.clientOverrides[m];
        if (typeof overridesVal === 'number') {
          finalClients = overridesVal;
          manualVolumeFromTiers = finalClients * avgTicket;
        } else {
          Object.entries(overridesVal).forEach(([tierName, count]) => {
            const tierObj = tiers.find((t: any) => t.name === tierName);
            const c = Number(count) || 0;
            manualClientsFromTiers += c;
            manualVolumeFromTiers += c * (tierObj ? tierObj.avgVolume : avgTicket);
          });
          finalClients = manualClientsFromTiers;
        }
      } else if (overrideMode === 'accumulative') {
        finalClients = theoreticalClients * currentShiftClients;
      }

      // 2. Resolve Volume
      if (isVolumeOverridden) {
        finalVolume = monthlyOverrides[m];
      } else if (isClientOverridden) {
        finalVolume = manualVolumeFromTiers;
      } else if (overrideMode === 'accumulative') {
        finalVolume = theoreticalVolume * currentShiftFactor;
      }

      // 3. Update Paradigm Shift Factors for next iterations
      if (overrideMode === 'accumulative') {
        if (isClientOverridden) {
          currentShiftClients = theoreticalClients > 0 ? (finalClients / theoreticalClients) : 1;
          if (!isVolumeOverridden) {
            currentShiftFactor = theoreticalVolume > 0 ? (finalVolume / theoreticalVolume) : 1;
          }
        }
        if (isVolumeOverridden) {
          currentShiftFactor = theoreticalVolume > 0 ? (finalVolume / theoreticalVolume) : 1;
        }
      }

      const [startYear, startMonth] = (bcData.startDate || new Date().toISOString().substring(0, 7)).split('-').map(Number);
      const date = new Date(startYear, startMonth - 1 + (m - 1));
      const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
      const yearStr = date.getFullYear().toString().slice(-2);

      data.push({
        month: m,
        volume: Math.round(finalVolume),
        clients: Math.round(finalClients),
        theoreticalMix: tMix,
        label: `${monthStr}/${yearStr}`
      });
    }

    return data;
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
              sku: '',
              name: '',
              description: '',
              painPoints: '',
              startDate: new Date().toISOString().substring(0, 7),
              model: 'cascata',
              targetClients: 0,
              avgVolume: 0,
              contractMonths: 12,
              resources: [],
              volumeStrategy: {
                type: 'ramp',
                rampUpMonths: 0,
                safetyBuffer: 0,
                expansionRate: 0,
                churnRate: 0,
                tiers: [
                  { id: 't1', name: 'Contas Enterprise (Grandes)', initialCount: 1, finalCount: 5, avgVolume: 25000 },
                  { id: 't2', name: 'Middle Market (Médias)', initialCount: 2, finalCount: 15, avgVolume: 8000 },
                  { id: 't3', name: 'Small Business (Pequenas)', initialCount: 5, finalCount: 40, avgVolume: 1500 }
                ],
                monthlyOverrides: {}
              },
              taxModel: {
                regime: 'lucro_presumido',
                estadoSede: 'SP',
                issRate: 5.0,
                pisCofinsRate: 8.65,
                reformaTributariaAtiva: false,
                reformaIbsCbsRate: 26.5
              },
              infrastructure: {
                cloudBuffer: 0,
                envMultiplier: 1.0,
                items: []
              }
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
                  sku: '',
                  name: '',
                  description: '',
                  painPoints: '',
                  startDate: new Date().toISOString().substring(0, 7),
                  model: 'cascata',
                  targetClients: 0,
                  avgVolume: 0,
                  contractMonths: 12,
                  resources: [],
                  volumeStrategy: {
                    type: 'ramp',
                    rampUpMonths: 0,
                    safetyBuffer: 0,
                    expansionRate: 0,
                    churnRate: 0,
                    tiers: [
                      { id: 't1', name: 'Contas Enterprise (Grandes)', initialCount: 1, finalCount: 5, avgVolume: 25000 },
                      { id: 't2', name: 'Middle Market (Médias)', initialCount: 2, finalCount: 15, avgVolume: 8000 },
                      { id: 't3', name: 'Small Business (Pequenas)', initialCount: 5, finalCount: 40, avgVolume: 1500 }
                    ],
                    monthlyOverrides: {}
                  },
                  taxModel: {
                    regime: 'lucro_presumido',
                    estadoSede: 'SP',
                    issRate: 5.0,
                    pisCofinsRate: 8.65,
                    reformaTributariaAtiva: false,
                    reformaIbsCbsRate: 26.5
                  },
                  infrastructure: {
                    cloudBuffer: 0,
                    envMultiplier: 1.0,
                    items: []
                  }
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
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${bc.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-500' :
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
                                sku: bc.sku || '',
                                name: bc.name || '',
                                description: bc.description || '',
                                painPoints: bc.pain_points || '',
                                startDate: bc.start_date || new Date().toISOString().substring(0, 7),
                                model: bc.model || 'cascata',
                                targetClients: bc.target_clients || 0,
                                avgVolume: bc.avg_volume || 0,
                                contractMonths: bc.contract_months || 12,
                                resources: bc.resources || [],
                                volumeStrategy: bc.volume_strategy || {
                                  type: 'ramp',
                                  rampUpMonths: 0,
                                  safetyBuffer: 0,
                                  expansionRate: 0,
                                  churnRate: 0,
                                  tiers: [
                                    { id: 't1', name: 'Contas Enterprise (Grandes)', initialCount: 1, finalCount: 5, avgVolume: 25000 },
                                    { id: 't2', name: 'Middle Market (Médias)', initialCount: 2, finalCount: 15, avgVolume: 8000 },
                                    { id: 't3', name: 'Small Business (Pequenas)', initialCount: 5, finalCount: 40, avgVolume: 1500 }
                                  ],
                                  monthlyOverrides: {}
                                },
                                taxModel: bc.tax_model || {
                                  regime: 'lucro_presumido',
                                  estadoSede: 'SP',
                                  issRate: 5.0,
                                  pisCofinsRate: 8.65,
                                  reformaTributariaAtiva: false,
                                  reformaIbsCbsRate: 26.5
                                },
                                infrastructure: bc.infrastructure || {
                                  cloudBuffer: 0,
                                  envMultiplier: 1.0,
                                  items: []
                                }
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
      { id: 2, name: 'Volumetria', icon: BarChart3 },
      { id: 3, name: 'Recursos', icon: Users },
      { id: 4, name: 'Infraestrutura (TI)', icon: Server },
      { id: 5, name: 'DAF', icon: FileText },
      { id: 6, name: 'Investimento', icon: DollarSign },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('overview')}
              className="p-2 rounded-xl bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">Business Case</h2>
              <p className="text-text-secondary text-sm">Preencha as informações para construir a projeção financeira.</p>
            </div>
          </div>

          <button
            onClick={() => saveBusinessCase()}
            disabled={!isDirty || isSaving}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 shadow-xl whitespace-nowrap outline-none
                ${isDirty ? 'bg-amber-500 text-white shadow-amber-500/30 ring-4 ring-amber-500/20 animate-pulse' : 'bg-primary text-white shadow-primary/20 hover:bg-blue-600'} 
                disabled:opacity-50 disabled:grayscale disabled:animate-none disabled:ring-0`}
            title={isDirty ? 'Você tem alterações pendentes!' : 'Tudo salvo'}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isDirty ? 'Salvar Mudanças' : 'Salvar'}
          </button>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center md:justify-start ${isActive
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
                <h3 className="text-lg font-bold mb-1">Visão Estratégica do Produto</h3>
                <p className="text-text-secondary text-sm">Defina a identidade, dores resolvidas e parametrize seu arcabouço fiscal.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* === LEFT COLUMN: Core / Identidade === */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-6 bg-element-bg/30 border border-border-subtle rounded-2xl space-y-6">
                    <h4 className="text-sm font-bold flex items-center gap-2 border-b border-border-subtle pb-3">
                      <Package className="w-4 h-4 text-primary" /> Identidade e Proposta de Valor
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Chave SKU (Opcional)</label>
                        <input
                          type="text"
                          value={bcData.sku || ''}
                          onChange={(e) => setBcData({ ...bcData, sku: e.target.value.toUpperCase() })}
                          placeholder="EX: TC-2026"
                          className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Nome do Business Case</label>
                        <input
                          type="text"
                          value={bcData.name}
                          onChange={(e) => setBcData({ ...bcData, name: e.target.value })}
                          placeholder="Ex: Novo Produto Portuário"
                          className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">O que o produto faz? (Descrição)</label>
                      <textarea
                        value={bcData.description}
                        onChange={(e) => setBcData({ ...bcData, description: e.target.value })}
                        placeholder="Descreva as principais características e entregáveis da solução..."
                        rows={3}
                        className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Dores que Resolve (Pain Points)</label>
                      <textarea
                        value={bcData.painPoints}
                        onChange={(e) => setBcData({ ...bcData, painPoints: e.target.value })}
                        placeholder="Quais ineficiências esta solução elimina? (Ex: Redução de 20% em fraudes...)"
                        rows={3}
                        className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* === RIGHT COLUMN: Setup Financeiro === */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Bloco Comercial */}
                  <div className="p-6 bg-element-bg/30 border border-border-subtle rounded-2xl space-y-6">
                    <h4 className="text-sm font-bold flex items-center gap-2 border-b border-border-subtle pb-3">
                      <Briefcase className="w-4 h-4 text-primary" /> Estrutura Comercial Base
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Acelerador Curinga de Modelagem</label>
                      <select
                        value={bcData.model}
                        onChange={(e) => setBcData({ ...bcData, model: e.target.value as any })}
                        className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="cascata">Cascata (Tiered Pricing)</option>
                        <option value="serrote">Serrote (Volume Pricing)</option>
                        <option value="block">Block Price (Preço Fixo / Bloco)</option>
                        <option value="license">Licença de Uso Mensal (SaaS Clássico)</option>
                        <option value="success_fee">Success Fee (Risco Puro)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Mês Início</label>
                        <input
                          type="month"
                          value={bcData.startDate}
                          onChange={(e) => setBcData({ ...bcData, startDate: e.target.value })}
                          className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Prazo (Meses)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={bcData.contractMonths}
                            onChange={(e) => setBcData({ ...bcData, contractMonths: parseInt(e.target.value) || 12 })}
                            className="w-full bg-element-bg border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco Fiscal (Tax Engine) */}
                  <div className="p-6 bg-element-bg/10 border border-primary/20 rounded-2xl space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>

                    <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" /> Tax Engine (Impostos)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Regime Atual</label>
                        <select
                          value={bcData.taxModel?.regime || 'lucro_presumido'}
                          onChange={(e) => {
                            const regime = e.target.value as any;
                            let pisCofinsRate = bcData.taxModel?.pisCofinsRate || 8.65;
                            if (regime === 'lucro_presumido') pisCofinsRate = 8.65;
                            if (regime === 'lucro_real') pisCofinsRate = 9.25;
                            setBcData({ ...bcData, taxModel: { ...(bcData.taxModel || {}), regime, pisCofinsRate } as any });
                          }}
                          className="w-full bg-element-bg border border-border-subtle rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-primary transition-colors cursor-pointer"
                        >
                          <option value="lucro_presumido">Lucro Presumido (Federal Médio)</option>
                          <option value="lucro_real">Lucro Real (Federal Seco)</option>
                          <option value="simples_nacional">Simples Nacional (Unificado)</option>
                          <option value="customizado">Customizado (Holdings/Isenções)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2" title="Unidade Federativa de Emissão da Nota">Sede (UF)</label>
                        <select
                          value={bcData.taxModel?.estadoSede || 'SP'}
                          onChange={(e) => {
                            const uf = e.target.value;
                            let newIss = bcData.taxModel?.issRate || 2.0;
                            // Heurística inteligente baseada nas capitais
                            if (['SP', 'RJ', 'BH'].includes(uf)) newIss = 5.0;
                            else if (['MG', 'RS', 'PR', 'SC', 'DF'].includes(uf)) newIss = 3.0;
                            else newIss = 2.0;
                            setBcData({ ...bcData, taxModel: { ...(bcData.taxModel || {}), estadoSede: uf, issRate: newIss } as any });
                          }}
                          className="w-full bg-element-bg border border-border-subtle rounded-xl px-3 py-2 text-[13px] uppercase font-bold focus:outline-none focus:border-primary transition-all cursor-pointer"
                        >
                          {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map(uf => (
                            <option key={uf} value={uf}>{uf}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(bcData.taxModel?.regime || 'lucro_presumido') !== 'simples_nacional' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2" title="Imposto Sobre Serviço (Depende do Município da UF sede)">ISS Mun. (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={bcData.taxModel?.issRate || 5.0}
                            onChange={(e) => setBcData({ ...bcData, taxModel: { ...(bcData.taxModel || {}), issRate: Number(e.target.value) } as any })}
                            className="w-full bg-element-bg border border-border-subtle rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-primary transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2" title="Carga Federal Base">PIS/COFINS (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={bcData.taxModel?.pisCofinsRate || 8.65}
                            onChange={(e) => setBcData({ ...bcData, taxModel: { ...(bcData.taxModel || {}), pisCofinsRate: Number(e.target.value) } as any })}
                            className="w-full bg-element-bg border border-border-subtle rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-primary transition-all font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Consolidado Fiscal Vigente */}
                    <div className="flex justify-between items-center px-4 py-3 bg-primary/5 border border-border-subtle rounded-xl text-sm">
                      <div className="font-bold text-text-primary">Efetivo Consolidado</div>
                      <div className="font-black text-primary text-base">
                        {(bcData.taxModel?.regime || 'lucro_presumido') === 'simples_nacional'
                          ? 'Tabela'
                          : `${((bcData.taxModel?.issRate || 0) + (bcData.taxModel?.pisCofinsRate || 0)).toFixed(2)}%`}
                      </div>
                    </div>

                    {/* IVA Toggle Assustador */}
                    <div className="pt-5 mt-2 border-t border-border-subtle border-dashed">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={bcData.taxModel?.reformaTributariaAtiva || false}
                          onChange={(e) => setBcData({ ...bcData, taxModel: { ...(bcData.taxModel || {}), reformaTributariaAtiva: e.target.checked } as any })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-element-bg border border-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 peer-checked:after:bg-white peer-checked:border-rose-500 relative"></div>
                        <span className="text-xs font-bold text-text-primary group-hover:text-rose-500 transition-colors">Simular Reforma (IVA Dual)</span>
                      </label>

                      <div className={`overflow-hidden transition-all duration-300 ${bcData.taxModel?.reformaTributariaAtiva ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="pl-12">
                          <label className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">Alíquota IVA Estimada (%)</label>
                          <div className="flex gap-2">
                            <span className="flex-1 text-[10px] text-text-secondary py-1 w-full leading-tight">A soma do CBS Federal com o IBS (Estadual/Municipal). Padrão especulado em ~26.5% para não-essenciais.</span>
                            <input
                              type="number"
                              step="0.01"
                              value={bcData.taxModel?.reformaIbsCbsRate || 26.5}
                              onChange={(e) => setBcData({ ...bcData, taxModel: { ...(bcData.taxModel || {}), reformaIbsCbsRate: Number(e.target.value) } as any })}
                              className="w-24 shrink-0 bg-rose-500/10 text-rose-500 font-bold border border-rose-500/30 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-rose-500 transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-1">Volumetria e Crescimento</h3>
                <p className="text-text-secondary text-sm">Projete sua base de clientes, modele restrições de rampa e estresse de faturamento.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tiers Tabela - Esquerda (2/3) */}
                <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-border-subtle">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Perfis de Clientes (Tiers)</h4>
                    <button
                      onClick={() => {
                        const newTiers = [...(bcData.volumeStrategy?.tiers || []), { id: `t_${Date.now()}`, name: 'Novo Tier', initialCount: 1, finalCount: 2, avgVolume: 5000 }];
                        setBcData(prev => ({ ...prev, volumeStrategy: { ...prev.volumeStrategy, tiers: newTiers } as any }));
                      }}
                      className="text-[10px] uppercase font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                    >+ Adicionar Tier</button>
                  </div>
                  <p className="text-[10px] text-text-secondary mb-4 leading-tight">Distribua sua base prospectiva em diferentes perfis. Contas grandes tendem a ter alto volume na unidade, mas formam a minoria da base; já os perfis pequenos diluem o risco com escalabilidade no número de clientes.</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-text-secondary">
                      <thead className="border-b border-border-subtle uppercase text-[9px] tracking-wider font-bold">
                        <tr>
                          <th className="pb-2 text-left w-2/5">Nome do Tier</th>
                          <th className="pb-2 text-center w-20">Nº Início</th>
                          <th className="pb-2 text-center w-20">Nº Fim</th>
                          <th className="pb-2 text-right w-24">Vol/Mês</th>
                          <th className="pb-2 text-right w-16">% Mix</th>
                          <th className="pb-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const totalFinalClients = Math.max(1, (bcData.volumeStrategy?.tiers || []).reduce((acc: any, t: any) => acc + t.finalCount, 0));
                          return (bcData.volumeStrategy?.tiers || []).map((tier: any, idx: number) => {
                            const pct = ((tier.finalCount) / totalFinalClients * 100).toFixed(1);
                            return (
                              <tr key={tier.id} className="border-b border-border-subtle/50 hover:bg-element-hover/30 transition-colors group">
                                <td className="py-2 pr-2">
                                  <input
                                    type="text" value={tier.name}
                                    onChange={(e) => {
                                      const t = [...(bcData.volumeStrategy?.tiers || [])]; t[idx].name = e.target.value;
                                      setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, tiers: t } as any }));
                                    }}
                                    className="bg-element-bg border border-border-subtle hover:border-text-secondary focus:bg-element-hover focus:border-primary rounded px-2 py-1.5 w-full font-bold focus:outline-none transition-colors"
                                  />
                                </td>
                                <td className="py-2 px-1">
                                  <input
                                    type="number" min="0" value={tier.initialCount}
                                    onChange={(e) => {
                                      const t = [...(bcData.volumeStrategy?.tiers || [])]; t[idx].initialCount = parseInt(e.target.value) || 0;
                                      setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, tiers: t } as any }));
                                    }}
                                    className="bg-element-bg border border-border-subtle hover:border-text-secondary focus:bg-element-hover focus:border-primary rounded px-2 py-1.5 w-full text-center focus:outline-none font-mono transition-colors"
                                  />
                                </td>
                                <td className="py-2 px-1">
                                  <input
                                    type="number" min="0" value={tier.finalCount}
                                    onChange={(e) => {
                                      const t = [...(bcData.volumeStrategy?.tiers || [])]; t[idx].finalCount = parseInt(e.target.value) || 0;
                                      setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, tiers: t } as any }));
                                    }}
                                    className="bg-element-bg border border-border-subtle hover:border-text-secondary focus:bg-element-hover focus:border-primary rounded px-2 py-1.5 w-full text-center focus:outline-none font-mono transition-colors"
                                  />
                                </td>
                                <td className="py-2 px-1">
                                  <input
                                    type="text" value={tier.avgVolume ? new Intl.NumberFormat('pt-BR').format(tier.avgVolume) : ''}
                                    onChange={(e) => {
                                      const valStr = e.target.value.replace(/\D/g, '');
                                      const val = parseInt(valStr) || 0;
                                      const t = [...(bcData.volumeStrategy?.tiers || [])]; t[idx].avgVolume = val;
                                      setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, tiers: t } as any }));
                                    }}
                                    className="bg-element-bg border border-border-subtle hover:border-text-secondary focus:bg-element-hover focus:border-primary rounded px-2 py-1.5 w-full text-right focus:outline-none font-mono text-primary font-bold transition-colors"
                                  />
                                </td>
                                <td className="py-2 pl-2 text-right">
                                  <span className="font-bold text-text-secondary font-mono bg-element-bg px-2 py-1.5 rounded">{pct}%</span>
                                </td>
                                <td className="py-2 pl-2 text-right">
                                  {bcData.volumeStrategy!.tiers.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const t = bcData.volumeStrategy!.tiers.filter((_, i) => i !== idx);
                                        setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, tiers: t } as any }));
                                      }}
                                      className="text-text-secondary hover:text-rose-500 transition-colors p-1"
                                    ><Trash2 className="w-3 h-3" /></button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Motor de Rampa - Direita (1/3) */}
                <div className="glass-panel p-5 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold text-primary mb-2 flex items-center justify-between">
                      Estratégia de Curva
                      <select
                        value={bcData.volumeStrategy?.type || 'ramp'}
                        onChange={(e) => setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, type: e.target.value as any } as any }))}
                        className="bg-element-bg border border-border-subtle rounded text-[10px] px-2 py-1 text-text-primary"
                      >
                        <option value="ramp">Crescimento (Rampa)</option>
                        <option value="manual">Controle Linear/Manual</option>
                      </select>
                    </label>
                    <p className="text-[10px] text-text-secondary leading-tight mb-4">
                      {bcData.volumeStrategy?.type === 'ramp' ? 'Distribui novos clientes linearmente ao longo dos meses e permite aplicar maturação progressiva.' : 'Desliga a automação de curva. O volume será processado integralmente sem rampa de maturação.'}
                    </p>
                  </div>

                  {bcData.volumeStrategy?.type === 'ramp' && (
                    <>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-text-secondary">Maturação (Go-Live)</label>
                          <span className="text-xs font-bold tabular-nums text-primary">{bcData.volumeStrategy.rampUpMonths}m</span>
                        </div>
                        <input
                          type="range" min="0" max="12" value={bcData.volumeStrategy.rampUpMonths}
                          onChange={(e) => setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, rampUpMonths: parseInt(e.target.value) } as any }))}
                          className="w-full accent-primary"
                        />
                        <p className="text-[9px] text-text-secondary mt-1">Nº de meses para o cliente atingir 100% de performance.</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-text-secondary">Safety Buffer (Estresse)</label>
                          <span className="text-xs font-bold tabular-nums text-rose-400">-{bcData.volumeStrategy.safetyBuffer}%</span>
                        </div>
                        <input
                          type="range" min="0" max="50" step="5" value={bcData.volumeStrategy.safetyBuffer}
                          onChange={(e) => setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, safetyBuffer: parseInt(e.target.value) } as any }))}
                          className="w-full accent-rose-500"
                        />
                        <p className="text-[9px] text-text-secondary mt-1">Margem de quebra. Reduz artificialmente o volume total para estressar o custo do BC.</p>
                      </div>

                      <div className="border-t border-border-subtle/50 pt-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-text-secondary">Expansão da Base (NRR)</label>
                          <span className="text-xs font-bold tabular-nums text-purple-400">+{bcData.volumeStrategy.expansionRate}%</span>
                        </div>
                        <input
                          type="range" min="0" max="25" step="1" value={bcData.volumeStrategy.expansionRate}
                          onChange={(e) => setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, expansionRate: parseInt(e.target.value) } as any }))}
                          className="w-full accent-purple-500"
                        />
                        <p className="text-[9px] text-text-secondary mt-1">Estimativa de subida cross-sell ou uso excedente mensal da mesma base.</p>
                      </div>

                      <div className="pb-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-text-secondary">Desligamento Diário (Churn)</label>
                          <span className="text-xs font-bold tabular-nums text-rose-500">-{bcData.volumeStrategy.churnRate || 0}%</span>
                        </div>
                        <input
                          type="range" min="0" max="15" step="1" value={bcData.volumeStrategy.churnRate || 0}
                          onChange={(e) => setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, churnRate: parseInt(e.target.value) } as any }))}
                          className="w-full accent-rose-600"
                        />
                        <p className="text-[9px] text-text-secondary mt-1">Índice recorrente de cancelamentos e inatividade da base instalada.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Timeline Projection Grid */}
              <div className="glass-panel p-5 rounded-2xl border border-border-subtle bg-element-bg/30">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <h4 className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Projeção de Volume Mensal</h4>

                    <div className="flex items-center gap-1 bg-element-bg p-1 rounded border border-border-subtle">
                      <button
                        onClick={() => setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, overrideMode: 'isolated' } as any }))}
                        title="As edições manuais agirão como Sazonalidades isoladas, sem afetar o resto da curva."
                        className={`px-2 py-1 text-[9px] uppercase font-bold rounded transition-colors ${(bcData.volumeStrategy?.overrideMode || 'isolated') === 'isolated' ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                      >Sazonalidade</button>
                      <button
                        onClick={() => setBcData(p => ({ ...p, volumeStrategy: { ...p.volumeStrategy, overrideMode: 'accumulative' } as any }))}
                        title="Valores sobrescritos definem uma nova linha base, herdando crescimento e churn pros meses seguintes."
                        className={`px-2 py-1 text-[9px] uppercase font-bold rounded transition-colors ${bcData.volumeStrategy?.overrideMode === 'accumulative' ? 'bg-amber-500/20 text-amber-500' : 'text-text-secondary hover:text-text-primary'}`}
                      >Nova Base (Herança)</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs border-l border-border-subtle pl-4">
                    <span className="text-text-secondary shrink-0">Vol. Mensal Fim de Contrato: </span>
                    <span className="font-bold text-primary font-display text-lg tracking-tight">
                      {formatNumber(getMonthlyVolumeDetails().length > 0 ? getMonthlyVolumeDetails()[getMonthlyVolumeDetails().length - 1].volume : 0)}
                    </span>
                  </div>
                </div>

                <div className="flex overflow-x-auto pb-4 gap-2 snap-x [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-border-subtle hover:[&::-webkit-scrollbar-thumb]:bg-text-secondary [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {getMonthlyVolumeDetails().map((mData, i) => {
                    // Check if this month has a manual override applied
                    const isVolOverride = bcData.volumeStrategy?.monthlyOverrides?.[mData.month] !== undefined;
                    const isCliOverride = bcData.volumeStrategy?.clientOverrides?.[mData.month] !== undefined;
                    const isOverride = isVolOverride || isCliOverride;

                    return (
                      <div key={i} className={`shrink-0 w-36 rounded-xl border p-3 flex flex-col items-center justify-center relative snap-start transition-colors ${isOverride ? 'bg-amber-500/10 border-amber-500/50' : 'bg-surface border-border-subtle'}`}>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">{mData.label}</span>

                        <div className="flex items-center justify-center w-full px-1 border-b border-dashed border-primary/30 focus-within:border-primary pb-0.5">
                          <input
                            type="text"
                            title="Modificar Volume"
                            value={(() => {
                              const v = isVolOverride ? bcData.volumeStrategy!.monthlyOverrides![mData.month] : Math.round(mData.volume);
                              return (v || v === 0) ? new Intl.NumberFormat('pt-BR').format(v) : '';
                            })()}
                            onChange={(e) => {
                              const valStr = e.target.value.replace(/\D/g, ''); // só números
                              setBcData(p => {
                                const overrides = { ...(p.volumeStrategy?.monthlyOverrides || {}) };
                                overrides[mData.month] = valStr === '' ? 0 : parseInt(valStr);
                                return { ...p, volumeStrategy: { ...p.volumeStrategy, monthlyOverrides: overrides } as any };
                              });
                            }}
                            className={`w-full flex-1 bg-transparent text-center font-bold font-mono outline-none pt-1 ${isVolOverride ? 'text-amber-500' : 'text-primary'}`}
                          />
                        </div>

                        <div className="flex flex-col items-center justify-center mt-2 relative w-full">
                          <button
                            onClick={() => setActiveTierModal(activeTierModal === mData.month ? null : mData.month)}
                            className={`flex items-center gap-1 bg-transparent font-bold outline-none border-b border-dashed ${isCliOverride ? 'text-amber-500 border-amber-500/50' : 'text-text-secondary border-text-secondary/30 hover:border-text-primary'} pb-0.5 text-[10px] transition-colors cursor-pointer`}
                            title="Ajustar Mix de Tiers"
                          >
                            <span>{Math.round(mData.clients)}</span>
                            <span className="text-[8px] font-normal uppercase tracking-wider">Clientes</span>
                          </button>

                          {activeTierModal === mData.month && (
                            <div className="mt-3 w-full bg-primary/5 border border-primary/20 rounded-xl p-2.5 flex flex-col gap-2 relative">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold text-primary uppercase">Tranche de Clientes</span>
                                <button onClick={() => setActiveTierModal(null)} className="text-text-secondary hover:text-rose-500 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex flex-col gap-1.5 w-full">
                                {(() => {
                                  // Scaneia retroativamente para achar o último "Mix" inserido manualmente se estiver em modo herança
                                  let activeTierBaseObj: any = null;
                                  if (bcData.volumeStrategy?.overrideMode === 'accumulative') {
                                    for (let walkM = mData.month; walkM >= 1; walkM--) {
                                      const walkOverride = bcData.volumeStrategy?.clientOverrides?.[walkM];
                                      if (walkOverride && typeof walkOverride === 'object') {
                                        activeTierBaseObj = walkOverride;
                                        break;
                                      }
                                    }
                                  }

                                  // Peso total a ser distribuido: A soma do último Mix editado OU a soma da Mistura Teórica atual
                                  const baseTotalToUse = activeTierBaseObj
                                    ? Math.max(1, Object.values(activeTierBaseObj).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as number)
                                    : Math.max(1, Object.values(mData.theoreticalMix || {}).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as number);

                                  return bcData.volumeStrategy.tiers.map((tier: any) => {
                                    const overrideObj = bcData.volumeStrategy.clientOverrides?.[mData.month];
                                    const isLegacyExt = typeof overrideObj === 'number';
                                    const currentVal = overrideObj && typeof overrideObj === 'object' ? (overrideObj as any)[tier.name] : undefined;

                                    // Descobre qual proporção caberá a este Tier baseado no tracking de herança fantasma
                                    const tierBaseWeight = activeTierBaseObj ? (activeTierBaseObj[tier.name] || 0) : (mData.theoreticalMix?.[tier.name] || 0);
                                    const placeholderVal = Math.round((isLegacyExt ? overrideObj : mData.clients) * (tierBaseWeight / baseTotalToUse));

                                    return (
                                      <div key={tier.id} className="flex items-center justify-between gap-1 border-b border-border-subtle/50 pb-0.5" title={tier.name}>
                                        <span className="text-[8px] text-text-secondary truncate text-left flex-1 font-medium">{tier.name}</span>
                                        <input
                                          type="text"
                                          value={currentVal !== undefined ? currentVal : ''}
                                          placeholder={placeholderVal.toString()}
                                          onChange={(e) => {
                                            const valStr = e.target.value.replace(/\D/g, '');
                                            setBcData(p => {
                                              const clientsDict = { ...(p.volumeStrategy?.clientOverrides || {}) } as any;
                                              if (typeof clientsDict[mData.month] !== 'object' || clientsDict[mData.month] === null) {
                                                clientsDict[mData.month] = {};
                                              }
                                              clientsDict[mData.month] = { ...clientsDict[mData.month] };

                                              if (valStr === '') {
                                                delete clientsDict[mData.month][tier.name];
                                                if (Object.keys(clientsDict[mData.month]).length === 0) {
                                                  delete clientsDict[mData.month];
                                                }
                                              } else {
                                                clientsDict[mData.month][tier.name] = parseInt(valStr);
                                              }
                                              return { ...p, volumeStrategy: { ...p.volumeStrategy, clientOverrides: clientsDict } as any };
                                            });
                                          }}
                                          className="w-8 shrink-0 bg-transparent text-right font-bold text-primary outline-none focus:border-b focus:border-primary text-[10px] placeholder:font-normal placeholder:text-text-secondary/40"
                                        />
                                      </div>
                                    );
                                  })
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Override Indicator & Restore Button */}
                        {isOverride ? (
                          <button
                            title="Restaurar Fórmula Matemática"
                            onClick={() => {
                              setBcData(p => {
                                const overrides = { ...(p.volumeStrategy?.monthlyOverrides || {}) };
                                const clientOverrides = { ...(p.volumeStrategy?.clientOverrides || {}) };
                                delete overrides[mData.month];
                                delete clientOverrides[mData.month];
                                return { ...p, volumeStrategy: { ...p.volumeStrategy, monthlyOverrides: overrides, clientOverrides: clientOverrides } as any };
                              });
                            }}

                            className="absolute top-1 right-1 text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 p-[3px] rounded transition-colors"
                          >
                            <X className="w-[10px] h-[10px]" />
                          </button>
                        ) : (
                          <div className="absolute top-1 right-2 text-text-secondary/40" title="Valor Protegido por Fórmula">
                            <BarChart3 className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Info className="w-3 h-3 text-text-secondary" />
                  <p className="text-[10px] text-text-secondary">Os volumes são gerados pelas opções geométricas acima. Para sazonalidade, basta digitar o novo valor em cima do mês que deseja sobrescrever a fórmula.</p>
                </div>
              </div>

              {/* Botão Global de Save agora fica no cabeçalho superior */}
            </div>
          )}
          {activeStep === 3 && (
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

                  {bcData.resources.some(r => (r.start_month || 0) > bcData.contractMonths || (r.end_month || 0) > bcData.contractMonths) && (
                     <button 
                       onClick={() => {
                         if (confirm('Deseja ajustar automaticamente todos os prazos para o limite do contrato? (Isso apenas cortará os meses excedentes)')) {
                           const newRes = bcData.resources.map(r => ({
                             ...r,
                             end_month: Math.min(r.end_month || bcData.contractMonths, bcData.contractMonths)
                           }));
                           setBcData({...bcData, resources: newRes});
                         }
                       }}
                       className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2 animate-pulse shadow-lg shadow-amber-500/10"
                     >
                       <AlertTriangle className="w-3.5 h-3.5" /> Sincronizar Prazos
                     </button>
                  )}
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
                          const isExpanded = expandedAreas[area] === true; // default to collapsed
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
                                    {resources.some(r => (r.start_month || 0) > bcData.contractMonths || (r.end_month || 0) > bcData.contractMonths) && (
                                       <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/20 animate-pulse" title="Existem recursos com prazos fora do contrato nesta área">
                                          <AlertTriangle className="w-2.5 h-2.5" />
                                          <span className="text-[8px] font-bold uppercase tracking-tighter">Erro de Prazo</span>
                                       </div>
                                    )}
                                    {resources.some(r => (r.end_month || bcData.contractMonths) < bcData.contractMonths) && (
                                       <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20" title="Existem recursos com rampa encerrada antes do fim do contrato nesta área">
                                          <AlertCircle className="w-2.5 h-2.5" />
                                          <span className="text-[8px] font-bold uppercase tracking-tighter">Rampa Incompleta</span>
                                       </div>
                                    )}
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
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Infraestrutura (TI)</h3>
                  <p className="text-text-secondary text-sm">Controle de OPEX, nuvem e licenças com projeção escalável.</p>
                </div>
              </div>

              {/* KPIs de Infraestrutura */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="glass-panel p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col justify-center">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Custo Médio Mensal (TI)</span>
                  <div className="text-2xl font-display font-bold text-text-primary">
                    R$ {formatNumber(getDetailedMonthlyTimeline().reduce((acc, m) => acc + m.totalItMonth, 0) / Math.max(1, bcData.contractMonths))}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-border-subtle bg-element-bg/30 flex flex-col justify-center">
                  <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mb-1">Total LTV (TI)</span>
                  <div className="text-xl font-display font-bold text-text-primary">
                    R$ {formatNumber(getDetailedMonthlyTimeline().reduce((acc, m) => acc + m.totalItMonth, 0))}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-border-subtle bg-element-bg/30 flex flex-col justify-center">
                  <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mb-1">Custo Fim de Contrato (Pico)</span>
                  <div className="text-xl font-display font-bold text-amber-500">
                    R$ {formatNumber(getDetailedMonthlyTimeline().slice(-1)[0]?.totalItMonth || 0)}
                  </div>
                </div>
              </div>

              {/* Tabela Resumo Anual Infra */}
              {bcData.infrastructure?.items && bcData.infrastructure.items.length > 0 && (
                <div className="glass-panel p-5 rounded-2xl border border-border-subtle bg-element-bg/50">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
                    <Cloud className="w-4 h-4" /> Evolução Anual do Custo Mensal (Cloud)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(() => {
                      const timeline = getDetailedMonthlyTimeline();
                      const years: Record<string, { total: number, months: number }> = {};
                      timeline.forEach(m => {
                         const yyyy = m.dateLabel.split('/')[1];
                         if (!years[yyyy]) years[yyyy] = { total: 0, months: 0 };
                         years[yyyy].total += m.totalItMonth;
                         years[yyyy].months += 1;
                      });
                      return Object.entries(years).map(([year, data]) => (
                        <div key={year} className="bg-surface border border-border-subtle rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden group hover:border-primary/50 transition-colors">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                          <span className="text-[10px] font-bold text-text-secondary">Ano {year}</span>
                          <div className="flex justify-between items-end mt-1">
                            <div>
                              <span className="text-[9px] text-text-secondary block">Média Mensal</span>
                              <span className="font-bold text-primary text-sm">R$ {formatNumber(data.total / data.months)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-text-secondary block">Acumulado</span>
                              <span className="font-bold text-amber-500 text-xs">R$ {formatNumber(data.total)}</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  <button
                    onClick={() => setView('infra-details')}
                    className="w-full mt-4 py-2 border border-border-subtle rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-element-hover transition-colors flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="w-3 h-3" /> Ver Detalhamento Mensal de Infraestrutura
                  </button>
                </div>
              )}

              {/* FinOps Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Cloud className="w-5 h-5 text-primary" />
                    <h4 className="text-sm font-bold text-text-primary">Controles Cloud (FinOps)</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-text-secondary">Safety Buffer (Contingência)</label>
                        <span className="text-xs font-bold tabular-nums text-rose-500">+{bcData.infrastructure?.cloudBuffer || 0}%</span>
                      </div>
                      <input
                        type="range" min="0" max="50" step="5"
                        value={bcData.infrastructure?.cloudBuffer || 0}
                        onChange={(e) => setBcData({ ...bcData, infrastructure: { ...(bcData.infrastructure || {}), cloudBuffer: parseInt(e.target.value) } as any })}
                        className="w-full accent-rose-500"
                      />
                      <p className="text-[9px] text-text-secondary mt-1">Margem de segurança para variação de tráfego, egress AWS e imprevisibilidades.</p>
                    </div>
                    <div className="border-t border-primary/10 pt-3">
                      <label className="text-xs font-bold text-text-secondary mb-2 block">Multiplicador de Ambientes (DEV/QA/PRD)</label>
                      <select 
                        value={bcData.infrastructure?.envMultiplier || 1.0}
                        onChange={(e) => setBcData({ ...bcData, infrastructure: { ...(bcData.infrastructure || {}), envMultiplier: parseFloat(e.target.value) } as any })}
                        className="w-full bg-element-bg border border-border-subtle rounded-xl px-3 py-2 text-[12px] font-bold focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      >
                        <option value={1.0}>Apenas Produção (1.0x)</option>
                        <option value={1.2}>PRD + Homologação Simples (1.2x)</option>
                        <option value={1.5}>PRD + Homologação + DEV (1.5x)</option>
                        <option value={2.0}>Espelho Completo (2.0x)</option>
                      </select>
                      <p className="text-[9px] text-text-secondary mt-1">Aplica-se apenas em itens transacionais, storage e processos. Licenças de rateio ignoram este fator.</p>
                    </div>
                  </div>
                </div>

                {/* Form to add item */}
                <div className="glass-panel p-5 rounded-2xl border border-border-subtle bg-element-bg/30 flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2"><Server className="w-5 h-5" /> Adicionar Recurso (OpEx)</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="col-span-2">
                      <label className="block text-[10px] text-text-secondary uppercase font-bold mb-1 ml-1">Nome do Item</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={tempInfraItem.name} 
                          onChange={(e) => setTempInfraItem({ ...tempInfraItem, name: e.target.value })} 
                          placeholder="Digite ou selecione no Catálogo..." 
                          className="flex-1 bg-element-bg border border-border-subtle rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary" 
                        />
                        <button 
                          type="button"
                          onClick={() => setIsInfraCatalogOpen(true)}
                          className="px-3 bg-element-bg text-text-secondary font-bold text-[10px] uppercase tracking-wider border border-border-subtle rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" /> Catálogo
                        </button>
                      </div>
                     </div>
                     <div className="col-span-2">
                       <label className="block text-[10px] text-text-secondary uppercase font-bold mb-1 ml-1">Natureza do Custo</label>
                       <select value={tempInfraItem.type} onChange={(e) => {
                          const newType = e.target.value as any;
                          setTempInfraItem({ ...tempInfraItem, type: newType, premise: newType === 'variable_api' ? '1' : '' });
                       }} className="w-full bg-element-bg border border-border-subtle rounded-xl px-3 py-2 text-[11px] font-bold focus:outline-none focus:border-primary cursor-pointer">
                         <option value="shared_fixed">Compartilhado (Rateio %)</option>
                         <option value="variable_api">Transacional (Chamada)</option>
                         <option value="batch_instance">Fixo Dedicado Mensal (Instância/Batch)</option>
                         <option value="storage_acumulativo">Armazenamento Acumulativo (Storage/DB Mensal)</option>
                       </select>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 p-3 bg-element-bg border border-border-subtle rounded-xl mt-1">
                    {tempInfraItem.type === 'shared_fixed' && (
                      <>
                        <div>
                          <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1">Custo Mensal Total (R$)</label>
                          <input type="text" placeholder="100000" value={tempInfraItem.cost} onChange={(e) => setTempInfraItem({ ...tempInfraItem, cost: e.target.value })} className="w-full bg-surface border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:border-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1">% de Rateio p/ BC</label>
                          <input type="number" min="0" max="100" placeholder="10" value={tempInfraItem.premise} onChange={(e) => setTempInfraItem({ ...tempInfraItem, premise: e.target.value })} className="w-full bg-surface border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:border-primary outline-none" />
                        </div>
                        <div className="col-span-2 text-[9px] text-text-secondary leading-tight mt-1">O valor será multiplicado pelo percentual para deduzir o custo alocado a este produto no mês.</div>
                      </>
                    )}
                    {tempInfraItem.type === 'variable_api' && (
                      <>
                        <div>
                          <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1">Custo Unitário (R$)</label>
                          <input type="text" placeholder="0.25" value={tempInfraItem.cost} onChange={(e) => setTempInfraItem({ ...tempInfraItem, cost: e.target.value })} className="w-full bg-surface border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:border-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1">Reqs. por Unid. Volume</label>
                          <input type="number" min="0" placeholder="1" value={tempInfraItem.premise} onChange={(e) => setTempInfraItem({ ...tempInfraItem, premise: e.target.value })} className="w-full bg-surface border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:border-primary outline-none" />
                        </div>
                        <div className="col-span-2 text-[9px] text-text-secondary leading-tight mt-1">Será cruzado com a Projeção de Volume Mensal. Ex: Se a ferramenta projetar 1.000 requisições globais naquele mês com 1 req/volume de infra, gera 1.000 cobranças unitárias.</div>
                      </>
                    )}
                    {tempInfraItem.type === 'batch_instance' && (
                      <>
                        <div className="col-span-2">
                          <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1">Valor Fixo no Mês (R$)</label>
                          <input type="text" placeholder="2500" value={tempInfraItem.cost} onChange={(e) => setTempInfraItem({ ...tempInfraItem, cost: e.target.value })} className="w-full bg-surface border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:border-primary outline-none" />
                        </div>
                        <div className="col-span-2 text-[9px] text-text-secondary leading-tight mt-1">Custo será lançado integralmente a cada mês independentemente de base de clientes.</div>
                      </>
                    )}
                    {tempInfraItem.type === 'storage_acumulativo' && (
                      <>
                        <div>
                          <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1">Custo por GB (R$)</label>
                          <input type="text" placeholder="0.12" value={tempInfraItem.cost} onChange={(e) => setTempInfraItem({ ...tempInfraItem, cost: e.target.value })} className="w-full bg-surface border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:border-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1">GBs Gerados / Volume (Mês)</label>
                          <input type="number" min="0" step="any" placeholder="1.5" value={tempInfraItem.premise} onChange={(e) => setTempInfraItem({ ...tempInfraItem, premise: e.target.value })} className="w-full bg-surface border border-border-subtle rounded px-2 py-1.5 text-xs font-mono focus:border-primary outline-none" />
                        </div>
                        <div className="col-span-2 text-[9px] text-text-secondary leading-tight mt-1">Acúmulo atrelado à Projeção de Volume Mensal do Step 2. O dado crescerá em formato de "bola de neve" gerando passivos para a fatura seguinte.</div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-auto flex justify-end">
                    <button
                      onClick={() => {
                        if (!tempInfraItem.name || !tempInfraItem.cost) return alert('Preencha nome e custo.');
                        const parsedCost = parseFloat(tempInfraItem.cost.toString().replace(/\./g, '').replace(',', '.')) || 0;
                        const parsedPremise = parseFloat(tempInfraItem.premise.toString()) || 0;
                        
                        setBcData({
                          ...bcData,
                          infrastructure: {
                            ...(bcData.infrastructure || { cloudBuffer: 0, envMultiplier: 1.0, items: [] }),
                            items: [
                              ...(bcData.infrastructure?.items || []),
                              {
                                id: `infra-${Date.now()}`,
                                name: tempInfraItem.name,
                                type: tempInfraItem.type,
                                cost: parsedCost,
                                premise: parsedPremise
                              }
                            ]
                          }
                        });
                        setTempInfraItem({ name: '', type: 'shared_fixed', cost: '', premise: '' });
                      }}
                      className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Plus className="w-4 h-4" /> Adicionar à Infraestrutura
                    </button>
                  </div>
                </div>
              </div>

              {/* Table of items */}
              {(!bcData.infrastructure?.items || bcData.infrastructure.items.length === 0) ? (
                <div className="p-8 border border-border-subtle border-dashed rounded-xl flex flex-col items-center justify-center text-text-secondary bg-element-bg/50">
                  <Server className="w-8 h-8 mb-2 opacity-20" />
                  <p>Nenhuma infraestrutura mapeada ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto glass-panel border border-border-subtle rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-text-secondary uppercase tracking-wider border-b border-border-subtle bg-element-bg/50">
                      <tr>
                        <th className="px-4 py-3 font-bold">Natureza</th>
                        <th className="px-4 py-3 font-bold">Item / Recurso</th>
                        <th className="px-4 py-3 font-bold text-right pt-r">Base de Cálculo / Setup</th>
                        <th className="px-4 py-3 font-bold text-center">Multiplicador Amb.</th>
                        <th className="px-4 py-3 font-bold text-right text-primary">Custo Mensal (Go-Live)</th>
                        <th className="px-4 py-3 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bcData.infrastructure.items.map((item: any, idx: number) => {
                        const typeLabels: Record<string, string> = {
                          'shared_fixed': 'Compartilhado (Rateio %)',
                          'variable_api': 'Transacional (Chamada)',
                          'batch_instance': 'Fixo (Batch/Mes)',
                          'storage_acumulativo': 'Data/Storage Acum.'
                        };
                        const typeColors: Record<string, string> = {
                          'shared_fixed': 'bg-amber-500/10 text-amber-500',
                          'variable_api': 'bg-primary/10 text-primary',
                          'batch_instance': 'bg-purple-500/10 text-purple-400',
                          'storage_acumulativo': 'bg-emerald-500/10 text-emerald-500'
                        };
                        
                        return (
                          <tr key={item.id} className="border-b border-border-subtle hover:bg-element-hover/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${typeColors[item.type] || 'bg-element-bg text-text-primary'}`}>
                                {typeLabels[item.type] || item.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-xs uppercase">{item.name}</td>
                            <td className="px-4 py-3 text-right">
                              {item.type === 'shared_fixed' && (
                                <div className="text-[10px] text-text-secondary"><span className="text-primary font-bold">{item.premise}%</span> sobre Custo Total R$ {formatNumber(item.cost)}</div>
                              )}
                              {item.type === 'variable_api' && (
                                <div className="text-[10px] text-text-secondary"><span className="text-primary font-bold">{item.premise} req/vol</span> x R$ {formatNumber(item.cost)} unid.</div>
                              )}
                              {item.type === 'batch_instance' && (
                                <div className="text-[10px] text-text-secondary"><span className="text-primary font-bold">R$ {formatNumber(item.cost)}</span> / mensal</div>
                              )}
                              {item.type === 'storage_acumulativo' && (
                                <div className="text-[10px] text-text-secondary"><span className="text-primary font-bold">{item.premise} GB/vol</span> gerado x R$ {formatNumber(item.cost)} /GB</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.type === 'shared_fixed' ? <span className="text-[10px] text-text-secondary">-- (Não Aplica)</span> : 
                               <span className="text-[10px] font-bold text-amber-500">x{(bcData.infrastructure?.envMultiplier || 1.2).toFixed(1)}</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {(() => {
                                let monthlyEst = 0;
                                let volumeText = '';
                                const envMult = bcData.infrastructure?.envMultiplier || 1.2;
                                const cloudBuff = (bcData.infrastructure?.cloudBuffer || 0) / 100;
                                const matureVol = bcData.targetClients * bcData.avgVolume;
                                if (item.type === 'shared_fixed') {
                                  monthlyEst = item.cost * (item.premise / 100);
                                  volumeText = 'Base Fixa/Corporativa';
                                } else if (item.type === 'variable_api') {
                                  monthlyEst = item.cost * matureVol * item.premise * envMult * (1 + cloudBuff);
                                  volumeText = `Sobre ${formatNumber(matureVol * item.premise)} Reqs`;
                                } else if (item.type === 'batch_instance') {
                                  monthlyEst = item.cost * envMult * (1 + cloudBuff);
                                  volumeText = 'Instância Fixa';
                                } else if (item.type === 'storage_acumulativo') {
                                  monthlyEst = item.cost * (matureVol * bcData.contractMonths) * item.premise * envMult * (1 + cloudBuff);
                                  volumeText = `Acumula ${formatNumber(matureVol * bcData.contractMonths * item.premise)} GB`;
                                }
                                return (
                                  <div className="flex flex-col items-end">
                                    <span className="text-primary font-bold font-mono">R$ {formatNumber(monthlyEst)}</span>
                                    <span className="text-[9px] text-text-secondary mt-0.5 uppercase tracking-wider">{volumeText}</span>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  const novoItems = [...(bcData.infrastructure?.items || [])];
                                  novoItems.splice(idx, 1);
                                  setBcData({ ...bcData, infrastructure: { ...bcData.infrastructure!, items: novoItems }});
                                }}
                                className="p-1.5 text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeStep === 5 && (
            <div>
              <h3 className="text-lg font-bold mb-4">DAF (Despesa atrelada ao Faturamento)</h3>
              <p className="text-text-secondary text-sm mb-6">Configure as despesas que variam de acordo com o faturamento.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de DAF em construção...
              </div>
            </div>
          )}
          {activeStep === 6 && (
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
                if (activeStep < 6) {
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
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : activeStep === 6 ? <Save className="w-4 h-4" /> : null}
              {activeStep === 6 ? 'Concluir e Salvar' : 'Próximo'}
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
        sku: bcData.sku || null,
        name: bcData.name,
        description: bcData.description,
        pain_points: bcData.painPoints,
        start_date: bcData.startDate,
        model: bcData.model,
        target_clients: bcData.targetClients,
        avg_volume: bcData.avgVolume,
        contract_months: bcData.contractMonths,
        resources: bcData.resources,
        volume_strategy: bcData.volumeStrategy,
        tax_model: bcData.taxModel,
        infrastructure: bcData.infrastructure,
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

    return Object.entries(years).sort((a, b) => Number(a[0]) - Number(b[0])).map(([year, data]) => ({
      year: Number(year),
      monthlyCost: data.monthlyCosts.reduce((a, b) => a + b, 0) / data.monthlyCosts.length,
      totalCost: data.monthlyCosts.reduce((a, b) => a + b, 0),
      headcount: data.headcounts.reduce((a, b) => a + b, 0) / data.headcounts.length,
      monthStart: data.monthStart,
      monthEnd: data.monthEnd
    }));
  };

  const getDetailedMonthlyTimeline = (): any[] => {
    const timeline: any[] = [];
    const [startYear, startMonth] = bcData.startDate.split('-').map(Number);
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const uniqueAreas = Array.from(new Set(bcData.resources.map(r => r.area))) as string[];
    
    // Check if we can extract volumetry safely
    const volumeTimeline = getMonthlyVolumeDetails();

    // Accumulator for IPCA factor per year
    let accumulatedIPCAFactor = 1.0;
    
    // Accumulators for storage features
    const accumulatedGbPerItem: Record<string, number> = {};

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
      let totalHrMonth = 0;
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
        totalHrMonth += projectedAreaCost;
        totalHC += hcForArea;
      });

      // IT INFRASTRUCTURE CALCULATIONS
      let totalItMonth = 0;
      const infraCosts: Record<string, number> = {};
      const monthVol = volumeTimeline[m] || { clients: 0 };
      const envMultiplier = bcData.infrastructure?.envMultiplier || 1.0;
      const cloudBuffer = bcData.infrastructure?.cloudBuffer || 0;

      (bcData.infrastructure?.items || []).forEach(item => {
        let baseCost = 0;

        if (item.type === 'shared_fixed') {
          baseCost = item.cost * (item.premise / 100);
        } else if (item.type === 'batch_instance') {
          baseCost = item.cost * envMultiplier;
        } else if (item.type === 'variable_api') {
          baseCost = item.cost * item.premise * Math.max(0, monthVol.volume) * envMultiplier;
        } else if (item.type === 'storage_acumulativo') {
          const generatedThismonth = item.premise * Math.max(0, monthVol.volume);
          accumulatedGbPerItem[item.id] = (accumulatedGbPerItem[item.id] || 0) + generatedThismonth;
          baseCost = item.cost * accumulatedGbPerItem[item.id] * envMultiplier;
        }

        const costWithIpca = baseCost * accumulatedIPCAFactor;
        const finalCost = costWithIpca * (1 + (cloudBuffer / 100));
        infraCosts[item.id] = finalCost;
        totalItMonth += finalCost;
      });

      timeline.push({
        dateLabel: `${monthsNames[monthIdx]}/${year}`,
        monthVolCalculated: Math.max(0, monthVol.volume),
        areaCosts,
        infraCosts,
        totalItMonth,
        totalHrMonth,
        appliedIPCA,
        total: totalHrMonth + totalItMonth,
        totalHC,
        isJanuary: isJanuary && m > 0
      });
    }
    return timeline;
  };

  const calculateLTVSummary = () => {
    const timeline = getDetailedMonthlyTimeline();
    return timeline.reduce((acc, m) => acc + m.total, 0);
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
              <p className="text-text-secondary text-[11px]">Detalhamento por área (Headcount) de LTV OPEX.</p>
            </div>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl border border-primary/20 bg-primary/5">
            <div className="text-[9px] text-text-secondary uppercase font-bold tracking-widest mb-0.5">LTV OPEX (Pessoal)</div>
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
                    <th key={area} className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-right min-w-[100px] whitespace-nowrap">
                      {area || 'N/A'}
                    </th>
                  ))}
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-center border-x border-border-subtle/30">HC Total</th>
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-center text-emerald-500">IPCA</th>
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-right bg-primary/5 text-primary">SubTotal Mensal</th>
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
                    <td className="py-1.5 px-4 text-center border-x border-border-subtle/30">
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
                      R$ {formatNumber(item.totalHrMonth)}
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
                  <td className="py-3 px-4 text-center text-text-secondary text-[10px] border-x border-border-subtle/30">--</td>
                  <td></td>
                  <td className="py-3 px-4 text-right text-primary bg-primary/10 text-sm">R$ {formatNumber(calculateLTVResources())}</td>
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

  const renderInfraDetailsPage = () => {
    const months = getDetailedMonthlyTimeline();
    const infraItems = bcData.infrastructure?.items || [];
    const totalInfraLTV = months.reduce((acc, m) => acc + m.totalItMonth, 0);

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
              onClick={() => { setView('new-bc'); setActiveStep(4); }}
              className="p-2 rounded-xl bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">Projeção Mensal de Infra (TI)</h2>
              <p className="text-text-secondary text-[11px]">Detalhamento individual de OPEX SaaS / Cloud mensalizada.</p>
            </div>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div className="text-[9px] text-text-secondary uppercase font-bold tracking-widest mb-0.5">LTV Global (Nuvem)</div>
            <div className="text-lg font-display font-bold text-amber-500">R$ {formatNumber(totalInfraLTV)}</div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="bg-element-bg border-b border-border-subtle">
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest sticky left-0 bg-element-bg z-10 w-28 border-r border-border-subtle/50">Mês/Ano</th>
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-center border-r border-border-subtle/30">Trans. (Vol)</th>
                  {infraItems.map(it => (
                    <th key={it.id} className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-right min-w-[100px] whitespace-nowrap">
                      {it.name}
                    </th>
                  ))}
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-center text-emerald-500 border-l border-border-subtle/30">IPCA + Buffer</th>
                  <th className="py-3 px-4 font-bold uppercase text-[9px] tracking-widest text-right bg-amber-500/5 text-amber-500 min-w-[120px]">SubTotal TI</th>
                </tr>
              </thead>
              <tbody>
                {(months as any[]).map((item, i) => (
                  <tr key={i} className={`border-b border-border-subtle/30 hover:bg-element-hover/50 transition-colors ${item.isJanuary ? 'bg-amber-500/5' : ''}`}>
                    <td className="py-1.5 px-4 font-bold sticky left-0 bg-surface border-r border-border-subtle/50">{item.dateLabel}</td>
                    <td className="py-1.5 px-4 text-center border-r border-border-subtle/30 font-mono text-[9px] text-text-secondary">
                      {Math.round(item.monthVolCalculated)}
                    </td>
                    {infraItems.map((it) => (
                      <td key={it.id} className="py-1.5 px-4 text-right font-medium text-text-secondary">
                        R$ {formatNumber(item.infraCosts[it.id] || 0)}
                      </td>
                    ))}
                    <td className="py-1.5 px-4 text-center border-l border-border-subtle/30">
                      {item.appliedIPCA > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[9px]">
                            +{item.appliedIPCA}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-secondary text-[9px]">--</span>
                      )}
                    </td>
                    <td className="py-1.5 px-4 text-right font-bold text-amber-500 bg-amber-500/5">
                      R$ {formatNumber(item.totalItMonth)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-element-bg font-bold">
                <tr>
                  <td className="py-3 px-4 sticky left-0 bg-element-bg border-r border-border-subtle/50 uppercase text-[9px]">TOTAIS LTV</td>
                  <td className="py-3 px-4 border-r border-border-subtle/30 text-center text-text-secondary text-[10px]">--</td>
                  {infraItems.map((it) => {
                    const areaTotal = (months as any[]).reduce((acc: number, m: any) => acc + (m.infraCosts[it.id] || 0), 0);
                    return (
                      <td key={it.id} className="py-3 px-4 text-right text-text-secondary text-[10px]">R$ {formatNumber(areaTotal)}</td>
                    )
                  })}
                  <td className="py-3 px-4 text-center text-text-secondary text-[10px] border-l border-border-subtle/30">--</td>
                  <td className="py-3 px-4 text-right text-amber-500 bg-amber-500/10 text-sm">R$ {formatNumber(totalInfraLTV)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => { setView('new-bc'); setActiveStep(4); }}
            className="px-6 py-2.5 bg-element-bg border border-border-subtle rounded-xl text-sm font-bold hover:bg-element-hover transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Step 4
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {view === 'overview' && renderOverview()}
        {view === 'new-bc' && renderNewBC()}
        {view === 'monthly-details' && renderMonthlyDetailsPage()}
        {view === 'infra-details' && renderInfraDetailsPage()}
      </AnimatePresence>

      {/* Catalog Modal */}
      {isInfraCatalogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface border border-border-subtle rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-5 border-b border-border-subtle bg-element-bg">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2"><Server className="w-5 h-5 text-primary" /> Catálogo de Infraestrutura</h3>
              <button onClick={() => setIsInfraCatalogOpen(false)} className="text-text-secondary hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-border-subtle bg-element-bg/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input type="text" placeholder="Buscar recurso por nome ou natureza..." value={infraCatalogSearch} onChange={(e) => setInfraCatalogSearch(e.target.value)} className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-primary transition-colors shadow-sm" />
              </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1 bg-element-bg/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableInfraItems.filter(i => i.name.toLowerCase().includes(infraCatalogSearch.toLowerCase()) || i.type.toLowerCase().includes(infraCatalogSearch.toLowerCase())).map(item => {
                  const typeLabels: Record<string, string> = {
                    'shared_fixed': 'Compartilhado (Rateio %)',
                    'variable_api': 'Transacional (Chamada)',
                    'batch_instance': 'Fixo (Batch/Mes)',
                    'storage_acumulativo': 'Data/Storage Acum.'
                  };
                  return (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setTempInfraItem({ ...tempInfraItem, name: item.name, type: item.type as any, cost: item.unit_cost.toString(), premise: item.type === 'variable_api' ? '1' : '' });
                        setIsInfraCatalogOpen(false);
                      }}
                      className="flex flex-col p-4 rounded-xl border border-border-subtle bg-surface hover:border-primary hover:bg-primary/5 transition-all text-left group shadow-sm"
                    >
                      <div className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors">{item.name}</div>
                      <div className="text-[9px] text-text-secondary uppercase font-bold tracking-widest mt-1.5">{typeLabels[item.type] || item.type}</div>
                      <div className="font-mono font-bold text-primary mt-2">{item.unit_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 })}</div>
                    </button>
                  );
                })}
                {availableInfraItems.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-text-secondary text-sm">Nenhum item disponível no banco dedados.</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
