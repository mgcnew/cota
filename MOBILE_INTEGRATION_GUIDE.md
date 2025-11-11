# 🔧 Guia de Integração - Otimizações Mobile

Este guia mostra como integrar as otimizações mobile criadas nas páginas restantes.

---

## 📄 Página: WhatsApp Mensagens

### 1. Integrar Hook Mobile

```typescript
// src/pages/WhatsAppMensagens.tsx
import { useWhatsAppMobile } from '@/hooks/mobile/useWhatsAppMobile';
import { createOptimizedPreview, revokePreviewUrls } from '@/utils/imageCompression';
import { ContactListVirtualized } from '@/components/whatsapp/ContactListVirtualized';

export default function WhatsAppMensagens() {
  const isMobile = useMobile();
  const mobileConfig = useWhatsAppMobile();
  
  // Usar configurações mobile
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Limitar quantidade em mobile
    const filesToProcess = Array.from(files).slice(0, mobileConfig.maxImages);
    
    const newImages = await Promise.all(
      filesToProcess.map(async (file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        // Preview otimizado para mobile
        preview: await createOptimizedPreview(file, isMobile),
      }))
    );
    
    setImagens((prev) => [...prev, ...newImages]);
  };
  
  // Cleanup de memória
  useEffect(() => {
    return () => {
      const urls = imagens.map(img => img.preview);
      revokePreviewUrls(urls);
    };
  }, [imagens]);
  
  // Usar lista virtualizada para contatos
  return (
    <div>
      {/* ... */}
      {contatos.length > 20 ? (
        <ContactListVirtualized 
          contacts={contatos} 
          onRemove={handleRemoveContato} 
        />
      ) : (
        // Lista normal para poucos contatos
        <div>
          {contatos.map(contact => (...))}
        </div>
      )}
    </div>
  );
}
```

### Impacto Esperado
- ✅ Memória: -60% (previews comprimidos)
- ✅ Upload: 3x mais rápido
- ✅ Scroll: 60 fps com 100+ contatos

---

## 📄 Página: Configurações

### 1. Integrar Lazy Loading de Seções

```typescript
// src/pages/Configuracoes.tsx
import { lazy, Suspense } from 'react';
import { useConfigMobile } from '@/hooks/mobile/useConfigMobile';
import {
  CompanyInfoLazy,
  CompanyUsersManagerLazy,
  SuperAdminDashboardLazy,
  CorporateGroupManagerLazy,
  BillingSectionLazy,
} from '@/components/settings/SettingsSectionsLazy';

export default function Configuracoes() {
  const mobileConfig = useConfigMobile();
  
  // Renderizar seção ativa com lazy loading
  const renderSection = () => {
    switch (activeSection) {
      case 'empresa':
        return <CompanyInfoLazy />;
      case 'usuarios':
        return <CompanyUsersManagerLazy />;
      case 'grupo':
        return <CorporateGroupManagerLazy />;
      case 'superadmin':
        return <SuperAdminDashboardLazy />;
      case 'assinatura':
        return <BillingSectionLazy />;
      default:
        return <div>Seção não encontrada</div>;
    }
  };
  
  return (
    <PageWrapper>
      {/* Menu mobile como drawer se configurado */}
      {mobileConfig.useDrawerMenu ? (
        <MobileDrawerMenu 
          items={menuItems}
          activeSection={activeSection}
          onSelect={setActiveSection}
        />
      ) : (
        <DesktopSidebar />
      )}
      
      {/* Conteúdo com lazy loading */}
      <div className="flex-1">
        {renderSection()}
      </div>
    </PageWrapper>
  );
}
```

### Impacto Esperado
- ✅ Bundle inicial: -120KB
- ✅ TTI: -1.5s
- ✅ Carrega apenas seção ativa

---

## 📄 Página: Relatórios

### 1. Integrar Lazy Loading de Gráficos

```typescript
// src/pages/Relatorios.tsx
import { useRelatoriosMobile } from '@/hooks/mobile/useRelatoriosMobile';
import { PerformanceChartsLazy, InsightsPanelLazy } from '@/components/reports/ReportsChartsLazy';

export default function Relatorios() {
  const mobileConfig = useRelatoriosMobile();
  
  return (
    <PageWrapper>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="analytics">
          {/* Lazy load de gráficos apenas se habilitado */}
          {mobileConfig.enableCharts ? (
            <PerformanceChartsLazy
              metricas={metricas}
              topProdutos={topProdutos.slice(0, mobileConfig.maxDataPoints)}
              performanceFornecedores={performanceFornecedores}
              tendenciasMensais={tendenciasMensais}
            />
          ) : (
            // Visualização simplificada para mobile
            <SimplifiedMetricsView metricas={metricas} />
          )}
          
          <InsightsPanelLazy
            insights={insights}
            isGenerating={isGeneratingInsights}
            lastGenerated={lastGenerated}
            onGenerate={generateInsights}
          />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
```

