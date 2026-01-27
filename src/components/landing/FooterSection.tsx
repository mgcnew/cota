import { memo } from "react";
import { Link } from "react-router-dom";

const FooterSection = memo(function FooterSection() {
  return (
    <footer className="border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-zinc-950 font-bold">
                C
              </div>
              <span className="font-extrabold text-xl tracking-tight">CotaJá</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xs font-medium leading-relaxed">
              Plataforma interna de alto desempenho para gestão estratégica de cotações e compras.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-zinc-900 dark:text-white">Acesso</h3>
            <ul className="space-y-3 text-zinc-500 dark:text-zinc-400 font-medium">
              <li><Link to="/auth?mode=login" className="hover:text-brand transition-colors">Entrar no Sistema</Link></li>
              <li><Link to="/auth?mode=login" className="hover:text-brand transition-colors">Suporte Interno</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-zinc-900 dark:text-white">Legal</h3>
            <ul className="space-y-3 text-zinc-500 dark:text-zinc-400 font-medium">
              <li><a href="#" className="hover:text-brand transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Termos de Uso</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-400 text-sm font-medium">
          <p>© {new Date().getFullYear()} CotaJá. Sistema de Uso Restrito.</p>
          <div className="flex gap-6">
            <span className="text-brand font-bold">● V.2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default FooterSection;
