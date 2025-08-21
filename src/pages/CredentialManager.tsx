import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CredentialCard, type Credential } from "@/components/CredentialCard";
import { CredentialForm } from "@/components/CredentialForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function CredentialManager() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar credenciais do Supabase
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar credenciais: " + error.message,
          variant: "destructive",
        });
        return;
      }

      setCredentials(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar credenciais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCredentials = useMemo(() => {
    if (!searchTerm) return credentials;
    return credentials.filter(cred =>
      cred.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [credentials, searchTerm]);

  const handleSaveCredential = async (credentialData: Omit<Credential, "id"> & { id?: string }) => {
    try {
      if (credentialData.id) {
        // Editar existente
        const { error } = await supabase
          .from('credentials')
          .update({
            platform: credentialData.platform,
            domain: credentialData.domain,
            username: credentialData.username,
            password: credentialData.password,
          })
          .eq('id', credentialData.id);

        if (error) {
          toast({
            title: "Erro",
            description: "Erro ao atualizar credencial: " + error.message,
            variant: "destructive",
          });
          return;
        }
      } else {
        // Adicionar nova
        const { error } = await supabase
          .from('credentials')
          .insert([{
            platform: credentialData.platform,
            domain: credentialData.domain,
            username: credentialData.username,
            password: credentialData.password,
          }]);

        if (error) {
          toast({
            title: "Erro",
            description: "Erro ao adicionar credencial: " + error.message,
            variant: "destructive",
          });
          return;
        }
      }

      // Recarregar credenciais
      await fetchCredentials();
      setEditingCredential(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar credencial.",
        variant: "destructive",
      });
    }
  };

  const handleEditCredential = (credential: Credential) => {
    setEditingCredential(credential);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingCredential(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary shadow-elevated">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary-foreground" />
            <h1 className="text-3xl font-bold text-primary-foreground">
              Gerenciador de Credenciais
            </h1>
          </div>
          <p className="text-primary-foreground/80">
            Gerencie suas senhas de forma segura e compartilhe com sua equipe
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por plataforma, domínio ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleAddNew}
            variant="gradient"
            className="whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nova Credencial
          </Button>
        </div>

        {/* Lista de credenciais */}
        {loading ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando credenciais...</p>
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              {searchTerm ? "Nenhuma credencial encontrada" : "Nenhuma credencial cadastrada"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? "Tente usar outros termos de busca." 
                : "Adicione sua primeira credencial para começar."}
            </p>
            {!searchTerm && (
              <Button onClick={handleAddNew} variant="gradient">
                <Plus className="w-4 h-4" />
                Adicionar Primeira Credencial
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCredentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                onEdit={handleEditCredential}
              />
            ))}
          </div>
        )}

        {/* Estatísticas */}
        <div className="mt-8 p-6 bg-gradient-card rounded-lg border shadow-card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{credentials.length}</div>
              <div className="text-sm text-muted-foreground">Total de Credenciais</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{filteredCredentials.length}</div>
              <div className="text-sm text-muted-foreground">Resultados da Busca</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-glow">
                {new Set(credentials.map(c => c.domain)).size}
              </div>
              <div className="text-sm text-muted-foreground">Domínios Únicos</div>
            </div>
          </div>
        </div>
      </main>

      {/* Formulário Modal */}
      <CredentialForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        credential={editingCredential}
        onSave={handleSaveCredential}
      />
    </div>
  );
}