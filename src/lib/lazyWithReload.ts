import { lazy, ComponentType, LazyExoticComponent } from "react";

/**
 * Wrapper para React.lazy que recarrega a página automaticamente quando um
 * chunk falha ao carregar.
 *
 * Por quê: a cada deploy o Vite gera novos arquivos com hash novo e remove os
 * antigos do servidor. Usuários com a página aberta ou com o index.html em
 * cache tentam baixar o chunk antigo (que não existe mais) → erro de import →
 * "Algo deu errado". Isso era crítico no portal público do fornecedor, onde
 * não dá para pedir que recarreguem manualmente.
 *
 * Solução: ao detectar a falha de import (sinal de versão nova publicada),
 * recarrega a página UMA vez para buscar o index.html novo e os chunks atuais.
 * Um guard em sessionStorage evita loop infinito caso a falha seja real.
 */
export function lazyWithReload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  key: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const guardKey = `chunk-reload:${key}`;
    try {
      const mod = await factory();
      sessionStorage.removeItem(guardKey); // sucesso: limpa o guard
      return mod;
    } catch (err) {
      // Já tentou recarregar antes? Então é falha real — propaga para a ErrorBoundary.
      if (sessionStorage.getItem(guardKey)) {
        throw err;
      }
      sessionStorage.setItem(guardKey, "1");
      window.location.reload();
      // Mantém o Suspense pendurado enquanto a página recarrega
      return new Promise<{ default: T }>(() => {});
    }
  });
}
