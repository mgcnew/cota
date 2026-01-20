import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Trash2, Edit2, Star, Award, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  manual_rating: number;
  products_count?: number;
}

interface BrandManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandManagementDialog({ open, onOpenChange }: BrandManagementDialogProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandRating, setNewBrandRating] = useState(3);
  const { toast } = useToast();

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*, products(count)')
        .order('name');
      
      if (error) throw error;
      
      const formattedBrands = data.map((b: any) => ({
        ...b,
        products_count: b.products?.[0]?.count || 0
      }));
      
      setBrands(formattedBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast({
        title: "Erro ao carregar marcas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBrands();
    }
  }, [open]);

  const handleSave = async () => {
    if (!newBrandName.trim()) return;
    
    try {
      if (isEditing && editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update({ 
            name: newBrandName,
            manual_rating: newBrandRating
          })
          .eq('id', editingBrand.id);

        if (error) throw error;

        toast({ title: "Marca atualizada com sucesso" });
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([{ 
            name: newBrandName,
            manual_rating: newBrandRating
          }]);

        if (error) throw error;

        toast({ title: "Marca criada com sucesso" });
      }

      setNewBrandName("");
      setNewBrandRating(3);
      setIsEditing(false);
      setEditingBrand(null);
      fetchBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
      toast({
        title: "Erro ao salvar marca",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Marca excluída com sucesso" });
      fetchBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        title: "Erro ao excluir marca",
        description: "Verifique se existem produtos vinculados a esta marca.",
        variant: "destructive"
      });
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Marcas</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                Cadastre e avalie as marcas dos produtos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Controls */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 grid gap-4 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar marcas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-9"
                />
              </div>
            </div>

            <div className="flex gap-2 items-end bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isEditing ? "Editar Marca" : "Nova Marca"}
                </Label>
                <Input 
                  placeholder="Nome da marca" 
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="w-32 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Avaliação</Label>
                <div className="flex items-center gap-1 h-8 px-2 border rounded-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setNewBrandRating(rating)}
                      className="focus:outline-none hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={cn(
                          "h-3.5 w-3.5",
                          rating <= newBrandRating 
                            ? "fill-amber-400 text-amber-400" 
                            : "text-gray-300 dark:text-gray-600"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={!newBrandName.trim()}
                className="h-8 bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isEditing ? <Edit2 className="h-3.5 w-3.5 mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                {isEditing ? "Atualizar" : "Adicionar"}
              </Button>
              {isEditing && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditingBrand(null);
                    setNewBrandName("");
                    setNewBrandRating(3);
                  }}
                  className="h-8 text-gray-500"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Nenhuma marca encontrada</p>
                  <p className="text-xs text-gray-400 mt-1">Cadastre novas marcas acima</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredBrands.map((brand) => (
                    <div 
                      key={brand.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all group hover:shadow-sm",
                        editingBrand?.id === brand.id 
                          ? "bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800" 
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {brand.name}
                          </span>
                          {brand.products_count !== undefined && brand.products_count > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              {brand.products_count} prod
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star 
                              key={i} 
                              className={cn(
                                "h-2.5 w-2.5", 
                                i <= brand.manual_rating 
                                  ? "fill-amber-400 text-amber-400" 
                                  : "text-gray-200 dark:text-gray-700"
                              )} 
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => {
                            setEditingBrand(brand);
                            setNewBrandName(brand.name);
                            setNewBrandRating(brand.manual_rating);
                            setIsEditing(true);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir marca?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a marca 
                                <strong> {brand.name}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(brand.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
