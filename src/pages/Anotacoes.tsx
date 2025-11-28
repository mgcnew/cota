import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
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
  Loader2,
  Clock,
  Search
} from "lucide-react";
import { useMobile } from "@/contexts/MobileProvider";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { useNotes, type Importance, type Note } from "@/hooks/useNotes";
import { useNotesMobile } from "@/hooks/mobile/useNotesMobile";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { MobileFAB } from "@/components/mobile/MobileFAB";
import { DataPagination } from "@/components/ui/data-pagination";
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
  const isMobile = useMobile();
  const { toast } = useToast();

  // Hooks condicionais
  const desktopNotes = useNotes();
  const mobileNotes = useNotesMobile();

  const {
    notes: desktopNotesList,
    isLoading: desktopLoading,
    createNote: desktopCreateNote,
    updateNote: desktopUpdateNote,
    toggleResolve: desktopToggleResolve,
    deleteNote: desktopDeleteNote
  } = desktopNotes;

  const {
    notes: mobileNotesList,
    isLoading: mobileLoading,
    search: mobileSearch,
    setSearch: setMobileSearch,
    pagination: mobilePagination,
    refetch: mobileRefetch,
    createNote: mobileCreateNote,
    updateNote: mobileUpdateNote,
    toggleResolve: mobileToggleResolve,
    deleteNote: mobileDeleteNote
  } = mobileNotes;

  // Usar dados apropriados baseado no dispositivo
  const notes = isMobile ? (Array.isArray(mobileNotesList) ? mobileNotesList : []) : (Array.isArray(desktopNotesList) ? desktopNotesList : []);
  const isLoading = isMobile ? mobileLoading : desktopLoading;
  const createNote = isMobile ? mobileCreateNote : desktopCreateNote;
  const updateNote = isMobile ? mobileUpdateNote : desktopUpdateNote;
  const toggleResolve = isMobile ? mobileToggleResolve : desktopToggleResolve;
  const deleteNote = isMobile ? mobileDeleteNote : desktopDeleteNote;

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
  const scrollPositionRef = useRef(0);

  // Atualizar busca mobile quando debouncedSearch mudar
  useEffect(() => {
    if (isMobile && setMobileSearch) {
      setMobileSearch(debouncedSearch);
    }
  }, [isMobile, debouncedSearch, setMobileSearch]);

  const filteredNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    if (isMobile) return notes; // Mobile já filtra no servidor

    // Desktop: filtrar por resolved e busca
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
  }, [notes, isMobile, debouncedSearch]);

  const resolvedNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    if (isMobile) return []; // Mobile não mostra resolvidas
    return notes.filter(note => note.resolved);
  }, [notes, isMobile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Conteúdo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateNote = async () => {
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
    setShowCreateDialog(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      importance: note.importance,
      observation: note.observation || "",
    });
  };

  const handleUpdateNote = async () => {
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

    setEditingNote(null);
    setFormData({ title: "", content: "", importance: "medium", observation: "" });
    setErrors({});
  };

  const handleResolveNote = async (noteId: string) => {
    await toggleResolve.mutateAsync(noteId);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta anotação?")) return;
    await deleteNote.mutateAsync(noteId);
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", importance: "medium", observation: "" });
    setEditingNote(null);
    setErrors({});
  };

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
            !isMobile && (
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
            )
          }
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar anotações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </PageHeader>

        {/* Notas Ativas */}
        {filteredNotes && Array.isArray(filteredNotes) && filteredNotes.length > 0 && (
          <PullToRefresh onRefresh={isMobile ? async () => { await mobileRefetch(); } : undefined} disabled={!isMobile}>
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

            {/* Paginação Mobile */}
            {isMobile && mobilePagination && typeof mobilePagination.totalItems === 'number' && (
              <div className="mt-4">
                <DataPagination
                  currentPage={mobilePagination.currentPage ?? 1}
                  totalPages={mobilePagination.totalPages ?? 0}
                  itemsPerPage={mobilePagination.pageSize ?? 20}
                  totalItems={mobilePagination.totalItems ?? 0}
                  onPageChange={mobilePagination.goToPage ?? (() => { })}
                  onItemsPerPageChange={mobilePagination.setItemsPerPage ?? mobilePagination.setPageSize ?? (() => { })}
                  startIndex={mobilePagination.startIndex ?? 0}
                  endIndex={mobilePagination.endIndex ?? 0}
                />
              </div>
            )}
          </PullToRefresh>
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

        {/* Mobile FAB */}
        {isMobile && (
          <>
            <MobileFAB
              onClick={() => setShowCreateDialog(true)}
              label="Nova Anotação"
            />

            <Sheet
              open={showCreateDialog || editingNote !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setShowCreateDialog(false);
                  setEditingNote(null);
                  resetForm();
                }
              }}
            >
              <SheetContent side="bottom" className="h-[90vh]">
                <SheetHeader>
                  <SheetTitle>{editingNote ? "Editar Anotação" : "Nova Anotação"}</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FormContent />
                  <div className="flex gap-2 pt-4 mt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setEditingNote(null);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={editingNote ? handleUpdateNote : handleCreateNote}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                    >
                      {editingNote ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </>
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
