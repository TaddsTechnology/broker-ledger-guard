import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Search } from "lucide-react";

interface PartySummaryRow {
  party_code: string;
  party_name: string;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  entity_type?: string; // Add entity_type to distinguish between party, main_broker, sub_broker
}

// Add Party interface for autocomplete
interface Party {
  id: string;
  party_code: string;
  name: string;
}

const API_BASE = "http://localhost:3001";

const formatCurrency = (value: number) => {
  if (isNaN(value)) return "₹0.00";
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// New component to format closing balance with CR/DR symbols and colors
const ClosingBalanceDisplay = ({ value, partyCode }: { value: number; partyCode?: string }) => {
  if (isNaN(value)) return <span>₹0.00</span>;
  const absValue = Math.abs(value);
  const formattedValue = `₹${absValue.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  
  // Special case: Sub-Broker Profit is always CR (your earnings)
  if (partyCode === 'SUB-BROKER') {
    return (
      <span>
        {formattedValue} <span className="text-green-500 font-medium">CR</span>
      </span>
    );
  }
  
  // Accounting convention for regular parties:
  // Positive balance (Debit > Credit) = DR (party owes you money)
  // Negative balance (Credit > Debit) = CR (you owe party money)
  if (value > 0) {
    return (
      <span>
        {formattedValue} <span className="text-red-500 font-medium">DR</span>
      </span>
    );
  } else if (value < 0) {
    return (
      <span>
        {formattedValue} <span className="text-green-500 font-medium">CR</span>
      </span>
    );
  } else {
    return <span>{formattedValue}</span>;
  }
};

export default function EquitySummaryModulePage() {
  const [rows, setRows] = useState<PartySummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Add party filter state
  const [partyFilter, setPartyFilter] = useState("");
  const [partySuggestions, setPartySuggestions] = useState<Party[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allParties, setAllParties] = useState<Party[]>([]);

  // Fetch all parties for autocomplete
  const fetchAllParties = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/parties`);
      if (!res.ok) {
        throw new Error("Failed to load parties");
      }
      const data = await res.json();
      setAllParties(data);
    } catch (err) {
      console.error("Error fetching parties:", err);
    }
  };

  const fetchSummary = async (partyCode: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = partyCode 
        ? `${API_BASE}/api/summary/parties?module=equity&party_code=${encodeURIComponent(partyCode)}`
        : `${API_BASE}/api/summary/parties?module=equity`;
      
      const res = await fetch(url);
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
    fetchSummary();
    fetchAllParties();
  }, []);

  // Handle party filter change with autocomplete
  const handlePartyFilterChange = (value: string) => {
    setPartyFilter(value);
    
    if (value.trim() === "") {
      setShowSuggestions(false);
      return;
    }
    
    // Filter parties for suggestions
    const filtered = allParties.filter(
      party => 
        party.party_code.toLowerCase().includes(value.toLowerCase()) ||
        party.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setPartySuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Apply filter when user selects a party or presses Enter
  const applyPartyFilter = (partyCode: string) => {
    setPartyFilter(partyCode);
    setShowSuggestions(false);
  };

  // Handle form submission
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummary(partyFilter);
  };

  // Update the filteredRows calculation to handle all entity types
  const filteredRows = partyFilter.trim() 
    ? rows.filter(row => 
        row.party_code.toLowerCase().includes(partyFilter.toLowerCase()) ||
        row.party_name.toLowerCase().includes(partyFilter.toLowerCase())
      )
    : rows;

  // Calculate totals separately for each entity type
  const mainBrokerRows = filteredRows.filter(row => row.entity_type === 'main_broker');
  const subBrokerRows = filteredRows.filter(row => row.entity_type === 'sub_broker');
  const partyRows = filteredRows.filter(row => row.entity_type === 'party');

  const totalDebit = filteredRows.reduce((s, r) => s + (Number(r.total_debit) || 0), 0);
  const totalCredit = filteredRows.reduce((s, r) => s + (Number(r.total_credit) || 0), 0);
  const totalClosing = filteredRows.reduce((s, r) => s + (Number(r.closing_balance) || 0), 0);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Equity Party Ledger Summary"
        description="Party-wise debit, credit and closing balance from Equity ledger"
        action={
          <Button onClick={() => fetchSummary(partyFilter)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Party Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Options</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Filter by party code or name..."
                    value={partyFilter}
                    onChange={(e) => handlePartyFilterChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Party suggestions dropdown */}
                {showSuggestions && partySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {partySuggestions.map((party) => (
                      <div
                        key={party.id}
                        className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                        onClick={() => applyPartyFilter(party.party_code)}
                      >
                        <span className="font-medium">{party.party_code}</span>
                        <span className="text-sm text-muted-foreground truncate ml-2">{party.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button type="submit" className="w-full sm:w-auto">
                <Search className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setPartyFilter("");
                  setShowSuggestions(false);
                  fetchSummary(""); // Also clear backend filter
                }}
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Statistic Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredRows.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partyRows.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalDebit)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">
                {formatCurrency(totalCredit)}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Party Ledger Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading summary...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-destructive">{error}</div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Party Code</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold text-right">Debit</TableHead>
                      <TableHead className="font-semibold text-right">Credit</TableHead>
                      <TableHead className="font-semibold text-right">Closing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No ledger entries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {filteredRows.map((row) => {
                          // Display sign convention based on entity type:
                          let displayClosing = row.closing_balance;
                          let rowClass = "";
                          
                          if (row.entity_type === 'main_broker') {
                            // Main broker: show as negative (what we owe them)
                            displayClosing = -Math.abs(row.closing_balance || 0);
                            rowClass = "bg-blue-50";
                          } else if (row.entity_type === 'sub_broker') {
                            // Sub broker: always positive (our earnings)
                            displayClosing = Math.abs(row.closing_balance || 0);
                            rowClass = "bg-green-50";
                          } else {
                            // Regular parties: show absolute value
                            displayClosing = Math.abs(row.closing_balance || 0);
                            rowClass = "";
                          }

                          return (
                            <TableRow 
                              key={row.party_code}
                              className={`${rowClass} hover:bg-muted/30 transition-colors`}
                            >
                              <TableCell className="font-medium">
                                {row.entity_type === 'main_broker' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                    Broker
                                  </span>
                                )}
                                {row.entity_type === 'sub_broker' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                    Profit
                                  </span>
                                )}
                                {row.party_code}
                              </TableCell>
                              <TableCell>{row.party_name}</TableCell>
                              <TableCell className="text-right text-emerald-600">
                                {formatCurrency(row.total_debit)}
                              </TableCell>
                              <TableCell className="text-right text-rose-600">
                                {formatCurrency(row.total_credit)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                <ClosingBalanceDisplay value={displayClosing} partyCode={row.party_code} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted font-semibold">
                          <TableCell colSpan={2}>Totals</TableCell>
                          <TableCell className="text-right text-emerald-600">
                            {formatCurrency(totalDebit)}
                          </TableCell>
                          <TableCell className="text-right text-rose-600">
                            {formatCurrency(totalCredit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <ClosingBalanceDisplay value={totalClosing} />
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}