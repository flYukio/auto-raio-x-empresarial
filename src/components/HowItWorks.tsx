import React from 'react';
import { motion } from 'motion/react';
import { Database, Cpu, LineChart } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: <Database className="w-6 h-6 text-blue-400" />,
      title: "Insira dados do seu negócio",
      desc: "Conecte suas fontes de dados ou insira premissas financeiras de forma segura.",
      delay: 0
    },
    {
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      title: "Simule cenários financeiros",
      desc: "Nossa IA processa milhares de variáveis para criar projeções precisas e stress tests.",
      delay: 0.2
    },
    {
      icon: <LineChart className="w-6 h-6 text-emerald-400" />,
      title: "Receba diagnóstico estratégico",
      desc: "Visualize riscos, oportunidades e o caminho exato para a melhor decisão.",
      delay: 0.4
    }
  ];

  return (
    <section id="como-funciona" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Como Funciona</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Três passos simples separam a incerteza da clareza absoluta.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-blue-500/0 via-purple-500/50 to-emerald-500/0" />

          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: step.delay, duration: 0.5 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-2xl glass-panel flex items-center justify-center mb-8 relative group">
                <div className="absolute inset-0 rounded-2xl bg-element-bg opacity-0 group-hover:opacity-100 transition-opacity" />
                {step.icon}
                
                {/* Number Badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface border border-border-subtle flex items-center justify-center font-mono text-sm font-bold">
                  {i + 1}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
