import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Link } from 'react-router-dom';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-primary">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            Auto Raio X <span className="text-blue-500">Empresarial</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#solucoes" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Soluções</a>
          <a href="#como-funciona" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Como Funciona</a>
          <a href="#modulos" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Módulos</a>
          
          <button onClick={toggleTheme} className="p-2 rounded-full bg-element-bg hover:bg-element-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-all">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link to="/login" className="px-5 py-2.5 rounded-full bg-element-bg hover:bg-element-hover border border-border-subtle text-sm font-medium transition-all">
            Login
          </Link>
          <Link to="/signup" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all">
            Simular Agora
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-element-bg text-text-secondary">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="text-text-secondary" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </nav>
  );
}
