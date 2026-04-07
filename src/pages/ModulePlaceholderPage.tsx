import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ModulePlaceholderPageProps {
  name: string;
  icon: React.ElementType;
  color: string;
}

export function ModulePlaceholderPage({ name, icon: Icon, color }: ModulePlaceholderPageProps) {
  const { companyName } = useOutletContext<{ companyName: string }>();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold">{name}</h1>
          <p className="text-text-secondary text-sm">Ambiente de trabalho isolado.</p>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-3xl border border-border-subtle flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="text-center relative z-10 max-w-md px-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-element-bg border border-border-subtle flex items-center justify-center mb-6 shadow-2xl">
            <Icon className={`w-10 h-10 ${color}`} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Módulo em Desenvolvimento</h2>
          <p className="text-text-secondary mb-8">
            A interface completa para o <strong>{name}</strong> está sendo carregada com os dados da {companyName}.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-full bg-element-bg border border-border-subtle hover:bg-element-hover transition-colors font-medium"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    </div>
  );
}
