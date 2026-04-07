import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowLeft, Users, Server, FileText, DollarSign, BarChart3, TrendingUp, Briefcase, Package } from 'lucide-react';

interface PricingEstrategicoViewProps {
  userPermissions: string[];
}

export function PricingEstrategicoView({ userPermissions }: PricingEstrategicoViewProps) {
  const [view, setView] = useState<'overview' | 'new-bc'>('overview');
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!userPermissions.includes('Pricing Estratégico')) {
    return <div className="p-8 text-center text-rose-400">Acesso negado.</div>;
  }

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral - Business Cases</h2>
          <p className="text-text-secondary text-sm">Acompanhe e gerencie todos os seus Business Cases.</p>
        </div>
        <button
          onClick={() => setView('new-bc')}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Criar um Novo BC
        </button>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm mb-1">BCs Criados</div>
            <div className="text-2xl font-display font-bold">12</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm mb-1">Margem Estimada Média</div>
            <div className="text-2xl font-display font-bold">24.5%</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-sm mb-1">Receita Estimada Total</div>
            <div className="text-2xl font-display font-bold">R$ 4.5M</div>
          </div>
        </div>
      </div>

      {/* Lista de BCs (Mock) */}
      <div className="glass-panel p-6 rounded-xl border border-border-subtle">
        <h3 className="text-lg font-bold mb-4">Business Cases Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-element-bg border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Nome do Produto</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Margem</th>
                <th className="px-4 py-3 font-medium text-right">Receita Est.</th>
                <th className="px-4 py-3 font-medium text-center">Data</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-subtle hover:bg-element-hover/50 transition-colors">
                <td className="px-4 py-3 font-medium">Produto Alpha</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500">Aprovado</span></td>
                <td className="px-4 py-3 text-right">28%</td>
                <td className="px-4 py-3 text-right">R$ 1.2M</td>
                <td className="px-4 py-3 text-center text-text-secondary">01/04/2026</td>
              </tr>
              <tr className="border-b border-border-subtle hover:bg-element-hover/50 transition-colors">
                <td className="px-4 py-3 font-medium">Serviço Beta</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500">Em Análise</span></td>
                <td className="px-4 py-3 text-right">18%</td>
                <td className="px-4 py-3 text-right">R$ 800k</td>
                <td className="px-4 py-3 text-center text-text-secondary">28/03/2026</td>
              </tr>
              <tr className="border-b border-border-subtle hover:bg-element-hover/50 transition-colors">
                <td className="px-4 py-3 font-medium">Plataforma Gamma</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500">Em Construção</span></td>
                <td className="px-4 py-3 text-right">--</td>
                <td className="px-4 py-3 text-right">--</td>
                <td className="px-4 py-3 text-center text-text-secondary">05/04/2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  const renderNewBC = () => {
    const steps = [
      { id: 1, name: 'Produto', icon: Package },
      { id: 2, name: 'Recursos (MOE e MOI)', icon: Users },
      { id: 3, name: 'Infraestrutura (TI)', icon: Server },
      { id: 4, name: 'DAF', icon: FileText },
      { id: 5, name: 'Investimento', icon: DollarSign },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('overview')}
            className="p-2 rounded-xl bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Novo Business Case</h2>
            <p className="text-text-secondary text-sm">Preencha as informações para construir o Business Case.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="glass-panel p-4 rounded-xl border border-border-subtle">
          <div className="flex flex-wrap md:flex-nowrap justify-between gap-2">
            {steps.map((step) => {
              const isActive = activeStep === step.id;
              const isPast = activeStep > step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center md:justify-start ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : isPast 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-element-bg text-text-secondary hover:bg-element-hover'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{step.name}</span>
                  <span className="md:hidden">{step.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="glass-panel p-6 rounded-xl border border-border-subtle min-h-[400px]">
          {activeStep === 1 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Produto</h3>
              <p className="text-text-secondary text-sm mb-6">Defina as informações gerais do produto.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de Produto em construção...
              </div>
            </div>
          )}
          {activeStep === 2 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Recursos (MOE e MOI)</h3>
              <p className="text-text-secondary text-sm mb-6">Defina a mão de obra estratégica e indireta necessária para este produto.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de Recursos em construção...
              </div>
            </div>
          )}
          {activeStep === 3 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Infraestrutura (TI)</h3>
              <p className="text-text-secondary text-sm mb-6">Especifique os custos de infraestrutura e tecnologia.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de Infraestrutura em construção...
              </div>
            </div>
          )}
          {activeStep === 4 && (
            <div>
              <h3 className="text-lg font-bold mb-4">DAF (Despesa atrelada ao Faturamento)</h3>
              <p className="text-text-secondary text-sm mb-6">Configure as despesas que variam de acordo com o faturamento.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de DAF em construção...
              </div>
            </div>
          )}
          {activeStep === 5 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Investimento</h3>
              <p className="text-text-secondary text-sm mb-6">Determine o valor de investimento inicial para construir o produto.</p>
              <div className="p-8 border border-border-subtle border-dashed rounded-xl flex items-center justify-center text-text-secondary bg-element-bg/50">
                Formulário de Investimento em construção...
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="px-4 py-2 bg-element-bg border border-border-subtle rounded-xl text-sm font-medium hover:bg-element-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => {
              if (activeStep < 5) {
                setActiveStep(prev => prev + 1);
              } else {
                // Save logic here
                alert('Business Case salvo com sucesso!');
                setView('overview');
              }
            }}
            className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            {activeStep === 5 ? 'Concluir e Salvar' : 'Próximo'}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {view === 'overview' ? renderOverview() : renderNewBC()}
      </AnimatePresence>
    </div>
  );
}
