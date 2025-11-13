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
import { partyQueries } from "@/lib/database";
import { TrendingUp, TrendingDown, Package } from "lucide-react";

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
  last_trade_date: string;
  party_code?: string;
  party_name?: string;
  company_code: string;
  company_name: string;
  nse_code: string | null;
}

const Holdings = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchParties();
    fetchHoldings();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      fetchHoldings();
    }
  }, [selectedParty]);

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
                                  {new Date(holding.last_trade_date).toLocaleDateString()}
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
                              {new Date(holding.last_trade_date).toLocaleDateString()}
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
                                    {new Date(holding.last_trade_date).toLocaleDateString()}
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
                                {new Date(holding.last_trade_date).toLocaleDateString()}
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
      </div>
    </div>
  );
};

export default Holdings;
