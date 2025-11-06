import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const { notes, isLoading, createNote, updateNote, toggleResolve, deleteNote } = useNotes();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    importance: "medium" as Importance,
    observation: "",
  });

  const filteredNotes = useMemo(() => {
    return notes.filter(note => !note.resolved);
  }, [notes]);

  const resolvedNotes = useMemo(() => {
    return notes.filter(note => note.resolved);
  }, [notes]);

  const handleCreateNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    await createNote.mutateAsync({
      title: formData.title.trim(),
      content: formData.content.trim(),
      importance: formData.importance,
      observation: formData.observation?.trim() || undefined,
    });

    setFormData({ title: "", content: "", importance: "medium", observation: "" });
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
    if (!editingNote || !formData.title.trim() || !formData.content.trim()) return;

    await updateNote.mutateAsync({
      id: editingNote.id,
      title: formData.title.trim(),
      content: formData.content.trim(),
      importance: formData.importance,
      observation: formData.observation?.trim() || undefined,
    });

    setEditingNote(null);
    setFormData({ title: "", content: "", importance: "medium", observation: "" });
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

            <Dialog open={showCreateDialog || editingNote !== null} onOpenChange={(open) => {
              if (!open) {
                setShowCreateDialog(false);
                setEditingNote(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Anotação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingNote ? "Editar Anotação" : "Nova Anotação"}
                  </DialogTitle>
                </DialogHeader>
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
                      {formData.content.length}/1000 caracteres
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
                      {formData.observation.length}/500 caracteres
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
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
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Notas Ativas */}
        {filteredNotes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Anotações Ativas ({filteredNotes.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredNotes.map((note) => {
                const config = importanceConfig[note.importance];
                const Icon = config.icon;
                
                return (
                  <Card
                    key={note.id}
                    className={`${config.color} ${config.shadow} border-2 transition-all hover:scale-105 hover:shadow-lg cursor-pointer relative`}
                    style={{
                      transform: `rotate(${Math.random() * 4 - 2}deg)`,
                    }}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Icon className={`h-4 w-4 ${config.textColor} flex-shrink-0`} />
                          <Badge 
                            variant="outline" 
                            className={`${config.textColor} border-current text-xs`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
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
                      <h3 className={`font-semibold text-sm ${config.textColor} line-clamp-2`}>
                        {note.title}
                      </h3>

                      {/* Conteúdo */}
                      <p className={`text-xs ${config.textColor} opacity-90 line-clamp-4`}>
                        {note.content}
                      </p>

                      {/* Observação */}
                      {note.observation && (
                        <div className={`pt-2 border-t ${config.textColor} opacity-50 border-current`}>
                          <p className="text-xs italic line-clamp-2">
                            {note.observation}
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-current opacity-30">
                        <span className={`text-xs ${config.textColor}`}>
                          {new Date(note.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolveNote(note.id)}
                          className={`h-7 px-2 ${config.textColor} hover:bg-current/10`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Resolver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Notas Resolvidas */}
        {resolvedNotes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Anotações Resolvidas ({resolvedNotes.length})
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
        {!isLoading && notes.length === 0 && (
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

