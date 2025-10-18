import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthModal } from "@/components/AuthModal";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import Dashboard from "./pages/Dashboard";
import PartyMaster from "./pages/PartyMaster";
import CompanyMaster from "./pages/CompanyMaster";
import SettlementMaster from "./pages/SettlementMaster";
import Trading from "./pages/Trading";
import Contracts from "./pages/Contracts";
import Bills from "./pages/Bills";
import Reports from "./pages/Reports";
import Ledger from "./pages/Ledger";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const AppContent = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  // Global keyboard shortcuts
  useGlobalShortcuts(
    () => setCommandPaletteOpen(true),
    () => setHelpOpen(true)
  );

  // Toggle sidebar with Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return (
    <>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      <KeyboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
      
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar onLogout={() => {
          sessionStorage.removeItem("broker_erp_auth");
          window.location.reload();
        }} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/master/party" element={<PartyMaster />} />
            <Route path="/master/company" element={<CompanyMaster />} />
            <Route path="/master/settlement" element={<SettlementMaster />} />
            <Route path="/trading" element={<Trading />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user has a valid session
    const authStatus = sessionStorage.getItem("broker_erp_auth");
    if (authStatus === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleAuthenticate = async (password: string): Promise<boolean> => {
    // In a real app, this would verify against the hashed password in the database
    // For demo purposes, we'll just check against the default password
    if (password === "admin123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("broker_erp_auth", "authenticated");
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("broker_erp_auth");
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal onAuthenticate={handleAuthenticate} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider defaultOpen>
            <AppContent />
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
