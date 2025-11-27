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
import { TrendingUp, TrendingDown, Package, History } from "lucide-react";

interface Party {
  id: string;
  party_code: string;
  name: string;
}

interface Position {
  id: string;
  party_id: string;
  instrument_id: string;
  quantity: number;
  avg_price: number;
  realized_pnl: number;
  unrealized_pnl: number;
  last_trade_date: string;
  status: string;
  party_code?: string;
  party_name?: string;
  symbol: string;
  instrument_type: string;
  expiry_date: string;
  strike_price: number | null;
  display_name: string;
  lot_size: number;
}

interface Transaction {
  id: string;
  bill_id: string;
  bill_number: string;
  bill_date: string;
  party_id: string;
  party_code: string;
  party_name: string;
  instrument_id: string;
  symbol: string;
  display_name: string;
  instrument_type: string;
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

const FOHoldings = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState("positions");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const { toast } = useToast();

  // Helper function to format instrument name like NIFTY25OCT24800PE
  const formatInstrumentName = (holding: Position): string => {
    if (!holding.expiry_date) {
      return holding.symbol; // For stocks without expiry
    }
    
    const expiry = new Date(holding.expiry_date);
    const day = expiry.getDate().toString().padStart(2, '0');
    const monthMap = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthMap[expiry.getMonth()];
    
    let displayName = `${holding.symbol}${day}${month}`;
    
    if (holding.strike_price) {
      // Convert to integer to remove decimals
      displayName += Math.round(Number(holding.strike_price)).toString();
    }
    
    if (holding.instrument_type === 'CE' || holding.instrument_type === 'PE') {
      displayName += holding.instrument_type;
    }
    
    return displayName;
  };

