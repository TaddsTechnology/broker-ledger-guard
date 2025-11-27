import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { List } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Plus, Wallet } from "lucide-react";

interface CashTransaction {
  id: string;
  date: string;
  party_code: string;
  amount: number;
  type: "RECEIPT" | "PAYMENT";
  narration: string | null;
  mode: string;
}

// Add Party interface for autocomplete
interface Party {
  id: string;
  party_code: string;
  name: string;
}

interface CashBookResponse {
  date: string;
  opening_balance: number;
  receipts: number;
  payments: number;
  closing_balance: number;
  transactions: CashTransaction[];
}

interface CashLedgerEntry {
  date: string;
  party_code: string;
  type: "RECEIPT" | "PAYMENT";
  narration: string | null;
  debit: number;
  credit: number;
  balance: number;
}

interface CashLedgerResponse {
  party_code: string;
  opening_balance: number;
  closing_balance: number;
  entries: CashLedgerEntry[];
}

interface CashSummaryRow {
  party_code: string;
  party_name: string;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
}

const formatCurrency = (value: number) => {
  if (isNaN(value)) return "₹0.00";
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function CashModulePage() {
  // View state
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  
  // Add Cash form state
  const [cashDate, setCashDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [partyCode, setPartyCode] = useState("");
  const [cashType, setCashType] = useState<"RECEIPT" | "PAYMENT">("RECEIPT");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Party autocomplete state
  const [partySuggestions, setPartySuggestions] = useState<Party[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allParties, setAllParties] = useState<Party[]>([]);

  // Cash book state
  const [bookDate, setBookDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [cashBook, setCashBook] = useState<CashBookResponse | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  // Recent transactions state
  const [recentTransactions, setRecentTransactions] = useState<CashTransaction[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const handleCreateCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = Number(amount);
    if (!partyCode) {
      setFormError("Party code is required");
      return;
    }
    if (!amount || !Number.isFinite(amt) || amt <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/cash/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: cashDate,
          party_code: partyCode,
          amount: amt,
          type: cashType,
          narration,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create cash transaction");
      }

      // Reset form
      setAmount("");
      setNarration("");
      
      // Refresh cash book and recent transactions
      fetchCashBook(bookDate);
      fetchRecentTransactions();
      
      // Switch to list view after successful submission
      setCurrentView('list');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create cash transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchCashBook = async (date: string) => {
    setLoadingBook(true);
    setBookError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/cash/book?date=${encodeURIComponent(date)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load cash book");
      }
      const data: CashBookResponse = await res.json();
      setCashBook(data);
    } catch (err: unknown) {
      setBookError(err instanceof Error ? err.message : "Failed to load cash book");
      setCashBook(null);
    } finally {
      setLoadingBook(false);
    }
  };

  const fetchRecentTransactions = async () => {
    setLoadingRecent(true);
    try {
      const res = await fetch(`http://localhost:3001/api/cash/recent`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load recent transactions");
      }
      const data: CashTransaction[] = await res.json();
      setRecentTransactions(data);
    } catch (err: unknown) {
      console.error("Failed to load recent transactions", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchCashBook(bookDate);
    fetchRecentTransactions();
    fetchAllParties(); // Fetch parties for autocomplete
  }, []);

  // Fetch all parties for autocomplete
  const fetchAllParties = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/parties`);
      if (!res.ok) {
        throw new Error("Failed to load parties");
      }
      const data = await res.json();
      setAllParties(data);
    } catch (err) {
      console.error("Error fetching parties:", err);
    }
  };

  // Handle party code change with autocomplete
  const handlePartyCodeChange = (value: string) => {
    setPartyCode(value.toUpperCase());
    
    if (value.trim() === "") {
      setShowSuggestions(false);
      return;
    }
    
    // Filter parties for suggestions
    const filtered = allParties.filter(
      party => 
        party.party_code.toLowerCase().startsWith(value.toLowerCase()) ||
        party.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setPartySuggestions(filtered.slice(0, 5)); // Show max 5 suggestions
    setShowSuggestions(filtered.length > 0);
  };

  // Select a party from suggestions
  const selectParty = (partyCode: string) => {
    setPartyCode(partyCode);
    setShowSuggestions(false);
  };

  // Render form view
  const renderFormView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Cash Module - New Entry"
        description="Add new cash receipt or payment"
        action={
          <Button
            onClick={() => setCurrentView('list')}
            variant="outline"
            className="group relative"
          >
            <List className="w-4 h-4 mr-2" />
            View List
          </Button>
        }
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Cash Receipt / Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCash} className="grid gap-4 md:grid-cols-1 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="cashDate">Date</Label>
                <Input
                  id="cashDate"
                  type="date"
                  value={cashDate}
                  onChange={(e) => setCashDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partyCode">Party Code</Label>
                <div className="relative">
                  <Input
                    id="partyCode"
                    value={partyCode}
                    onChange={(e) => handlePartyCodeChange(e.target.value)}
                    placeholder="e.g. STV001"
                  />
                  {/* Party suggestions dropdown */}
                  {showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {partySuggestions.map((party) => (
                        <div
                          key={party.id}
                          className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                          onClick={() => selectParty(party.party_code)}
                        >
                          <span className="font-medium">{party.party_code}</span>
                          <span className="text-sm text-muted-foreground truncate ml-2">{party.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cashType">Type</Label>
                <Select
                  value={cashType}
                  onValueChange={(v: string) => setCashType(v as "RECEIPT" | "PAYMENT")}
                >
                  <SelectTrigger id="cashType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIPT">Cash Receipt (In)</SelectItem>
                    <SelectItem value="PAYMENT">Cash Payment (Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2 lg:col-span-5">
                <Label htmlFor="narration">Narration</Label>
                <Textarea
                  id="narration"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  rows={2}
                  placeholder="Reason / details of cash transaction"
                />
              </div>
              
              <div className="lg:col-span-5">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Save Cash Entry
                    </>
                  )}
                </Button>
                {formError && (
                  <p className="mt-2 text-sm text-destructive">{formError}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Cash Module"
        description="Manage cash receipts/payments, view daily cash book and recent transactions"
        action={
          <Button
            onClick={() => {
              // Reset form and switch to form view
              setCashDate(new Date().toISOString().slice(0, 10));
              setPartyCode("");
              setAmount("");
              setNarration("");
              setFormError(null);
              setCurrentView('form');
            }}
            className="bg-primary hover:bg-primary-hover group relative"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Cash Entry
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Recent Cash Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecent ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading recent transactions...</div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Narration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No recent cash transactions.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentTransactions.map((t) => (
                        <TableRow 
                          key={t.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>{String(t.date).slice(0, 10)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{t.party_code}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={t.type === "RECEIPT" ? "default" : "destructive"}>
                              {t.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={t.type === "RECEIPT" ? "text-emerald-600" : "text-rose-600"}>
                              {formatCurrency(t.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {t.narration || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Cash Book */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Daily Cash Book
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  onBlur={() => fetchCashBook(bookDate)}
                  className="w-40"
                />
                <Button 
                  size="sm" 
                  type="button" 
                  onClick={() => fetchCashBook(bookDate)}
                  disabled={loadingBook}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBook ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingBook ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading cash book...</div>
              </div>
            ) : bookError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-destructive">{bookError}</div>
              </div>
            ) : cashBook ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Opening Balance</p>
                    <p className="text-lg font-semibold">{formatCurrency(cashBook.opening_balance)}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Closing Balance</p>
                    <p className="text-lg font-semibold">{formatCurrency(cashBook.closing_balance)}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Receipts</p>
                    <p className="text-lg font-semibold text-emerald-600">{formatCurrency(cashBook.receipts)}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Payments</p>
                    <p className="text-lg font-semibold text-rose-600">{formatCurrency(cashBook.payments)}</p>
                  </Card>
                </div>

                {/* Transactions Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Ref</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashBook.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No cash transactions for this date.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {cashBook.transactions.map((t) => (
                            <TableRow 
                              key={t.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="text-xs text-muted-foreground">
                                {String(t.id).slice(0, 8)}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{t.party_code}</div>
                                <div className="text-xs text-muted-foreground">{t.narration}</div>
                              </TableCell>
                              <TableCell className="text-right text-emerald-600">
                                {t.type === "RECEIPT" ? formatCurrency(t.amount) : "-"}
                              </TableCell>
                              <TableCell className="text-right text-rose-600">
                                {t.type === "PAYMENT" ? formatCurrency(t.amount) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted font-semibold">
                            <TableCell colSpan={2}>
                              Total: {cashBook.transactions.length} transactions
                            </TableCell>
                            <TableCell className="text-right text-emerald-600">
                              {formatCurrency(
                                cashBook.transactions
                                  .filter((t) => t.type === "RECEIPT")
                                  .reduce((s, t) => s + Number(t.amount || 0), 0)
                              )}
                            </TableCell>
                            <TableCell className="text-right text-rose-600">
                              {formatCurrency(
                                cashBook.transactions
                                  .filter((t) => t.type === "PAYMENT")
                                  .reduce((s, t) => s + Number(t.amount || 0), 0)
                              )}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Main render based on current view
  return (
    <>
      {currentView === 'form' ? renderFormView() : renderListView()}
    </>
  );
}