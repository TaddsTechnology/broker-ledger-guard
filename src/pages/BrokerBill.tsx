import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface BillItem {
  expiryDate: string | null;
  securityName: string;
  side: string;
  quantity: number;
  price: number;
  amount: number;
  clientId: string;
  company_code: string | null;
  company_name: string | null;
  type: string;
  brokerage_rate_pct: number;
  brokerage_amount: number;
}

interface BillSummary {
  totalQuantity: number;
  totalAmount: number;
  totalBrokerage: number;
  numClients: number;
  numCompanies: number;
  numItems: number;
}

interface BrokerBillData {
  brokerId: string;
  clients: string[];
  clientPartyMap?: { [key: string]: string }; // Map of client code to party name
  items: BillItem[];
  summary: BillSummary;
}

function formatCurrency(n: number) {
  return `₹${(Number(n) || 0).toFixed(2)}`;
}

function combineBillsByBroker(bills: BrokerBillData[]): BrokerBillData | null {
  if (!Array.isArray(bills) || bills.length === 0) return null;
  const key = (b: BrokerBillData) => (b.brokerId || '').toString().trim().toUpperCase();
  const firstKey = key(bills[0]);
  // Combine all bills that share the same brokerId (even if array had more than 1)
  const same = bills.filter(b => key(b) === firstKey);
  const base: BrokerBillData = {
    brokerId: bills[0].brokerId,
    clients: [],
    items: [],
    summary: {
      totalQuantity: 0,
      totalAmount: 0,
      totalBrokerage: 0,
      numClients: 0,
      numCompanies: 0,
      numItems: 0,
    },
  };
  const clientSet = new Set<string>();
  const companySet = new Set<string>();
  for (const b of same) {
    b.clients.forEach(c => clientSet.add(c));
    base.items = base.items.concat(b.items);
    base.summary.totalQuantity += b.summary.totalQuantity;
    base.summary.totalAmount += b.summary.totalAmount;
    base.summary.totalBrokerage += b.summary.totalBrokerage;
    base.summary.numItems += b.summary.numItems;
    // track companies from items
    b.items.forEach(it => { if (it.company_code) companySet.add(it.company_code); });
  }
  base.clients = Array.from(clientSet);
  base.summary.numClients = base.clients.length;
  base.summary.numCompanies = companySet.size;
  return base;
}

