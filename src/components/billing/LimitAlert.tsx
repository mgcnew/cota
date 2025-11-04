import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/components/auth/AuthProvider";

interface LimitAlertProps {
  resource: "users" | "products" | "suppliers";
  current: number;
  max: number;
  onUpgrade?: () => void;
}

export function LimitAlert({ resource, current, max, onUpgrade }: LimitAlertProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner } = useUserRole();
  
  // Lista de emails conhecidos de owners do sistema (para casos especiais)
  const ownerEmails = ['mgc.info.new@gmail.com'];
  const userIsOwner = isOwner === true || (user?.email && ownerEmails.includes(user.email.toLowerCase().trim()));
  
  // Owners não veem alertas de limite
  if (userIsOwner) return null;
  
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  if (!isNearLimit) return null;

  const resourceNames = {
    users: "usuários",
    products: "produtos",
    suppliers: "fornecedores",
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate("/pricing");
    }
  };

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? "Limite Atingido" : "Limite Próximo"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p>
          Você está usando {current} de {max === Infinity ? "ilimitado" : max} {resourceNames[resource]}.
          {isAtLimit && " Não é possível adicionar mais."}
          {isNearLimit && !isAtLimit && " Considere fazer upgrade do plano."}
        </p>
        {isAtLimit && (
          <Button 
            onClick={handleUpgrade} 
            className="mt-3"
            size="sm"
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Fazer Upgrade
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}


