import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useState, useEffect } from "react";
import { Credential } from "./CredentialCard";
import { useToast } from "@/hooks/use-toast";

interface CredentialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential?: Credential | null;
  onSave: (credential: Omit<Credential, "id"> & { id?: string }) => void;
}

export function CredentialForm({ open, onOpenChange, credential, onSave }: CredentialFormProps) {
  const [formData, setFormData] = useState({
    platform: "",
    domain: "",
    username: "",
    password: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (credential) {
      setFormData({
        platform: credential.platform,
        domain: credential.domain,
        username: credential.username,
        password: credential.password,
      });
    } else {
      setFormData({
        platform: "",
        domain: "",
        username: "",
        password: "",
      });
    }
  }, [credential, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.username || !formData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      ...formData,
      id: credential?.id,
    });

    toast({
      title: "Sucesso!",
      description: credential ? "Credencial atualizada com sucesso." : "Credencial adicionada com sucesso.",
    });

    onOpenChange(false);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
    
    toast({
      title: "Senha gerada!",
      description: "Uma senha segura foi gerada automaticamente.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {credential ? "Editar Credencial" : "Nova Credencial"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma *</Label>
            <Input
              id="platform"
              placeholder="Ex: Gmail, Facebook, LinkedIn..."
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domínio</Label>
            <Input
              id="domain"
              placeholder="Ex: gmail.com, facebook.com..."
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Usuário *</Label>
            <Input
              id="username"
              placeholder="Email ou nome de usuário"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Senha *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
              >
                Gerar Senha
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Digite ou gere uma senha"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {credential ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}