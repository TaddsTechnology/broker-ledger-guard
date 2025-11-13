import { useState } from "react";
import { Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AuthModalProps {
  onAuthenticate: (password: string) => Promise<boolean>;
}

export const AuthModal = ({ onAuthenticate }: AuthModalProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNuclearWarning, setShowNuclearWarning] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password === "admin") {
      // Normal login
      sessionStorage.setItem("isAuthenticated", "true");
      toast({
        title: "Welcome! 👋",
        description: "Access granted",
      });
      window.location.reload();
    } else if (password === "nimda") {
      // Nuclear option - show warning
      setIsLoading(false);
      setShowNuclearWarning(true);
    } else {
      setError("Invalid password. Please try again.");
      setPassword("");
      setIsLoading(false);
    }
  };

  const executeNuclearOption = async () => {
    try {
      toast({
        title: "🔥 NUCLEAR MODE ACTIVATED",
        description: "Deleting all database entries...",
        variant: "destructive",
      });

      const response = await fetch("http://localhost:3001/api/nuclear-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to reset database");
      }

      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();

      toast({
        title: "💥 Database Cleared",
        description: "All data has been permanently deleted. Reloading...",
        variant: "destructive",
      });

      // Reload app after 2 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);

    } catch (error) {
      console.error("Nuclear reset error:", error);
      toast({
        title: "Error",
        description: "Failed to complete nuclear reset",
        variant: "destructive",
      });
      setShowNuclearWarning(false);
      setPassword("");
    }
  };

  return (
    <>
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

      {/* Nuclear Warning Dialog */}
      <AlertDialog open={showNuclearWarning} onOpenChange={setShowNuclearWarning}>
        <AlertDialogContent className="border-red-500 border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              NUCLEAR RESET WARNING
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-4">
              <p className="font-bold text-lg text-foreground">
                You are about to execute the NUCLEAR OPTION!
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-4 space-y-2">
                <p className="text-red-800 font-semibold">This will PERMANENTLY:</p>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>Delete ALL database entries</li>
                  <li>Remove ALL bills, contracts, parties</li>
                  <li>Erase ALL ledger entries</li>
                  <li>Clear ALL master data</li>
                </ul>
              </div>
              <p className="font-bold text-red-600">
                ⚠️ THIS CANNOT BE UNDONE! ⚠️
              </p>
              <p className="text-sm">
                Are you absolutely sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowNuclearWarning(false);
                setPassword("");
              }}
              className="font-semibold"
            >
              Cancel (Safe)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeNuclearOption}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              YES, DELETE EVERYTHING
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
