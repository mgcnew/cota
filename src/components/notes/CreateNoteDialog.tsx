import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Importance, Note } from "@/hooks/useNotes";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNote: Note | null;
  formData: {
    title: string;
    content: string;
    importance: Importance;
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-white dark:bg-gray-950 border-none shadow-2xl sm:rounded-xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {editingNote ? "Editar Anotação" : "Nova Anotação"}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Reunião com fornecedor"
                maxLength={100}
                className={cn("h-10", errors.title ? 'border-red-500 focus-visible:ring-red-500' : '')}
              />
              {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label htmlFor="importance" className="text-sm font-medium">Prioridade</Label>
                <Select
                  value={formData.importance}
                  onValueChange={(value) => setFormData({ ...formData, importance: value as Importance })}
                >
                  <SelectTrigger id="importance" className="h-10">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">Conteúdo</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Digite os detalhes da anotação..."
                rows={6}
                maxLength={1000}
                className={cn("resize-none min-h-[120px]", errors.content ? 'border-red-500 focus-visible:ring-red-500' : '')}
              />
              <div className="flex justify-between items-center">
                {errors.content && <p className="text-xs text-red-500 font-medium">{errors.content}</p>}
                <p className="text-xs text-muted-foreground ml-auto">
                  {(formData.content || '').length}/1000
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observation" className="text-sm font-medium">Observação <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
              <Textarea
                id="observation"
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {(formData.observation || '').length}/500
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 pt-2 flex justify-end gap-3 bg-gray-50/30 dark:bg-gray-900/30">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 min-w-[100px]"
          >
            {editingNote ? "Salvar" : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
