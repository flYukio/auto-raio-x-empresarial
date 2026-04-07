import React from 'react';

export function SocialProof() {
  return (
    <section className="py-12 border-y border-border-subtle bg-surface/30">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm font-mono text-text-secondary uppercase tracking-wider mb-8">
          Projetado para empresas que não podem errar decisões
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Fictional Logos */}
          <div className="flex items-center gap-2 font-display font-bold text-xl">
            <div className="w-6 h-6 rounded bg-text-primary" /> NEXUS
          </div>
          <div className="flex items-center gap-2 font-display font-bold text-xl">
            <div className="w-6 h-6 rounded-full border-2 border-text-primary" /> QUANTUM
          </div>
          <div className="flex items-center gap-2 font-display font-bold text-xl">
            <div className="w-6 h-6 rotate-45 bg-text-primary" /> STRATOS
          </div>
          <div className="flex items-center gap-2 font-display font-bold text-xl">
            <div className="w-6 h-6 rounded-tl-lg rounded-br-lg bg-text-primary" /> VANGUARD
          </div>
          <div className="flex items-center gap-2 font-display font-bold text-xl">
            <div className="w-6 h-6 border-t-2 border-r-2 border-text-primary" /> APEX
          </div>
        </div>
      </div>
    </section>
  );
}
