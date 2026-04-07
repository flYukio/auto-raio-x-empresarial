import React from 'react';
import { motion } from 'motion/react';

export function VisualDemo() {
  return (
    <section className="py-32 bg-surface/30 border-y border-border-subtle relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Visão Clara. Controle Total.</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Uma interface projetada para traduzir complexidade financeira em insights acionáveis imediatos.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel rounded-3xl border border-border-subtle p-2 md:p-4 shadow-2xl relative"
        >
          {/* Mac-like Window Controls */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <div className="ml-4 text-xs font-mono text-text-secondary">auto-raiox-dashboard.app</div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 p-2">
            {/* Left Column: DRE & Indicators */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-element-bg border border-border-subtle">
                <div className="text-xs font-mono text-text-secondary uppercase mb-4">DRE Simplificado (Q3)</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Receita Bruta</span>
                    <span className="font-mono">R$ 45.2M</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span className="text-sm">Deduções</span>
                    <span className="font-mono">- R$ 4.1M</span>
                  </div>
                  <div className="h-px bg-border-subtle my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Receita Líquida</span>
                    <span className="font-mono">R$ 41.1M</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span className="text-sm">Custos (CMV)</span>
                    <span className="font-mono">- R$ 18.5M</span>
                  </div>
                  <div className="h-px bg-border-subtle my-2" />
                  <div className="flex justify-between items-center font-bold text-emerald-400">
                    <span className="text-sm">Lucro Bruto</span>
                    <span className="font-mono">R$ 22.6M</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-element-bg border border-border-subtle">
                <div className="text-xs font-mono text-text-secondary uppercase mb-2">Margem EBITDA</div>
                <div className="text-3xl font-display font-bold mb-2">24.8%</div>
                <div className="w-full bg-element-hover rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full w-[75%]" />
                </div>
              </div>
            </div>

            {/* Middle & Right: Main Chart & Alerts */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl bg-element-bg border border-border-subtle h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-xs font-mono text-text-secondary uppercase">Projeção de Caixa (Cenário Base vs Stress)</div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-blue-500" /> Base</div>
                    <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-rose-500" /> Stress</div>
                  </div>
                </div>
                <div className="flex-1 relative flex items-end gap-2 pb-4">
                  {/* Mock Chart Bars */}
                  {[40, 55, 45, 70, 65, 85, 80, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
                      <div className="w-full bg-rose-500/40 rounded-t-sm transition-all duration-300 group-hover:bg-rose-500/60" style={{ height: `${h * 0.7}%` }} />
                      <div className="w-full bg-blue-500/80 rounded-t-sm transition-all duration-300 group-hover:bg-blue-400" style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-rose-400 font-medium text-sm mb-1">Alerta de Risco</div>
                  <div className="text-xs text-text-secondary">Ruptura de caixa detectada no Mês 6 no cenário de stress extremo.</div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-emerald-400 font-medium text-sm mb-1">Oportunidade</div>
                  <div className="text-xs text-text-secondary">Ajuste de +2% no pricing absorve impacto sem perda de market share.</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
