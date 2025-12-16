import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PartySummaryRow {
  party_code: string;
  party_name: string;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
}

const API_BASE = "http://localhost:3001";

const formatCurrency = (value: number) => {
  if (isNaN(value)) return "₹0.00";
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// New function to format closing balance with CR/DR symbols
const formatClosingBalance = (value: number, partyCode: string = '') => {
  if (isNaN(value)) return "₹0.00";
  const absValue = Math.abs(value);
  const formattedValue = `₹${absValue.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  
  // Special case: Sub-Broker Profit is always CR (your earnings)
  if (partyCode === 'SUB-BROKER') {
    return `${formattedValue} CR`;
  }
  
  // Accounting convention for regular parties:
  // Positive balance (Debit > Credit) = DR (party owes you money)
  // Negative balance (Credit > Debit) = CR (you owe party money)
  if (value > 0) {
    return `${formattedValue} DR`;
  } else if (value < 0) {
    return `${formattedValue} CR`;
  } else {
    return formattedValue;
  }
};

export default function SummaryModulePage() {
  const [module, setModule] = useState<"equity" | "fo">("equity");
  const [rows, setRows] = useState<PartySummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (mod: "equity" | "fo") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/summary/parties?module=${encodeURIComponent(mod)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load summary");
      }
      const data: PartySummaryRow[] = await res.json();
      setRows(data);
    } catch (err: any) {
      setError(err.message || "Failed to load summary");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(module);
  }, [module]);

  const totalDebit = rows.reduce((s, r) => s + (Number(r.total_debit) || 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (Number(r.total_credit) || 0), 0);
  const totalClosing = rows.reduce((s, r) => s + (Number(r.closing_balance) || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Party Ledger Summary</h1>
        <div className="flex items-center gap-2">
          <Select
            value={module}
            onValueChange={(v: any) => setModule(v)}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="fo">F&O</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" type="button" onClick={() => fetchSummary(module)}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        {loading && <p className="text-sm text-muted-foreground">Loading summary...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="max-h-[70vh] overflow-y-auto border rounded-md text-xs">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-2 py-1 text-left">Party Code</th>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-right">Debit</th>
                  <th className="px-2 py-1 text-right">Credit</th>
                  <th className="px-2 py-1 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.party_code} className="border-t">
                    <td className="px-2 py-1 align-top font-medium">{r.party_code}</td>
                    <td className="px-2 py-1 align-top text-muted-foreground">{r.party_name}</td>
                    <td className="px-2 py-1 text-right align-top">{formatCurrency(r.total_debit)}</td>
                    <td className="px-2 py-1 text-right align-top">{formatCurrency(r.total_credit)}</td>
                    <td className="px-2 py-1 text-right align-top font-semibold">{formatClosingBalance(r.closing_balance, r.party_code)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-3 text-center text-muted-foreground">
                      No ledger entries found.
                    </td>
                  </tr>
                )}
                {rows.length > 0 && (
                  <tr className="border-t bg-muted/40 font-semibold">
                    <td className="px-2 py-1" colSpan={2}>
                      Total Parties: {rows.length}
                    </td>
                    <td className="px-2 py-1 text-right">{formatCurrency(totalDebit)}</td>
                    <td className="px-2 py-1 text-right">{formatCurrency(totalCredit)}</td>
                    <td className="px-2 py-1 text-right">{formatClosingBalance(totalClosing)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
