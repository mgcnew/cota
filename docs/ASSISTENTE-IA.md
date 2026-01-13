# Assistente de IA - Configuração

O sistema possui um assistente de IA especializado em cotações que pode responder perguntas sobre:
- Produtos e preços
- Fornecedores e histórico
- Cotações e pedidos
- Análises e comparações

## Como Configurar

### 1. Obter Chave da API Groq (Gratuito)

1. Acesse: https://console.groq.com
2. Crie uma conta gratuita
3. Vá em "API Keys"
4. Clique em "Create API Key"
5. Copie a chave gerada

### 2. Configurar no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione a linha:
```
VITE_GROQ_API_KEY=sua_chave_aqui
```
3. Salve o arquivo
4. Reinicie o servidor de desenvolvimento

### 3. Usar o Assistente

- Pressione `Ctrl+K` (ou `⌘K` no Mac) para abrir
- Ou clique na barra de busca com ícone de estrela ✨
- Faça perguntas em linguagem natural

## Exemplos de Perguntas

- "Quantos pedidos fizemos com a Holambra?"
- "Qual o menor preço do arroz?"
- "Mostre produtos com preço acima de R$50"
- "Quais fornecedores têm melhor taxa de entrega?"
- "Quantas cotações ativas temos?"
- "Qual fornecedor tem o melhor preço médio?"

## Limites Gratuitos

- **Groq**: 14.400 requisições por dia
- Velocidade: Muito rápida (inferência otimizada)
- Modelos: Llama 3.1 70B (muito preciso)

## Privacidade

- Os dados são enviados para a API do Groq apenas durante a consulta
- Nenhum dado é armazenado permanentemente pela Groq
- A API é usada apenas para processar a pergunta e retornar a resposta
