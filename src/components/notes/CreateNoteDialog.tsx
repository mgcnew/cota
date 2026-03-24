import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Importance, Note } from "@/hooks/useNotes";
import { ds } from "@/styles/design-system";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { StickyNote, AlertCircle, FileText, MessageSquare, Plus, Check, Tag } from "lucide-react";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNote: Note | null;
  formData: {
    title: string;
    content: string;
    importance: Importance;
    category: string;
    observation: string;
  };
  setFormData: (data: any) => void;
  errors: Record<string, string>;
  onCancel: () => void;
  onSave: () => void;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  editingNote,
  formData,
  setFormData,
  errors,
  onCancel,
  onSave
}: CreateNoteDialogProps) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();

  const Header = (
    <div className={ds.components.modal.header}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg border", ds.colors.surface.card, ds.colors.border.subtle)}>
          <StickyNote className={cn("h-4 w-4", ds.colors.text.primary)} />
        </div>
        <DialogTitle className={cn(ds.typography.size.lg, ds.typography.weight.bold, ds.colors.text.primary)}>
          {editingNote ? "Editar Anotação" : "Nova Anotação"}
        </DialogTitle>
      </div>
    </div>
  );

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      {Header}
      
      <div className={cn(ds.components.modal.body, "flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4")}>
        {/* Seção: Título e Prioridade */}
        <div className={cn(ds.components.card.flat, "p-4 space-y-4")}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-brand" />
                Título
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Reunião com fornecedor"
                maxLength={100}
                className={cn(ds.components.input.root, errors.title ? 'border-red-500 focus-visible:ring-red-500' : '')}
              />
              {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="importance" className="text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-brand" />
                  Prioridade
                </Label>
                <Select
                  value={formData.importance}
                  onValueChange={(value) => setFormData({ ...formData, importance: value as Importance })}
                >
                  <SelectTrigger id="importance" className={ds.components.input.root}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-bold flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-brand" />
                  Categoria
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category" className={ds.components.input.root}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geral">Geral</SelectItem>
                    <SelectItem value="Trabalho">Trabalho</SelectItem>
                    <SelectItem value="Pessoal">Pessoal</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Ideias">Ideias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Conteúdo Principal */}
        <div className={cn(ds.components.card.flat, "p-4 space-y-4")}>
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-brand" />
              Conteúdo
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Digite os detalhes da anotação..."
              rows={6}
              maxLength={1000}
              className={cn(ds.components.input.root, "resize-none min-h-[150px]", errors.content ? 'border-red-500 focus-visible:ring-red-500' : '')}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.content && <p className="text-xs text-red-500 font-medium">{errors.content}</p>}
              <p className="text-[10px] font-bold text-muted-foreground ml-auto uppercase tracking-wider">
                {(formData.content || '').length}/1000
              </p>
            </div>
          </div>
        </div>

        {/* Seção: Observação */}
        <div className={cn(ds.components.card.flat, "p-4 space-y-4")}>
          <div className="space-y-2">
            <Label htmlFor="observation" className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-brand" />
              Observação <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
            </Label>
            <Textarea
              id="observation"
              value={formData.observation}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              placeholder="Informações adicionais..."
              rows={3}
              maxLength={500}
              className={cn(ds.components.input.root, "resize-none min-h-[80px]")}
            />
            <p className="text-[10px] font-bold text-muted-foreground text-right uppercase tracking-wider mt-1">
              {(formData.observation || '').length}/500
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={ds.components.modal.footer}>
        <Button
          variant="outline"
          onClick={onCancel}
          className={ds.components.button.secondary}
        >
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          className={ds.components.button.primary}
        >
          {editingNote ? <Check className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {editingNote ? "Salvar" : "Criar Anotação"}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0 bg-background border-t border-border"
          style={{
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(ds.components.modal.content, "max-w-xl p-0 gap-0 overflow-hidden")}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
