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
  Sun, 
  Moon,
  Building,
  Clock
} from 'lucide-react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../ThemeProvider';

export function MainLayout() {
  const [userName, setUserName] = useState<string>('Usuário');
  const [companyName, setCompanyName] = useState<string>('Empresa');
  const [loading, setLoading] = useState(true);
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [userRoleId, setUserRoleId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();
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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

      if (profileData && profileData.role_id) {
        setUserRoleId(profileData.role_id);
      }

      const { data: rolesData } = await supabase.from('roles').select('*').order('name');
      if (rolesData) {
        setDbRoles(rolesData);
        if (profileData?.role_id) {
          const role = rolesData.find(r => r.id === profileData.role_id);
          setUserPermissions(role?.modules || []);
        }
      }

      setLoading(false);
    };

    fetchUserAndRoles();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const modules = [
    { id: 'pricing', path: '/dashboard/pricing', name: 'Pricing Estratégico', icon: Calculator, color: 'text-blue-400', hoverColor: 'group-hover:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', indicator: 'bg-blue-500' },
    { id: 'simulator', path: '/dashboard/simulator', name: 'Simulador de Negócios', icon: LineChart, color: 'text-purple-400', hoverColor: 'group-hover:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', indicator: 'bg-purple-500' },
    { id: 'viability', path: '/dashboard/viability', name: 'Análise de Viabilidade', icon: Target, color: 'text-emerald-400', hoverColor: 'group-hover:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', indicator: 'bg-emerald-500' },
    { id: 'stress', path: '/dashboard/stress', name: 'Stress Test Financeiro', icon: Activity, color: 'text-rose-400', hoverColor: 'group-hover:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', indicator: 'bg-rose-500' },
    { id: 'margin', path: '/dashboard/margin', name: 'Inteligência de Margem', icon: PieChart, color: 'text-amber-400', hoverColor: 'group-hover:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', indicator: 'bg-amber-500' },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-text-primary">Carregando...</div>;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background text-text-primary flex overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-subtle bg-surface/50 glass-panel flex flex-col z-20 hidden md:flex">
        <div className="h-20 flex items-center px-6 border-b border-border-subtle">
          <Link to="/dashboard">
            <img 
              src="/logo.png" 
              alt="Auto Raio X" 
              className={`h-10 w-auto transition-all ${theme === 'dark' ? 'brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : ''}`}
            />
          </Link>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-mono text-text-secondary uppercase tracking-wider mb-4 px-2">Menu Principal</div>
          
          <Link to="/dashboard">
            <motion.div 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${isActive('/dashboard') ? 'bg-primary/10 text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
            >
              {isActive('/dashboard') && (
                <motion.div 
                  layoutId="active-sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" 
                />
              )}
              <LayoutDashboard className={`w-5 h-5 relative z-10 transition-colors ${isActive('/dashboard') ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`} /> 
              <span className="relative z-10">Painel de Trabalho</span>
            </motion.div>
          </Link>

          <div className="mt-8 mb-4 px-2 text-xs font-mono text-text-secondary uppercase tracking-wider">Módulos</div>
          
          {modules.map((mod) => (
            <Link key={mod.id} to={mod.path}>
              <motion.div 
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${isActive(mod.path) ? `${mod.bg} text-text-primary shadow-sm` : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
              >
                {isActive(mod.path) && (
                  <motion.div 
                    layoutId="active-sidebar-indicator"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 ${mod.indicator} rounded-r-full`} 
                  />
                )}
                <mod.icon className={`w-5 h-5 relative z-10 transition-colors ${isActive(mod.path) ? mod.color : `text-text-secondary ${mod.hoverColor}`}`} /> 
                <span className="relative z-10">{mod.name}</span>
              </motion.div>
            </Link>
          ))}

          <div className="mt-8 mb-4 px-2 text-xs font-mono text-text-secondary uppercase tracking-wider">Parâmetros</div>
          
          {userPermissions.includes('Parâmetros - Pricing') && (
            <Link to="/dashboard/params-pricing">
              <motion.div 
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${isActive('/dashboard/params-pricing') ? 'bg-amber-500/10 text-text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
              >
                {isActive('/dashboard/params-pricing') && (
                  <motion.div 
                    layoutId="active-sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full" 
                  />
                )}
                <Calculator className={`w-5 h-5 relative z-10 transition-colors ${isActive('/dashboard/params-pricing') ? 'text-amber-400' : 'text-text-secondary group-hover:text-amber-400'}`} /> 
                <span className="relative z-10">Pricing</span>
              </motion.div>
            </Link>
          )}

          {userPermissions.includes('Parâmetros - Empresa') && (
            <Link to="/dashboard/params-empresa">
              <motion.div 
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${isActive('/dashboard/params-empresa') ? 'bg-amber-500/10 text-text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
              >
                {isActive('/dashboard/params-empresa') && (
                  <motion.div 
                    layoutId="active-sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full" 
                  />
                )}
                <Building className={`w-5 h-5 relative z-10 transition-colors ${isActive('/dashboard/params-empresa') ? 'text-amber-400' : 'text-text-secondary group-hover:text-amber-400'}`} /> 
                <span className="relative z-10">Empresa</span>
              </motion.div>
            </Link>
          )}

          {userPermissions.includes('Parâmetros - Pricing') && (
            <Link to="/dashboard/params-reajuste">
              <motion.div 
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${isActive('/dashboard/params-reajuste') ? 'bg-amber-500/10 text-text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
              >
                {isActive('/dashboard/params-reajuste') && (
                  <motion.div 
                    layoutId="active-sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full" 
                  />
                )}
                <TrendingUp className={`w-5 h-5 relative z-10 transition-colors ${isActive('/dashboard/params-reajuste') ? 'text-amber-400' : 'text-text-secondary group-hover:text-amber-400'}`} /> 
                <span className="relative z-10">Índice Reajuste</span>
              </motion.div>
            </Link>
          )}
        </div>

        <div className="p-4 border-t border-border-subtle space-y-2">
          <Link to="/dashboard/settings">
            <motion.div 
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium overflow-hidden group ${isActive('/dashboard/settings') ? 'bg-primary/10 text-primary shadow-sm' : 'text-text-secondary hover:bg-element-bg hover:text-text-primary'}`}
            >
              {isActive('/dashboard/settings') && (
                <motion.div 
                  layoutId="active-sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" 
                />
              )}
              <Settings className={`w-5 h-5 relative z-10 transition-colors ${isActive('/dashboard/settings') ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`} /> 
              <span className="relative z-10">Configurações</span>
            </motion.div>
          </Link>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
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

        {/* Page Content area */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <Outlet context={{ userPermissions, userName, companyName }} />
        </div>
      </main>
    </div>
  );
}
