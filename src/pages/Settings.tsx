import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Loader2 } from "lucide-react";
import { useState } from "react";

const API_BASE = "http://localhost:3001";

const Settings = () => {
  const { toast } = useToast();
  const [recalculatingEquity, setRecalculatingEquity] = useState(false);
  const [recalculatingFO, setRecalculatingFO] = useState(false);

  const handleRecalculateEquity = async () => {
    setRecalculatingEquity(true);
    try {
      const response = await fetch(`${API_BASE}/api/equity/ledger/recalculate-balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate balances');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Recalculated ${data.totalUpdated} equity ledger entries successfully!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to recalculate equity balances",
        variant: "destructive",
      });
    } finally {
      setRecalculatingEquity(false);
    }
  };

  const handleRecalculateFO = async () => {
    setRecalculatingFO(true);
    try {
      const response = await fetch(`${API_BASE}/api/fo/recalculate-balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate F&O balances');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message || "F&O balances recalculated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to recalculate F&O balances",
        variant: "destructive",
      });
    } finally {
      setRecalculatingFO(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Application Settings"
        description="Configure system settings and preferences"
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ledger Balance Recalculation</CardTitle>
            <CardDescription>
              Recalculate all ledger balances from scratch. Use this if you notice incorrect balance calculations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Equity Ledger</h3>
                <p className="text-sm text-muted-foreground">
                  Recalculates all party and broker balances in the equity ledger
                </p>
              </div>
              <Button 
                onClick={handleRecalculateEquity}
                disabled={recalculatingEquity}
                className="min-w-[140px]"
              >
                {recalculatingEquity ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Recalculate
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">F&O Ledger</h3>
                <p className="text-sm text-muted-foreground">
                  Recalculates all party and broker balances in the F&O ledger
                </p>
              </div>
              <Button 
                onClick={handleRecalculateFO}
                disabled={recalculatingFO}
                className="min-w-[140px]"
              >
                {recalculatingFO ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Recalculate
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This operation recalculates balances based on existing debit/credit entries. 
                It may take a few moments depending on the number of ledger entries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;