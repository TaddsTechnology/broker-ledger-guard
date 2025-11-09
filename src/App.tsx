import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
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
import LedgerBills from "./pages/LedgerBills";
import Settings from "./pages/Settings";
import DataManagement from "./pages/DataManagement";
import BrokerMaster from "./pages/BrokerMaster";
import NotFound from "./pages/NotFound";
import BrokerBill from "./pages/BrokerBill";

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
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/master/party" element={<PartyMaster />} />
            <Route path="/master/broker" element={<BrokerMaster />} />
            <Route path="/master/company" element={<CompanyMaster />} />
            <Route path="/master/settlement" element={<SettlementMaster />} />
            <Route path="/trading" element={<Trading />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/bills/broker" element={<BrokerBill />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/party" element={<Reports />} />
            <Route path="/reports/trading" element={<Reports />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/ledger/bills" element={<LedgerBills />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/data" element={<DataManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </main>
        </div>
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
    // Normal login
    if (password === "admin") {
      setIsAuthenticated(true);
      sessionStorage.setItem("broker_erp_auth", "authenticated");
      return true;
    }
    
    // Reverse password - delete all entries (functionality removed)
    if (password === "nimda") {
      // TODO: Implement data deletion with proper UI confirmation
      return false;
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
        <Toaster duration={1000} />
        <Sonner duration={1000} />
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