### Impacto Esperado
- ✅ Bundle: -80KB (Recharts lazy)
- ✅ TTI: -2s
- ✅ Gráficos simplificados em mobile

---

## 🎨 Componente: Visualização Simplificada Mobile

```typescript
// src/components/reports/SimplifiedMetricsView.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';

interface Props {
  metricas: {
    economiaTotal: number;
    pedidosTotal: number;
    produtosTotal: number;
    tendencia: 'up' | 'down';
  };
}

export function SimplifiedMetricsView({ metricas }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Economia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {metricas.economiaTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {metricas.tendencia === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{metricas.pedidosTotal}</p>
          <p className="text-xs text-muted-foreground mt-1">Total no período</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🧪 Testes de Integração

### 1. Teste WhatsApp
```bash
# 1. Abrir página em mobile
# 2. Adicionar 5 imagens
# 3. Verificar:
#    - Previews carregam rápido
#    - Memória não explode
#    - Lista de contatos rola suave

# Comandos úteis:
# Chrome DevTools → Performance → Memory
# Antes: ~150MB
# Depois: ~60MB
```

### 2. Teste Configurações
```bash
# 1. Abrir Configurações em mobile
# 2. Navegar entre seções
# 3. Verificar:
#    - Cada seção carrega sob demanda
#    - Transições suaves
#    - Bundle inicial pequeno

# Network tab:
# Inicial: ~200KB
# Por seção: ~30-50KB
```

### 3. Teste Relatórios
```bash
# 1. Abrir Relatórios em mobile
# 2. Verificar:
#    - Gráficos não carregam (ou simplificados)
#    - Métricas carregam rápido
#    - Insights funcionam

# Performance tab:
# TTI: <3s
# FCP: <2s
```

---

## 📋 Checklist de Integração

### WhatsApp
- [ ] Integrar `useWhatsAppMobile`
- [ ] Adicionar compressão de imagens
- [ ] Usar `ContactListVirtualized` para listas grandes
- [ ] Adicionar cleanup de memória
- [ ] Testar com 10+ imagens
- [ ] Validar scroll com 100+ contatos

### Configurações
- [ ] Integrar `useConfigMobile`
- [ ] Substituir imports por lazy versions
- [ ] Adicionar drawer menu para mobile
- [ ] Testar navegação entre seções
- [ ] Validar bundle size

### Relatórios
- [ ] Integrar `useRelatoriosMobile`
- [ ] Usar lazy loading de gráficos
- [ ] Criar `SimplifiedMetricsView`
- [ ] Testar com dados reais
- [ ] Validar performance

---

## 🚀 Deploy

Após integrar todas as otimizações:

```bash
# 1. Build de produção
npm run build

# 2. Analisar bundle
npm run analyze-bundle

# 3. Verificar tamanhos
# Antes:
# - app.js: ~800KB
# - vendor.js: ~400KB

# Depois:
# - app.js: ~500KB (-37%)
# - vendor.js: ~350KB (-12%)
# - lazy chunks: ~200KB (total)

# 4. Preview
npm run preview

# 5. Testar em dispositivo real
# - Android: Chrome DevTools Remote Debugging
# - iOS: Safari Web Inspector
```

---

## 📊 Métricas Finais Esperadas

| Página | Métrica | Antes | Depois | Status |
|--------|---------|-------|--------|--------|
| Pedidos | TTI | 4.5s | 2.5s | ✅ |
| Relatórios | TTI | 5.0s | 3.0s | 🔄 |
| WhatsApp | Memória | 150MB | 60MB | 🔄 |
| Configurações | Bundle | 320KB | 200KB | 🔄 |
| **GERAL** | **FPS** | **35** | **58** | ✅ |

---

## 💡 Dicas Importantes

1. **Sempre testar em dispositivo real** - Emuladores não refletem performance real
2. **Monitorar memória** - Use Chrome DevTools Memory Profiler
3. **Validar com Lighthouse** - Score >85 para mobile
4. **Testar em 3G** - Throttling simula conexões lentas
5. **Cleanup é crucial** - Sempre revogar URLs de objetos

---

**Última atualização**: 11/11/2025  
**Próxima revisão**: Após testes em produção
