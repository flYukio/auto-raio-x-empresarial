import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-border-subtle rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-border-subtle rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-element-bg border border-border-subtle mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">Auto Raio X v2.0 Live</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-6">
            Tome decisões financeiras com clareza <br/>
            <span className="text-gradient">antes de investir 1 real.</span>
          </h1>
          
          <p className="text-lg text-text-secondary mb-10 max-w-xl leading-relaxed">
            Simule, valide e entenda o futuro do seu negócio com inteligência avançada. O motor de decisão projetado para empresas que não podem errar.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <button className="px-8 py-4 rounded-full bg-text-primary text-background font-semibold hover:opacity-90 transition-colors flex items-center gap-2">
              Simular Agora <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-4 rounded-full glass-panel hover:bg-element-hover transition-colors font-medium">
              Ver Como Funciona
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          {/* Dashboard Mockup */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-mono text-text-secondary uppercase tracking-wider mb-1">Projeção de Cenário</h3>
                <div className="text-2xl font-display font-bold">Simulação Q3 2026</div>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono border border-emerald-500/30">Baixo Risco</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Metric Row */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">EBITDA Projetado</div>
                    <div className="font-mono font-medium">R$ 12.4M</div>
                  </div>
                </div>
                <div className="text-emerald-400 font-mono text-sm">+18.2%</div>
              </div>

              {/* Metric Row */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">Margem Operacional</div>
                    <div className="font-mono font-medium">24.8%</div>
                  </div>
                </div>
                <div className="text-emerald-400 font-mono text-sm">+2.1%</div>
              </div>

              {/* Alert Row */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-amber-400 mb-1">Aviso de Sensibilidade</div>
                  <div className="text-xs text-text-secondary">Aumento de 5% no CAC pode comprometer a meta de margem no Mês 4.</div>
                </div>
              </div>
            </div>
            
            {/* Decorative Chart Lines */}
            <div className="absolute bottom-0 left-0 w-full h-32 opacity-20 pointer-events-none">
               <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                 <path d="M0,100 L0,50 Q25,30 50,60 T100,20 L100,100 Z" fill="url(#grad1)" />
                 <defs>
                   <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                     <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                     <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
          </div>
          
          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 top-12 glass-panel p-4 rounded-xl border-emerald-500/30"
          >
            <div className="text-xs text-text-secondary mb-1">Viabilidade</div>
            <div className="text-emerald-400 font-mono font-bold text-lg">94.2%</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
