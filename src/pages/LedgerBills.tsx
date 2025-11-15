import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Eye, Search, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ledgerQueries, partyQueries, billQueries } from "@/lib/database";
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
import { BillView } from "@/components/BillView";

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

const LedgerBills = () => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [brokers, setBrokers] = useState<Party[]>([]); // Using Party interface for brokers too
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [viewBillId, setViewBillId] = useState<string | null>(null);
  const [billViewOpen, setBillViewOpen] = useState(false);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchParties();
    fetchBrokers();
  }, []);

  // Fetch ledger entries on component mount and when filters change
  useEffect(() => {
    fetchLedgerEntries();
  }, [selectedPartyId, selectedBrokerId]);

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

  const fetchLedgerEntries = async () => {
    setIsLoading(true);
    try {
      let result;
      if (selectedPartyId && selectedPartyId !== "all") {
        // Fetch party ledger entries
        result = await ledgerQueries.getByPartyId(selectedPartyId);
      } else if (selectedBrokerId && selectedBrokerId !== "all") {
        // Fetch broker ledger entries (entries with null party_id that mention broker)
        result = await ledgerQueries.getAll();
        result = result.filter(entry => 
          !entry.party_id && entry.particulars.includes('Brokerage')
        );
      } else {
        // Fetch all ledger entries
        result = await ledgerQueries.getAll();
      }
      
      // Enhance entries with bill information if they reference bills
      const enhancedEntries = await enhanceEntriesWithBillInfo(result || []);
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
  };

  const enhanceEntriesWithBillInfo = async (entries: LedgerEntry[]): Promise<LedgerEntry[]> => {
    // Try to extract bill IDs from particulars and enhance entries with bill info
    const enhancedEntries = [];
    
    for (const entry of entries) {
      const enhancedEntry = { ...entry };
      
      // If entry already has reference_id, use it as bill_id
      if (entry.reference_id) {
        enhancedEntry.bill_id = entry.reference_id;
      }
      
      // Try to extract bill number from particulars
      // Look for patterns like "Bill PTY20251104-215" or "Bill BRK20251104-215"
      const billNumberMatch = entry.particulars.match(/Bill\s+((?:PTY|BRK)\d{8}-\d{3})/i);
      if (billNumberMatch) {
        enhancedEntry.bill_number = billNumberMatch[1];
        
        // If we don't have bill_id yet, try to find it by bill number
        if (!enhancedEntry.bill_id) {
          try {
            const bill = await billQueries.getByNumber(billNumberMatch[1]);
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
  };

  const fetchParties = async () => {
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
  };

  const fetchBrokers = async () => {
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
  };

  const handleViewBill = async (entry: LedgerEntry) => {
    if (entry.bill_id) {
      setViewBillId(entry.bill_id);
      setBillViewOpen(true);
    } else if (entry.bill_number) {
      try {
        // Try to fetch the bill by number
        const bill = await billQueries.getByNumber(entry.bill_number);
        if (bill && bill.id) {
          setViewBillId(bill.id);
          setBillViewOpen(true);
        } else {
          toast({
            title: "Bill Not Found",
            description: `Could not find bill ${entry.bill_number}`,
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

      <div className="p-6">
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
                        {entry.party_code ? entry.party_code : (entry.particulars.includes('Sub-Broker Profit') ? 'Sub-Broker' : entry.particulars.includes('Brokerage') ? 'Main Broker' : 'N/A')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.party_name ? entry.party_name : (entry.particulars.includes('Sub-Broker Profit') ? 'Profit Entry' : entry.particulars.includes('Brokerage') ? 'Broker Transaction' : 'N/A')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.particulars}
                      {entry.bill_number && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Bill: {entry.bill_number}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {Number(entry.debit_amount) > 0 ? `₹${Number(entry.debit_amount).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {Number(entry.credit_amount) > 0 ? `₹${Number(entry.credit_amount).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-medium ${
                      (entry.particulars.includes('Sub-Broker Profit') || (entry.particulars.includes('Brokerage') && !entry.party_id)) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(entry.particulars.includes('Sub-Broker Profit') || (entry.particulars.includes('Brokerage') && !entry.party_id)) ? '+' : '-'}₹{Math.abs(Number(entry.balance)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBill(entry)}
                        className="hover:bg-primary/10 hover:text-primary"
                        disabled={!entry.bill_number && !entry.bill_id}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {viewBillId && (
        <BillView
          billId={viewBillId}
          open={billViewOpen}
          onOpenChange={setBillViewOpen}
        />
      )}
    </div>
  );

  // Main render
  return renderListView();
};

export default LedgerBills;