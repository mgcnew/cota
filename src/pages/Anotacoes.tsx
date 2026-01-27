import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import {
  Plus,
  StickyNote,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { useAnotacoes } from "@/hooks/useAnotacoes";
import { NoteCard } from "@/components/notes/NoteCard";
import { CreateNoteDialog } from "@/components/notes/CreateNoteDialog";

export default function Anotacoes() {
  const {
    isLoading,
    showCreateDialog,
    setShowCreateDialog,
    editingNote,
    setEditingNote,
    searchQuery,
    setSearchQuery,
    formData,
    setFormData,
    errors,
    filteredNotes,
    resolvedNotes,
    handleCreateNote,
    handleUpdateNote,
    handleEditNote,
    handleResolveNote,
    handleDeleteNote,
    resetForm
  } = useAnotacoes();

  return (
    <PageWrapper>
      <div className="page-container max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <PageHeader
          title="Anotações"
          description="Gerencie suas tarefas e lembretes de forma simples"
          icon={StickyNote}
          actions={
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Anotação
            </Button>
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

        {/* Create/Edit Dialog */}
        <CreateNoteDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingNote(null);
              resetForm();
            }
          }}
          editingNote={editingNote}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          onCancel={() => {
            setShowCreateDialog(false);
            setEditingNote(null);
            resetForm();
          }}
          onSave={editingNote ? handleUpdateNote : handleCreateNote}
        />

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
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <StickyNote className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                {searchQuery ? "Nenhum resultado encontrado" : "Tudo limpo por aqui"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {searchQuery 
                  ? "Tente buscar por outro termo ou limpe o filtro." 
                  : "Crie uma nova anotação para começar a organizar suas tarefas."}
              </p>
            </div>
          )
        )}

        {/* Resolved Section */}
        {resolvedNotes && resolvedNotes.length > 0 && (
          <div className="pt-8 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Concluídas ({resolvedNotes.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {resolvedNotes.map((note) => (
                <Card key={note.id} className="group bg-muted/50 border-border shadow-none hover:border-muted-foreground/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-medium text-muted-foreground line-through truncate">{note.title}</h3>
                        <p className="text-sm text-muted-foreground/80 line-clamp-2">{note.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg -mr-2 -mt-2"
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
