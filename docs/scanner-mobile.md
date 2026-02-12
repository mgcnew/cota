# Scanner (Mobile)

## Comportamento Esperado
- O botão de scanner aparece apenas em dispositivos móveis (iOS/Android).
- Ao abrir o scanner, a aplicação tenta inicializar a câmera traseira automaticamente.
- O scanner tenta iniciar a câmera em 3 estratégias (fallback):
  - `exact-env`: exige câmera traseira (`facingMode: { exact: 'environment' }`).
  - `ideal-env`: prefere câmera traseira (`facingMode: { ideal: 'environment' }`).
  - `any`: usa qualquer câmera disponível.
- A leitura acontece em tempo real, no vídeo, com suporte a formatos comuns de códigos de barras (EAN-13/EAN-8/UPC/Code128/ITF etc.).

## Erros Tratados
- Permissão negada: mostra mensagem solicitando habilitar a câmera.
- Nenhuma câmera: mostra mensagem específica.
- Câmera em uso: orienta fechar outros apps que estejam usando a câmera.
- Timeout de inicialização (15s): mostra erro e sugere revisar permissões/HTTPS.

## Logs para Debug
- Todos os eventos relevantes são registrados no console com o prefixo `\[SCANNER\]`.
- Inclui estratégia atual, falhas de inicialização e resultados decodificados.

## Limitações Conhecidas
- Câmera no navegador normalmente exige contexto seguro: `https://` (ou `localhost`).
- Em alguns aparelhos, o foco automático pode demorar; mantenha o código estável e bem iluminado.
- Códigos 1D (EAN/UPC) podem exigir distância adequada e boa luz; se possível, aproxime até o código ocupar boa parte da área marcada.

