import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { 
  LayoutDashboard,
  Package, 
  Building2, 
  FileText, 
  ShoppingCart, 
  History, 
  BarChart3, 
  TrendingUp,
  Star,
  // Alternativas
  Home,
  Box,
  Users,
  ClipboardList,
  ShoppingBag,
  Clock,
  FileBarChart,
  LineChart
} from 'lucide-react';

// ========================================
// RECOMENDAÇÕES DE ÍCONES PARA SIDEBAR
// ========================================

interface IconOption {
  name: string;
  library: 'lucide' | 'iconify';
  icon: any; // Component ou string
  example: string;
  style: 'outline' | 'filled';
  description: string;
}

interface MenuItemRecommendations {
  title: string;
  current: string;
  options: IconOption[];
  recommended: IconOption;
}

const recommendations: MenuItemRecommendations[] = [
  {
    title: "Dashboard",
    current: "fluent:home-32-filled",
    recommended: {
      name: "LayoutDashboard (Lucide)",
      library: 'lucide',
      icon: LayoutDashboard,
      example: "LayoutDashboard",
      style: 'outline',
      description: "Ícone específico para dashboard, mais adequado que 'home'"
    },
    options: [
      {
        name: "LayoutDashboard (Lucide)",
        library: 'lucide',
        icon: LayoutDashboard,
        example: "LayoutDashboard",
        style: 'outline',
        description: "✅ Recomendado - Específico para dashboard"
      },
      {
        name: "Home (Lucide)",
        library: 'lucide',
        icon: Home,
        example: "Home",
        style: 'outline',
        description: "Alternativa simples e direta"
      },
      {
        name: "mdi:view-dashboard (Iconify)",
        library: 'iconify',
        icon: "mdi:view-dashboard",
        example: "mdi:view-dashboard",
        style: 'filled',
        description: "Material Design - estilo preenchido"
      },
      {
        name: "heroicons:home-modern (Iconify)",
        library: 'iconify',
        icon: "heroicons:home-modern",
        example: "heroicons:home-modern",
        style: 'filled',
        description: "Heroicons moderno"
      }
    ]
  },
  {
    title: "Produtos",
    current: "fluent:box-32-filled",
    recommended: {
      name: "Package (Lucide)",
      library: 'lucide',
      icon: Package,
      example: "Package",
      style: 'outline',
      description: "✅ Recomendado - Ícone clássico para produtos/embalagens"
    },
    options: [
      {
        name: "Package (Lucide)",
        library: 'lucide',
        icon: Package,
        example: "Package",
        style: 'outline',
        description: "✅ Recomendado - Clássico para produtos"
      },
      {
        name: "Box (Lucide)",
        library: 'lucide',
        icon: Box,
        example: "Box",
        style: 'outline',
        description: "Alternativa minimalista"
      },
      {
        name: "mdi:package-variant (Iconify)",
        library: 'iconify',
        icon: "mdi:package-variant",
        example: "mdi:package-variant",
        style: 'filled',
        description: "Material Design - estilo preenchido"
      },
      {
        name: "heroicons:cube (Iconify)",
        library: 'iconify',
        icon: "heroicons:cube",
        example: "heroicons:cube",
        style: 'filled',
        description: "Heroicons - estilo moderno"
      }
    ]
  },
  {
    title: "Fornecedores",
    current: "fluent:building-32-filled",
    recommended: {
      name: "Building2 (Lucide)",
      library: 'lucide',
      icon: Building2,
      example: "Building2",
      style: 'outline',
      description: "✅ Recomendado - Representa empresa/fornecedor"
    },
    options: [
      {
        name: "Building2 (Lucide)",
        library: 'lucide',
        icon: Building2,
        example: "Building2",
        style: 'outline',
        description: "✅ Recomendado - Representa empresa"
      },
      {
        name: "Users (Lucide)",
        library: 'lucide',
        icon: Users,
        example: "Users",
        style: 'outline',
        description: "Alternativa focada em pessoas/contatos"
      },
      {
        name: "mdi:office-building (Iconify)",
        library: 'iconify',
        icon: "mdi:office-building",
        example: "mdi:office-building",
        style: 'filled',
        description: "Material Design - estilo preenchido"
      },
      {
        name: "heroicons:building-office (Iconify)",
        library: 'iconify',
        icon: "heroicons:building-office",
        example: "heroicons:building-office",
        style: 'filled',
        description: "Heroicons - estilo moderno"
      }
    ]
  },
  {
    title: "Cotações",
    current: "fluent:document-text-32-filled",
    recommended: {
      name: "FileText (Lucide)",
      library: 'lucide',
      icon: FileText,
      example: "FileText",
      style: 'outline',
      description: "✅ Recomendado - Representa documentos/cotações"
    },
    options: [
      {
        name: "FileText (Lucide)",
        library: 'lucide',
        icon: FileText,
        example: "FileText",
        style: 'outline',
        description: "✅ Recomendado - Documento com texto"
      },
      {
        name: "ClipboardList (Lucide)",
        library: 'lucide',
        icon: ClipboardList,
        example: "ClipboardList",
        style: 'outline',
        description: "Alternativa - prancheta com lista"
      },
      {
        name: "mdi:file-document-edit (Iconify)",
        library: 'iconify',
        icon: "mdi:file-document-edit",
        example: "mdi:file-document-edit",
        style: 'filled',
        description: "Material Design - documento editável"
      },
      {
        name: "heroicons:document-text (Iconify)",
        library: 'iconify',
        icon: "heroicons:document-text",
        example: "heroicons:document-text",
        style: 'filled',
        description: "Heroicons - estilo moderno"
      }
    ]
  },
  {
    title: "Pedidos",
    current: "fluent:shopping-bag-32-filled",
    recommended: {
      name: "ShoppingCart (Lucide)",
      library: 'lucide',
      icon: ShoppingCart,
      example: "ShoppingCart",
      style: 'outline',
      description: "✅ Recomendado - Carrinho clássico para pedidos"
    },
    options: [
      {
        name: "ShoppingCart (Lucide)",
        library: 'lucide',
        icon: ShoppingCart,
        example: "ShoppingCart",
        style: 'outline',
        description: "✅ Recomendado - Carrinho de compras"
      },
      {
        name: "ShoppingBag (Lucide)",
        library: 'lucide',
        icon: ShoppingBag,
        example: "ShoppingBag",
        style: 'outline',
        description: "Alternativa - sacola de compras"
      },
      {
        name: "mdi:cart (Iconify)",
        library: 'iconify',
        icon: "mdi:cart",
        example: "mdi:cart",
        style: 'filled',
        description: "Material Design - estilo preenchido"
      },
      {
        name: "heroicons:shopping-cart (Iconify)",
        library: 'iconify',
        icon: "heroicons:shopping-cart",
        example: "heroicons:shopping-cart",
        style: 'filled',
        description: "Heroicons - estilo moderno"
      }
    ]
  },
  {
    title: "Histórico",
    current: "fluent:history-32-filled",
    recommended: {
      name: "History (Lucide)",
      library: 'lucide',
      icon: History,
      example: "History",
      style: 'outline',
      description: "✅ Recomendado - Relógio com seta circular"
    },
    options: [
      {
        name: "History (Lucide)",
        library: 'lucide',
        icon: History,
        example: "History",
        style: 'outline',
        description: "✅ Recomendado - Relógio histórico"
      },
      {
        name: "Clock (Lucide)",
        library: 'lucide',
        icon: Clock,
        example: "Clock",
        style: 'outline',
        description: "Alternativa - relógio simples"
      },
      {
        name: "mdi:history (Iconify)",
        library: 'iconify',
        icon: "mdi:history",
        example: "mdi:history",
        style: 'filled',
        description: "Material Design - estilo preenchido"
      },
      {
        name: "heroicons:clock (Iconify)",
        library: 'iconify',
        icon: "heroicons:clock",
        example: "heroicons:clock",
        style: 'filled',
        description: "Heroicons - estilo moderno"
      }
    ]
  },
  {
    title: "Relatórios",
    current: "fluent:data-bar-vertical-32-filled",
    recommended: {
      name: "BarChart3 (Lucide)",
      library: 'lucide',
      icon: BarChart3,
      example: "BarChart3",
      style: 'outline',
      description: "✅ Recomendado - Gráfico de barras"
    },
    options: [
      {
        name: "BarChart3 (Lucide)",
        library: 'lucide',
        icon: BarChart3,
        example: "BarChart3",
        style: 'outline',
        description: "✅ Recomendado - Gráfico de barras"
      },
      {
        name: "FileBarChart (Lucide)",
        library: 'lucide',
        icon: FileBarChart,
        example: "FileBarChart",
        style: 'outline',
        description: "Alternativa - documento com gráfico"
      },
      {
        name: "mdi:chart-bar (Iconify)",
        library: 'iconify',
        icon: "mdi:chart-bar",
        example: "mdi:chart-bar",
        style: 'filled',
        description: "Material Design - estilo preenchido"
      },
      {
        name: "heroicons:chart-bar (Iconify)",
        library: 'iconify',
        icon: "heroicons:chart-bar",
        example: "heroicons:chart-bar",
        style: 'filled',
        description: "Heroicons - estilo moderno"
      }
    ]
  },
  {
    title: "Analytics",
    current: "fluent:data-trending-32-filled",
    recommended: {
      name: "TrendingUp (Lucide)",
      library: 'lucide',
      icon: TrendingUp,
      example: "TrendingUp",
      style: 'outline',
      description: "✅ Recomendado - Tendência/crescimento"
    },
    options: [
      {
        name: "TrendingUp (Lucide)",
        library: 'lucide',
        icon: TrendingUp,
        example: "TrendingUp",
        style: 'outline',
        description: "✅ Recomendado - Análise de tendências"
      },
      {
        name: "LineChart (Lucide)",
        library: 'lucide',
        icon: LineChart,
        example: "LineChart",
        style: 'outline',
        description: "Alternativa - gráfico de linha"
      },
      {
        name: "mdi:chart-line (Iconify)",
        library: 'iconify',
        icon: "mdi:chart-line",
        example: "mdi:chart-line",
        style: 'filled',
        description: "Material Design - gráfico de linha"
      },
      {
        name: "heroicons:chart-bar-square (Iconify)",
        library: 'iconify',
        icon: "heroicons:chart-bar-square",
        example: "heroicons:chart-bar-square",
        style: 'filled',
        description: "Heroicons - estilo moderno"
      }
    ]
  },
  {
    title: "Extra",
    current: "fluent:star-32-filled",
    recommended: {
      name: "Star (Lucide)",
      library: 'lucide',
      icon: Star,
      example: "Star",
      style: 'outline',
      description: "✅ Recomendado - Estrela para funcionalidades extras"
    },
    options: [
      {
        name: "Star (Lucide)",
        library: 'lucide',
        icon: Star,
        example: "Star",
        style: 'outline',
        description: "✅ Recomendado - Simples e direto"
      },
      {
        name: "mdi:star (Iconify)",
        library: 'iconify',
        icon: "mdi:star",
        example: "mdi:star",
        style: 'filled',
        description: "Material Design - estilo preenchido"
      },
      {
        name: "heroicons:star (Iconify)",
        library: 'iconify',
        icon: "heroicons:star",
        example: "heroicons:star",
        style: 'filled',
        description: "Heroicons - estilo moderno"
      }
    ]
  }
];

