import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Package, 
  Save, 
  Upload, 
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Loader2,
  Building2,
  ClipboardList,
  DollarSign,
  Tags
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { capitalize } from "@/lib/text-utils";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  barcode?: string;
  image_url?: string;
  lastQuotePrice: string;
  bestSupplier: string;
  quotesCount: number;
  lastUpdate: string;
  trend: "up" | "down" | "stable";
}

interface ProductEditViewProps {
  product: Product;
  onBack: () => void;
  onEdit: (productId: string, data: Partial<Product>) => void;
  categories: string[];
  onCategoryAdded?: (category: string) => void;
  isUpdating?: boolean;
}

export default function ProductEditView({
  product,
  onBack,
  onEdit,
  categories,
  onCategoryAdded,
  isUpdating = false
}: ProductEditViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("detalhes");
  const [editedProduct, setEditedProduct] = useState(product);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${product.id}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setEditedProduct({ ...editedProduct, image_url: publicUrl });
      
      toast({
        title: "Imagem carregada!",
        description: "A nova imagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = () => {
    if (!editedProduct.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O produto precisa ter um nome.",
        variant: "destructive",
      });
      return;
    }

    if (!editedProduct.category.trim()) {
      toast({
        title: "Categoria obrigatória",
        description: "O produto precisa ter uma categoria.",
        variant: "destructive",
      });
      return;
    }

    let finalCategory = editedProduct.category;
    if (editedProduct.category === "nova") {
      if (!newCategory.trim()) {
        toast({
          title: "Nome da categoria obrigatório",
          description: "Digite o nome da nova categoria.",
          variant: "destructive",
        });
        return;
      }
      finalCategory = newCategory.trim();
      if (onCategoryAdded) {
        onCategoryAdded(finalCategory);
      }
    }

    onEdit(product.id, {
      ...editedProduct,
      category: finalCategory,
      lastUpdate: new Date().toLocaleDateString('pt-BR')
    });
  };

  const availableCategories = categories.filter(cat => cat !== "all");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-lg border shadow-sm"
    >
      {/* Header */}
      <div className="border-b bg-muted/50 px-6 py-4 flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {product.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Editar produto
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isUpdating} size="sm">
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="detalhes" className="gap-2">
              <Package className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="space-y-6">
            {/* Image */}
            {(editedProduct.image_url || isUploadingImage) && (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/20 shadow-md relative group">
                    {isUploadingImage ? (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      </div>
                    ) : (
                      <>
                        <img 
                          src={editedProduct.image_url} 
                          alt={editedProduct.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditedProduct({ ...editedProduct, image_url: undefined })}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingImage}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Trocar Imagem
                      </span>
                    </Button>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            )}

            {/* Form Fields */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input
                    id="name"
                    value={editedProduct.name}
                    onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                    placeholder="Ex: Coxa com Sobrecoxa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={editedProduct.category}
                    onValueChange={(value) => {
                      setEditedProduct({ ...editedProduct, category: value });
                      setShowNewCategory(value === "nova");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {capitalize(cat)}
                        </SelectItem>
                      ))}
                      <SelectItem value="nova" className="text-primary font-medium">
                        + Adicionar nova categoria
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showNewCategory && (
                  <div className="space-y-2">
                    <Label htmlFor="newCategory">Nome da Nova Categoria</Label>
                    <Input
                      id="newCategory"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Ex: Peixes, Laticínios"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade de Medida</Label>
                  <Select
                    value={editedProduct.unit}
                    onValueChange={(value) => setEditedProduct({ ...editedProduct, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                      <SelectItem value="kg">Quilograma (kg)</SelectItem>
                      <SelectItem value="g">Grama (g)</SelectItem>
                      <SelectItem value="lt">Litro (lt)</SelectItem>
                      <SelectItem value="ml">Mililitro (ml)</SelectItem>
                      <SelectItem value="cx">Caixa (cx)</SelectItem>
                      <SelectItem value="pc">Pacote (pc)</SelectItem>
                      <SelectItem value="dz">Dúzia (dz)</SelectItem>
                      <SelectItem value="m">Metro (m)</SelectItem>
                      <SelectItem value="m2">Metro² (m²)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras (Opcional)</Label>
                  <Input
                    id="barcode"
                    value={editedProduct.barcode || ""}
                    onChange={(e) => setEditedProduct({ ...editedProduct, barcode: e.target.value })}
                    placeholder="EAN-13, EAN-8, UPC..."
                    maxLength={13}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Último Preço</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold">{product.lastQuotePrice}</p>
                        {getTrendIcon(product.trend)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cotações</p>
                      <p className="text-lg font-semibold">{product.quotesCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {product.bestSupplier && product.bestSupplier !== "N/A" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Melhor Fornecedor</p>
                      <p className="text-base font-medium">{capitalize(product.bestSupplier)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Última atualização</span>
                    <Badge variant="outline">{product.lastUpdate}</Badge>
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Histórico de alterações em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
