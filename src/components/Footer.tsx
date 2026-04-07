import { useTheme } from './ThemeProvider';

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border-subtle bg-surface/50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center mb-6">
              <img 
                src="/logo.png" 
                alt="Auto Raio X" 
                className={`h-10 w-auto transition-all ${theme === 'dark' ? 'brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : ''}`}
              />
            </div>
            <p className="text-text-secondary text-sm max-w-xs leading-relaxed">
              A plataforma definitiva para simulação e inteligência de decisão financeira corporativa.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Produto</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><a href="#" className="hover:text-text-primary transition-colors">Pricing Estratégico</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Simulador de Negócios</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Stress Test</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Integrações</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Empresa</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><a href="#" className="hover:text-text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Contato</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><a href="#" className="hover:text-text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-text-primary transition-colors">Segurança</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <p>© {new Date().getFullYear()} Auto Raio X Empresarial. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-text-primary transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-text-primary transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
