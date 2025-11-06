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
  X, 
  Edit, 
  Trash2, 
  AlertCircle,
  Info,
  AlertTriangle,
  Flame,
  Loader2
} from "lucide-react";
import { useMobile } from "@/contexts/MobileProvider";
import { PageWrapper } from "@/components/layout/PageWrapper";
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
    color: "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800",
    textColor: "text-yellow-900 dark:text-yellow-100",
    icon: Info,
    shadow: "shadow-yellow-200/50 dark:shadow-yellow-900/30",
  },
  medium: {
    label: "Média",
    color: "bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    icon: AlertCircle,
    shadow: "shadow-blue-200/50 dark:shadow-blue-900/30",
  },
  high: {
    label: "Alta",
    color: "bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800",
    textColor: "text-orange-900 dark:text-orange-100",
    icon: AlertTriangle,
    shadow: "shadow-orange-200/50 dark:shadow-orange-900/30",
  },
  urgent: {
    label: "Urgente",
    color: "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-800",
    textColor: "text-red-900 dark:text-red-100",
    icon: Flame,
    shadow: "shadow-red-200/50 dark:shadow-red-900/30",
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
    return notes.filter(note => !note.resolved);
  }, [notes, isMobile]);

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
    
    // Focar no campo de título após criar (se reabrir)
    if (isMobile && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
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
  
  // Auto-focus e scroll preservation
  const handleOpenChange = (open: boolean) => {
    if (open) {
      scrollPositionRef.current = window.scrollY;
      // Focar no campo de título após um pequeno delay
      setTimeout(() => {
        if (isMobile && titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 300);
    } else {
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 100);
    }
  };

  return (
    <PageWrapper>
      <div className="page-container">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600 flex-shrink-0">
                <StickyNote className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Anotações</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Organize suas anotações importantes
                </p>
              </div>
            </div>

            {!isMobile && (
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
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Anotação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 flex flex-col">
                  <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-4' : 'px-6 py-4'} border-b border-gray-200 dark:border-gray-700`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
                      {editingNote ? "Editar Anotação" : "Nova Anotação"}
                    </div>
                  </div>
                  <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-6'}`}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Digite o título da anotação"
                          maxLength={100}
                        />
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
                        />
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
                  </div>
                  <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-3 flex-col gap-3' : 'px-6 py-4 flex-row justify-end'} border-t border-gray-200 dark:border-gray-700 flex gap-2`}>
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
                      className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                    >
                      {editingNote ? "Atualizar" : "Criar"} Anotação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {isMobile && (
              <Sheet 
                open={showCreateDialog || editingNote !== null} 
                onOpenChange={(open) => {
                  handleOpenChange(open);
                  if (!open) {
                    setShowCreateDialog(false);
                    setEditingNote(null);
                    resetForm();
                  }
                }}
              >
                <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] p-0 flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden">
                  <SheetHeader className="sr-only">
                    <SheetTitle>{editingNote ? "Editar Anotação" : "Nova Anotação"}</SheetTitle>
                  </SheetHeader>
                  
                  {/* Header melhorado */}
                  <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
                        <StickyNote className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {editingNote ? "Editar Anotação" : "Nova Anotação"}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {editingNote ? "Atualize os dados da anotação" : "Preencha os campos abaixo"}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Conteúdo com scroll */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Título */}
                      <div className="space-y-2">
                        <Label htmlFor="title-mobile" className="text-base font-semibold">
                          Título *
                        </Label>
                        <Input
                          ref={titleInputRef}
                          id="title-mobile"
                          value={formData.title}
                          onChange={(e) => {
                            setFormData({ ...formData, title: e.target.value });
                            if (errors.title) setErrors({ ...errors, title: "" });
                          }}
                          placeholder="Ex: Reunião importante, Lembrete..."
                          maxLength={100}
                          className={`h-11 text-base ${errors.title ? 'border-red-500 dark:border-red-400' : ''}`}
                        />
                        {errors.title && (
                          <p className="text-xs text-red-500 dark:text-red-400">{errors.title}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(formData.title || '').length}/100 caracteres
                        </p>
                      </div>

                      {/* Conteúdo */}
                      <div className="space-y-2">
                        <Label htmlFor="content-mobile" className="text-base font-semibold">
                          Conteúdo *
                        </Label>
                        <Textarea
                          id="content-mobile"
                          value={formData.content}
                          onChange={(e) => {
                            setFormData({ ...formData, content: e.target.value });
                            if (errors.content) setErrors({ ...errors, content: "" });
                          }}
                          placeholder="Descreva os detalhes da anotação..."
                          rows={6}
                          maxLength={1000}
                          className={`text-base resize-none ${errors.content ? 'border-red-500 dark:border-red-400' : ''}`}
                        />
                        {errors.content && (
                          <p className="text-xs text-red-500 dark:text-red-400">{errors.content}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(formData.content || '').length}/1000 caracteres
                          </p>
                          {formData.content.length > 800 && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                              {1000 - formData.content.length} restantes
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Importância com visual melhorado */}
                      <div className="space-y-2">
                        <Label htmlFor="importance-mobile" className="text-base font-semibold">
                          Nível de Importância
                        </Label>
                        <Select
                          value={formData.importance}
                          onValueChange={(value) => setFormData({ ...formData, importance: value as Importance })}
                        >
                          <SelectTrigger id="importance-mobile" className="h-11 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <span className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-yellow-600" />
                                Baixa
                              </span>
                            </SelectItem>
                            <SelectItem value="medium">
                              <span className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                Média
                              </span>
                            </SelectItem>
                            <SelectItem value="high">
                              <span className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                Alta
                              </span>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <span className="flex items-center gap-2">
                                <Flame className="h-4 w-4 text-red-600" />
                                Urgente
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          {(() => {
                            const config = importanceConfig[formData.importance];
                            const Icon = config.icon;
                            return (
                              <>
                                <Icon className={`h-4 w-4 ${config.textColor}`} />
                                <p className={`text-xs ${config.textColor} font-medium`}>
                                  {config.label}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Observação */}
                      <div className="space-y-2">
                        <Label htmlFor="observation-mobile" className="text-base font-semibold">
                          Observação <span className="text-xs font-normal text-gray-500">(opcional)</span>
                        </Label>
                        <Textarea
                          id="observation-mobile"
                          value={formData.observation}
                          onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                          placeholder="Adicione informações complementares..."
                          rows={3}
                          maxLength={500}
                          className="text-base resize-none"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(formData.observation || '').length}/500 caracteres
                        </p>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Footer melhorado */}
                  <div className="flex-shrink-0 px-4 py-3 flex-col gap-3 border-t-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/10 dark:to-orange-950/10 flex">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setEditingNote(null);
                        resetForm();
                      }}
                      className="flex-1 h-11 text-base"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={editingNote ? handleUpdateNote : handleCreateNote}
                      disabled={!formData.title.trim() || !formData.content.trim() || createNote.isPending || updateNote.isPending}
                      className="flex-1 h-11 text-base bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {createNote.isPending || updateNote.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingNote ? "Atualizando..." : "Criando..."}
                        </>
                      ) : (
                        <>
                          {editingNote ? "Atualizar" : "Criar"} Anotação
                        </>
                      )}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Busca Mobile */}
        {isMobile && (
          <div className="mb-4">
            <Input
              placeholder="Buscar anotações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 text-base"
            />
          </div>
        )}

        {/* Notas Ativas */}
        {filteredNotes && Array.isArray(filteredNotes) && filteredNotes.length > 0 && (
          <PullToRefresh onRefresh={isMobile ? mobileRefetch : undefined} disabled={!isMobile}>
            <div className={isMobile ? 'mb-6' : 'mb-8'}>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-4 flex items-center gap-2`}>
                <StickyNote className="h-5 w-5" />
                Anotações Ativas ({filteredNotes.length || 0})
              </h2>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
                {filteredNotes.map((note) => {
                  const config = importanceConfig[note.importance];
                  const Icon = config.icon;
                  
                  return (
                    <Card
                      key={note.id}
                      className={`${config.color} ${config.shadow} border-2 transition-all hover:scale-105 hover:shadow-lg cursor-pointer relative ${isMobile ? 'p-3' : ''}`}
                      style={!isMobile ? {
                        transform: `rotate(${Math.random() * 4 - 2}deg)`,
                      } : undefined}
                    >
                      <CardContent className={isMobile ? 'p-0 space-y-2' : 'p-4 space-y-3'}>
                        {/* Header */}
                        <div className={`flex items-start justify-between gap-2 ${isMobile ? 'mb-2' : ''}`}>
                          <div className="flex items-center gap-2 flex-1">
                            <Icon className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} ${config.textColor} flex-shrink-0`} />
                            <Badge 
                              variant="outline" 
                              className={`${config.textColor} border-current ${isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs'}`}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditNote(note)}
                              className={isMobile ? 'h-8 w-8 p-0' : 'h-7 w-7 p-0'}
                            >
                              <Edit className={isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              className={`${isMobile ? 'h-8 w-8' : 'h-7 w-7'} p-0 text-destructive`}
                            >
                              <Trash2 className={isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
                            </Button>
                          </div>
                        </div>

                        {/* Título */}
                        <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-sm'} ${config.textColor} line-clamp-2`}>
                          {note.title}
                        </h3>

                        {/* Conteúdo */}
                        <p className={`${isMobile ? 'text-sm line-clamp-3' : 'text-xs line-clamp-4'} ${config.textColor} opacity-90`}>
                          {note.content}
                        </p>

                        {/* Observação - Ocultar no mobile */}
                        {!isMobile && note.observation && (
                          <div className={`pt-2 border-t ${config.textColor} opacity-50 border-current`}>
                            <p className="text-xs italic line-clamp-2">
                              {note.observation}
                            </p>
                          </div>
                        )}

                        {/* Footer */}
                        <div className={`flex items-center justify-between pt-2 border-t border-current ${isMobile ? 'opacity-40' : 'opacity-30'}`}>
                          <span className={`${isMobile ? 'text-xs' : 'text-xs'} ${config.textColor}`}>
                            {new Date(note.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveNote(note.id)}
                            className={`${isMobile ? 'h-8 px-2 text-xs' : 'h-7 px-2'} ${config.textColor} hover:bg-current/10`}
                          >
                            <CheckCircle2 className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} mr-1`} />
                            Resolver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
                    onPageChange={mobilePagination.goToPage ?? (() => {})}
                    onItemsPerPageChange={mobilePagination.setItemsPerPage ?? mobilePagination.setPageSize ?? (() => {})}
                    startIndex={mobilePagination.startIndex ?? 0}
                    endIndex={mobilePagination.endIndex ?? 0}
                  />
                </div>
              )}
            </div>
          </PullToRefresh>
        )}

        {/* Mobile FAB */}
        {isMobile && (
          <MobileFAB
            onClick={() => setShowCreateDialog(true)}
            icon={Plus}
            label="Nova Anotação"
          />
        )}


        {/* Notas Resolvidas */}
        {resolvedNotes && Array.isArray(resolvedNotes) && resolvedNotes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Anotações Resolvidas ({resolvedNotes.length || 0})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {resolvedNotes.map((note) => {
                const config = importanceConfig[note.importance];
                const Icon = config.icon;
                
                return (
                  <Card
                    key={note.id}
                    className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60 relative"
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-7 w-7 p-0 text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Título */}
                      <h3 className="font-semibold text-sm text-muted-foreground line-through line-clamp-2">
                        {note.title}
                      </h3>

                      {/* Conteúdo */}
                      <p className="text-xs text-muted-foreground line-clamp-4">
                        {note.content}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-gray-700">
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolveNote(note.id)}
                          className="h-7 px-2 text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reabrir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-600 dark:text-yellow-400 mb-4" />
            <p className="text-muted-foreground">Carregando anotações...</p>
          </div>
        )}

        {/* Estado vazio */}
        {!isLoading && notes && Array.isArray(notes) && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 mb-4">
              <StickyNote className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma anotação ainda</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Crie sua primeira anotação para começar a organizar suas tarefas e lembretes importantes.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Anotação
            </Button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

