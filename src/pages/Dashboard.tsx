import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  Calculator, 
  PieChart, 
  Clock 
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export function Dashboard() {
  const { userName, companyName } = useOutletContext<{ userName: string, companyName: string }>();

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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

      {/* Quick Stats */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-border-subtle flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">Evolução de Cenários (EBITDA)</h2>
          </div>
          <div className="flex-1 min-h-[200px] rounded-lg border border-border-subtle border-dashed flex items-center justify-center bg-element-bg/50 relative overflow-hidden">
             <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
               <path d="M0,80 Q20,60 40,70 T80,40 T100,20" fill="none" stroke="currentColor" className="text-emerald-500/50" strokeWidth="2" vectorEffect="non-scaling-stroke" />
               <path d="M0,90 Q20,80 40,85 T80,60 T100,50" fill="none" stroke="currentColor" className="text-blue-500/30" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
             </svg>
             <div className="text-xs text-text-secondary z-10 bg-surface/80 px-3 py-1 rounded-full backdrop-blur-sm border border-border-subtle">
               Gráfico Interativo
             </div>
          </div>
        </div>

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
  );
}
