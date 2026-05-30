import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LoginForm } from "./LoginForm";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <BrandLogo className="h-9" />
            <div className="space-y-1">
              <DialogTitle className="text-xl font-extrabold tracking-tight">Acessar Sistema</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Entre com suas credenciais para continuar
              </DialogDescription>
            </div>
          </div>

          <LoginForm
            autoFocus={open}
            onSuccess={() => {
              onOpenChange(false);
              navigate("/dashboard");
            }}
          />

          <p className="text-center text-xs leading-relaxed text-muted-foreground/70">
            Problemas com o acesso? Fale com o administrador do sistema.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
