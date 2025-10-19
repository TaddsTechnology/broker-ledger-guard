import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthModalProps {
  onAuthenticate: (password: string) => Promise<boolean>;
}

export const AuthModal = ({ onAuthenticate }: AuthModalProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const isValid = await onAuthenticate(password);
    
    if (!isValid) {
      setError("Invalid password. Please try again.");
      setPassword("");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-elevated border-primary/20">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-glow">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Stock Broker ERP</CardTitle>
          <CardDescription className="text-base">
            Enter admin password to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-lg bg-secondary border-border focus:border-primary"
                autoFocus
                disabled={isLoading}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary-hover transition-colors"
              disabled={isLoading || !password}
            >
              {isLoading ? "Verifying..." : "Access System"}
            </Button>
            <div className="space-y-2 text-xs text-muted-foreground text-center">
              <p>Login: <code className="bg-muted px-1 rounded">admin</code></p>
              <p className="text-destructive">
                ⚠️ Reset Database: <code className="bg-muted px-1 rounded">nimda</code> (Use with caution!)
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
