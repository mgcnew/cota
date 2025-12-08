import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCorporateGroup } from "@/hooks/useCorporateGroup";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CorporateGroupManager() {
  const { isOwner, isLoading: roleLoading } = useUserRole();
  const { group, isLoading, createGroup, updateGroup } = useCorporateGroup();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  if (roleLoading || isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!isOwner) {
    return null;
  }

  const handleCreateGroup = () => {
    createGroup({
      name: newGroupName,
      description: newGroupDescription,
    });
    setIsCreateDialogOpen(false);
    setNewGroupName("");
    setNewGroupDescription("");
  };

  const handleUpdateGroup = () => {
    if (group) {
      updateGroup({
        id: group.id,
        data: {
          name: editName || group.name,
          description: editDescription || group.description,
        },
      });
    }
  };

  if (!group) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grupo Corporativo</CardTitle>
          <CardDescription>
            Crie um grupo corporativo para gerenciar múltiplas empresas e obter descontos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Grupo Corporativo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Grupo Corporativo</DialogTitle>
                <DialogDescription>
                  Adicione informações sobre seu grupo corporativo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Nome do Grupo</Label>
                  <Input
                    id="group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ex: Grupo Empresarial ABC"
                    inputMode="text"
                    autoComplete="organization"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-description">Descrição (opcional)</Label>
                  <Textarea
                    id="group-description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Descreva seu grupo corporativo..."
                    inputMode="text"
                    className="min-h-[88px]"
                  />
                </div>
                <Button onClick={handleCreateGroup} disabled={!newGroupName}>
                  Criar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {group.name}
        </CardTitle>
        <CardDescription>
          Gerencie as informações do seu grupo corporativo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Empresas no Grupo</p>
            <p className="text-2xl font-bold">{group.companies_count}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Desconto Aplicado</p>
            <p className="text-2xl font-bold text-green-600">{group.calculated_discount}%</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Grupo</Label>
            <Input
              id="edit-name"
              defaultValue={group.name}
              onChange={(e) => setEditName(e.target.value)}
              inputMode="text"
              autoComplete="organization"
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              defaultValue={group.description || ""}
              onChange={(e) => setEditDescription(e.target.value)}
              inputMode="text"
              className="min-h-[88px]"
            />
          </div>
          <Button onClick={handleUpdateGroup} className="min-h-[44px]">
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-medium">Tabela de Descontos</h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>• 2-4 empresas: 10% de desconto</p>
            <p>• 3-4 empresas: 15% de desconto</p>
            <p>• 5-9 empresas: 20% de desconto</p>
            <p>• 10+ empresas: 30% de desconto</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
