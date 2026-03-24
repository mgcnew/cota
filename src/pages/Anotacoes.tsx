import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import {
  Plus,
  StickyNote,
  CheckCircle2,
  Trash2,
  Pin,
  Tag,
  Filter
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAnotacoes } from "@/hooks/useAnotacoes";
import { NoteCard } from "@/components/notes/NoteCard";
import { CreateNoteDialog } from "@/components/notes/CreateNoteDialog";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

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
    handleTogglePin,
    resetForm
  } = useAnotacoes();

  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const categories = ["Todas", "Geral", "Trabalho", "Pessoal", "Urgente", "Ideias"];

  const finalFilteredNotes = filteredNotes.filter(note => {
    if (selectedCategory === "Todas") return true;
    if (selectedCategory === "Geral") return !note.category || note.category === "Geral";
    return note.category === selectedCategory;
  });

  const finalResolvedNotes = resolvedNotes.filter(note => {
    if (selectedCategory === "Todas") return true;
    if (selectedCategory === "Geral") return !note.category || note.category === "Geral";
    return note.category === selectedCategory;
  });

  const pinnedNotes = finalFilteredNotes.filter(n => n.pinned);
  const otherNotes = finalFilteredNotes.filter(n => !n.pinned);

  return (
    <PageWrapper>
      <div className={cn(ds.layout.container.page, "pt-8 md:pt-12 animate-in fade-in zoom-in-95 duration-500")}>
        {/* Page Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center gap-3">
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
          
          {/* Unified Actions Bar */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
              {/* Search Field */}
              <div className="flex-1 max-w-xl">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Pesquisar em suas notas..."
                />
              </div>
              
              {/* Actions Group */}
              <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className={cn(ds.components.button.primary, "h-11 px-6 w-full sm:w-auto font-bold dark:text-white")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Anotação
                </Button>
              </div>
            </div>

            {/* Category Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <div className="flex items-center gap-2 mr-2 text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">Filtrar:</span>
              </div>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-bold transition-all border",
                    selectedCategory === cat
                      ? "bg-brand text-zinc-950 dark:text-white border-brand"
                      : "bg-zinc-100/50 dark:bg-zinc-900/50 text-muted-foreground border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  {cat}
                </button>
              ))}
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

        {/* Notes Sections */}
        {finalFilteredNotes && finalFilteredNotes.length > 0 ? (
          <div className="space-y-12">
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-brand fill-brand" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Notas Fixadas</h2>
                </div>
                <ResponsiveGrid gap="md" config={{ mobile: 1, tablet: 2, desktop: 3 }}>
                  {pinnedNotes.map((note, index) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      index={index}
                      onEdit={handleEditNote}
                      onResolve={handleResolveNote}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </ResponsiveGrid>
              </div>
            )}

            {/* Other Notes Section */}
            {otherNotes.length > 0 && (
              <div className="space-y-6">
                {pinnedNotes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Outras Anotações</h2>
                  </div>
                )}
                <ResponsiveGrid gap="md" config={{ mobile: 1, tablet: 2, desktop: 3 }}>
                  {otherNotes.map((note, index) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      index={index + pinnedNotes.length}
                      onEdit={handleEditNote}
                      onResolve={handleResolveNote}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </ResponsiveGrid>
              </div>
            )}
          </div>
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
        {finalResolvedNotes && finalResolvedNotes.length > 0 && (
          <div className="pt-12 mt-12 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className={cn(ds.typography.size.lg, "font-semibold text-foreground")}>
                Concluídas ({finalResolvedNotes.length})
              </h2>
            </div>
            
            <ResponsiveGrid gap="md" config={{ mobile: 1, tablet: 2, desktop: 3 }} className="opacity-60 hover:opacity-100 transition-opacity duration-300">
              {finalResolvedNotes.map((note) => (
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
