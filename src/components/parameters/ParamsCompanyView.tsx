import React from 'react';
import { motion } from 'motion/react';
import { Building, Percent, Calculator } from 'lucide-react';

export function ParamsCompanyView({ userPermissions }: { userPermissions: string[] }) {
  if (!userPermissions.includes('Parâmetros - Empresa')) {
    return <div className="p-8 text-center text-rose-400">Acesso negado.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-2xl border border-border-subtle max-w-3xl"
    >
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building className="w-4 h-4 text-primary" />
        </div>
        Parâmetros da Empresa
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Margem Operacional (%)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Percent className="h-4 w-4 text-text-secondary" />
            </div>
            <input 
              type="number" 
              className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
              placeholder="Ex: 15" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Margem EBITDA (%)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Percent className="h-4 w-4 text-text-secondary" />
            </div>
            <input 
              type="number" 
              className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
              placeholder="Ex: 20" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Taxa de RH por Cargo (%)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Calculator className="h-4 w-4 text-text-secondary" />
            </div>
            <input 
              type="number" 
              className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
              placeholder="Ex: 5" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Impostos (%)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Percent className="h-4 w-4 text-text-secondary" />
            </div>
            <input 
              type="number" 
              className="w-full bg-element-bg border border-border-subtle rounded-xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
              placeholder="Ex: 12.5" 
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border-subtle flex justify-end">
        <button className="px-6 py-2.5 rounded-xl bg-primary text-background font-bold hover:opacity-90 transition-all">
          Salvar Parâmetros
        </button>
      </div>
    </motion.div>
  );
}
