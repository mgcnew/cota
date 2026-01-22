import { useEffect, useState } from 'react';

export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Verificar suporte à API
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      
      // Calcula a diferença entre a altura da janela e a viewport visual
      // No iOS, quando o teclado abre, a visualViewport diminui, mas a window.innerHeight mantém
      const currentOffset = window.innerHeight - window.visualViewport.height;
      
      // Só consideramos offset positivo (teclado aberto)
      // Pequenas variações (< 10px) podem ser barras de navegação, ignoramos
      setOffset(currentOffset > 10 ? currentOffset : 0);
    };

    // Ouvir eventos de redimensionamento e scroll da viewport visual
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    // Chamada inicial
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return offset;
}