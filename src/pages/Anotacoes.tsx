import { Button } from "@/components/ui/button";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import {
  Plus,
  StickyNote,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAnotacoes } from "@/hooks/useAnotacoes";
import { NoteCard } from "@/components/notes/NoteCard";
import { CreateNoteDialog } from "@/components/notes/CreateNoteDialog";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";

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
      <div className={ds.layout.container.page}>
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
            <StickyNote className="h-6 w-6 text-brand" />
          </div>
          <div>
            <h1 className={cn(ds.typography.size["2xl"], "font-bold text-foreground")}>
              Anotações
            </h1>
            <p className={cn(ds.colors.text.secondary, "text-sm mt-0.5")}>
              Gerencie suas tarefas e lembretes de forma simples
            </p>
          </div>
        </div>
          
        {/* Unified Actions Bar - Aligned to the Right */}
        <div className="flex justify-end mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Search Field */}
            <div className="w-full sm:w-64">
              <ExpandableSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Pesquisar anotações..."
                accentColor="gray"
                expandedWidth="w-full"
              />
            </div>

            {/* Actions Block */}
            <div className="flex items-center gap-2">
              <Button
              onClick={() => setShowCreateDialog(true)}
              className={cn(ds.components.button.primary, "h-11 px-6 flex-1 sm:flex-initial")}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Nova Anotação</span>
            </Button>
            </div>
          </div>
        </div>

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
          <ResponsiveGrid gap="md" config={{ mobile: 1, tablet: 2, desktop: 4 }}>
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
          </ResponsiveGrid>
        ) : (
          !isLoading && (
            <div className={cn(ds.components.card.root, "p-12 border-dashed")}>
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center ring-8 ring-zinc-50/50 dark:ring-zinc-900/30">
                  <StickyNote className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {searchQuery ? "Nenhum resultado encontrado" : "Tudo limpo por aqui"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? "Tente buscar por outro termo ou limpe o filtro." 
                      : "Crie uma nova anotação para começar a organizar suas tarefas."}
                  </p>
                </div>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Anotação
                  </Button>
                )}
              </div>
            </div>
          )
        )}

        {/* Resolved Section */}
        {resolvedNotes && resolvedNotes.length > 0 && (
          <div className="pt-12 mt-12 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className={cn(ds.typography.size.lg, "font-semibold text-foreground")}>
                Concluídas ({resolvedNotes.length})
              </h2>
            </div>
            
            <ResponsiveGrid gap="md" config={{ mobile: 1, tablet: 2, desktop: 4 }} className="opacity-60 hover:opacity-100 transition-opacity duration-300">
              {resolvedNotes.map((note) => (
                <div key={note.id} className={cn(ds.components.card.root, "bg-muted/30 border-dashed hover:bg-muted/50 transition-all p-5")}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-muted-foreground line-through truncate">{note.title}</h3>
                      <p className="text-sm text-muted-foreground/80 line-clamp-2">{note.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </ResponsiveGrid>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
