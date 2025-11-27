import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider, useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FOSidebar } from "@/components/FOSidebar";
import { AuthModal } from "@/components/AuthModal";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { ModuleSelector } from "@/pages/ModuleSelector";
import FODashboard from "./pages/fo/FODashboard";
import FOInstrumentMaster from "./pages/fo/FOInstrumentMaster";
import FOPartyMaster from "./pages/fo/FOPartyMaster";
import FOBrokerMaster from "./pages/fo/FOBrokerMaster";
import FOTrading from "./pages/fo/FOTrading";
import FOBills from "./pages/fo/FOBills";
import FOLedger from "./pages/fo/FOLedger";
import FOLedgerBills from "./pages/fo/FOLedgerBills";
import FOContracts from "./pages/fo/FOContracts";
import FOHoldings from "./pages/fo/FOHoldings";
import Dashboard from "./pages/Dashboard";
import PartyMaster from "./pages/PartyMaster";
import CompanyMaster from "./pages/CompanyMaster";
import SettlementMaster from "./pages/SettlementMaster";
import Trading from "./pages/Trading";
import Contracts from "./pages/Contracts";
import Holdings from "./pages/Holdings";
import Bills from "./pages/Bills";
import Reports from "./pages/Reports";
import Ledger from "./pages/Ledger";
import LedgerBills from "./pages/LedgerBills";
import Interest from "./pages/Interest";
import EquityInterest from "./pages/EquityInterest";
import Settings from "./pages/Settings";
import DataManagement from "./pages/DataManagement";
import BrokerMaster from "./pages/BrokerMaster";
import NotFound from "./pages/NotFound";
import CashModulePage from "./pages/CashModulePage";
import EquitySummaryModulePage from "./pages/EquitySummaryModulePage";
import FOSummaryModulePage from "./pages/FOSummaryModulePage";
import FOCashModulePage from "./pages/FOCashModulePage";
import SummaryModulePage from "./pages/SummaryModulePage";

const queryClient = new QueryClient();

const AppContent = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  const location = useLocation();

  // Determine which sidebar to show based on the module
  const isEquityModule = location.pathname.startsWith('/equity');
  const isFOModule = location.pathname.startsWith('/fo');
  const showSidebar = isEquityModule || isFOModule;

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
        if (showSidebar) {
          toggleSidebar();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, showSidebar]);

  return (
    <>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      <KeyboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
      
      <div className="flex min-h-screen w-full bg-background">
        {showSidebar && (
          isEquityModule ? (
            <AppSidebar onLogout={() => {
              sessionStorage.removeItem("isAuthenticated");
              window.location.reload();
            }} />
          ) : (
            <FOSidebar onLogout={() => {
              sessionStorage.removeItem("isAuthenticated");
              window.location.reload();
            }} />
          )
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/modules" replace />} />
            <Route path="/modules" element={<ModuleSelector />} />
            
            {/* F&O Module Routes */}
            <Route path="/fo/dashboard" element={<FODashboard />} />
            <Route path="/fo/master/party" element={<FOPartyMaster />} />
            <Route path="/fo/master/broker" element={<FOBrokerMaster />} />
            <Route path="/fo/master/instruments" element={<FOInstrumentMaster />} />
            <Route path="/fo/trading" element={<FOTrading />} />
            <Route path="/fo/contracts" element={<FOContracts />} />
            <Route path="/fo/positions" element={<FOHoldings />} />
            <Route path="/fo/bills" element={<FOBills />} />
            <Route path="/fo/ledger" element={<FOLedger />} />
            <Route path="/fo/ledger/bills" element={<FOLedgerBills />} />
            <Route path="/fo/interest" element={<Interest />} />
            <Route path="/fo/summary" element={<FOSummaryModulePage />} />
            <Route path="/fo/cash" element={<FOCashModulePage />} />
            
            {/* Equity Module Routes */}
            <Route path="/equity/dashboard" element={<Dashboard />} />
            <Route path="/equity/master/party" element={<PartyMaster />} />
            <Route path="/equity/master/broker" element={<BrokerMaster />} />
            <Route path="/equity/master/company" element={<CompanyMaster />} />
            <Route path="/equity/master/settlement" element={<SettlementMaster />} />
            <Route path="/equity/trading" element={<Trading />} />
            <Route path="/equity/contracts" element={<Contracts />} />
            <Route path="/equity/holdings" element={<Holdings />} />
            <Route path="/equity/bills" element={<Bills />} />
            <Route path="/equity/reports" element={<Reports />} />
            <Route path="/equity/reports/party" element={<Reports />} />
            <Route path="/equity/reports/trading" element={<Reports />} />
            <Route path="/equity/ledger" element={<Ledger />} />
            <Route path="/equity/ledger/bills" element={<LedgerBills />} />
            <Route path="/equity/interest" element={<EquityInterest />} />
            <Route path="/equity/cash" element={<CashModulePage />} />
            <Route path="/equity/summary" element={<EquitySummaryModulePage />} />
            <Route path="/equity/settings" element={<Settings />} />
            <Route path="/equity/settings" element={<Settings />} />
            <Route path="/equity/settings/data" element={<DataManagement />} />
            
            {/* Legacy routes - redirect to equity module */}
            <Route path="/dashboard" element={<Navigate to="/equity/dashboard" replace />} />
            <Route path="/master/*" element={<Navigate to="/modules" replace />} />
            <Route path="/trading" element={<Navigate to="/equity/trading" replace />} />
            <Route path="/contracts" element={<Navigate to="/equity/contracts" replace />} />
            <Route path="/holdings" element={<Navigate to="/equity/holdings" replace />} />
            <Route path="/bills" element={<Navigate to="/equity/bills" replace />} />
            <Route path="/reports" element={<Navigate to="/equity/reports" replace />} />
            <Route path="/ledger" element={<Navigate to="/equity/ledger" replace />} />
            <Route path="/settings" element={<Navigate to="/equity/settings" replace />} />
            
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
    const authStatus = sessionStorage.getItem("isAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleAuthenticate = async (password: string): Promise<boolean> => {
    // This function is no longer needed as AuthModal handles it internally
    return false;
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ModuleProvider>
          <Toaster />
          <Sonner duration={1000} />
          {!isAuthenticated ? (
            <AuthModal onAuthenticate={handleAuthenticate} />
          ) : (
            <BrowserRouter>
              <SidebarProvider defaultOpen>
                <AppContent />
              </SidebarProvider>
            </BrowserRouter>
          )}
        </ModuleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
