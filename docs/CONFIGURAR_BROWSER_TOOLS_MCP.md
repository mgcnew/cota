# Como Configurar o MCP Browser-Tools no Cursor

## O que é o Browser-Tools MCP?

O Browser-Tools MCP é uma ferramenta que permite ao Cursor interagir com navegadores web, abrindo URLs, capturando screenshots, e automatizando tarefas relacionadas ao navegador.

## Passo a Passo para Configurar

### 1. Verificar se o Browser-Tools está Instalado

O Browser-Tools MCP geralmente é instalado através do Node.js/npm. Verifique se você tem:

```bash
npm list -g @modelcontextprotocol/server-browser-tools
```

Se não estiver instalado, instale globalmente:

```bash
npm install -g @modelcontextprotocol/server-browser-tools
```

### 2. Configurar no Cursor

O Cursor configura MCPs através de um arquivo de configuração. Existem duas formas:

#### Opção A: Configuração via Interface do Cursor

1. Abra o Cursor
2. Vá em **File > Preferences > Settings** (ou `Ctrl+,`)
3. Procure por "MCP" ou "Model Context Protocol"
4. Adicione a configuração do browser-tools

#### Opção B: Configuração via Arquivo de Configuração

O arquivo de configuração do Cursor geralmente fica em:

**Windows:**
```
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

Ou pode estar em:
```
%USERPROFILE%\.cursor\mcp.json
```

Adicione a seguinte configuração:

```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-browser-tools"
      ],
      "env": {
        "BROWSER_TOOLS_HEADLESS": "false"
      }
    }
  }
}
```

### 3. Configuração Alternativa (se usar arquivo local)

Se preferir usar um arquivo local no projeto, crie um arquivo `.cursor/mcp.json` na raiz do projeto:

```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-browser-tools"
      ],
      "env": {
        "BROWSER_TOOLS_HEADLESS": "false"
      }
    }
  }
}
```

### 4. Reiniciar o Cursor

Após configurar, **reinicie o Cursor** para que as mudanças tenham efeito.

### 5. Verificar se Funcionou

Após reiniciar, você pode testar o browser-tools pedindo ao Cursor para:
- Abrir uma URL específica
- Capturar um screenshot de uma página
- Navegar para o seu projeto local

## Exemplo de Uso

Após configurado, você pode pedir:

```
"Abra o projeto no navegador em http://localhost:8080"
```

Ou:

```
"Capture um screenshot da página de login"
```

## Troubleshooting

### Erro: "MCP server not found"
- Verifique se o npm está instalado corretamente
- Tente instalar localmente: `npm install @modelcontextprotocol/server-browser-tools`

### Erro: "Command not found"
- Certifique-se de que o Node.js e npm estão no PATH
- Use o caminho completo do npx se necessário

### Browser não abre
- Verifique se a variável `BROWSER_TOOLS_HEADLESS` está como `"false"`
- Verifique se há algum firewall bloqueando

## Configuração para o Projeto Cotaja

Para abrir especificamente o projeto Cotaja:

1. Certifique-se de que o servidor de desenvolvimento está rodando:
   ```bash
   cd cotaja
   npm run dev
   ```

2. Peça ao Cursor para abrir:
   ```
   "Abra http://localhost:8080 no navegador usando o browser-tools"
   ```

## Notas Importantes

- O Browser-Tools precisa de um navegador instalado (Chrome, Firefox, ou Edge)
- A primeira execução pode demorar um pouco enquanto o MCP baixa dependências
- Algumas funcionalidades podem precisar de permissões específicas do sistema



