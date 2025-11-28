import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { partyQueries } from "@/lib/database";
import { TrendingUp, TrendingDown, Package, History } from "lucide-react";

interface Party {
  id: string;
  party_code: string;
  name: string;
}

interface Holding {
  id: string;
  party_id: string;
  company_id: string;
  quantity: number;
  avg_buy_price: number;
  total_invested: number;
  last_trade_date: string | null;
  party_code?: string;
  party_name?: string;
  company_code: string;
  company_name: string;
  nse_code: string | null;
  broker_codes?: string | null; // e.g. "BRK1, BRK2"
  broker_qty_breakdown?: string | null; // e.g. "4622:1000, 2025:1500"
}

interface Transaction {
  id: string;
  bill_id: string;
  bill_number: string;
  bill_date: string;
  party_id: string;
  party_code: string;
  party_name: string;
  company_code: string;
  description: string;
  type: 'BUY' | 'SELL' | 'UNKNOWN';
  quantity: number;
  rate: number;
  amount: number;
  brokerage_amount: number;
  trade_type: string;
  balance: number;
  created_at: string;
}

const Holdings = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState("holdings");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchParties();
    fetchHoldings();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      fetchHoldings();
      if (activeTab === "transactions") {
        fetchTransactions();
      }
    }
  }, [selectedParty]);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchParties = async () => {
    try {
      const result = await partyQueries.getAll();
      setParties(result || []);
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast({
        title: "Error",
        description: "Failed to fetch parties",
        variant: "destructive",
      });
    }
  };

  const fetchHoldings = async () => {
    setIsLoading(true);
    try {
      const endpoint =
        selectedParty === "all" || !selectedParty
          ? "/api/holdings"
          : `/api/holdings/party/${selectedParty}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch holdings");
      
      const result = await response.json();
      setHoldings(result || []);
    } catch (error) {
      console.error("Error fetching holdings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch holdings",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const params = new URLSearchParams();
      if (selectedParty && selectedParty !== "all") {
        params.append("party_id", selectedParty);
      }
      if (fromDate) {
        params.append("from_date", fromDate);
      }
      if (toDate) {
        params.append("to_date", toDate);
      }
      
      const endpoint = `/api/holdings/transactions${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      
      const result = await response.json();
      setTransactions(result || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive",
      });
    }
    setIsLoadingTransactions(false);
  };

  // Calculate total portfolio value and P&L (simplified - would need current prices)
  const calculateTotals = () => {
    const longPositions = holdings.filter(h => h.quantity > 0);
    const shortPositions = holdings.filter(h => h.quantity < 0);
    const totalInvested = longPositions.reduce((sum, h) => sum + Number(h.total_invested), 0);
    const totalQuantity = longPositions.reduce((sum, h) => sum + Number(h.quantity), 0);
    const shortQuantity = Math.abs(shortPositions.reduce((sum, h) => sum + Number(h.quantity), 0));
    return { 
      totalInvested, 
      totalQuantity, 
      shortQuantity,
      longCount: longPositions.length,
      shortCount: shortPositions.length,
    };
  };

  const totals = calculateTotals();
  
  // Separate long, short, and closed positions
  const longPositions = holdings.filter(h => h.quantity > 0);
  const shortPositions = holdings.filter(h => h.quantity < 0);
  const closedPositions = holdings.filter(h => h.quantity === 0);

  // Group long positions by party
  const longPositionsByParty = longPositions.reduce((acc, holding) => {
    const partyName = holding.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(holding);
    return acc;
  }, {} as Record<string, Holding[]>);
  
  // Group short positions by party
  const shortPositionsByParty = shortPositions.reduce((acc, holding) => {
    const partyName = holding.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(holding);
    return acc;
  }, {} as Record<string, Holding[]>);
  
  // Group closed positions by party
  const closedPositionsByParty = closedPositions.reduce((acc, holding) => {
    const partyName = holding.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(holding);
    return acc;
  }, {} as Record<string, Holding[]>);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Stock Holdings"
        description="Track delivery positions and client portfolios"
      />

      <div className="p-6 space-y-6">
        {/* Filter Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between gap-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filter by Client</label>
              <Select value={selectedParty} onValueChange={setSelectedParty}>
                <SelectTrigger className="w-72 h-10 bg-white border-gray-300 shadow-sm">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.party_code} - {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right bg-white rounded-lg px-10 py-5 shadow-sm border border-green-200 min-w-[300px]">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Invested</p>
              <p className="text-3xl font-bold text-green-600 tabular-nums">
                ₹{totals.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs: Holdings and Transaction History */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="holdings" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Current Holdings
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Transaction History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Long Positions</p>
                      <h3 className="text-2xl font-bold">{totals.longCount}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Bought stocks
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Long Quantity</p>
                      <h3 className="text-2xl font-bold text-green-600">{totals.totalQuantity.toLocaleString()}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Shares held (long)
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Short Quantity</p>
                      <h3 className="text-2xl font-bold text-red-600">
                        {totals.shortQuantity.toLocaleString()}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Shares sold short
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Long Positions Table */}
            <Card>
          <CardHeader>
            <CardTitle className="text-lg">Long Positions (Buy)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading holdings...
              </div>
            ) : longPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No long positions found.
              </div>
            ) : (
              <div className="space-y-6">
                {selectedParty === "all" ? (
                  // Group by party when showing all
                  Object.entries(longPositionsByParty).map(([partyName, partyHoldings]) => {
                    const partyTotalInvested = partyHoldings.reduce((sum, h) => sum + Number(h.total_invested), 0);
                    return (
                    <div key={partyName} className="space-y-2">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-sm font-semibold text-primary">
                          {partyName}
                        </h3>
                        <span className="text-sm font-bold text-green-600">
                          Total Invested: ₹{partyTotalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Stock</TableHead>
                              <TableHead>NSE Code</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Invested</TableHead>
                              <TableHead>Last Trade</TableHead>
                              <TableHead>Broker Codes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partyHoldings.map((holding) => (
                              <TableRow key={holding.id}>
                                <TableCell>
                                  <div className="font-medium">{holding.company_code}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {holding.company_name}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {holding.nse_code || "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {Number(holding.quantity).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  ₹{Number(holding.avg_buy_price).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  ₹{Number(holding.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {holding.broker_qty_breakdown
                                    ? holding.broker_qty_breakdown
                                    : (holding.broker_codes || '-')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  // Single table for specific party
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Stock</TableHead>
                          <TableHead>NSE Code</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Price</TableHead>
                          <TableHead className="text-right">Total Invested</TableHead>
                          <TableHead>Last Trade</TableHead>
                          <TableHead>Broker Codes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {longPositions.map((holding) => (
                          <TableRow key={holding.id}>
                            <TableCell>
                              <div className="font-medium">{holding.company_code}</div>
                              <div className="text-sm text-muted-foreground">
                                {holding.company_name}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {holding.nse_code || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {Number(holding.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{Number(holding.avg_buy_price).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{Number(holding.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {holding.broker_qty_breakdown
                                ? holding.broker_qty_breakdown
                                : (holding.broker_codes || '-')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

            {/* Short Positions Table */}
            {shortPositions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Short Positions (Sell)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedParty === "all" ? (
                      // Group by party when showing all
                      Object.entries(shortPositionsByParty).map(([partyName, partyHoldings]) => (
                        <div key={partyName} className="space-y-2">
                          <h3 className="text-sm font-semibold text-primary border-b pb-2">
                            {partyName}
                          </h3>
                          <div className="rounded-lg border border-red-200">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-red-50">
                                  <TableHead>Stock</TableHead>
                                  <TableHead>NSE Code</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Avg Price</TableHead>
                                  <TableHead className="text-right">Total Value</TableHead>
                                  <TableHead>Last Trade</TableHead>
                                  <TableHead>Broker Codes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {partyHoldings.map((holding) => {
                                  const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_buy_price);
                                  return (
                                    <TableRow key={holding.id} className="bg-red-50/30">
                                      <TableCell>
                                        <div className="font-medium">{holding.company_code}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {holding.company_name}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-mono text-sm">
                                        {holding.nse_code || "-"}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-red-600 font-bold">
                                        {Number(holding.quantity).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right font-mono">
                                        ₹{Number(holding.avg_buy_price).toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono font-medium text-red-600">
                                        ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {holding.broker_codes || '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Single table for specific party
                      <div className="rounded-lg border border-red-200">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-red-50">
                              <TableHead>Stock</TableHead>
                              <TableHead>NSE Code</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Value</TableHead>
                              <TableHead>Last Trade</TableHead>
                              <TableHead>Broker Codes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shortPositions.map((holding) => {
                              const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_buy_price);
                              return (
                                <TableRow key={holding.id} className="bg-red-50/30">
                                  <TableCell>
                                    <div className="font-medium">{holding.company_code}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {holding.company_name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {holding.nse_code || "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-red-600 font-bold">
                                    {Number(holding.quantity).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    ₹{Number(holding.avg_buy_price).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-medium text-red-600">
                                    ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {holding.broker_codes || '-'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Date Filter Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="fromDate" className="text-xs font-semibold uppercase">From Date</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="toDate" className="text-xs font-semibold uppercase">To Date</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={fetchTransactions}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Apply Filter
                  </Button>
                  <Button 
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setTimeout(() => fetchTransactions(), 100);
                    }}
                    variant="outline"
                  >
                    All Time
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction History (Date-wise Buy/Sell)</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Party filter inside Transactions tab */}
                <div className="flex items-end gap-4 mb-4">
                  <div className="w-64">
                    <Label htmlFor="partyFilter" className="text-xs font-semibold uppercase">Party</Label>
                    <Select
                      value={selectedParty}
                      onValueChange={(value) => setSelectedParty(value)}
                    >
                      <SelectTrigger id="partyFilter" className="mt-1 h-9">
                        <SelectValue placeholder="All Parties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Parties</SelectItem>
                        {parties.map((party) => (
                          <SelectItem key={party.id} value={party.id}>
                            {party.party_code} - {party.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoadingTransactions ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading transaction history...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Date</TableHead>
                          <TableHead>Bill No</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Running Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell className="text-sm">
                              {new Date(txn.bill_date).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs text-blue-600 cursor-pointer hover:underline">
                                {txn.bill_number}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div className="font-medium">{txn.party_code}</div>
                                <div className="text-muted-foreground">{txn.party_name}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              {txn.company_code}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                txn.type === 'BUY' ? 'bg-green-100 text-green-700' : 
                                txn.type === 'SELL' ? 'bg-red-100 text-red-700' : 
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {txn.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {txn.quantity.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              ₹{txn.rate.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{txn.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className={`text-right font-mono font-bold ${
                              txn.balance > 0 ? 'text-green-600' : 
                              txn.balance < 0 ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {txn.balance.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Holdings;
