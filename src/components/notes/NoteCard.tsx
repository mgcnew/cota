import { memo } from "react";
import { CSSSlideIn } from "@/components/ui/css-animation";
import { Button } from "@/components/ui/button";
import { AlertCircle, MessageSquare, Clock, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Note, Importance } from "@/hooks/useNotes";
import { ds } from "@/styles/design-system";

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

interface NoteCardProps {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onResolve: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

export const NoteCard = memo(({ note, index, onEdit, onResolve, onDelete }: NoteCardProps) => {
  const config = importanceConfig[note.importance];

  return (
    <CSSSlideIn direction="up" duration={300} delay={index * 50}>
      <div className={cn(
        ds.components.card.root,
        "group relative flex flex-col h-full hover:shadow-lg hover:shadow-brand/5 transition-all duration-300"
      )}>
        
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between gap-3">
          <h3 className={cn(ds.typography.size.base, "font-bold text-foreground leading-tight line-clamp-2")}>
            {note.title}
          </h3>
          
          {/* Indicador de Status (Exclamação) */}
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-xl shrink-0 transition-colors border",
            config.bg,
            config.border
          )}>
            <AlertCircle className={cn("h-4 w-4", config.color)} />
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-2 flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-5">
            {note.content}
          </p>
          
          {note.observation && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="h-3 w-3 text-brand" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Observação</span>
              </div>
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                {note.observation}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-between mt-auto border-t border-transparent group-hover:border-border/50 transition-colors">
          <div className="flex items-center text-[11px] font-semibold text-muted-foreground/70">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-brand/70" />
            {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(note)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-brand hover:bg-brand/10"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(note.id)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onResolve(note.id)}
              className="h-8 w-8 rounded-lg text-emerald-600 bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
              title="Concluir"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </CSSSlideIn>
  );
});
