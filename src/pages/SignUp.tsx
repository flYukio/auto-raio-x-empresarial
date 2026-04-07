import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, ArrowRight, Mail, Lock, Loader2, User, Building } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function SignUp() {
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company: company,
          }
        }
      });

      if (error) throw error;
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-border-subtle rounded-full opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-border-subtle rounded-full opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-border-subtle shadow-2xl relative overflow-hidden">
          {/* Top highlight line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500" />

          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-primary transition-transform group-hover:scale-105">
                <BrainCircuit className="w-7 h-7 text-white" />
              </div>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold mb-2">Criar Conta</h1>
            <p className="text-text-secondary text-sm">Comece a simular o futuro do seu negócio.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.
              </div>
              <Link 
                to="/login"
                className="w-full py-3.5 rounded-xl bg-text-primary text-background font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Ir para o Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-element-bg border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                    placeholder="João Silva" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Empresa</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input 
                    type="text" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    className="w-full bg-element-bg border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                    placeholder="Sua Empresa Ltda" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">E-mail corporativo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-element-bg border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                    placeholder="voce@empresa.com" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-element-bg border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-text-primary text-background font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Criar Conta <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center text-sm text-text-secondary">
              Já tem uma conta? <Link to="/login" className="text-primary hover:text-blue-400 font-medium transition-colors">Entrar</Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
