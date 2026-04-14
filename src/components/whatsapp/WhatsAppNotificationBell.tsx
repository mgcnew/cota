import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommunicationHubDrawer } from "./CommunicationHubDrawer";

export function WhatsAppNotificationBell() {
  const { data: company } = useCompany();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!company) return;

    // Load initial count
    const loadCount = async () => {
      const { count, error } = await supabase
        .from('whatsapp_responses')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('is_processed', false);

      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    loadCount();

    // Subscribe to changes
    const channel = supabase
      .channel('whatsapp-bell')
      .on('postgres_changes' as any, 
        { 
          event: '*', 
          table: 'whatsapp_responses',
          filter: `company_id=eq.${company.id}`
        }, 
        () => {
          loadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company]);

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
                unreadCount > 0 
                  ? "bg-brand/10 text-brand shadow-lg shadow-brand/10 ring-1 ring-brand/20" 
                  : "bg-muted/50 text-muted-foreground hover:bg-accent"
              )}
            >
              <Bell className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                unreadCount > 0 && "animate-pulse"
              )} />
              
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[8px] font-bold text-white ring-2 ring-white animate-in zoom-in">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={16} className="font-semibold text-xs py-1.5 border border-brand/20 shadow-lg">
            {unreadCount > 0 
              ? `${unreadCount} novas interações de WhatsApp` 
              : "Notificações do WhatsApp"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CommunicationHubDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onSelectNotification={(quoteId) => {
          console.log("Selecionado quote:", quoteId);
          // Opcional: Navegar ou abrir modal de cotação
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
}
