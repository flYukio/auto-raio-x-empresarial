import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, Plus, Check, Mail, Lock, User, AlertTriangle, Save, Bell, Building, Briefcase, BadgeCheck, Edit2, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SettingsViewProps {
  userPermissions: string[];
}

export function SettingsView({ userPermissions }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-6 h-full flex flex-col"
    >
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Configurações do Sistema</h1>
        <p className="text-text-secondary text-sm">Gerencie acessos, cargos e preferências da plataforma.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'roles' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
          }`}
        >
          <Shield className="w-4 h-4" /> Administração de Cargos
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
          }`}
        >
          <Users className="w-4 h-4" /> Administração de Usuários
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'roles' && <RolesManager key="roles" userPermissions={userPermissions} />}
          {activeTab === 'users' && <UsersManager key="users" userPermissions={userPermissions} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface Role {
  id: string;
  name: string;
  modules: string[];
}

function RolesManager({ userPermissions }: { userPermissions: string[] }) {
  const hasAccess = userPermissions.includes('Administração de Cargos');
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleName, setRoleName] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const businessModules = [
    'Pricing Estratégico',
    'Simulador de Negócios',
    'Análise de Viabilidade',
    'Stress Test Financeiro',
    'Inteligência de Margem'
  ];

  const parameterModules = [
    'Parâmetros - Pricing',
    'Parâmetros - Empresa'
  ];

  const adminModules = [
    'Administração de Cargos',
    'Administração de Usuários'
  ];

  useEffect(() => {
    if (hasAccess) {
      fetchRoles();
    }
  }, [hasAccess]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setRoles(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar cargos:', err);
      setErrorMsg('Erro de conexão. Verifique se a tabela "roles" foi criada no Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (mod: string) => {
    setSelectedModules(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  const handleSave = async () => {
    if (!roleName || selectedModules.length === 0) return;
    setIsSaving(true);
    setErrorMsg('');

    try {
      if (editingRoleId) {
        const { error } = await supabase
          .from('roles')
          .update({ name: roleName, modules: selectedModules })
          .eq('id', editingRoleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('roles')
          .insert([{ name: roleName, modules: selectedModules }]);
        if (error) throw error;
      }

      setSaved(true);
      setRoleName('');
      setSelectedModules([]);
      setEditingRoleId(null);
      fetchRoles();

      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setErrorMsg(err.message || 'Erro ao salvar cargo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setSelectedModules(role.modules || []);
    setErrorMsg('');
  };

  const cancelEdit = () => {
    setEditingRoleId(null);
    setRoleName('');
    setSelectedModules([]);
    setErrorMsg('');
  };

  if (!hasAccess) {
    return <AccessDenied message="Apenas Diretores e Heads/Gerentes têm acesso à Administração de Cargos." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Cargos */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Cargos Existentes</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : roles.length === 0 ? (
          <div className="text-sm text-text-secondary p-4 border border-border-subtle border-dashed rounded-xl text-center">
            Nenhum cargo cadastrado.
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {roles.map(role => (
              <div key={role.id} className={`p-3 rounded-xl border transition-colors flex items-center justify-between group ${editingRoleId === role.id ? 'border-primary bg-primary/5' : 'border-border-subtle bg-element-bg hover:border-primary/50'}`}>
                <div>
                  <div className="font-medium text-sm">{role.name}</div>
                  <div className="text-xs text-text-secondary">{role.modules?.length || 0} módulos</div>
                </div>
                <button 
                  onClick={() => handleEdit(role)}
                  className={`p-1.5 rounded-lg transition-all ${editingRoleId === role.id ? 'text-primary bg-primary/10' : 'text-text-secondary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100'}`}
                  title="Editar Cargo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-border-subtle h-fit"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingRoleId ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
              {editingRoleId ? <Edit2 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-blue-400" />}
            </div>
            {editingRoleId ? 'Editar Cargo' : 'Criar Novo Cargo'}
          </h2>
          {editingRoleId && (
            <button onClick={cancelEdit} className="text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-element-hover transition-colors">
              <X className="w-3.5 h-3.5" /> Cancelar edição
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nome do Cargo</label>
            <input 
              type="text" 
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 px-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
              placeholder="Ex: Analista Financeiro Sênior" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">Permissões de Módulos</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {businessModules.map(mod => (
                <label key={mod} className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle hover:bg-element-hover cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={selectedModules.includes(mod)} 
                    onChange={() => toggleModule(mod)} 
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedModules.includes(mod) ? 'bg-primary border-primary text-background' : 'border-border-subtle bg-element-bg'}`}>
                    {selectedModules.includes(mod) && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium">{mod}</span>
                </label>
              ))}
            </div>

            <label className="block text-sm font-medium text-text-secondary mb-3">Permissões de Parâmetros</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {parameterModules.map(mod => (
                <label key={mod} className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle hover:bg-element-hover cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={selectedModules.includes(mod)} 
                    onChange={() => toggleModule(mod)} 
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedModules.includes(mod) ? 'bg-amber-500 border-amber-500 text-background' : 'border-border-subtle bg-element-bg'}`}>
                    {selectedModules.includes(mod) && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium">{mod}</span>
                </label>
              ))}
            </div>

            <label className="block text-sm font-medium text-text-secondary mb-3">Permissões Administrativas</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {adminModules.map(mod => (
                <label key={mod} className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle hover:bg-element-hover cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={selectedModules.includes(mod)} 
                    onChange={() => toggleModule(mod)} 
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedModules.includes(mod) ? 'bg-rose-500 border-rose-500 text-background' : 'border-border-subtle bg-element-bg'}`}>
                    {selectedModules.includes(mod) && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium">{mod}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
            {saved ? (
              <span className="text-emerald-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> Cargo {editingRoleId ? 'atualizado' : 'criado'} com sucesso!
              </span>
            ) : <span />}
            <button 
              onClick={handleSave}
              disabled={!roleName || selectedModules.length === 0 || isSaving}
              className="px-6 py-2.5 rounded-xl bg-primary text-background font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
              {editingRoleId ? 'Atualizar Cargo' : 'Salvar Cargo'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  company: string;
  area: string;
  role_id: string;
  active: boolean;
  roles?: { name: string };
}

function UsersManager({ userPermissions }: { userPermissions: string[] }) {
  const hasAccess = userPermissions.includes('Administração de Usuários');
  const [users, setUsers] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [area, setArea] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (hasAccess) {
      fetchRoles();
      fetchUsers();
    }
  }, [hasAccess]);

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .order('name', { ascending: true });
        
      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error('Erro ao buscar cargos:', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(name)')
        .order('full_name', { ascending: true });
        
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handlePreSave = () => {
    if (!name || !email || !company || !area || !role) return;
    if (!validateEmail(email)) {
      setEmailError('Por favor, insira um e-mail válido.');
      return;
    }
    setEmailError('');
    
    if (editingUserId) {
      handleFinalSave(false);
    } else {
      setShowNotificationPrompt(true);
    }
  };

  const handleFinalSave = async (notify: boolean) => {
    setShowNotificationPrompt(false);
    setIsSaving(true);
    setErrorMsg('');
    
    try {
      if (editingUserId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: name,
            email: email,
            company: company,
            area: area,
            role_id: role,
            active: isActive
          })
          .eq('id', editingUserId);
          
        if (error) throw error;
      } else {
        // Criação de novo usuário via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: 'raiox123',
          options: {
            data: {
              full_name: name,
              company: company,
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Upsert no profile para garantir que os campos extras sejam salvos
          // (cobre o caso do trigger já ter rodado ou não)
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              full_name: name,
              email: email,
              company: company,
              area: area,
              role_id: role,
              active: true
            }, { onConflict: 'id' });

          if (profileError) throw profileError;
        } else {
          throw new Error('Não foi possível criar o usuário. Verifique as configurações do Supabase.');
        }
      }
      
      setSaved(true);
      cancelEdit();
      fetchUsers();
      
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setErrorMsg(err.message || 'Erro ao salvar usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user: Profile) => {
    setEditingUserId(user.id);
    setName(user.full_name || '');
    setEmail(user.email || '');
    setCompany(user.company || '');
    setArea(user.area || '');
    setRole(user.role_id || '');
    setIsActive(user.active !== false); // default true if undefined
    setEmailError('');
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setCompany('');
    setArea('');
    setRole('');
    setIsActive(true);
    setEmailError('');
    setErrorMsg('');
  };

  if (!hasAccess) {
    return <AccessDenied message="Apenas perfis autorizados têm acesso à Administração de Usuários." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Usuários */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Usuários Cadastrados</h3>
        {isLoadingUsers ? (
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : users.length === 0 ? (
          <div className="text-sm text-text-secondary p-4 border border-border-subtle border-dashed rounded-xl text-center">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {users.map(user => (
              <div key={user.id} className={`p-3 rounded-xl border transition-colors flex items-center justify-between group ${editingUserId === user.id ? 'border-primary bg-primary/5' : 'border-border-subtle bg-element-bg hover:border-primary/50'} ${user.active === false ? 'opacity-60' : ''}`}>
                <div className="overflow-hidden pr-2">
                  <div className="font-medium text-sm truncate">{user.full_name}</div>
                  <div className="text-xs text-text-secondary truncate">{user.roles?.name || 'Sem cargo'}</div>
                </div>
                <button 
                  onClick={() => handleEdit(user)}
                  className={`shrink-0 p-1.5 rounded-lg transition-all ${editingUserId === user.id ? 'text-primary bg-primary/10' : 'text-text-secondary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100'}`}
                  title="Editar Usuário"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-border-subtle relative h-fit"
      >
        {/* Modal de Confirmação de Notificação */}
        <AnimatePresence>
          {showNotificationPrompt && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm rounded-2xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-element-bg border border-border-subtle p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Notificar Usuário?</h3>
                <p className="text-sm text-text-secondary mb-6">
                  Deseja enviar um e-mail para <strong>{email}</strong> com as instruções de acesso e a senha padrão?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleFinalSave(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border-subtle hover:bg-element-hover transition-colors text-sm font-medium"
                  >
                    Não notificar
                  </button>
                  <button 
                    onClick={() => handleFinalSave(true)}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-background hover:opacity-90 transition-colors text-sm font-medium"
                  >
                    Sim, enviar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingUserId ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
              {editingUserId ? <Edit2 className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4 text-emerald-400" />}
            </div>
            {editingUserId ? 'Editar Usuário' : 'Criar Novo Usuário'}
          </h2>
          {editingUserId && (
            <button onClick={cancelEdit} className="text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-element-hover transition-colors">
              <X className="w-3.5 h-3.5" /> Cancelar edição
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">Nome Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-text-secondary" />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="Ex: Maria Silva" 
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-text-secondary" />
              </div>
              <input 
                type="email" 
                value={email}
                disabled={!!editingUserId}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                className={`w-full bg-element-bg border ${emailError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-border-subtle focus:border-primary focus:ring-primary'} rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:ring-1 transition-colors ${editingUserId ? 'opacity-60 cursor-not-allowed' : ''}`} 
                placeholder="maria@empresa.com" 
              />
            </div>
            {emailError && <p className="text-rose-400 text-xs mt-1.5">{emailError}</p>}
            {editingUserId && <p className="text-text-secondary text-xs mt-1.5">O e-mail não pode ser alterado após a criação.</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">Empresa</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building className="h-4 w-4 text-text-secondary" />
              </div>
              <input 
                type="text" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="Nome da Empresa" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Área</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Briefcase className="h-4 w-4 text-text-secondary" />
              </div>
              <input 
                type="text" 
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="Ex: Financeiro" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Cargo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <BadgeCheck className="h-4 w-4 text-text-secondary" />
              </div>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoadingRoles}
                className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none disabled:opacity-50" 
              >
                <option value="" disabled className="bg-background text-text-primary">
                  {isLoadingRoles ? 'Carregando cargos...' : 'Selecione um cargo'}
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-background text-text-primary">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {editingUserId ? (
            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-element-bg mt-2">
              <div>
                <div className="font-medium text-sm text-text-primary">Status do Usuário</div>
                <div className="text-xs text-text-secondary mt-0.5">Usuários inativos perdem o acesso ao sistema.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                />
                <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">Senha Padrão</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-text-secondary" />
                </div>
                <input 
                  type="text" 
                  value="raiox123"
                  disabled
                  className="w-full bg-surface border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-secondary cursor-not-allowed opacity-70" 
                />
              </div>
              <p className="text-xs text-text-secondary mt-1.5">A senha padrão será exigida no primeiro acesso.</p>
            </div>
          )}

          <div className="md:col-span-2 pt-4 border-t border-border-subtle flex items-center justify-between">
            {saved ? (
              <span className="text-emerald-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> Usuário {editingUserId ? 'atualizado' : 'criado'} com sucesso!
              </span>
            ) : <span />}
            <button 
              onClick={handlePreSave}
              disabled={!name || !email || !company || !area || !role || isSaving}
              className="px-6 py-2.5 rounded-xl bg-primary text-background font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingUserId ? 'Atualizar Usuário' : 'Salvar Usuário'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AccessDenied({ message }: { message: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-rose-400" />
      </div>
      <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
      <p className="text-text-secondary max-w-md">{message}</p>
    </motion.div>
  );
}
