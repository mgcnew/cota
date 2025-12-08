import { memo } from "react";
import { Link } from "react-router-dom";

const FooterSection = memo(function FooterSection() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="font-bold">Cotaja</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sistema completo de gestão de cotações e compras
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Produto</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Preços</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">Começar Grátis</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Suporte</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentação</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Termos</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center text-xs sm:text-sm text-muted-foreground">
          © 2024 Cotaja. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
});

export default FooterSection;
