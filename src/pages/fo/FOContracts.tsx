import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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

interface Broker {
  id: string;
  broker_code: string;
  name: string;
  trading_slab: number;
  delivery_slab: number;
}

interface Instrument {
  id: string;
  symbol: string;
  instrument_type: string;
  expiry_date: string;
  strike_price: number | null;
  display_name: string;
}

interface Contract {
  id: string;
  contract_number: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  instrument_id: string;
  symbol?: string;
  instrument_type?: string;
  expiry_date?: string;
  strike_price?: number;
  display_name?: string;
  broker_id: string;
  broker_code?: string;
  broker_name?: string;
  trade_date: string;
  trade_type: 'BUY' | 'SELL' | 'CF';
  quantity: number;
  price: number;
  amount: number;
  brokerage_rate: number;
  brokerage_amount: number;
  status: 'open' | 'closed' | 'expired';
  notes: string | null;
  created_at: string;
}

const FOContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('list');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(0);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Common fields for all contracts
  const [commonFields, setCommonFields] = useState({
    party_id: "",
    instrument_id: "",
    broker_id: "",
  });

  // Individual contract rows
  interface ContractRow {
    id: string;
    instrument_id: string;
    trade_type: "BUY" | "SELL" | "CF";
    trade_date: string;
    quantity: string;
    price: string;
  }
  const [contractRows, setContractRows] = useState<ContractRow[]>([
    {
      id: Date.now().toString(),
      instrument_id: "",
      trade_type: "BUY",
      trade_date: new Date().toISOString().split('T')[0],
      quantity: "",
      price: "",
    }
  ]);

  useEffect(() => {
    fetchContracts();
    fetchParties();
    fetchBrokers();
    fetchInstruments();
  }, []);

  // Filter contracts based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredContracts(contracts);
    } else {
      const filtered = contracts.filter(
        (contract) =>
          contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contract.party_name && contract.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.party_code && contract.party_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.symbol && contract.symbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.display_name && contract.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredContracts(filtered);
    }
    setSelectedRowIndex(0);
  }, [contracts, searchTerm]);

  // Focus first input when form view opens
  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/fo/contracts');
      const result = await response.json();
      setContracts(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching F&O contracts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch F&O contracts",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const fetchParties = async () => {
    try {
      // Use Equity API - parties are shared between Equity and F&O
      const response = await fetch('http://localhost:3001/api/parties');
      const result = await response.json();
      setParties(Array.isArray(result) ? result : []);
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
      // Use Equity API - brokers are shared between Equity and F&O
      const response = await fetch('http://localhost:3001/api/brokers');
      const result = await response.json();
      setBrokers(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch brokers",
        variant: "destructive",
      });
    }
  };

  const fetchInstruments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/fo/instruments');
      const result = await response.json();
      setInstruments(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching F&O instruments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch F&O instruments",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCommonFields({
      party_id: "",
      instrument_id: "",
      broker_id: "",
    });
    setContractRows([{
      id: Date.now().toString(),
      instrument_id: "",
      trade_type: "BUY",
      trade_date: new Date().toISOString().split('T')[0],
      quantity: "",
      price: "",
    }]);
    setEditingContract(null);
  };

  const addContractRow = () => {
    const newRow: ContractRow = {
      id: Date.now().toString(),
      instrument_id: "",
      trade_type: "BUY",
      trade_date: new Date().toISOString().split('T')[0],
      quantity: "",
      price: "",
    };
    setContractRows([...contractRows, newRow]);
  };

  const removeContractRow = (id: string) => {
    if (contractRows.length === 1) {
      toast({ title: "Warning", description: "At least one row is required", variant: "destructive" });
      return;
    }
    setContractRows(contractRows.filter(row => row.id !== id));
  };

  const updateContractRow = (id: string, field: keyof ContractRow, value: any) => {
    setContractRows(contractRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate common fields
    if (!commonFields.party_id || !commonFields.broker_id) {
      toast({
        title: "Validation Error",
        description: "Please fill Party and Broker",
        variant: "destructive",
      });
      return;
    }

    // Validate all rows
    const invalidRows = contractRows.filter(row => !row.instrument_id || !row.quantity || !row.price || !row.trade_date);
    if (invalidRows.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill Instrument, Quantity, Price, and Date in all rows",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get party for brokerage calculation
      const party = parties.find(p => p.id === commonFields.party_id);
      const broker = brokers.find(b => b.id === commonFields.broker_id);

      // Prepare contracts data
      // BUY and SELL generate settlement bills with brokerage
      // CF has NO brokerage and NO bills (just rollover tracking)
      const contractsData = contractRows.map(row => {
        const quantity = parseInt(row.quantity) || 0;
        const price = parseFloat(row.price) || 0;
        const amount = quantity * price;
        
        // CF has 0 brokerage, BUY/SELL have brokerage
        const brokerageRate = row.trade_type === 'CF' ? 0 : (party?.trading_slab || 0);
        const brokerageAmount = row.trade_type === 'CF' ? 0 : (amount * brokerageRate) / 100;
        
        const instrument = instruments.find(i => i.id === row.instrument_id);

        return {
          party_id: commonFields.party_id,
          instrument_id: row.instrument_id,
          broker_id: commonFields.broker_id,
          broker_code: broker?.broker_code,
          trade_date: row.trade_date,
          trade_type: row.trade_type,
          quantity,
          price,
          amount,
          brokerage_rate: brokerageRate,
          brokerage_amount: brokerageAmount,
          notes: null,
        };
      });

      // Separate trades (for info only, all of them just create contracts now)
      const billableTrades = contractsData.filter(c => c.trade_type === 'BUY' || c.trade_type === 'SELL');
      const cfTrades = contractsData.filter(c => c.trade_type === 'CF');
      
      let createdContracts = 0;
      const totalTrades = contractsData.length;

      // Store all contracts (no bills here)
      const response = await fetch('http://localhost:3001/api/fo/contracts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contracts: contractsData,
          billDate: contractRows[0].trade_date,
          generateBills: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create contracts');
      }

      const result = await response.json();
      createdContracts = result.contracts?.length || totalTrades;

      const buyCount = billableTrades.filter(c => c.trade_type === 'BUY').length;
      const sellCount = billableTrades.filter(c => c.trade_type === 'SELL').length;
      const cfCount = cfTrades.length;
      
      let billsMessage = '';
      billsMessage = ` (${buyCount} BUY, ${sellCount} SELL, ${cfCount} CF)`;

      toast({
        title: "Success",
        description: `Created ${createdContracts} contracts${billsMessage}. Generate bills later from FO Contracts or FO Ledger Bills.`,
      });

      resetForm();
      fetchContracts();
      setCurrentView('list');
    } catch (error) {
      console.error('Error saving contracts:', error);
      toast({
        title: "Error",
        description: "Failed to create contracts",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (contract: Contract) => {
    toast({
      title: "Edit Not Supported",
      description: "F&O contract editing is not supported. Please delete and recreate the contract.",
      variant: "destructive",
    });
  };

  const handleDelete = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    
    // Increment confirmation step
    const newConfirmationStep = confirmationStep + 1;
    setConfirmationStep(newConfirmationStep);
    
    // If we haven't reached 3 confirmations yet, show toast and return
    if (newConfirmationStep < 3) {
      toast({
        title: `Confirmation ${newConfirmationStep}/3`,
        description: `Please click "Confirm" ${3 - newConfirmationStep} more time(s) to proceed with deletion.`,
        variant: "destructive",
      });
      return; // Early return
    }
    
    // On the 3rd confirmation, perform the actual deletion
    try {
      const response = await fetch(`http://localhost:3001/api/fo/contracts/${contractToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: 'true' })
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete contract');
      }
      
      toast({ 
        title: "Success", 
        description: `Contract "${contractToDelete.contract_number}" deleted successfully`,
        variant: "default"
      });
      fetchContracts();
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contract",
        variant: "destructive",
      });
    }
    
    // Reset confirmation after deletion attempt
    setConfirmationStep(0);
  };

  // Business keyboard shortcuts
  useBusinessKeyboard({
    onNew: () => {
      resetForm();
      setCurrentView('form');
    },
    onEdit: () => {
      if (currentView === 'list' && filteredContracts[selectedRowIndex]) {
        handleEdit(filteredContracts[selectedRowIndex]);
      }
    },
    onDelete: () => {
      if (currentView === 'list' && filteredContracts[selectedRowIndex]) {
        handleDelete(filteredContracts[selectedRowIndex]);
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
    onUp: () => {
      if (currentView === 'list' && contracts.length > 0) {
        const prevIndex = Math.max(selectedRowIndex - 1, 0);
        setSelectedRowIndex(prevIndex);
      }
    },
    onDown: () => {
      if (currentView === 'list' && contracts.length > 0) {
        const nextIndex = Math.min(selectedRowIndex + 1, contracts.length - 1);
        setSelectedRowIndex(nextIndex);
      }
    },
  });

  // Form navigation
  useFormNavigation(formRef, handleSubmit);

  // Render form view
  const renderFormView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title={editingContract ? `F&O Contracts - Edit ${editingContract.contract_number}` : "F&O Contracts - New Entry"}
        description={editingContract ? "Update F&O contract details" : "Add multiple F&O contracts. Bills are generated later from contracts."}
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
              <FileText className="w-4 h-4 mr-2" />
              Save & Generate Bills
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F9
              </kbd>
            </Button>
          </div>
        }
      />
      
      <div className="p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Contract Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party_id" className="text-sm font-medium">
                    Party (Client) <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={commonFields.party_id}
                    onValueChange={(value) => setCommonFields({ ...commonFields, party_id: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={1}>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {parties.map((party) => (
                        <SelectItem key={party.id} value={party.id}>
                          {party.party_code} - {party.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">The client</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="broker_id" className="text-sm font-medium">
                    Broker <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={commonFields.broker_id}
                    onValueChange={(value) => setCommonFields({ ...commonFields, broker_id: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={2}>
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                    <SelectContent>
                      {brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.broker_code} - {broker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Who is handling this</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Items Section (store contracts only; no bills here) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
                Contract Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Info box directing users to FO Ledger Bills for bill generation */}
              <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                <div className="font-semibold text-[13px] w-full md:w-auto">Generate F&O Bills</div>
                <div className="w-full text-[11px] text-blue-800 mt-1">
                  Bills are generated from the FO Ledger Bills page. After saving contracts here, go to FO → Ledger Bills to generate bills.
                </div>
                <Button
                  onClick={() => window.location.hash = '/fo/ledger/bills'}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 h-7 px-3 text-[11px] font-semibold"
                >
                  Go to FO Ledger Bills
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[280px]">Instrument</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead className="w-[140px]">Date</TableHead>
                      <TableHead className="w-[120px]">Quantity</TableHead>
                      <TableHead className="w-[120px]">Price</TableHead>
                      <TableHead className="w-[140px]">Amount</TableHead>
                      <TableHead className="w-[150px]">Brokerage</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractRows.map((row) => {
                      const quantity = parseInt(row.quantity) || 0;
                      const price = parseFloat(row.price) || 0;
                      const amount = quantity * price;
                      const party = parties.find(p => p.id === commonFields.party_id);
                      // CF has no brokerage, BUY/SELL have brokerage
                      const brokerageRate = row.trade_type === 'CF' ? 0 : (party?.trading_slab || 0);
                      const brokerageAmount = row.trade_type === 'CF' ? 0 : (amount * brokerageRate) / 100;

                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Select
                              value={row.instrument_id}
                              onValueChange={(value) => updateContractRow(row.id, "instrument_id", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select instrument" />
                              </SelectTrigger>
                              <SelectContent>
                                {instruments.map((instrument) => (
                                  <SelectItem key={instrument.id} value={instrument.id}>
                                    {instrument.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.trade_type}
                              onValueChange={(value: "BUY" | "SELL" | "CF") => updateContractRow(row.id, "trade_type", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BUY">BUY</SelectItem>
                                <SelectItem value="SELL">SELL</SelectItem>
                                <SelectItem value="CF">CF (Carry Forward)</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={row.trade_date}
                              onChange={(e) => updateContractRow(row.id, "trade_date", e.target.value)}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={row.quantity}
                              onChange={(e) => {
                                // Only allow whole numbers (integers)
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                updateContractRow(row.id, "quantity", value);
                              }}
                              placeholder="Quantity"
                              className="h-9"
                              min="1"
                              step="1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={row.price}
                              onChange={(e) => updateContractRow(row.id, "price", e.target.value)}
                              placeholder="Price"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            ₹{amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-amber-600">
                            {row.trade_type === 'CF' ? (
                              <div className="text-purple-600 text-sm">No Brokerage (CF)</div>
                            ) : (
                              `${brokerageRate}% = ₹${brokerageAmount.toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContractRow(row.id)}
                              className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button onClick={addContractRow} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Row
                </Button>

                <div className="text-sm text-muted-foreground">
                  {contractRows.length} {contractRows.length === 1 ? "item" : "items"} • Total: ₹
                  {contractRows
                    .reduce((sum, row) => {
                      const quantity = parseInt(row.quantity) || 0;
                      const amount = quantity * (parseFloat(row.price) || 0);
                      return sum + amount;
                    }, 0)
                    .toFixed(2)}
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
            >
              <X className="w-4 h-4 mr-2" />
              Cancel <kbd className="ml-2 text-xs opacity-50">Esc</kbd>
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-hover px-6"
            >
              <FileText className="w-4 h-4 mr-2" />
              Save & Generate Bills <kbd className="ml-2 text-xs opacity-50">F9</kbd>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="F&O Contracts"
        description="View and manage F&O contract notes"
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search contracts... (F3)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64 bg-secondary"
              />
            </div>
            <Button
              onClick={() => {
                resetForm();
                setCurrentView('form');
              }}
              className="bg-primary hover:bg-primary-hover group relative"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add F&O Contract
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
                <TableHead className="font-semibold">Contract Number</TableHead>
                <TableHead className="font-semibold">Party</TableHead>
                <TableHead className="font-semibold">Instrument</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="font-semibold text-right">Price</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold text-right">Type</TableHead>
                <TableHead className="font-semibold text-right">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Loading contracts...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No contracts found. Add your first contract to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract, index) => (
                  <TableRow 
                    key={contract.id} 
                    data-row-index={index}
                    className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                      index === selectedRowIndex ? "bg-primary/10 ring-2 ring-primary/20" : ""
                    }`}
                    onClick={(e) => {
                      setSelectedRowIndex(index);
                      // Auto-focus the row for keyboard navigation
                      const rowElement = e.currentTarget;
                      rowElement.focus();
                    }}
                    onDoubleClick={() => handleEdit(contract)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEdit(contract);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const nextIndex = Math.min(selectedRowIndex + 1, filteredContracts.length - 1);
                        setSelectedRowIndex(nextIndex);
                        // Focus the next row
                        const nextRow = e.currentTarget.parentElement?.children[nextIndex] as HTMLElement;
                        nextRow?.focus();
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        const prevIndex = Math.max(selectedRowIndex - 1, 0);
                        setSelectedRowIndex(prevIndex);
                        // Focus the previous row
                        const prevRow = e.currentTarget.parentElement?.children[prevIndex] as HTMLElement;
                        prevRow?.focus();
                      } else if (e.key === "Home") {
                        e.preventDefault();
                        setSelectedRowIndex(0);
                        const firstRow = e.currentTarget.parentElement?.children[0] as HTMLElement;
                        firstRow?.focus();
                      } else if (e.key === "End") {
                        e.preventDefault();
                        const lastIndex = filteredContracts.length - 1;
                        setSelectedRowIndex(lastIndex);
                        const lastRow = e.currentTarget.parentElement?.children[lastIndex] as HTMLElement;
                        lastRow?.focus();
                      }
                    }}
                  >
                    <TableCell className="font-mono text-sm font-medium">{contract.contract_number}</TableCell>
                    <TableCell>
                      <div className="font-medium">{contract.party_code}</div>
                      <div className="text-sm text-muted-foreground">{contract.party_name}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{contract.display_name || contract.symbol}</div>
                      <div className="text-xs text-muted-foreground">{contract.instrument_type}</div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(contract.trade_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-accent">{contract.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-accent">₹{Number(contract.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-accent font-medium">₹{Number(contract.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        contract.trade_type === 'BUY' ? 'bg-green-100 text-green-800' : 
                        contract.trade_type === 'SELL' ? 'bg-red-100 text-red-800' : 
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {contract.trade_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        contract.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        contract.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contract)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contract)}
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
        title="Delete Contract"
        description={
          confirmationStep > 0 
            ? `This is confirmation ${confirmationStep}/3. Please click "Confirm" ${3 - confirmationStep} more time(s) to proceed with deletion.`
            : `Are you sure you want to delete contract "${contractToDelete?.contract_number}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
};

export default FOContracts;
