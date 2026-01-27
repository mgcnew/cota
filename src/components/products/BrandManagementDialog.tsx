import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Trash2, Edit2, Star, Award, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { designSystem } from "@/styles/design-system";

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
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
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

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const content = (
    <>
      <div className={designSystem.components.modal.header}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg border", designSystem.colors.surface.card, designSystem.colors.border.subtle)}>
            <Award className={cn("h-4 w-4", designSystem.colors.text.primary)} />
          </div>
          <div>
            <DialogTitle className={cn(designSystem.typography.size.lg, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
              Gerenciar Marcas
            </DialogTitle>
            <DialogDescription className="text-sm opacity-70">
              Cadastre e avalie as marcas dos produtos.
            </DialogDescription>
          </div>
        </div>
        {!isMobile && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 grid gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar marcas..."
                value={searchQuery}
                onFocus={handleInputFocus}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(designSystem.components.input.root, "pl-9 h-10")}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {isEditing ? "Editar Marca" : "Nova Marca"}
              </Label>
              <Input
                placeholder="Nome da marca"
                value={newBrandName}
                onFocus={handleInputFocus}
                onChange={(e) => setNewBrandName(e.target.value)}
                className={cn(designSystem.components.input.root, "h-10")}
              />
            </div>
            <div className="sm:w-32 space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Avaliação</Label>
              <div className="flex items-center gap-1.5 h-10 px-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setNewBrandRating(rating)}
                    className="focus:outline-none hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        rating <= newBrandRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300 dark:text-zinc-600"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleSave}
                disabled={!newBrandName.trim()}
                className={cn(designSystem.components.button.primary, "h-10 flex-1 sm:flex-none")}
              >
                {isEditing ? "Atualizar" : "Adicionar"}
              </Button>
              {isEditing && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingBrand(null);
                    setNewBrandName("");
                    setNewBrandRating(3);
                  }}
                  className={cn(designSystem.components.button.ghost, "h-10")}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-zinc-400">
                <Loader2 className="h-8 w-8 animate-spin mr-3" /> Carregando...
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-zinc-300" />
                </div>
                <p className="text-zinc-500 font-bold">Nenhuma marca encontrada</p>
                <p className="text-sm text-zinc-400 mt-1">Cadastre marcas para organizar seus produtos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all group hover:shadow-md",
                      editingBrand?.id === brand.id
                        ? "bg-brand/5 border-brand/30"
                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {brand.name}
                        </span>
                        {brand.products_count !== undefined && brand.products_count > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-2 h-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                            {brand.products_count} prod
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i <= brand.manual_rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-200 dark:text-zinc-700"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-zinc-400 hover:text-brand hover:bg-brand/10"
                        onClick={() => {
                          setEditingBrand(brand);
                          setNewBrandName(brand.name);
                          setNewBrandRating(brand.manual_rating);
                          setIsEditing(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-zinc-900 dark:text-white">Excluir marca?</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-500">
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a marca
                              <strong className="text-zinc-900 dark:text-white"> {brand.name}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-zinc-200 text-zinc-700 hover:bg-zinc-100">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(brand.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
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
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 transition-[height,max-height] duration-200 ease-in-out"
          style={{
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          <DrawerTitle className="sr-only">Gerenciar Marcas</DrawerTitle>
          <DrawerDescription className="sr-only">Interface para gerenciamento de marcas de produtos.</DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className={cn(designSystem.components.modal.content, "max-h-[85vh] p-0 overflow-hidden flex flex-col")}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
