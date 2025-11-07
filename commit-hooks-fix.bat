@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: corrige ordem dos hooks no MobileProductsList para resolver erro 'Rendered more hooks than during the previous render'

- Move todos os hooks (useRef, useState, useEffect, useMemo, useCallback) para antes de qualquer return antecipado
- Corrige useMemo de visibleItems que estava sendo chamado condicionalmente
- Garante que todos os hooks sejam sempre chamados na mesma ordem
- Corrige useServerPagination para usar useState com função inicializadora para isMobile
- Melhora estrutura do router Produtos.tsx para garantir ordem consistente de hooks"
git push
pause

