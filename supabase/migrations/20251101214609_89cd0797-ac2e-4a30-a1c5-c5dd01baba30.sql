-- Adicionar campo data_planejada na tabela quotes
ALTER TABLE quotes ADD COLUMN data_planejada timestamptz;

-- Criar índices para performance
CREATE INDEX idx_quotes_data_planejada ON quotes(data_planejada);
CREATE INDEX idx_quotes_status_data_planejada ON quotes(status, data_planejada);