import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Calculator, 
  LineChart, 
  Target, 
  Activity, 
  PieChart, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Plus,
  ShieldAlert,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { SettingsView } from '../components/SettingsView';
import { ParamsPricingView } from '../components/parameters/ParamsPricingView';
import { ParamsCompanyView } from '../components/parameters/ParamsCompanyView';
import { PricingEstrategicoView } from '../components/pricing/PricingEstrategicoView';

// Tipos para os módulos
type ModuleType = 'overview' | 'pricing' | 'simulator' | 'viability' | 'stress' | 'margin' | 'settings' | 'params-pricing' | 'params-empresa';

export function Dashboard() {
  const [activeModule, setActiveModule] = useState<ModuleType>('overview');
  const [userName, setUserName] = useState<string>('Usuário');
  const [companyName, setCompanyName] = useState<string>('Empresa');
  const [loading, setLoading] = useState(true);
  
  // Estado para testar as permissões de acesso
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [userRoleId, setUserRoleId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchUserAndRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (user.user_metadata) {
        setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário');
        setCompanyName(user.user_metadata.company || 'Sua Empresa');
      }

      // Buscar perfil do usuário para obter o role_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

      if (profileData && profileData.role_id) {
        setUserRoleId(profileData.role_id);
      }

      // Buscar cargos
      const { data: rolesData } = await supabase.from('roles').select('*').order('name');
      if (rolesData) {
        setDbRoles(rolesData);
      }

      setLoading(false);
    };

    fetchUserAndRoles();
  }, [navigate]);

  // Calcular permissões baseadas no cargo do usuário
  let userPermissions: string[] = [];
  if (userRoleId) {
    const role = dbRoles.find(r => r.id === userRoleId);
    userPermissions = role?.modules || [];
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const modules = [
    { id: 'pricing', name: 'Pricing Estratégico', icon: Calculator, color: 'text-blue-400', hoverColor: 'group-hover:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', indicator: 'bg-blue-500' },
    { id: 'simulator', name: 'Simulador de Negócios', icon: LineChart, color: 'text-purple-400', hoverColor: 'group-hover:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', indicator: 'bg-purple-500' },
    { id: 'viability', name: 'Análise de Viabilidade', icon: Target, color: 'text-emerald-400', hoverColor: 'group-hover:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', indicator: 'bg-emerald-500' },
    { id: 'stress', name: 'Stress Test Financeiro', icon: Activity, color: 'text-rose-400', hoverColor: 'group-hover:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', indicator: 'bg-rose-500' },
    { id: 'margin', name: 'Inteligência de Margem', icon: PieChart, color: 'text-amber-400', hoverColor: 'group-hover:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', indicator: 'bg-amber-500' },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-text-primary">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-subtle bg-surface/50 glass-panel flex flex-col z-20 hidden md:flex">
        <div className="h-20 flex items-center px-6 border-b border-border-subtle">
          <div className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            Auto Raio X
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-mono text-text-secondary uppercase tracking-wider mb-4 px-2">Menu Principal</div>
          
          <motion.button 
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModule('overview')}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${activeModule === 'overview' ? 'bg-primary/10 text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
          >
            {activeModule === 'overview' && (
              <motion.div 
                layoutId="active-sidebar-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" 
              />
            )}
            <LayoutDashboard className={`w-5 h-5 relative z-10 transition-colors ${activeModule === 'overview' ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`} /> 
            <span className="relative z-10">Painel de Trabalho</span>
          </motion.button>

          <div className="mt-8 mb-4 px-2 text-xs font-mono text-text-secondary uppercase tracking-wider">Módulos</div>
          
          {modules.map((mod) => (
            <motion.button 
              key={mod.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModule(mod.id as ModuleType)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${activeModule === mod.id ? `${mod.bg} text-text-primary shadow-sm` : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
            >
              {activeModule === mod.id && (
                <motion.div 
                  layoutId="active-sidebar-indicator"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 ${mod.indicator} rounded-r-full`} 
                />
              )}
              <mod.icon className={`w-5 h-5 relative z-10 transition-colors ${activeModule === mod.id ? mod.color : `text-text-secondary ${mod.hoverColor}`}`} /> 
              <span className="relative z-10">{mod.name}</span>
            </motion.button>
          ))}

          <div className="mt-8 mb-4 px-2 text-xs font-mono text-text-secondary uppercase tracking-wider">Parâmetros</div>
          
          {userPermissions.includes('Parâmetros - Pricing') && (
            <motion.button 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModule('params-pricing')}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${activeModule === 'params-pricing' ? 'bg-amber-500/10 text-text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
            >
              {activeModule === 'params-pricing' && (
                <motion.div 
                  layoutId="active-sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full" 
                />
              )}
              <Calculator className={`w-5 h-5 relative z-10 transition-colors ${activeModule === 'params-pricing' ? 'text-amber-400' : 'text-text-secondary group-hover:text-amber-400'}`} /> 
              <span className="relative z-10">Pricing</span>
            </motion.button>
          )}

          {userPermissions.includes('Parâmetros - Empresa') && (
            <motion.button 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModule('params-empresa')}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${activeModule === 'params-empresa' ? 'bg-amber-500/10 text-text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
            >
              {activeModule === 'params-empresa' && (
                <motion.div 
                  layoutId="active-sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full" 
                />
              )}
              <Building className={`w-5 h-5 relative z-10 transition-colors ${activeModule === 'params-empresa' ? 'text-amber-400' : 'text-text-secondary group-hover:text-amber-400'}`} /> 
              <span className="relative z-10">Empresa</span>
            </motion.button>
          )}
        </div>

        <div className="p-4 border-t border-border-subtle space-y-2">
          <motion.button 
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModule('settings')}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${activeModule === 'settings' ? 'bg-primary/10 text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
          >
            {activeModule === 'settings' && (
              <motion.div 
                layoutId="active-sidebar-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" 
              />
            )}
            <Settings className={`w-5 h-5 relative z-10 transition-colors ${activeModule === 'settings' ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`} /> 
            <span className="relative z-10">Configurações</span>
          </motion.button>
          <motion.button 
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" /> Sair
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Topbar */}
        <header className="h-20 border-b border-border-subtle bg-surface/30 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Buscar simulações, relatórios..." 
                className="w-full bg-element-bg border border-border-subtle rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-element-hover text-text-secondary transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-full hover:bg-element-hover text-text-secondary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-background"></span>
            </button>
            <div className="h-8 w-px bg-border-subtle mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-text-primary">{userName}</div>
                <div className="text-xs text-text-secondary">{companyName}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content Area */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <AnimatePresence mode="wait">
            {activeModule === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-6xl mx-auto space-y-5"
              >
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-display font-bold mb-1">Painel de Trabalho</h1>
                    <p className="text-text-secondary text-sm">Bem-vindo de volta, {userName}. Aqui está o resumo da {companyName}.</p>
                  </div>
                  <button className="px-4 py-2 rounded-full bg-text-primary text-background text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Nova Simulação
                  </button>
                </div>

                {/* Quick Stats - Condensed */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">+12%</span>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-0.5">Saúde Financeira</div>
                      <div className="text-xl font-display font-bold">Excelente</div>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">Q4</span>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-0.5">Risco de Ruptura</div>
                      <div className="text-xl font-display font-bold">Médio</div>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-0.5">Simulações Ativas</div>
                      <div className="text-xl font-display font-bold">14</div>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <PieChart className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-mono border border-purple-500/20">Projetado</span>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-0.5">Margem Média</div>
                      <div className="text-xl font-display font-bold">22.4%</div>
                    </div>
                  </div>
                </div>

                {/* Main Dashboard Area: Chart + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Chart Placeholder */}
                  <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-border-subtle flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold">Evolução de Cenários (EBITDA)</h2>
                      <select className="bg-element-bg border border-border-subtle rounded-lg text-xs px-2 py-1 text-text-secondary outline-none">
                         <option>Últimos 6 meses</option>
                         <option>Ano atual</option>
                      </select>
                    </div>
                    <div className="flex-1 min-h-[200px] rounded-lg border border-border-subtle border-dashed flex items-center justify-center bg-element-bg/50 relative overflow-hidden">
                       {/* Mock Chart Lines */}
                       <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                         <path d="M0,80 Q20,60 40,70 T80,40 T100,20" fill="none" stroke="currentColor" className="text-emerald-500/50" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                         <path d="M0,90 Q20,80 40,85 T80,60 T100,50" fill="none" stroke="currentColor" className="text-blue-500/30" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                       </svg>
                       <div className="text-xs text-text-secondary z-10 bg-surface/80 px-3 py-1 rounded-full backdrop-blur-sm border border-border-subtle">
                         Gráfico Interativo
                       </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="glass-panel p-5 rounded-xl border border-border-subtle flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold">Atividade Recente</h2>
                      <button className="text-xs text-primary hover:underline">Ver tudo</button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
                      {[
                        { title: 'Cenário Base 2026', module: 'Simulador', date: 'Hoje, 14:30', status: 'Concluído' },
                        { title: 'Ajuste Produto A', module: 'Pricing', date: 'Ontem, 09:15', status: 'Rascunho' },
                        { title: 'Expansão Sul', module: 'Viabilidade', date: '02 Abr', status: 'Concluído' },
                        { title: 'Teste Q4', module: 'Stress Test', date: '28 Mar', status: 'Alerta' },
                      ].map((item, i) => (
                        <div key={i} className="p-3 rounded-lg bg-element-bg border border-border-subtle hover:border-primary/30 transition-colors flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-surface border border-border-subtle flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Clock className="w-3.5 h-3.5 text-text-secondary group-hover:text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium leading-tight">{item.title}</div>
                              <div className="text-[10px] text-text-secondary mt-0.5">{item.module}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-text-secondary">{item.date}</div>
                            <div className={`text-[10px] font-mono mt-0.5 ${
                              item.status === 'Concluído' ? 'text-emerald-400' : 
                              item.status === 'Alerta' ? 'text-amber-400' : 'text-blue-400'
                            }`}>{item.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Placeholder for specific modules */}
            {activeModule !== 'overview' && activeModule !== 'settings' && activeModule !== 'params-pricing' && activeModule !== 'params-empresa' && activeModule !== 'pricing' && (
              <motion.div
                key="module-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => setActiveModule('overview')}
                    className="p-2 rounded-xl bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-display font-bold">
                      {modules.find(m => m.id === activeModule)?.name}
                    </h1>
                    <p className="text-text-secondary text-sm">Ambiente de trabalho isolado.</p>
                  </div>
                </div>

                <div className="flex-1 glass-panel rounded-3xl border border-border-subtle flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                  <div className="text-center relative z-10 max-w-md px-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-element-bg border border-border-subtle flex items-center justify-center mb-6 shadow-2xl">
                      {modules.find(m => m.id === activeModule) && React.createElement(modules.find(m => m.id === activeModule)!.icon, { className: `w-10 h-10 ${modules.find(m => m.id === activeModule)?.color}` })}
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Módulo em Desenvolvimento</h2>
                    <p className="text-text-secondary mb-8">
                      A interface completa para o <strong>{modules.find(m => m.id === activeModule)?.name}</strong> está sendo carregada com os dados da {companyName}.
                    </p>
                    <button 
                      onClick={() => setActiveModule('overview')}
                      className="px-6 py-3 rounded-full bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors font-medium"
                    >
                      Voltar ao Painel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings View */}
            {activeModule === 'settings' && (
              <SettingsView userPermissions={userPermissions} />
            )}

            {/* Parameters Views */}
            {activeModule === 'params-pricing' && (
              <ParamsPricingView userPermissions={userPermissions} />
            )}
            
            {activeModule === 'params-empresa' && (
              <ParamsCompanyView userPermissions={userPermissions} />
            )}

            {/* Pricing Estratégico View */}
            {activeModule === 'pricing' && (
              <PricingEstrategicoView userPermissions={userPermissions} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
