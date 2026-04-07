import React from 'react';
import { motion } from 'motion/react';
import { Calculator, LayoutDashboard, Target, Zap, PieChart } from 'lucide-react';

export function ProductModules() {
  const modules = [
    {
      title: "Pricing Estratégico",
      desc: "Simule elasticidade de preço e encontre o ponto ótimo de margem e volume.",
      icon: <Calculator className="w-5 h-5" />,
      color: "from-blue-500/20 to-blue-600/5",
      borderColor: "group-hover:border-blue-500/50",
      iconColor: "text-blue-400"
    },
    {
      title: "Simulador de Negócios",
      desc: "Crie gêmeos digitais do seu modelo de negócio e teste hipóteses sem risco.",
      icon: <LayoutDashboard className="w-5 h-5" />,
      color: "from-purple-500/20 to-purple-600/5",
      borderColor: "group-hover:border-purple-500/50",
      iconColor: "text-purple-400"
    },
    {
      title: "Análise de Viabilidade",
      desc: "Valide novos projetos, M&A ou expansões com projeções de fluxo de caixa.",
      icon: <Target className="w-5 h-5" />,
      color: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "group-hover:border-emerald-500/50",
      iconColor: "text-emerald-400"
    },
    {
      title: "Stress Test Financeiro",
      desc: "Submeta seu caixa a cenários extremos (crises, perda de clientes, inflação).",
      icon: <Zap className="w-5 h-5" />,
      color: "from-amber-500/20 to-amber-600/5",
      borderColor: "group-hover:border-amber-500/50",
      iconColor: "text-amber-400"
    },
    {
      title: "Inteligência de Margem",
      desc: "Identifique vazamentos de lucro e otimize seu mix de produtos/serviços.",
      icon: <PieChart className="w-5 h-5" />,
      color: "from-rose-500/20 to-rose-600/5",
      borderColor: "group-hover:border-rose-500/50",
      iconColor: "text-rose-400"
    }
  ];

  return (
    <section id="modulos" className="py-32 bg-surface/30 border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Módulos do Produto</h2>
          <p className="text-text-secondary max-w-2xl">
            Um ecossistema completo para cobrir todas as frentes da sua estratégia financeira.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`group relative p-8 rounded-2xl glass-panel border border-border-subtle transition-all duration-300 ${mod.borderColor} hover:-translate-y-1 hover:shadow-2xl overflow-hidden`}
            >
              {/* Hover Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-surface border border-border-subtle flex items-center justify-center mb-6 ${mod.iconColor}`}>
                  {mod.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{mod.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{mod.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