export default function BrokerBill() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bill, setBill] = useState<BrokerBillData | null>(null);
  const { toast } = useToast();

  async function parseCsv(file: File): Promise<any[]> {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",");
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length === 1 && parts[0].trim() === "") continue;
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h.trim()] = (parts[idx] ?? '').trim();
      });
      rows.push(obj);
    }
    return rows;
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setBill(null);
    try {
      const rows = await parseCsv(file);
      const res = await fetch("http://localhost:3001/api/bills/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to preview");

      // Combine by broker (ensure single bill even if backend returned multiple)
      const combined = combineBillsByBroker(json?.bills || []);
      setBill(combined);
    } catch (err: any) {
      setError(err?.message || "Failed to generate broker bill");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBill = async () => {
    if (!bill) return;
    
    setSaving(true);
    try {
      // Ensure items have company_code extracted from securityName
      const itemsWithCompanyCode = bill.items.map(item => {
        // Extract company code from securityName if not already present
        if (!item.company_code && item.securityName) {
          // Use the same logic as in the backend
          const match = item.securityName.match(/^[A-Z]+/i);
          const code = (match ? match[0] : item.securityName).replace(/[^A-Z]/gi, '').toUpperCase();
          return {
            ...item,
            company_code: code || null
          };
        }
        return item;
      });
      
      const res = await fetch("http://localhost:3001/api/bills/create-broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerId: bill.brokerId,
          brokerCode: bill.brokerId, // Also pass brokerCode for consistency
          billDate: new Date().toISOString().split('T')[0], // Add today's date
          items: itemsWithCompanyCode,
        }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save bill");
      
      toast({
        title: "Success",
        description: "Broker bill saved successfully",
      });
      
      // Reset the form after successful save
      setBill(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save broker bill",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Build client-wise subtotals
  const clientGroups = (() => {
    if (!bill) return [] as { clientId: string; items: BillItem[]; subAmount: number; subBrokerage: number; }[];
    const map = new Map<string, { items: BillItem[]; subAmount: number; subBrokerage: number }>();
    for (const it of bill.items) {
      const key = (it.clientId || '').toString().trim().toUpperCase();
      if (!map.has(key)) map.set(key, { items: [], subAmount: 0, subBrokerage: 0 });
      const g = map.get(key)!;
      g.items.push(it);
      g.subAmount += Number(it.amount) || 0;
      g.subBrokerage += Number(it.brokerage_amount) || 0;
    }
    return Array.from(map.entries()).map(([clientId, v]) => ({ clientId, ...v }));
  })();

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader title="Broker Bill" description="Generate broker bill from CSV (combines all parties under the broker)" />

      <div className="p-6 space-y-6">
        <Card className="card-clean">
          <CardHeader>
            <CardTitle className="text-clean">Upload CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".csv" onChange={handleUpload} />
            {loading && <div className="text-muted-clean">Processing...</div>}
            {error && <div className="text-destructive">{error}</div>}
          </CardContent>
        </Card>

        {bill && (
          <Card className="card-clean">
            <CardHeader>
              <CardTitle className="text-clean">Broker: {bill.brokerId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-medium">Clients:</div>
                {bill.clients.map(clientCode => (
                  <div key={clientCode} className="text-sm text-muted-clean ml-4">
                    <span className="font-medium">{clientCode}</span>
                    {bill.clientPartyMap && bill.clientPartyMap[clientCode] && (
                      <span> - {bill.clientPartyMap[clientCode]}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Items table with client-wise grouping and subtotals */}
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full table-clean">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2">Company</th>
                      <th className="text-left px-4 py-2">Security</th>
                      <th className="text-left px-4 py-2">Type</th>
                      <th className="text-left px-4 py-2">Side</th>
                      <th className="text-right px-4 py-2">Qty</th>
                      <th className="text-right px-4 py-2">Price</th>
                      <th className="text-right px-4 py-2">Amount</th>
                      <th className="text-right px-4 py-2">Brokerage %</th>
                      <th className="text-right px-4 py-2">Brokerage</th>
                      <th className="text-left px-4 py-2">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientGroups.map((group) => (
                      <>
                        {group.items.map((it, idx) => (
                          <tr key={`${group.clientId}-${idx}`} className="hover-clean">
                            <td className="px-4 py-2">{it.company_code || "-"} {it.company_name && it.company_name !== it.company_code ? `- ${it.company_name}` : ""}</td>
                            <td className="px-4 py-2">{it.securityName}</td>
                            <td className="px-4 py-2">{it.type === 'D' ? 'Delivery' : it.type === 'T' ? 'Trading' : it.type || '-'}</td>
                            <td className="px-4 py-2">{it.side}</td>
                            <td className="px-4 py-2 text-right">{it.quantity}</td>
                            <td className="px-4 py-2 text-right">{Number(it.price).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{Number(it.amount).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{Number(it.brokerage_rate_pct).toFixed(2)}%</td>
                            <td className="px-4 py-2 text-right">{Number(it.brokerage_amount).toFixed(2)}</td>
                            <td className="px-4 py-2">{group.clientId}</td>
                          </tr>
                        ))}
                        {/* Subtotal row per client */}
                        <tr key={`subtotal-${group.clientId}`} className="bg-muted/40">
                          <td className="px-4 py-2 font-medium" colSpan={5}>Subtotal - {group.clientId}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(group.subAmount)}</td>
                          <td className="px-4 py-2 text-right"> </td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(group.subBrokerage)}</td>
                          <td className="px-4 py-2"> </td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Overall summary */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-clean">
                  <div>Total Items: {bill.summary.numItems}</div>
                  <div>Total Quantity: {bill.summary.totalQuantity}</div>
                  <div>Total Amount: {formatCurrency(bill.summary.totalAmount)}</div>
                  <div>Total Brokerage: {formatCurrency(bill.summary.totalBrokerage)}</div>
                </div>
                
                <Button 
                  onClick={handleSaveBill} 
                  disabled={saving}
                  className="bg-primary hover:bg-primary-hover"
                >
                  {saving ? "Saving..." : "Save Bill"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}