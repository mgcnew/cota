import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommunicationHubDrawer } from "./CommunicationHubDrawer";
import { useNotificationHub } from "@/hooks/useNotificationHub";
import bellIcon from "@/assets/icons/bell.svg";

export function WhatsAppNotificationBell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { totalCount, recentResponses, urgentCotacoes, reload } = useNotificationHub();

  const tooltipText = totalCount === 0
    ? "Notificações"
    : `${totalCount} notificação${totalCount !== 1 ? 'ões' : ''} pendente${totalCount !== 1 ? 's' : ''}`;

  return (
    <div className="relative">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDrawerOpen(true)}
              className={cn(
                "relative group w-10 h-10 p-0 rounded-xl flex items-center justify-center transition-all duration-300",
                totalCount > 0
                  ? "bg-brand/10 text-brand shadow-lg shadow-brand/10 ring-1 ring-brand/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-accent"
              )}
            >
              <img
                src={bellIcon}
                alt=""
                className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110",
                  totalCount > 0 && "animate-pulse"
                )}
              />

              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[8px] font-bold text-white ring-2 ring-white animate-in zoom-in">
                  {totalCount > 9 ? "9+" : totalCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={16} className="font-semibold text-xs py-1.5 border border-brand/20 shadow-lg">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CommunicationHubDrawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) reload();
        }}
        recentResponses={recentResponses}
        urgentCotacoes={urgentCotacoes}
      />
    </div>
  );
}
