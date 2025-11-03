import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ========================================
// 1. LUCIDE REACT (já instalado)
// ========================================
import { 
  Search, 
  User, 
  Settings, 
  Heart,
  Star,
  ShoppingCart 
} from 'lucide-react';

// ========================================
// 2. REACT ICONS (recomendado - precisa instalar)
// ========================================
// npm install react-icons
// Descomente após instalar:
/*
import { 
  FaBeer, 
  FaUser, 
  FaShoppingCart,
  FaHeart,
  FaStar,
  FaHome,
  FaCog
} from 'react-icons/fa'; // Font Awesome

import { 
  MdSettings, 
  MdHome, 
  MdFavorite,
  MdStar
} from 'react-icons/md'; // Material Design

import { 
  HiOutlineUser, 
  HiOutlineHome,
  HiOutlineHeart
} from 'react-icons/hi'; // Heroicons Outline

import { 
  AiFillHeart,
  AiOutlineHeart,
  AiFillStar
} from 'react-icons/ai'; // Ant Design Icons

import { 
  IoCartOutline,
  IoCartSharp,
  IoHomeOutline
} from 'react-icons/io5'; // Ionicons 5
*/

// ========================================
// 3. @ICONIFY/REACT (já instalado)
// ========================================
import { Icon } from '@iconify/react';

// Exemplos de uso:
// <Icon icon="mdi:home" />
// <Icon icon="fa-solid:heart" />
// <Icon icon="material-symbols:settings" />
// <Icon icon="heroicons:user" />

// ========================================
// 4. HEROICONS (moderno - precisa instalar)
// ========================================
// npm install @heroicons/react
// import { 
//   HomeIcon, 
//   UserIcon, 
//   HeartIcon,
//   ShoppingCartIcon
// } from '@heroicons/react/24/outline'; // Outline
// import { 
//   HomeIcon as HomeIconSolid,
//   UserIcon as UserIconSolid
// } from '@heroicons/react/24/solid'; // Solid