  useEffect(() => {
    fetchParties();
    fetchPositions();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      fetchPositions();
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
      // Use Equity API - parties are shared between Equity and F&O
      const response = await fetch('http://localhost:3001/api/parties');
      const result = await response.json();
      setParties(result || []);
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch parties",
        variant: "destructive",
      });
    }
  };

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const endpoint =
        selectedParty === "all" || !selectedParty
          ? "/api/fo/positions"
          : `/api/fo/positions?party_id=${selectedParty}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch F&O positions");
      
      const result = await response.json();
      setPositions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching F&O positions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch F&O positions",
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
      
      const endpoint = `/api/fo/positions/transactions${params.toString() ? `?${params.toString()}` : ""}`;
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

  // Calculate total positions and P&L
  const calculateTotals = () => {
    const longPositions = positions.filter(p => p.quantity > 0);
    const shortPositions = positions.filter(p => p.quantity < 0);
    const totalInvested = longPositions.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.avg_price || 0)), 0);
    const totalRealizedPnl = positions.reduce((sum, p) => sum + Number(p.realized_pnl || 0), 0);
    const totalUnrealizedPnl = positions.reduce((sum, p) => sum + Number(p.unrealized_pnl || 0), 0);
    const totalQuantity = longPositions.reduce((sum, p) => sum + Number(p.quantity), 0);
    const shortQuantity = Math.abs(shortPositions.reduce((sum, p) => sum + Number(p.quantity), 0));
    return { 
      totalInvested, 
      totalQuantity, 
      shortQuantity,
      longCount: longPositions.length,
      shortCount: shortPositions.length,
      totalRealizedPnl,
      totalUnrealizedPnl,
    };
  };

  const totals = calculateTotals();
  
  // Separate long, short, and closed positions
  const longPositions = positions.filter(p => p.quantity > 0);
  const shortPositions = positions.filter(p => p.quantity < 0);
  const closedPositions = positions.filter(p => p.quantity === 0);

  // Group long positions by party
  const longPositionsByParty = longPositions.reduce((acc, position) => {
    const partyName = position.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(position);
    return acc;
  }, {} as Record<string, Position[]>);
  
  // Group short positions by party
  const shortPositionsByParty = shortPositions.reduce((acc, position) => {
    const partyName = position.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(position);
    return acc;
  }, {} as Record<string, Position[]>);
  
  // Group closed positions by party
  const closedPositionsByParty = closedPositions.reduce((acc, position) => {
    const partyName = position.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(position);
    return acc;
  }, {} as Record<string, Position[]>);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="F&O Positions"
        description="Track F&O positions, carry forward trades, and client portfolios"
      />

      <div className="p-6 space-y-6">
        {/* Filter Section */}
        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg border border-purple-200 p-6">
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

        {/* Tabs: Positions and Transaction History */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Current Positions
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Transaction History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-6">
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
                    const partyTotalInvested = partyHoldings.reduce((sum, h) => sum + (Number(h.quantity) * Number(h.avg_price || 0)), 0);
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
                              <TableHead>Instrument</TableHead>
                              <TableHead className="text-right">Strike/Expiry</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Invested</TableHead>
                              <TableHead>Last Trade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partyHoldings.map((holding) => {
                              const totalInvested = Number(holding.quantity) * Number(holding.avg_price || 0);
                              return (
                              <TableRow key={holding.id}>
                                <TableCell>
                                  <div className="font-medium text-base">{formatInstrumentName(holding)}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {holding.symbol}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {holding.strike_price ? (
                                    <div>
                                      <div className="font-semibold">₹{Number(holding.strike_price).toLocaleString()}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                                      </div>
                                    </div>
                                  ) : (
                                    holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {Number(holding.quantity).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  ₹{Number(holding.avg_price || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                </TableCell>
                              </TableRow>
                              );
                            })}
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
                          <TableHead>Instrument</TableHead>
                          <TableHead className="text-right">Strike/Expiry</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Price</TableHead>
                          <TableHead className="text-right">Total Invested</TableHead>
                          <TableHead>Last Trade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {longPositions.map((holding) => {
                          const totalInvested = Number(holding.quantity) * Number(holding.avg_price || 0);
                          return (
                          <TableRow key={holding.id}>
                            <TableCell>
                              <div className="font-medium text-base">{formatInstrumentName(holding)}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {holding.symbol}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {holding.strike_price ? (
                                <div>
                                  <div className="font-semibold">₹{Number(holding.strike_price).toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                                  </div>
                                </div>
                              ) : (
                                holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {Number(holding.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{Number(holding.avg_price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                          );
                        })}
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
                              <TableHead>Instrument</TableHead>
                              <TableHead className="text-right">Strike/Expiry</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Value</TableHead>
                              <TableHead>Last Trade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partyHoldings.map((holding) => {
                              const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_price || 0);
                              return (
                                <TableRow key={holding.id} className="bg-red-50/30">
                                  <TableCell>
                                    <div className="font-medium text-base">{formatInstrumentName(holding)}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {holding.symbol}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {holding.strike_price ? (
                                      <div>
                                        <div className="font-semibold">₹{Number(holding.strike_price).toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                                        </div>
                                      </div>
                                    ) : (
                                      holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-red-600 font-bold">
                                    {Number(holding.quantity).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    ₹{Number(holding.avg_price || 0).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-medium text-red-600">
                                    ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
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
                          <TableHead>Instrument</TableHead>
                          <TableHead className="text-right">Strike/Expiry</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Price</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                          <TableHead>Last Trade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shortPositions.map((holding) => {
                          const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_price || 0);
                          return (
                            <TableRow key={holding.id} className="bg-red-50/30">
                              <TableCell>
                                <div className="font-medium text-base">{formatInstrumentName(holding)}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {holding.symbol}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {holding.strike_price ? (
                                  <div>
                                    <div className="font-semibold">₹{Number(holding.strike_price).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                                    </div>
                                  </div>
                                ) : (
                                  holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-red-600 font-bold">
                                {Number(holding.quantity).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ₹{Number(holding.avg_price || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-red-600">
                                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-sm">
                                {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
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
                    className="bg-[#9333ea] hover:bg-[#7e22ce]"
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
                          <TableHead>Instrument</TableHead>
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
                              <span className="font-mono text-xs text-[#9333ea] cursor-pointer hover:underline">
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
                              <div className="font-medium">{txn.display_name || txn.symbol}</div>
                              <div className="text-xs text-muted-foreground">{txn.symbol}</div>
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

export default FOHoldings;
