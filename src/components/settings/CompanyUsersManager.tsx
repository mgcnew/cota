import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useCompanyInvitations } from "@/hooks/useCompanyInvitations";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Trash2, Shield, UserCog, UserPlus, Mail, Clock, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { LimitAlert } from "@/components/billing/LimitAlert";
import { useUserRole } from "@/hooks/useUserRole";

export function CompanyUsersManager() {
  const { user: currentUser } = useAuth();
  const { users, isLoading, updateRole, removeUser } = useCompanyUsers();
  const { invitations, sendInvitation, cancelInvitation, isSendingInvitation } = useCompanyInvitations();
  const subscriptionLimits = useSubscriptionLimits();
  const { isOwner } = useUserRole();
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  const currentUserRole = users.find((u) => u.user_id === currentUser?.id)?.role;
  // Check if current user has admin or owner role using server-side validation
  const canManageUsers = currentUserRole === "owner" || currentUserRole === "admin";

  const handleSendInvitation = () => {
    if (!inviteEmail) return;
    
    // Verificar limite antes de enviar convite
    // Owners não têm limites
    if (!isOwner && !subscriptionLimits.canAddUser) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite de ${subscriptionLimits.maxUsers} usuários. Faça upgrade do plano para adicionar mais usuários.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    sendInvitation({ email: inviteEmail, role: inviteRole });
    setInviteEmail("");
    setInviteRole("member");
    setInviteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400">
            <Shield className="h-3 w-3 mr-1" />
            Proprietário
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
            <UserCog className="h-3 w-3 mr-1" />
            Administrador
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Membro
          </Badge>
        );
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setSelectedRole({ ...selectedRole, [userId]: newRole });
    updateRole({ userId, newRole });
  };

  return (
    <div className="space-y-6">
      {/* Alerta de limite de usuários */}
      <LimitAlert 
        resource="users"
        current={subscriptionLimits.currentUsers}
        max={subscriptionLimits.maxUsers}
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários da Empresa
              </CardTitle>
              <CardDescription>
                Gerencie os usuários que têm acesso à sua empresa ({users.length} {users.length === 1 ? "usuário" : "usuários"})
              </CardDescription>
            </div>
            {canManageUsers && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Convidar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convidar novo usuário</DialogTitle>
                    <DialogDescription>
                      Envie um convite por email para adicionar um novo usuário à sua empresa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@exemplo.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Função</Label>
                      <Select value={inviteRole} onValueChange={(value: "admin" | "member") => setInviteRole(value)}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSendInvitation} disabled={!inviteEmail || isSendingInvitation}>
                      {isSendingInvitation ? "Enviando..." : "Enviar Convite"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((user) => {
            const isCurrentUser = user.user_id === currentUser?.id;
            const canModify = canManageUsers && !isCurrentUser && user.role !== "owner";

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {user.email || `Usuário ${user.user_id.slice(0, 8)}`}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        Você
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    <span className="text-xs text-muted-foreground">
                      • Entrou em {new Date(user.joined_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canModify ? (
                    <>
                      <Select
                        value={selectedRole[user.user_id] || user.role}
                        onValueChange={(value) => handleRoleChange(user.user_id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O usuário perderá acesso a todos os
                              dados da empresa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeUser(user.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <div className="w-[140px] text-sm text-muted-foreground text-center">
                      {isCurrentUser ? "Você" : "Sem permissão"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!canManageUsers && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Somente proprietários e administradores podem gerenciar usuários
          </p>
        )}
      </CardContent>
    </Card>

    {/* Convites Pendentes */}
    {canManageUsers && invitations.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convites Pendentes
          </CardTitle>
          <CardDescription>
            Convites enviados aguardando resposta ({invitations.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{invitation.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {invitation.role === "admin" ? "Administrador" : "Membro"}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expira em {new Date(invitation.expires_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => cancelInvitation(invitation.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
    </div>
  );
}
