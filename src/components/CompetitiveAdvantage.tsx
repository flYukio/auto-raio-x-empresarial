import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export function CompetitiveAdvantage() {
  const advantages = [
    "Simulação antes da execução",
    "Diagnóstico inteligente com IA",
    "Visualização de risco em tempo real",
    "Decisão baseada em dados"
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
              A diferença entre <br/>
              <span className="text-text-secondary">achar</span> e <span className="text-gradient">saber</span>.
            </h2>
            <p className="text-lg text-text-secondary mb-10 leading-relaxed">
              Planilhas tradicionais mostram o que aconteceu. Nossa engine mostra o que vai acontecer. Antecipe cenários e elimine o achismo da sua diretoria.
            </p>

            <div className="space-y-4">
              {advantages.map((adv, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium">{adv}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Abstract Visual Representation */}
            <div className="aspect-square rounded-full border border-border-subtle relative flex items-center justify-center">
               <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-[spin_20s_linear_infinite]" />
               <div className="absolute inset-8 rounded-full border border-purple-500/20 animate-[spin_15s_linear_infinite_reverse]" />
               <div className="absolute inset-16 rounded-full border border-emerald-500/20 animate-[spin_10s_linear_infinite]" />
               
               <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 blur-xl opacity-50" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center">
                   <div className="text-4xl font-display font-bold text-text-primary mb-1">99.8%</div>
                   <div className="text-xs font-mono text-text-secondary uppercase tracking-widest">Precisão Preditiva</div>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
