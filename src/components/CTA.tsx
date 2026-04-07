import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/20" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/30 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            Pare de tomar decisões <span className="text-gradient">no escuro.</span>
          </h2>
          <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
            Junte-se às empresas que simulam o futuro antes de investir no presente. O risco da inação é maior que o custo da clareza.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-10 py-5 rounded-full bg-text-primary text-background font-bold text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Testar Gratuitamente <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-10 py-5 rounded-full glass-panel hover:bg-element-hover transition-colors font-medium text-lg">
              Falar com Especialista
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