// ========================================
// COMPONENTE DE EXEMPLO
// ========================================
export function IconExamples() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Exemplos de Bibliotecas de Ícones</h1>

      {/* Lucide React */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lucide React (já instalado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Search className="h-8 w-8 text-blue-500" />
              <span className="text-xs">Search</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <User className="h-8 w-8 text-green-500" />
              <span className="text-xs">User</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Settings className="h-8 w-8 text-purple-500" />
              <span className="text-xs">Settings</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-xs">Heart</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <ShoppingCart className="h-8 w-8 text-orange-500" />
              <span className="text-xs">Cart</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <code className="text-xs">
              {`import { Search, User } from 'lucide-react';`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* React Icons - Font Awesome */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="fa6-solid:home" className="h-5 w-5" />
            React Icons - Font Awesome (recomendado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Precisa instalar: <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">npm install react-icons</code>
            </p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="fa6-solid:house" className="h-8 w-8 text-blue-500" />
              <span className="text-xs">FaHome</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="fa6-solid:user" className="h-8 w-8 text-green-500" />
              <span className="text-xs">FaUser</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="fa6-solid:gear" className="h-8 w-8 text-purple-500" />
              <span className="text-xs">FaCog</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="fa6-solid:heart" className="h-8 w-8 text-red-500" />
              <span className="text-xs">FaHeart</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="fa6-solid:cart-shopping" className="h-8 w-8 text-orange-500" />
              <span className="text-xs">FaCart</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="fa6-solid:star" className="h-8 w-8 text-yellow-500" />
              <span className="text-xs">FaStar</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <code className="text-xs block mb-2">
              {`import { FaHome, FaUser } from 'react-icons/fa';`}
            </code>
            <code className="text-xs block">
              {`// Mais de 1.500 ícones do Font Awesome`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* React Icons - Material Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="material-symbols:home" className="h-5 w-5" />
            React Icons - Material Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="material-symbols:home" className="h-8 w-8 text-blue-500" />
              <span className="text-xs">MdHome</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="material-symbols:settings" className="h-8 w-8 text-purple-500" />
              <span className="text-xs">MdSettings</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="material-symbols:favorite" className="h-8 w-8 text-red-500" />
              <span className="text-xs">MdFavorite</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="material-symbols:star" className="h-8 w-8 text-yellow-500" />
              <span className="text-xs">MdStar</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <code className="text-xs">
              {`import { MdHome, MdSettings } from 'react-icons/md';`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* React Icons - Heroicons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="heroicons:home" className="h-5 w-5" />
            React Icons - Heroicons Outline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="heroicons:home" className="h-8 w-8 text-blue-500" />
              <span className="text-xs">HiOutlineHome</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="heroicons:user" className="h-8 w-8 text-green-500" />
              <span className="text-xs">HiOutlineUser</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="heroicons:heart" className="h-8 w-8 text-red-500" />
              <span className="text-xs">HiOutlineHeart</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <code className="text-xs">
              {`import { HiOutlineHome, HiOutlineUser } from 'react-icons/hi';`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* React Icons - Ant Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="ant-design:heart-filled" className="h-5 w-5" />
            React Icons - Ant Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="ant-design:heart-filled" className="h-8 w-8 text-red-500" />
              <span className="text-xs">AiFillHeart</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="ant-design:heart-outlined" className="h-8 w-8 text-red-400" />
              <span className="text-xs">AiOutlineHeart</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="ant-design:star-filled" className="h-8 w-8 text-yellow-500" />
              <span className="text-xs">AiFillStar</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <code className="text-xs">
              {`import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* React Icons - Ionicons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="ion:home-outline" className="h-5 w-5" />
            React Icons - Ionicons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="ion:home-outline" className="h-8 w-8 text-blue-500" />
              <span className="text-xs">IoHomeOutline</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="ion:cart-outline" className="h-8 w-8 text-orange-500" />
              <span className="text-xs">IoCartOutline</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="ion:cart" className="h-8 w-8 text-orange-600" />
              <span className="text-xs">IoCartSharp</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <code className="text-xs">
              {`import { IoHomeOutline, IoCartOutline } from 'react-icons/io5';`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Iconify React */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="mdi:home" className="h-5 w-5" />
            @iconify/react (já instalado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="mdi:home" className="h-8 w-8 text-blue-500" />
              <span className="text-xs">mdi:home</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="fa-solid:heart" className="h-8 w-8 text-red-500" />
              <span className="text-xs">fa-solid:heart</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="material-symbols:settings" className="h-8 w-8 text-purple-500" />
              <span className="text-xs">material-symbols:settings</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="heroicons:user" className="h-8 w-8 text-green-500" />
              <span className="text-xs">heroicons:user</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="lucide:shopping-cart" className="h-8 w-8 text-orange-500" />
              <span className="text-xs">lucide:shopping-cart</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
              <Icon icon="carbon:user-profile" className="h-8 w-8 text-indigo-500" />
              <span className="text-xs">carbon:user-profile</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <code className="text-xs block mb-2">
              {`import { Icon } from '@iconify/react';`}
            </code>
            <code className="text-xs block">
              {`// <Icon icon="mdi:home" className="h-8 w-8" />`}
            </code>
            <p className="text-xs mt-2 text-muted-foreground">
              Acesse: <a href="https://icon-sets.iconify.design/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">icon-sets.iconify.design</a> para ver todos os ícones disponíveis (200.000+)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exemplo Prático - Uso em Botão */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo Prático - Uso em Botões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Lucide React:</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                <Search className="h-4 w-4" />
                Buscar
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                <User className="h-4 w-4" />
                Usuário
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">React Icons via Iconify (Font Awesome):</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                <Icon icon="fa6-solid:cart-shopping" className="h-4 w-4" />
                Carrinho
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                <Icon icon="fa6-solid:heart" className="h-4 w-4" />
                Favorito
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Instale react-icons para usar diretamente: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npm install react-icons</code>
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Iconify React:</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                <Icon icon="mdi:home" className="h-4 w-4" />
                Início
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                <Icon icon="material-symbols:settings" className="h-4 w-4" />
                Configurações
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo e Recomendações */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardTitle>📚 Resumo e Recomendações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">✅ Já instalado no projeto:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li><strong>lucide-react</strong> - Moderna, consistente, ótima para projetos React</li>
              <li><strong>@iconify/react</strong> - Super completa (200k+ ícones), suporta múltiplas bibliotecas</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">⭐ Recomendação:</h3>
            <p className="text-sm mb-2">
              <strong>React Icons</strong> - A mais completa e fácil de usar:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Mais de 10.000 ícones em um único pacote</li>
              <li>Agrega Font Awesome, Material Design, Heroicons, Ionicons, etc.</li>
              <li>Tree-shaking automático (apenas os ícones usados são incluídos)</li>
              <li>TypeScript support nativo</li>
              <li>Fácil migração de outras bibliotecas</li>
            </ul>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <h4 className="font-semibold mb-2">Como instalar React Icons:</h4>
            <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded text-sm">
              npm install react-icons
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

