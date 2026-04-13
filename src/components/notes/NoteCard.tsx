import { memo } from "react";
import { CSSSlideIn } from "@/components/ui/css-animation";
import { Button } from "@/components/ui/button";
import { AlertCircle, MessageSquare, Clock, Edit, Trash2, CheckCircle2, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Note, Importance } from "@/hooks/useNotes";
import { designSystem as ds } from "@/styles/design-system";

const categoryConfig: Record<string, { color: string; bg: string; border: string }> = {
  "Geral": {
    color: "text-zinc-500",
    bg: "bg-zinc-50 dark:bg-zinc-900/40",
    border: "border-zinc-200 dark:border-zinc-800",
  },
  "Trabalho": {
    color: "text-blue-500",
    bg: "bg-blue-50/50 dark:bg-blue-900/10",
    border: "border-blue-100 dark:border-blue-800/50",
  },
  "Pessoal": {
    color: "text-emerald-500",
    bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
    border: "border-emerald-100 dark:border-emerald-800/50",
  },
  "Urgente": {
    color: "text-red-500",
    bg: "bg-red-50/50 dark:bg-red-900/10",
    border: "border-red-100 dark:border-red-800/50",
  },
  "Ideias": {
    color: "text-amber-500",
    bg: "bg-amber-50/50 dark:bg-amber-900/10",
    border: "border-amber-100 dark:border-amber-800/50",
  },
};

const importanceConfig = {
  low: { label: "Baixa", color: "text-zinc-400" },
  medium: { label: "Média", color: "text-indigo-500" },
  high: { label: "Alta", color: "text-orange-500" },
  urgent: { label: "Urgente", color: "text-red-500" },
};

interface NoteCardProps {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onResolve: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (note: Note) => void;
}

export const NoteCard = memo(({ note, index, onEdit, onResolve, onDelete, onTogglePin }: NoteCardProps) => {
  const config = categoryConfig[note.category || "Geral"];
  const importance = importanceConfig[note.importance];

  return (
    <CSSSlideIn direction="up" duration={400} delay={index * 30}>
      <div className={cn(
        ds.components.card.root,
        "group relative flex flex-col h-full transition-all duration-300 overflow-hidden",
        "border-zinc-200/60 dark:border-zinc-800/60 hover:border-brand/40 shadow-none hover:shadow-xl",
        note.pinned && "ring-1 ring-brand/30 border-brand/30"
      )}>
        {/* Category Accent Line */}
        <div className={cn("absolute top-0 left-0 w-full h-1", config.color.replace("text-", "bg-"))} />
        
        {/* Pin Button */}
        <button
          onClick={() => onTogglePin(note)}
          className={cn(
            "absolute top-3 right-3 p-1.5 rounded-lg transition-all z-10",
            note.pinned 
              ? "bg-brand text-zinc-950 dark:text-white opacity-100" 
              : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
          title={note.pinned ? "Desafixar" : "Fixar"}
        >
          {note.pinned ? <PinOff className="h-3.5 w-3.5 fill-current" /> : <Pin className="h-3.5 w-3.5" />}
        </button>

        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
              config.color, config.bg, config.border
            )}>
              {note.category || "Geral"}
            </span>
            {note.importance !== "low" && (
              <span className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-1", importance.color)}>
                <AlertCircle className="h-2.5 w-2.5" />
                {importance.label}
              </span>
            )}
          </div>
          <h3 className={cn(ds.typography.size.base, "font-bold text-foreground leading-snug line-clamp-2 pr-6")}>
            {note.title}
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 py-2 flex-1">
          <p className="text-sm text-muted-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-6">
            {note.content}
          </p>
          
          {note.observation && (
            <div className="mt-4 pt-4 border-t border-border/40 relative">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="p-1 rounded bg-brand/10">
                  <MessageSquare className="h-2.5 w-2.5 text-brand" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Alt. Observação</span>
              </div>
              <p className="text-xs text-muted-foreground/80 italic line-clamp-2 pl-2 border-l-2 border-brand/30">
                {note.observation}
              </p>
            </div>
          )}
        </div>

        {/* Action Tray */}
        <div className="p-4 px-6 flex items-center justify-between mt-auto bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center text-[10px] font-bold text-muted-foreground/60 tracking-wider">
            <Clock className="h-3 w-3 mr-1.5 text-brand/60" />
            {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(note)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-brand hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Editar"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onResolve(note.id)}
              className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-500/10"
              title="Concluir"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(note.id)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </CSSSlideIn>
  );
});

