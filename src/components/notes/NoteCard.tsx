import { memo } from "react";
import { CSSSlideIn } from "@/components/ui/css-animation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, MessageSquare, Clock, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Note, Importance } from "@/hooks/useNotes";

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
      <Card className="group relative flex flex-col h-full bg-card border border-border hover:border-border/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-xl overflow-hidden">
        
        {/* Header Minimalista */}
        <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between space-y-0 gap-3">
          <CardTitle className="text-base font-semibold text-foreground leading-tight line-clamp-2">
            {note.title}
          </CardTitle>
          
          {/* Indicador de Status (Exclamação) */}
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors",
            config.bg
          )}>
            <AlertCircle className={cn("h-3.5 w-3.5", config.color)} />
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-2 flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-5">
            {note.content}
          </p>
          
          {note.observation && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">Observação</span>
              </div>
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                {note.observation}
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer com Ações e Data */}
        <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between border-t border-transparent group-hover:border-border/50 transition-colors">
          <div className="flex items-center text-[11px] font-medium text-muted-foreground/70">
            <Clock className="h-3 w-3 mr-1.5" />
            {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-2 group-hover:translate-y-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(note)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
              title="Editar"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(note.id)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onResolve(note.id)}
              className="h-8 w-8 rounded-lg text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40"
              title="Concluir"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </CSSSlideIn>
  );
});
