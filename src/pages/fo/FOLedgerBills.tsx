import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Eye, Search, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { partyQueries } from "@/lib/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FOBillView } from "@/components/fo/FOBillView";
import { FOBrokerBillView } from "@/components/fo/FOBrokerBillView";
import { PaymentDialog } from "@/components/PaymentDialog";

interface Party {
  id: string;
  party_code: string;
  name: string;
  nse_code: string | null;
  trading_slab: number;
  delivery_slab: number;
}

interface LedgerEntry {
  id: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  entry_date: string;
  particulars: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  created_at: string;
  reference_type?: string;
  reference_id?: string;
  // Add bill reference if this entry is related to a bill
  bill_id?: string;
  bill_number?: string;
}

interface FOBill {
  id: string;
  bill_number: string;
  party_id: string;
  broker_id?: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  bill_date: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  party_code?: string;
  party_name?: string;
  broker_code?: string;
  broker_name?: string;
  bill_type?: 'party' | 'broker';
}

interface ViewBillData {
  id: string;
  bill_number: string;
  party_id: string;
  broker_id?: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  bill_date: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  party_code?: string;
  party_name?: string;
  broker_code?: string;
  broker_name?: string;
  bill_type?: 'party' | 'broker';
}

const FOLedgerBills = () => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [brokers, setBrokers] = useState<Party[]>([]); // Using Party interface for brokers too
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [viewBillId, setViewBillId] = useState<string | null>(null);

  // FO bill generation controls
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [billDate, setBillDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [generateLoading, setGenerateLoading] = useState(false);
  const [billViewOpen, setBillViewOpen] = useState(false);
  const [viewBillType, setViewBillType] = useState<'party' | 'broker' | 'main_broker'>('party');
  const [viewBillData, setViewBillData] = useState<ViewBillData | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPartyForPayment, setSelectedPartyForPayment] = useState<{id: string, code: string, balance: number} | null>(null);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const enhanceEntriesWithBillInfo = useCallback(async (entries: LedgerEntry[]): Promise<LedgerEntry[]> => {
    // Try to extract bill IDs from particulars and enhance entries with bill info
    const enhancedEntries: LedgerEntry[] = [];
    
    for (const entry of entries) {
      const enhancedEntry = { ...entry };
      
      // If entry already has reference_id, use it as bill_id
      if (entry.reference_id) {
        enhancedEntry.bill_id = entry.reference_id;
      }
      
      // Try to extract bill number from particulars
      // Look for patterns like "Bill FO-PTY20251104-215" or "Bill FO-BRK20251104-215"
      const billNumberMatch = entry.particulars.match(/Bill\s+(FO-(?:PTY|BRK)\d{8}-\d{3})/i);
      if (billNumberMatch) {
        enhancedEntry.bill_number = billNumberMatch[1];
        
        // If we don't have bill_id yet, try to find it by bill number
        if (!enhancedEntry.bill_id) {
          try {
            // Determine if it's a broker bill or party bill
            const isBrokerBill = billNumberMatch[1].includes('BRK');
            const billType = isBrokerBill ? 'broker' : 'party';
            
            // Search F&O bills by bill number and type
            const response = await fetch(`http://localhost:3001/api/fo/bills?type=${billType}`);
            const bills: FOBill[] = await response.json();
            const bill = (Array.isArray(bills) ? bills : []).find((b: FOBill) => b.bill_number === billNumberMatch[1]);
            if (bill && bill.id) {
              enhancedEntry.bill_id = bill.id;
            }
          } catch (error) {
            console.error('Error fetching bill info:', error);
          }
        }
      }
      
      enhancedEntries.push(enhancedEntry);
    }
    
    return enhancedEntries;
  }, []);

  const fetchLedgerEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      let result;
      if (selectedPartyId && selectedPartyId !== "all") {
        // Fetch F&O party ledger entries
        const response = await fetch(`http://localhost:3001/api/fo/ledger/party/${selectedPartyId}`);
        result = await response.json();
      } else if (selectedBrokerId && selectedBrokerId !== "all") {
        // Fetch F&O broker ledger entries (entries with null party_id that mention broker)
        const response = await fetch('http://localhost:3001/api/fo/ledger');
        result = await response.json();
        result = (Array.isArray(result) ? result : []).filter(entry => 
          !entry.party_id && entry.particulars.includes('Brokerage')
        );
      } else {
        // Fetch all F&O ledger entries
        const response = await fetch('http://localhost:3001/api/fo/ledger');
        result = await response.json();
      }
      
      // Enhance entries with bill information if they reference bills
      const enhancedEntries = await enhanceEntriesWithBillInfo(result || []);

      // Sort passbook-wise: oldest date first, then by created_at
      enhancedEntries.sort((a, b) => {
        const da = new Date(a.entry_date).getTime();
        const db = new Date(b.entry_date).getTime();
        if (da !== db) return da - db;
        const ca = new Date(a.created_at).getTime();
        const cb = new Date(b.created_at).getTime();
        return ca - cb;
      });

      setLedgerEntries(enhancedEntries);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ledger entries",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [selectedPartyId, selectedBrokerId, toast, enhanceEntriesWithBillInfo]);

  const fetchParties = useCallback(async () => {
    try {
      const result = await partyQueries.getAll();
      setParties(result || []);
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch parties",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchBrokers = useCallback(async () => {
    try {
      // For now, we'll use the same parties list but could fetch brokers separately
      // In a real implementation, you might have a separate brokers API
      const result = await partyQueries.getAll();
      setBrokers(result || []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch brokers",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchParties();
    fetchBrokers();
  }, [fetchParties, fetchBrokers]);

  // Fetch ledger entries on component mount and when filters change
  useEffect(() => {
    fetchLedgerEntries();
  }, [selectedPartyId, selectedBrokerId, fetchLedgerEntries]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEntries(ledgerEntries);
    } else {
      const filtered = ledgerEntries.filter(
        (entry) =>
          entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (entry.party_name && entry.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (entry.party_code && entry.party_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (entry.bill_number && entry.bill_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEntries(filtered);
    }
  }, [ledgerEntries, searchTerm]);

  const handleGenerateBills = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Date Required",
        description: "Please select From Date and To Date to generate bills.",
        variant: "destructive",
      });
      return;
    }

    setGenerateLoading(true);
    try {
      const payload: any = {
        fromDate,
        toDate,
        billDate: billDate || new Date().toISOString().slice(0, 10),
      };
      if (selectedPartyId && selectedPartyId !== "all") {
        payload.partyId = selectedPartyId;
      }

      const response = await fetch("http://localhost:3001/api/fo/billing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate F&O bills");
      }

      const data = await response.json();
      const count = Array.isArray(data?.bills) ? data.bills.length : 0;

      toast({
        title: "F&O Bills Generated",
        description: count > 0
          ? `Generated ${count} F&O bill(s) from contracts.`
          : "No eligible contracts found in this date range.",
      });

      // Refresh ledger entries so new bills show here
      fetchLedgerEntries();
    } catch (error) {
      console.error("Error generating F&O bills:", error);
      toast({
        title: "Error",
        description: "Failed to generate F&O bills from contracts.",
        variant: "destructive",
      });
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleViewBill = async (entry: LedgerEntry) => {
    if (entry.bill_id) {
      // Determine bill type from entry based on reference_type
      let billType: 'party' | 'broker' | 'main_broker' = 'party';
      
      if (entry.bill_number && entry.bill_number.includes('BRK')) {
        // It's a broker bill - check if it's main broker or sub-broker profit
        if (entry.reference_type === 'broker_brokerage') {
          billType = 'main_broker'; // Main broker bill (no profit shown)
        } else if (entry.reference_type === 'sub_broker_profit') {
          billType = 'broker'; // Sub-broker profit bill (with profit)
        } else {
          billType = 'broker'; // Default to sub-broker
        }
      } else {
        billType = 'party'; // Party bill
      }
      
      try {
        // Fetch the full bill data
        const response = await fetch(`http://localhost:3001/api/fo/bills/${entry.bill_id}`);
        if (response.ok) {
          const billData = await response.json();
          // Convert to ViewBillData
          const bill: ViewBillData = {
            ...billData,
            party_id: billData.party_id || '', // Ensure party_id is always a string
          };
          setViewBillData(bill);
          setViewBillType(billType);
          setViewBillId(entry.bill_id);
          setBillViewOpen(true);
        } else {
          toast({
            title: "Bill Not Found",
            description: "Could not fetch bill details",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching bill:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bill details",
          variant: "destructive",
        });
      }
    } else if (entry.bill_number) {
      try {
        // Determine bill type based on bill number and reference_type
        let billType: 'party' | 'broker' | 'main_broker' = 'party';
        
        if (entry.bill_number.includes('BRK')) {
          // It's a broker bill - check reference type
          if (entry.reference_type === 'broker_brokerage') {
            billType = 'main_broker';
          } else if (entry.reference_type === 'sub_broker_profit') {
            billType = 'broker';
          } else {
            billType = 'broker';
          }
        } else {
          billType = 'party';
        }
        
        // Try to fetch the F&O bill by number and type
        const apiBillType = billType === 'main_broker' ? 'broker' : billType;
        const response = await fetch(`http://localhost:3001/api/fo/bills?type=${apiBillType}`);
        const bills = await response.json();
        const bill = (Array.isArray(bills) ? bills : []).find((b: FOBill) => b.bill_number === entry.bill_number);
        if (bill && bill.id) {
          setViewBillData(bill);
          setViewBillType(billType);
          setViewBillId(bill.id);
          setBillViewOpen(true);
        } else {
          toast({
            title: "Bill Not Found",
            description: `Could not find F&O bill ${entry.bill_number}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching bill:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bill details",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Bill Reference",
        description: "This ledger entry does not reference a specific bill.",
        variant: "default",
      });
    }
  };

  const handleCashCut = (partyId: string, partyCode: string, balance: number) => {
    // Check if this is a main broker payment
    if (partyId === "main-broker") {
      // For main broker payments, we need to handle it differently
      // We'll set a special flag in the payment dialog
      setSelectedPartyForPayment({ id: "main-broker", code: partyCode, balance });
    } else {
      setSelectedPartyForPayment({ id: partyId, code: partyCode, balance });
    }
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchLedgerEntries();
    // Refresh parties to update balances
    fetchParties();
  };

  const renderListView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Ledger Bills"
        description="View ledger entries with associated bill details"
        action={
          <div className="flex gap-2">
            <div className="flex gap-2">
              <Select
                value={selectedPartyId}
                onValueChange={(value) => {
                  setSelectedPartyId(value);
                  if (value !== "all") setSelectedBrokerId("");
                }}
              >
                <SelectTrigger className="w-48 bg-secondary">
                  <SelectValue placeholder="Filter by party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {parties
                    .filter(party => party.id && party.id.trim() !== "")
                    .map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.party_code} - {party.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedBrokerId}
                onValueChange={(value) => {
                  setSelectedBrokerId(value);
                  if (value !== "all") setSelectedPartyId("");
                }}
              >
                <SelectTrigger className="w-48 bg-secondary">
                  <SelectValue placeholder="Filter by broker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brokers</SelectItem>
                  <SelectItem value="broker-entries">Broker Entries Only</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search ledger entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64 bg-secondary"
                />
              </div>
            </div>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* FO Bill Generation From Contracts */}
        <Card className="border-purple-200">
          <CardHeader className="py-3 flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-purple-900">
                Generate F&O Bills From Contracts
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Select date range and (optional) party, then click Generate Bills. Trades must be imported first.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">From Date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 w-40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">To Date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 w-40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">Bill Date</label>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="h-8 w-40"
                />
              </div>
              <Button
                onClick={handleGenerateBills}
                disabled={generateLoading}
                className="ml-auto bg-[#9333ea] hover:bg-[#7e22ce] h-8 px-4 text-xs font-semibold"
              >
                {generateLoading ? "Generating..." : "Generate FO Bills"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Party/Broker</TableHead>
                <TableHead className="font-semibold">Particulars</TableHead>
                <TableHead className="font-semibold text-right">Debit</TableHead>
                <TableHead className="font-semibold text-right">Credit</TableHead>
                <TableHead className="font-semibold text-right">Balance</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading ledger entries...
                  </TableCell>
                </TableRow>
              ) : ledgerEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No ledger entries found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry, index) => (
                  <TableRow 
                    key={entry.id} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="text-sm">{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {entry.party_code ? entry.party_code : (entry.reference_type === 'sub_broker_profit' ? 'Sub-Broker' : entry.reference_type === 'broker_brokerage' ? 'Main Broker' : entry.particulars.includes('Brokerage') ? 'Broker Entry' : 'N/A')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.party_name ? entry.party_name : (entry.reference_type === 'sub_broker_profit' ? 'Profit Entry' : 'Broker Transaction')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.particulars}
                      {entry.bill_number && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewBill(entry);
                          }}
                          className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                          Bill: {entry.bill_number}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {Number(entry.debit_amount) > 0 ? `₹${Number(entry.debit_amount).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {Number(entry.credit_amount) > 0 ? `₹${Number(entry.credit_amount).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-medium ${
                        // Color coding based on entry type and actual debit/credit amounts
                        entry.party_id
                          ? entry.credit_amount > 0
                            ? 'text-green-600'  // Party credit: green
                            : 'text-red-600'    // Party debit: red
                          : entry.reference_type === 'broker_brokerage'
                          ? entry.credit_amount > 0
                            ? 'text-green-600'  // Main broker credit: green
                            : 'text-red-600'    // Main broker debit: red
                          : 'text-green-600'    // Sub broker: always green
                      }`}>
                      {entry.party_id
                        ? entry.credit_amount > 0
                          ? `+₹${Math.abs(entry.balance).toFixed(2)}`
                          : `-₹${Math.abs(entry.balance).toFixed(2)}`
                        : entry.reference_type === 'broker_brokerage'
                        ? entry.credit_amount > 0
                          ? `+₹${Math.abs(entry.balance).toFixed(2)}`
                          : `-₹${Math.abs(entry.balance).toFixed(2)}`
                        : `+₹${Math.abs(entry.balance).toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Enable payment for main broker entries (broker_brokerage) but disable for sub-broker entries (sub_broker_profit) and party entries */}
                        {entry.party_id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Get party information for the payment dialog
                              const partyId = entry.party_id || "";
                              const partyCode = entry.party_code || "Unknown Party";
                              const balance = entry.balance || 0;
                              handleCashCut(partyId, partyCode, balance);
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <IndianRupee className="w-4 h-4" />
                          </Button>
                        ) : entry.reference_type === 'broker_brokerage' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // For main broker bills, we still use the payment dialog but with special handling
                              // We'll pass a special identifier to indicate this is a broker payment
                              const brokerId = "main-broker";
                              const brokerCode = "Main Broker";
                              const balance = entry.balance || 0;
                              handleCashCut(brokerId, brokerCode, balance);
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                            title="Record payment for main broker"
                          >
                            <IndianRupee className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary"
                            disabled
                            title="Payment recording disabled for sub-broker entries"
                          >
                            <IndianRupee className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBill(entry)}
                          className="hover:bg-primary/10 hover:text-primary"
                          disabled={!entry.bill_number && !entry.bill_id}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {viewBillId && viewBillType === 'party' && viewBillData && (
        <FOBillView
          bill={viewBillData}
          billId={viewBillId}
          open={billViewOpen}
          onOpenChange={setBillViewOpen}
        />
      )}
      
      {viewBillId && viewBillType === 'main_broker' && viewBillData && (
        <FOBillView
          bill={viewBillData}
          billId={viewBillId}
          open={billViewOpen}
          onOpenChange={setBillViewOpen}
        />
      )}
      
      {viewBillId && viewBillType === 'broker' && viewBillData && (
        <FOBrokerBillView
          bill={viewBillData}
          open={billViewOpen}
          onOpenChange={setBillViewOpen}
        />
      )}
      {selectedPartyForPayment && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          partyId={selectedPartyForPayment.id}
          partyCode={selectedPartyForPayment.code}
          currentBalance={selectedPartyForPayment.balance}
          mode="fo"
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );

  // Main render
  return renderListView();
};

export default FOLedgerBills;
