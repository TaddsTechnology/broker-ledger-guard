import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, List, Search, Calendar, IndianRupee } from "lucide-react";
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
  created_at: string;
}

const Ledger = () => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('list');
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
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

  useEffect(() => {
    fetchParties();
  }, []);

  // Fetch ledger entries on component mount and when selected party changes
  useEffect(() => {
    fetchLedgerEntries();
  }, [selectedPartyId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEntries(ledgerEntries);
    } else {
      const filtered = ledgerEntries.filter(
        (entry) =>
          entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (entry.party_name && entry.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (entry.party_code && entry.party_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEntries(filtered);
    }
  }, [ledgerEntries, searchTerm]);

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
        result = await ledgerQueries.getByPartyId(selectedPartyId);
      } else {
        result = await ledgerQueries.getAll();
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
        await ledgerQueries.update(editingEntry.id, ledgerData);
        toast({ title: "Success", description: "Ledger entry updated successfully" });
      } else {
        await ledgerQueries.create(ledgerData);
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
                      {parties.map((party) => (
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
        title="Ledger"
        description="Account ledger and transaction history"
        action={
          <div className="flex gap-2">
            <div className="flex gap-2">
              <Select
                value={selectedPartyId}
                onValueChange={(value) => setSelectedPartyId(value)}
              >
                <SelectTrigger className="w-48 bg-secondary">
                  <SelectValue placeholder="Filter by party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Parties</SelectItem>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.party_code} - {party.name}
                    </SelectItem>
                  ))}
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
                    No ledger entries found. Add your first entry to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry, index) => (
                  <TableRow 
                    key={entry.id} 
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onDoubleClick={() => handleEdit(entry)}
                  >
                    <TableCell className="text-sm">{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.party_code}</div>
                      <div className="text-sm text-muted-foreground">{entry.party_name}</div>
                    </TableCell>
                    <TableCell className="font-medium">{entry.particulars}</TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {entry.debit_amount > 0 ? `₹${entry.debit_amount.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {entry.credit_amount > 0 ? `₹${entry.credit_amount.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-medium ${
                      entry.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{entry.balance.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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
    </>
  );
};

export default Ledger;