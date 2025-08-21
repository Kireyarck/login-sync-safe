import { Copy, Edit, Eye, EyeOff, Globe, Key, User } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useToast } from "@/hooks/use-toast";

export interface Credential {
  id: string;
  platform: string;
  domain: string | null;
  username: string;
  password: string;
  created_at?: string;
  updated_at?: string;
}

interface CredentialCardProps {
  credential: Credential;
  onEdit: (credential: Credential) => void;
}

export function CredentialCard({ credential, onEdit }: CredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: "usuário" | "senha") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${type} copiado para a área de transferência.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const name = platform.toLowerCase();
    if (name.includes("google") || name.includes("gmail")) return "🌐";
    if (name.includes("facebook") || name.includes("meta")) return "📘";
    if (name.includes("instagram")) return "📷";
    if (name.includes("linkedin")) return "💼";
    if (name.includes("github")) return "🐙";
    if (name.includes("twitter") || name.includes("x.com")) return "🐦";
    return "🔐";
  };

  return (
    <Card className="shadow-card hover:shadow-elevated transition-smooth group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getPlatformIcon(credential.platform)}</div>
            <div>
              <h3 className="font-semibold text-card-foreground">{credential.platform}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {credential.domain}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(credential)}
            className="opacity-0 group-hover:opacity-100 transition-smooth"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm">{credential.username}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(credential.username, "usuário")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm">
                {showPassword ? credential.password : "•".repeat(credential.password.length)}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(credential.password, "senha")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}