export function SidebarIconRecommendations() {
  return (
    <div className="p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recomendações de Ícones para Sidebar</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sugestões usando <strong>Lucide React</strong> e <strong>@iconify/react</strong>
        </p>
      </div>

      {recommendations.map((item, index) => (
        <Card key={item.title}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-500">{index + 1}</span>
                <span>{item.title}</span>
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Atual: {item.current}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recomendação Principal */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-blue-500 text-white">⭐ Recomendado</Badge>
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  {item.recommended.name}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  {item.recommended.library === 'lucide' ? (
                    <item.recommended.icon className="h-8 w-8 text-white" />
                  ) : (
                    <Icon icon={item.recommended.icon} className="h-8 w-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {item.recommended.description}
                  </p>
                  <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                    {item.recommended.library === 'lucide' 
                      ? `import { ${item.recommended.example} } from 'lucide-react';`
                      : `<Icon icon="${item.recommended.example}" />`
                    }
                  </code>
                </div>
              </div>
            </div>

            {/* Outras Opções */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">
                Outras Opções:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 shrink-0">
                      {option.library === 'lucide' ? (
                        <option.icon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                      ) : (
                        <Icon icon={option.icon} className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {option.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {option.library}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                      <code className="text-[10px] bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded mt-1 block">
                        {option.library === 'lucide' 
                          ? `import { ${option.example} } from 'lucide-react';`
                          : `icon="${option.example}"`
                        }
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Resumo e Recomendação Final */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Recomendação Final
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">🎯 Minha Recomendação:</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Usar <strong>Lucide React</strong> para todos os ícones da sidebar pelos seguintes motivos:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300 ml-4">
              <li>✅ <strong>Consistência:</strong> Todos os ícones no mesmo estilo (outline moderno)</li>
              <li>✅ <strong>Performance:</strong> Tree-shaking automático, apenas ícones usados</li>
              <li>✅ <strong>TypeScript:</strong> Suporte nativo completo</li>
              <li>✅ <strong>Tamanho:</strong> Biblioteca leve e otimizada</li>
              <li>✅ <strong>Manutenção:</strong> Fácil de atualizar e substituir</li>
              <li>✅ <strong>Visual:</strong> Design moderno e minimalista, perfeito para interfaces premium</li>
            </ul>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-3 text-sm">📋 Código Recomendado:</h4>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
{`const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
  { title: "Cotações", url: "/cotacoes", icon: FileText },
  { title: "Pedidos", url: "/pedidos", icon: ShoppingCart },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Extra", url: "/extra", icon: Star },
];`}
            </pre>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-blue-500">Lucide React</Badge>
            <Badge variant="outline">Consistente</Badge>
            <Badge variant="outline">Performance</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">Moderno</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

