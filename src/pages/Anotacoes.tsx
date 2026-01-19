import { useState, useMemo, useRef, useCallback, startTransition } from "react";
import { CSSSlideIn } from "@/components/ui/css-animation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  StickyNote,
  CheckCircle2,
  Edit,
  Trash2,
  AlertCircle,
  Search,
  Clock,
  MessageSquare
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { useNotes, type Importance, type Note } from "@/hooks/useNotes";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Configuração de cores mantendo o padrão do sistema
const importanceConfig = {
  low: {
    label: "Baixa",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
  },
  medium: {
    label: "Média",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  high: {
    label: "Alta",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
  },
  urgent: {
    label: "Urgente",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
  },
};

export default function Anotacoes() {
  const { toast } = useToast();
  const { notes, isLoading, createNote, updateNote, toggleResolve, deleteNote } = useNotes();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const dialogTriggerRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    importance: "medium" as Importance,
    observation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleInputRef = useRef<HTMLInputElement>(null);

  const filteredNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];

    let filtered = notes.filter(note => !note.resolved);

    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        (note.observation && note.observation.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [notes, debouncedSearch]);

  const resolvedNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    return notes.filter(note => note.resolved);
  }, [notes]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Conteúdo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.title, formData.content]);

  const handleCreateNote = useCallback(async () => {
    if (!validateForm()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    await createNote.mutateAsync({
      title: formData.title.trim(),
      content: formData.content.trim(),
      importance: formData.importance,
      observation: formData.observation?.trim() || undefined,
    });

    setFormData({ title: "", content: "", importance: "medium", observation: "" });
    setErrors({});
    startTransition(() => {
      setShowCreateDialog(false);
    });
  }, [formData, validateForm, createNote, toast]);

  const handleUpdateNote = useCallback(async () => {
    if (!editingNote) return;

    if (!validateForm()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    await updateNote.mutateAsync({
      id: editingNote.id,
      title: formData.title.trim(),
      content: formData.content.trim(),
      importance: formData.importance,
      observation: formData.observation?.trim() || undefined,
    });

    startTransition(() => {
      setEditingNote(null);
      setFormData({ title: "", content: "", importance: "medium", observation: "" });
      setErrors({});
    });
  }, [editingNote, formData, validateForm, updateNote, toast]);

  const handleEditNote = useCallback((note: Note) => {
    startTransition(() => {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        importance: note.importance,
        observation: note.observation || "",
      });
    });
  }, []);

  const handleResolveNote = useCallback(async (noteId: string) => {
    await toggleResolve.mutateAsync(noteId);
  }, [toggleResolve]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta anotação?")) return;
    await deleteNote.mutateAsync(noteId);
  }, [deleteNote]);

  const resetForm = useCallback(() => {
    startTransition(() => {
      setFormData({ title: "", content: "", importance: "medium", observation: "" });
      setEditingNote(null);
      setErrors({});
    });
  }, []);

  const FormContent = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">Título</Label>
        <Input
          ref={titleInputRef}
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
  );

  return (
    <PageWrapper>
      <div className="page-container max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <PageHeader
          title="Anotações"
          description="Gerencie suas tarefas e lembretes de forma simples"
          icon={StickyNote}
          actions={
            <Dialog open={showCreateDialog || editingNote !== null} onOpenChange={(open) => {
              if (!open) {
                setShowCreateDialog(false);
                setEditingNote(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  ref={dialogTriggerRef}
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-10 px-4 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Anotação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-white dark:bg-gray-950 border-none shadow-2xl sm:rounded-xl">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                  <DialogTitle className="text-lg font-semibold tracking-tight">
                    {editingNote ? "Editar Anotação" : "Nova Anotação"}
                  </DialogTitle>
                </DialogHeader>
                <div className="p-6">
                  <FormContent />
                </div>
                <div className="p-6 pt-2 flex justify-end gap-3 bg-gray-50/30 dark:bg-gray-900/30">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingNote(null);
                      resetForm();
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={editingNote ? handleUpdateNote : handleCreateNote}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 min-w-[100px]"
                  >
                    {editingNote ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        >
          <div className="w-full sm:w-auto">
            <ExpandableSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Pesquisar..."
              accentColor="gray"
              expandedWidth="w-full sm:w-64"
            />
          </div>
        </PageHeader>

        {/* Notes Grid */}
        {filteredNotes && filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                index={index}
                onEdit={handleEditNote}
                onResolve={handleResolveNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <StickyNote className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {searchQuery ? "Nenhum resultado encontrado" : "Tudo limpo por aqui"}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {searchQuery 
                  ? "Tente buscar por outro termo ou limpe o filtro." 
                  : "Crie uma nova anotação para começar a organizar suas tarefas."}
              </p>
            </div>
          )
        )}

        {/* Resolved Section */}
        {resolvedNotes && resolvedNotes.length > 0 && (
          <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Concluídas ({resolvedNotes.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {resolvedNotes.map((note, index) => (
                <Card key={note.id} className="group bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-none hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-medium text-gray-500 line-through truncate">{note.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{note.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg -mr-2 -mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// Minimalist Note Card Component
function NoteCard({ note, index, onEdit, onResolve, onDelete }: {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onResolve: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}) {
  const config = importanceConfig[note.importance];

  return (
    <CSSSlideIn direction="up" duration={300} delay={index * 50}>
      <Card className="group relative flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300 rounded-xl overflow-hidden">
        
        {/* Header Minimalista */}
        <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between space-y-0 gap-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
            {note.title}
          </CardTitle>
          
          {/* Indicador de Status (Exclamação) */}
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors",
            config.bg
          )}>
            <AlertCircle className={cn("h-3.5 w-3.5", config.color)} />
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-2 flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-5">
            {note.content}
          </p>
          
          {note.observation && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Observação</span>
              </div>
              <p className="text-xs text-gray-500 italic line-clamp-2">
                {note.observation}
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer com Ações e Data */}
        <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between border-t border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-800 transition-colors">
          <div className="flex items-center text-[11px] font-medium text-gray-400">
            <Clock className="h-3 w-3 mr-1.5" />
            {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-2 group-hover:translate-y-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(note)}
              className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Editar"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(note.id)}
              className="h-8 w-8 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onResolve(note.id)}
              className="h-8 w-8 rounded-lg text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40"
              title="Concluir"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </CSSSlideIn>
  );
}
