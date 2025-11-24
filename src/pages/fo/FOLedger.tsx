import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, List, Search, Calendar, IndianRupee, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { ledgerQueries, partyQueries } from "@/lib/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  reference_type?: string;
  created_at: string;
}

const FOLedger = () => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('list');
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [ledgerType, setLedgerType] = useState<string>("all"); // all, brokerage, trade_settlement
  const [viewMode, setViewMode] = useState<'detailed' | 'grouped'>('grouped'); // detailed or grouped
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    party_id: "",
    entry_date: new Date().toISOString().split('T')[0],
    particulars: "",
    debit_amount: "",
    credit_amount: "",
    balance: "",
  });

  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LedgerEntry | null>(null);

  useEffect(() => {
    fetchParties();
  }, []);

  // Fetch ledger entries on component mount and when selected party changes
  useEffect(() => {
    fetchLedgerEntries();
  }, [selectedPartyId]);

  useEffect(() => {
    let entries = ledgerEntries;
    
    // Filter by ledger type
    if (ledgerType !== "all") {
      entries = entries.filter(entry => entry.reference_type === ledgerType);
    }
    
    // Filter by search term
    if (searchTerm.trim() !== "") {
      entries = entries.filter(
        (entry) =>
          entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (entry.party_name && entry.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (entry.party_code && entry.party_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredEntries(entries);
  }, [ledgerEntries, searchTerm, ledgerType]);

  // Focus first input when form view opens
  useEffect(() => {
    if (currentView === 'form') {
      // Focus the first select element after a short delay
      setTimeout(() => {
        const firstSelect = document.querySelector('[tabindex="1"]') as HTMLElement;
        if (firstSelect) {
          firstSelect.focus();
        }
      }, 100);
    }
  }, [currentView]);

  const fetchLedgerEntries = async () => {
    setIsLoading(true);
    try {
      let result;
      if (selectedPartyId) {
        result = await (async () => { const response = await fetch(`http://localhost:3001/api/fo/ledger/party/${selectedPartyId}`); const result = await response.json(); return Array.isArray(result) ? result : []; })();
      } else {
        result = await (async () => { const response = await fetch("http://localhost:3001/api/fo/ledger"); const result = await response.json(); return Array.isArray(result) ? result : []; })();
      }
      setLedgerEntries(result || []);
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

  const resetForm = () => {
    setFormData({
      party_id: "",
      entry_date: new Date().toISOString().split('T')[0],
      particulars: "",
      debit_amount: "",
      credit_amount: "",
      balance: "",
    });
    setEditingEntry(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const ledgerData = {
      party_id: formData.party_id,
      entry_date: formData.entry_date,
      particulars: formData.particulars,
      debit_amount: parseFloat(formData.debit_amount) || 0,
      credit_amount: parseFloat(formData.credit_amount) || 0,
      balance: parseFloat(formData.balance),
    };

    try {
      if (editingEntry) {
        await (await fetch(`http://localhost:3001/api/fo/ledger/${editingEntry.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ledgerData) })).json();
        toast({ title: "Success", description: "Ledger entry updated successfully" });
      } else {
        await (await fetch("http://localhost:3001/api/fo/ledger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ledgerData) })).json();
        toast({ 
          title: "Success", 
          description: "Ledger entry created successfully",
          variant: "default"
        });
      }
      setCurrentView('list');
      resetForm();
      fetchLedgerEntries();
    } catch (error) {
      console.error('Error saving ledger entry:', error);
      toast({
        title: "Error",
        description: "Failed to save ledger entry",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: LedgerEntry) => {
    setEditingEntry(entry);
    setFormData({
      party_id: entry.party_id,
      entry_date: entry.entry_date,
      particulars: entry.particulars,
      debit_amount: entry.debit_amount.toString(),
      credit_amount: entry.credit_amount.toString(),
      balance: entry.balance.toString(),
    });
    setCurrentView('form');
  };

  const handleDeleteClick = (entry: LedgerEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  // Group entries by date and party
  const groupLedgerEntries = () => {
    const groups: { [key: string]: { 
      date: string; 
      party_id: string;
      party_code: string;
      party_name: string;
      entries: LedgerEntry[];
      tradeEntries: LedgerEntry[];
      brokerageEntries: LedgerEntry[];
      cfEntries: LedgerEntry[];
      tradeBuy: number;
      tradeSell: number;
      tradeBalance: number;
      brokerageTotal: number;
      brokerageBalance: number;
      cfBuy: number;
      cfSell: number;
      cfBalance: number;
    } } = {};

    filteredEntries.forEach(entry => {
      const date = new Date(entry.entry_date).toLocaleDateString();
      const partyKey = `${date}-${entry.party_id || 'broker'}`;
      
      if (!groups[partyKey]) {
        groups[partyKey] = {
          date,
          party_id: entry.party_id || 'broker',
          party_code: entry.party_code || 'Broker Entry',
          party_name: entry.party_name || 'Brokerage Transaction',
          entries: [],
          tradeEntries: [],
          brokerageEntries: [],
          cfEntries: [],
          tradeBuy: 0,
          tradeSell: 0,
          tradeBalance: 0,
          brokerageTotal: 0,
          brokerageBalance: 0,
          cfBuy: 0,
          cfSell: 0,
          cfBalance: 0,
        };
      }
      
      groups[partyKey].entries.push(entry);
      
      if (entry.reference_type === 'client_settlement') {
        groups[partyKey].tradeEntries.push(entry);
        groups[partyKey].tradeBuy += Number(entry.debit_amount) || 0;
        groups[partyKey].tradeSell += Number(entry.credit_amount) || 0;
        groups[partyKey].tradeBalance = Number(entry.balance) || 0;
      } else if (entry.reference_type === 'carry_forward') {
        groups[partyKey].cfEntries.push(entry);
        groups[partyKey].cfBuy += Number(entry.debit_amount) || 0;
        groups[partyKey].cfSell += Number(entry.credit_amount) || 0;
        groups[partyKey].cfBalance = Number(entry.balance) || 0;
      } else if (entry.reference_type === 'brokerage' || entry.reference_type === 'broker_brokerage') {
        groups[partyKey].brokerageEntries.push(entry);
        // For brokerage: clients pay (debit), broker receives (credit)
        const amount = Number(entry.debit_amount) || Number(entry.credit_amount) || 0;
        groups[partyKey].brokerageTotal += amount;
        groups[partyKey].brokerageBalance = Number(entry.balance) || 0;
      }
    });
    
    return Object.values(groups);
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    try {
      await ledgerQueries.delete(entryToDelete.id);
      toast({ 
        title: "Success", 
        description: "Ledger entry deleted successfully",
        variant: "default"
      });
      fetchLedgerEntries();
    } catch (error) {
      console.error('Error deleting ledger entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete ledger entry",
        variant: "destructive",
      });
    } finally {
      setEntryToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Add edit functionality to keyboard shortcuts
  // Business keyboard shortcuts
  useBusinessKeyboard({
    onNew: () => {
      resetForm();
      setCurrentView('form');
    },
    onEdit: () => {
      if (currentView === 'list' && filteredEntries.length > 0) {
        // Find the first visible entry in the table
        const firstEntry = filteredEntries[0];
        if (firstEntry) {
          handleEdit(firstEntry);
        }
      }
    },
    onSearch: () => {
      if (currentView === 'list') {
        searchInputRef.current?.focus();
      }
    },
    onSave: () => {
      if (currentView === 'form') {
        handleSubmit();
      }
    },
    onCancel: () => {
      if (currentView === 'form') {
        setCurrentView('list');
        resetForm();
      }
    },
  });

  // Update the form title to reflect edit mode
  // Render form view
  const renderFormView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title={editingEntry ? "Edit Ledger Entry" : "Ledger - New Entry"}
        description={editingEntry ? "Update ledger entry" : "Create new ledger entry"}
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setCurrentView('list');
                resetForm();
              }}
              variant="outline"
              className="group relative"
            >
              <List className="w-4 h-4 mr-2" />
              View List
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                Esc
              </kbd>
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary-hover group relative"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingEntry ? "Update" : "Save"}
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F9
              </kbd>
            </Button>
          </div>
        }
      />
      
      <div className="p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Ledger Entry Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                Ledger Entry Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party_id" className="text-sm font-medium">
                    Party <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.party_id}
                    onValueChange={(value) => setFormData({ ...formData, party_id: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={1}>
                      <SelectValue placeholder="Select party" />
                    </SelectTrigger>
                    <SelectContent>
                      {parties
                        .filter(party => party.id && party.id.trim() !== "")
                        .map((party) => (
                          <SelectItem key={party.id} value={party.id}>
                            {party.party_code} - {party.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entry_date" className="text-sm font-medium">
                    Entry Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    required
                    className="bg-secondary h-10"
                    tabIndex={2}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="particulars" className="text-sm font-medium">
                  Particulars <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="particulars"
                  value={formData.particulars}
                  onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                  required
                  className="bg-secondary h-10"
                  placeholder="Enter particulars"
                  tabIndex={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="debit_amount" className="text-sm font-medium">
                    Debit Amount
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="debit_amount"
                      type="number"
                      step="0.01"
                      value={formData.debit_amount}
                      onChange={(e) => setFormData({ ...formData, debit_amount: e.target.value })}
                      className="bg-secondary h-10 pl-10"
                      placeholder="0.00"
                      tabIndex={4}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="credit_amount" className="text-sm font-medium">
                    Credit Amount
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="credit_amount"
                      type="number"
                      step="0.01"
                      value={formData.credit_amount}
                      onChange={(e) => setFormData({ ...formData, credit_amount: e.target.value })}
                      className="bg-secondary h-10 pl-10"
                      placeholder="0.00"
                      tabIndex={5}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="balance" className="text-sm font-medium">
                    Balance <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      required
                      className="bg-secondary h-10 pl-10"
                      placeholder="0.00"
                      tabIndex={6}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentView('list');
                resetForm();
              }}
              className="px-6"
              tabIndex={8}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel <kbd className="ml-2 text-xs opacity-50">Esc</kbd>
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-hover px-6"
              tabIndex={7}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingEntry ? "Update" : "Save"} <kbd className="ml-2 text-xs opacity-50">F9</kbd>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // Add edit button to list view
  // Render list view
  const renderListView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="F&O Ledger"
        description="Account ledger and transaction history"
        action={
          <div className="flex gap-2">
            <div className="flex gap-2">
              <Select
                value={selectedPartyId}
                onValueChange={(value) => setSelectedPartyId(value)}
              >
                <SelectTrigger className="w-64 bg-secondary">
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
                value={ledgerType}
                onValueChange={(value) => setLedgerType(value)}
              >
                <SelectTrigger className="w-56 bg-secondary">
                  <SelectValue placeholder="Ledger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="client_settlement">Client Settlement</SelectItem>
                  <SelectItem value="carry_forward">Carry Forward (CF)</SelectItem>
                  <SelectItem value="brokerage">Brokerage Only</SelectItem>
                  <SelectItem value="broker_brokerage">Broker Income</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={viewMode}
                onValueChange={(value: 'detailed' | 'grouped') => setViewMode(value)}
              >
                <SelectTrigger className="w-44 bg-secondary">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grouped">📊 Grouped Summary</SelectItem>
                  <SelectItem value="detailed">📋 Detailed View</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search ledger... (F3)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64 bg-secondary"
                />
              </div>
            </div>
            
            <Button
              onClick={() => {
                resetForm();
                setCurrentView('form');
              }}
              className="bg-primary hover:bg-primary-hover group relative"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F4
              </kbd>
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Party</TableHead>
                <TableHead className="font-semibold">Particulars</TableHead>
                <TableHead className="font-semibold text-right">Debit</TableHead>
                <TableHead className="font-semibold text-right">Credit</TableHead>
                <TableHead className="font-semibold text-right">Balance</TableHead>
                <TableHead className="font-semibold text-right">Net Profit</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading ledger entries...
                  </TableCell>
                </TableRow>
              ) : ledgerEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No ledger entries found. Add your first entry to get started.
                  </TableCell>
                </TableRow>
              ) : viewMode === 'grouped' ? (
                // Grouped view
                groupLedgerEntries().map((group) => {
                  const groupKey = `${group.date}-${group.party_id}`;
                  const isExpanded = expandedGroups.has(groupKey);
                  // const billNumbers = [...new Set(group.entries.map(e => e.bill_number).filter(Boolean))];
                  
                  return (
                    <>
                      {/* Group Summary Row */}
                      <TableRow 
                        key={groupKey}
                        className="bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium border-b-2"
                        onClick={() => toggleGroup(groupKey)}
                      >
                        <TableCell className="text-sm font-semibold">{group.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                            <div>
                              <div className="font-bold text-base">{group.party_code}</div>
                              <div className="text-xs text-muted-foreground">{group.party_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Trade Settlement Summary */}
                            {group.tradeEntries.length > 0 && (
                              <div className="border-l-4 border-blue-400 pl-3">
                                <div className="text-xs font-semibold text-blue-700 mb-1">TRADE SETTLEMENT</div>
                                <div className="text-xs space-y-0.5">
                                  <div>Buy: ₹{group.tradeBuy.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                                  <div>Sell: ₹{group.tradeSell.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                                  <div className={`font-bold ${group.tradeBalance === 0 ? 'text-green-600' : group.tradeBalance < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                    Balance: ₹{group.tradeBalance.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                                    {group.tradeBalance === 0 && ' ✔ CLOSED'}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Carry Forward Summary */}
                            {group.cfEntries.length > 0 && (
                              <div className="border-l-4 border-purple-400 pl-3">
                                <div className="text-xs font-semibold text-purple-700 mb-1">CARRY FORWARD (CF)</div>
                                <div className="text-xs space-y-0.5">
                                  <div>CF Buy: ₹{group.cfBuy.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                                  <div>CF Sell: ₹{group.cfSell.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                                  <div className="font-bold text-purple-700">
                                    Balance: ₹{group.cfBalance.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Brokerage Summary */}
                            {group.brokerageEntries.length > 0 && (
                              <div className="border-l-4 border-amber-400 pl-3">
                                <div className="text-xs font-semibold text-amber-700 mb-1">BROKERAGE CHARGES</div>
                                <div className="text-xs space-y-0.5">
                                  <div>Total: ₹{group.brokerageTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                                  <div className="font-bold text-amber-700">
                                    Balance: ₹{group.brokerageBalance.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {group.tradeBuy > 0 && (
                            <div className="font-mono">₹{group.tradeBuy.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                          )}
                          {group.brokerageTotal > 0 && (
                            <div className="font-mono mt-1">₹{group.brokerageTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {group.tradeSell > 0 && (
                            <div className="font-mono">₹{group.tradeSell.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold">
                          {group.tradeBalance !== 0 && (
                            <div className={`font-mono ${group.tradeBalance === 0 ? 'text-green-600' : group.tradeBalance < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                              ₹{group.tradeBalance.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                            </div>
                          )}
                          {group.brokerageBalance > 0 && (
                            <div className="font-mono text-amber-700 mt-1">
                              ₹{group.brokerageBalance.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`text-right text-xs font-bold ${
                          (group.tradeSell - group.tradeBuy - group.brokerageTotal + group.cfSell - group.cfBuy) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <div className="font-mono">
                            ₹{(group.tradeSell - group.tradeBuy - group.brokerageTotal + group.cfSell - group.cfBuy).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-semibold text-blue-600">
                                {group.entries.length} {group.entries.length === 1 ? 'bill' : 'bills'}
                              </span>
                              <button 
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleGroup(groupKey);
                                }}
                              >
                                Manage bills {isExpanded ? '▲' : '▼'}
                              </button>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroup(groupKey);
                              }}
                              className="p-2 hover:bg-blue-200 rounded transition-colors"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              <span className="text-xl text-blue-600">{isExpanded ? '▲' : '▼'}</span>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details */}
                      {isExpanded && group.entries.map((entry) => (
                        <TableRow 
                          key={entry.id}
                          className="bg-gray-50 hover:bg-gray-100"
                        >
                          <TableCell className="pl-12 text-xs text-muted-foreground">
                            {new Date(entry.entry_date).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="px-2 py-1 rounded text-xs font-medium" 
                              style={{backgroundColor: 
                                entry.reference_type === 'client_settlement' ? '#dbeafe' : 
                                entry.reference_type === 'carry_forward' ? '#f3e8ff' : 
                                '#fef3c7'}}>
                              {entry.reference_type === 'client_settlement' ? 'Settlement' : 
                               entry.reference_type === 'carry_forward' ? 'CF' : 
                               'Brokerage'}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{entry.particulars}</TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {Number(entry.debit_amount) > 0 ? `₹${Number(entry.debit_amount).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {Number(entry.credit_amount) > 0 ? `₹${Number(entry.credit_amount).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            ₹{Number(entry.balance).toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right text-xs font-mono font-semibold ${
                            (Number(entry.credit_amount) - Number(entry.debit_amount)) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ₹{(Number(entry.credit_amount) - Number(entry.debit_amount)).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(entry);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(entry);
                                }}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })
              ) : (
                // Detailed view (original)
                filteredEntries.map((entry, index) => (
                  <TableRow 
                    key={entry.id} 
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onDoubleClick={() => handleEdit(entry)}
                  >
                    <TableCell className="text-sm">{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {entry.party_code ? entry.party_code : 'Broker Entry'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.party_name ? entry.party_name : 'Brokerage Transaction'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.particulars}
                      {(entry.particulars.includes('Brokerage for bill') || 
                        entry.particulars.includes('Main Broker Bill') || 
                        entry.particulars.includes('Sub-Broker Profit')) && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Broker Bill
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
                      entry.party_id ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {entry.party_id ? '-' : '+'}₹{Math.abs(Number(entry.balance)).toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${
                      (Number(entry.credit_amount) - Number(entry.debit_amount)) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{(Number(entry.credit_amount) - Number(entry.debit_amount)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(entry)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );

  // Main render based on current view
  return (
    <>
      {currentView === 'form' ? renderFormView() : renderListView()}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Ledger Entry"
        description={`Are you sure you want to delete this ledger entry? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default FOLedger;
