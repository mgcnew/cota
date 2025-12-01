import { useState, useMemo, useRef, useCallback, startTransition } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Search
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { useNotes, type Importance, type Note } from "@/hooks/useNotes";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";

const importanceConfig = {
  low: {
    label: "Baixa",
    color: "border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  medium: {
    label: "Média",
    color: "border-l-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    icon: AlertCircle,
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  high: {
    label: "Alta",
    color: "border-l-orange-400 bg-orange-50/50 dark:bg-orange-950/20",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    icon: AlertTriangle,
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  urgent: {
    label: "Urgente",
    color: "border-l-red-400 bg-red-50/50 dark:bg-red-950/20",
    badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    icon: Flame,
    iconColor: "text-red-600 dark:text-red-400",
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

        {/* Notas Ativas */}
        {filteredNotes && Array.isArray(filteredNotes) && filteredNotes.length > 0 && (
          <div className="space-y-3">
            {filteredNotes.map((note, index) => {
              const config = importanceConfig[note.importance];
              const Icon = config.icon;

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <Card className={`${config.color} border-l-4 hover:shadow-md transition-shadow duration-200`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Icon className={`h-4 w-4 ${config.iconColor}`} />
                            <Badge className={config.badgeColor}>
                              {config.label}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(note.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {note.title}
                          </h3>

                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {note.content}
                          </p>

                          {note.observation && (
                            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {note.observation}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note as any)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveNote(note.id)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredNotes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma anotação encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? "Tente ajustar sua busca" : "Crie sua primeira anotação para começar"}
            </p>
          </div>
        )}

        {/* Notas Resolvidas */}
        {resolvedNotes && Array.isArray(resolvedNotes) && resolvedNotes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Anotações Resolvidas ({resolvedNotes.length})
            </h2>
            <div className="space-y-3">
              {resolvedNotes.map((note) => {
                const config = importanceConfig[note.importance];
                const Icon = config.icon;

                return (
                  <Card key={note.id} className="bg-gray-50 dark:bg-gray-900 opacity-60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className="text-muted-foreground">
                              {config.label}
                            </Badge>
                          </div>
                          <h3 className="text-base font-semibold line-through text-muted-foreground">
                            {note.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {note.content}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
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
