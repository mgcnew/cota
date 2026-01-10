import { useState, useMemo, useRef, useCallback, startTransition } from "react";
import { CSSSlideIn } from "@/components/ui/css-animation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus,
  StickyNote,
  CheckCircle2,
  Edit,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  Flame,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { useNotes, type Importance, type Note } from "@/hooks/useNotes";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const importanceConfig = {
  low: {
    label: "Baixa",
    color: "from-blue-500/10 to-cyan-500/10 dark:from-blue-900/30 dark:to-cyan-900/30",
    borderColor: "border-blue-400/50",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    glowColor: "shadow-blue-500/20",
  },
  medium: {
    label: "Média",
    color: "from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/30 dark:to-purple-900/30",
    borderColor: "border-indigo-400/50",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    icon: AlertCircle,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    glowColor: "shadow-indigo-500/20",
  },
  high: {
    label: "Alta",
    color: "from-orange-500/10 to-amber-500/10 dark:from-orange-900/30 dark:to-amber-900/30",
    borderColor: "border-orange-400/50",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    icon: AlertTriangle,
    iconColor: "text-orange-600 dark:text-orange-400",
    glowColor: "shadow-orange-500/20",
  },
  urgent: {
    label: "Urgente",
    color: "from-red-500/10 to-rose-500/10 dark:from-red-900/30 dark:to-rose-900/30",
    borderColor: "border-red-400/50",
    badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    icon: Flame,
    iconColor: "text-red-600 dark:text-red-400",
    glowColor: "shadow-red-500/20",
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          ref={titleInputRef}
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Digite o título da anotação"
          maxLength={100}
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Digite o conteúdo da anotação"
          rows={6}
          maxLength={1000}
          className={errors.content ? 'border-red-500' : ''}
        />
        {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
        <p className="text-xs text-muted-foreground">
          {(formData.content || '').length}/1000 caracteres
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="importance">Importância</Label>
        <Select
          value={formData.importance}
          onValueChange={(value) => setFormData({ ...formData, importance: value as Importance })}
        >
          <SelectTrigger id="importance">
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
        <Label htmlFor="observation">Observação (opcional)</Label>
        <Textarea
          id="observation"
          value={formData.observation}
          onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
          placeholder="Adicione uma observação adicional"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {(formData.observation || '').length}/500 caracteres
        </p>
      </div>
    </div>
  );

  return (
    <PageWrapper>
      <div className="page-container">
        <PageHeader
          title="Anotações"
          description="Organize e gerencie suas anotações importantes"
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
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Anotação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingNote ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
                </DialogHeader>
                <FormContent />
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingNote(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={editingNote ? handleUpdateNote : handleCreateNote}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                  >
                    {editingNote ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        >
          <div className="flex-shrink-0">
            <ExpandableSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar anotações..."
              accentColor="purple"
              expandedWidth="w-64"
            />
          </div>
        </PageHeader>

        {/* Notas Ativas - Grid Layout */}
        {filteredNotes && Array.isArray(filteredNotes) && filteredNotes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        )}

        {/* Empty State */}
        {filteredNotes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <StickyNote className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma anotação encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? "Tente ajustar sua busca" : "Crie sua primeira anotação para começar"}
            </p>
          </div>
        )}

        {/* Notas Resolvidas - Grid Layout */}
        {resolvedNotes && Array.isArray(resolvedNotes) && resolvedNotes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resolvidas ({resolvedNotes.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {resolvedNotes.map((note) => {
                const config = importanceConfig[note.importance];
                const Icon = config.icon;

                return (
                  <Card key={note.id} className="bg-gray-50/80 dark:bg-gray-900/50 opacity-70 hover:opacity-90 transition-opacity">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gray-200/50 dark:bg-gray-700/50">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium line-through text-muted-foreground truncate">
                            {note.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {note.content}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-7 w-7 p-0 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// Componente de Card de Nota
interface NoteCardProps {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onResolve: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

function NoteCard({ note, index, onEdit, onResolve, onDelete }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = importanceConfig[note.importance];
  const Icon = config.icon;
  
  const hasMoreContent = note.content.length > 100 || note.observation;
  const truncatedContent = note.content.length > 100 ? note.content.slice(0, 100) + "..." : note.content;

  return (
    <CSSSlideIn
      direction="up"
      duration={200}
      delay={index * 30}
    >
      <Card 
        className={cn(
          "group relative overflow-hidden border transition-all duration-300 hover:shadow-lg",
          config.borderColor,
          config.glowColor,
          "hover:shadow-md"
        )}
      >
        {/* Gradient Background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-60",
          config.color
        )} />
        
        <CardContent className="relative p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className={cn("p-2 rounded-lg shrink-0", config.iconBg)}>
              <Icon className={cn("h-4 w-4", config.iconColor)} />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(note as any)}
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResolve(note.id)}
                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {note.title}
          </h3>

          {/* Content */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {isExpanded ? note.content : truncatedContent}
            </p>
            
            {hasMoreContent && (
              <>
                <CollapsibleContent className="mt-2 space-y-2">
                  {note.observation && (
                    <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Observação</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {note.observation}
                      </p>
                    </div>
                  )}
                </CollapsibleContent>
                
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Recolher
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Expandir
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </>
            )}
          </Collapsible>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/30 dark:border-gray-700/30">
            <Badge className={cn("text-[10px] px-2 py-0.5", config.badgeColor)}>
              {config.label}
            </Badge>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(note.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </CSSSlideIn>
  );
}
