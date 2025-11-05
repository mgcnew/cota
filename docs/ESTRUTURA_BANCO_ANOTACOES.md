# Estrutura do Banco de Dados - Anotações

## Tabela: `notes`

Esta tabela armazena as anotações estilo post-it dos usuários.

### Campos

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  importance VARCHAR(20) NOT NULL CHECK (importance IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  observation TEXT CHECK (char_length(observation) <= 500),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT notes_company_user_idx UNIQUE NULLS NOT DISTINCT (company_id, user_id)
);

-- Índices
CREATE INDEX idx_notes_company_id ON notes(company_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_resolved ON notes(resolved);
CREATE INDEX idx_notes_importance ON notes(importance);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
```

### Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias anotações dentro de sua empresa
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem criar anotações em sua empresa
CREATE POLICY "Users can create notes in their company"
  ON notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem atualizar suas próprias anotações
CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Política: Usuários podem deletar suas próprias anotações
CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );
```

### Trigger para atualizar `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();
```

### Comentários nas colunas

```sql
COMMENT ON TABLE notes IS 'Armazena anotações estilo post-it dos usuários';
COMMENT ON COLUMN notes.importance IS 'Nível de importância: low (baixa), medium (média), high (alta), urgent (urgente)';
COMMENT ON COLUMN notes.resolved IS 'Indica se a anotação foi resolvida/concluída';
COMMENT ON COLUMN notes.observation IS 'Observação adicional opcional para a anotação';
```

## Migração SQL Completa

Crie um arquivo de migração com o nome: `YYYYMMDDHHMMSS_create_notes_table.sql`

```sql
-- Criar tabela notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  importance VARCHAR(20) NOT NULL CHECK (importance IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  observation TEXT CHECK (char_length(observation) <= 500),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_notes_company_id ON notes(company_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_resolved ON notes(resolved);
CREATE INDEX IF NOT EXISTS idx_notes_importance ON notes(importance);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Habilitar RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes in their company"
  ON notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (
    auth.uid() = user_id 
    AND company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- Comentários
COMMENT ON TABLE notes IS 'Armazena anotações estilo post-it dos usuários';
COMMENT ON COLUMN notes.importance IS 'Nível de importância: low (baixa), medium (média), high (alta), urgent (urgente)';
COMMENT ON COLUMN notes.resolved IS 'Indica se a anotação foi resolvida/concluída';
COMMENT ON COLUMN notes.observation IS 'Observação adicional opcional para a anotação';
```

## Próximos Passos

Após criar a tabela no banco de dados:

1. Criar hook `useNotes.ts` para gerenciar as operações CRUD
2. Conectar a página `Anotacoes.tsx` com o hook
3. Atualizar os estados locais para usar dados do Supabase

