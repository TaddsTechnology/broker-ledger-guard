import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { partyQueries, settlementQueries, contractQueries, brokerQueries, companyQueries } from "@/lib/database";
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

interface Company {
  id: string;
  company_code: string;
  name: string;
  nse_code: string | null;
}

interface Settlement {
  id: string;
  settlement_number: string;
  type: string;
  start_date: string;
  end_date: string;
}

interface Contract {
  id: string;
  contract_number: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  settlement_id: string;
  settlement_number?: string;
  broker_id: string;
  broker_code?: string;
  broker_name?: string;
  contract_date: string;
  quantity: number;
  rate: number;
  amount: number;
  contract_type: 'buy' | 'sell';
  brokerage_rate: number;
  brokerage_amount: number;
  status: 'active' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
}

const Contracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('list');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Common fields for all contracts
  const [commonFields, setCommonFields] = useState({
    party_id: "",
    settlement_id: "",
    broker_id: "",
  });

  // Individual contract rows
  interface ContractRow {
    id: string;
    company_id: string;
    trade_type: "T" | "D";
    contract_type: "buy" | "sell";
    contract_date: string;
    quantity: string;
    rate: string;
  }
  const [contractRows, setContractRows] = useState<ContractRow[]>([
    {
      id: Date.now().toString(),
      company_id: "",
      trade_type: "T",
      contract_type: "buy",
      contract_date: new Date().toISOString().split('T')[0],
      quantity: "",
      rate: "",
    }
  ]);
  useEffect(() => {
    fetchContracts();
    fetchParties();
    fetchBrokers();
    fetchSettlements();
    fetchCompanies();
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
          (contract.settlement_number && contract.settlement_number.toLowerCase().includes(searchTerm.toLowerCase()))
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
      const result = await contractQueries.getAll();
      setContracts(result || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contracts",
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

  const fetchBrokers = async () => {
    try {
      const result = await brokerQueries.getAll();
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

  const fetchSettlements = async () => {
    try {
      const result = await settlementQueries.getAll();
      setSettlements(result || []);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settlements",
        variant: "destructive",
      });
    }
  };

  const fetchCompanies = async () => {
    try {
      const result = await companyQueries.getAll();
      setCompanies(result || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCommonFields({
      party_id: "",
      settlement_id: "",
      broker_id: "",
    });
    setContractRows([{
      id: Date.now().toString(),
      company_id: "",
      trade_type: "T",
      contract_type: "buy",
      contract_date: new Date().toISOString().split('T')[0],
      quantity: "",
      rate: "",
    }]);
    setEditingContract(null);
  };

  const addContractRow = () => {
    const newRow: ContractRow = {
      id: Date.now().toString(),
      company_id: "",
      trade_type: "T",
      contract_type: "buy",
      contract_date: new Date().toISOString().split('T')[0],
      quantity: "",
      rate: "",
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
    if (!commonFields.party_id || !commonFields.broker_id || !commonFields.settlement_id) {
      toast({
        title: "Validation Error",
        description: "Please fill Party, Broker, and Settlement",
        variant: "destructive",
      });
      return;
    }

    // Validate all rows
    const invalidRows = contractRows.filter(row => !row.company_id || !row.quantity || !row.rate || !row.contract_date);
    if (invalidRows.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill Company, Quantity, Rate, and Date in all rows",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get party for brokerage calculation
      const party = parties.find(p => p.id === commonFields.party_id);
      const broker = brokers.find(b => b.id === commonFields.broker_id);

      // Check if we're editing an existing contract
      if (editingContract && contractRows.length === 1) {
        // Single contract edit mode
        const row = contractRows[0];
        const quantity = parseInt(row.quantity);
        const rate = parseFloat(row.rate);
        const amount = quantity * rate;
        const brokerageRate = row.trade_type === 'T' 
          ? (party?.trading_slab || 0) 
          : (party?.delivery_slab || 0);
        const brokerageAmount = (amount * brokerageRate) / 100;

        const updatedContract = {
          contract_number: editingContract.contract_number,
          party_id: commonFields.party_id,
          settlement_id: commonFields.settlement_id,
          broker_id: commonFields.broker_id,
          broker_code: broker?.broker_code,
          contract_date: row.contract_date,
          quantity,
          rate,
          amount,
          contract_type: row.contract_type,
          brokerage_rate: brokerageRate,
          brokerage_amount: brokerageAmount,
          status: editingContract.status,
          notes: editingContract.notes,
          company_id: row.company_id,
          trade_type: row.trade_type,
        };

        const response = await contractQueries.update(editingContract.id, updatedContract);

        toast({
          title: "Success! 🎉",
          description: `Contract ${editingContract.contract_number} updated successfully`,
        });

        resetForm();
        fetchContracts();
        setCurrentView('list');
        return;
      }

      // Prepare contracts data for batch creation
      const contractsData = contractRows.map(row => {
        const quantity = parseInt(row.quantity);
        const rate = parseFloat(row.rate);
        const amount = quantity * rate;
        const brokerageRate = row.trade_type === 'T' 
          ? (party?.trading_slab || 0) 
          : (party?.delivery_slab || 0);
        const brokerageAmount = (amount * brokerageRate) / 100;

        return {
          party_id: commonFields.party_id,
          settlement_id: commonFields.settlement_id,
          broker_id: commonFields.broker_id,
          broker_code: broker?.broker_code,
          contract_date: row.contract_date,
          quantity,
          rate,
          amount,
          contract_type: row.contract_type,
          brokerage_rate: brokerageRate,
          brokerage_amount: brokerageAmount,
          company_id: row.company_id,
          trade_type: row.trade_type,
          notes: null,
        };
      });

      // Call batch API
      const response = await fetch('http://localhost:3001/api/contracts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contracts: contractsData,
          billDate: contractRows[0].contract_date,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create contracts and bills');
      }

      const result = await response.json();

      toast({
        title: "Success! 🎉",
        description: `Created ${result.contracts.length} contracts, ${result.partyBills.length} party bills, ${result.brokerBills.length} broker bills`,
      });

      resetForm();
      fetchContracts();
      setCurrentView('list');
    } catch (error) {
      console.error('Error saving contracts:', error);
      toast({
        title: "Error",
        description: "Failed to create contracts and generate bills",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (contract: Contract) => {
    try {
      // Fetch the full contract details including company_id and trade_type
      const response = await fetch(`http://localhost:3001/api/contracts/${contract.id}`);
      if (!response.ok) throw new Error('Failed to fetch contract details');
      const fullContract = await response.json();
      
      setEditingContract(fullContract);
      
      // Set common fields
      setCommonFields({
        party_id: fullContract.party_id,
        settlement_id: fullContract.settlement_id,
        broker_id: fullContract.broker_id,
      });
      
      // Set contract row with the contract data
      setContractRows([{
        id: Date.now().toString(),
        company_id: fullContract.company_id || '',
        trade_type: fullContract.trade_type || 'T',
        contract_type: fullContract.contract_type,
        contract_date: fullContract.contract_date.split('T')[0],
        quantity: fullContract.quantity.toString(),
        rate: fullContract.rate.toString(),
      }]);
      
      setCurrentView('form');
    } catch (error) {
      console.error('Error loading contract for edit:', error);
      toast({
        title: "Error",
        description: "Failed to load contract for editing",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;

    try {
      await contractQueries.delete(contractToDelete.id);
      toast({ 
        title: "Success", 
        description: `Contract "${contractToDelete.contract_number}" deleted successfully`,
        variant: "default"
      });
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        title: "Error",
        description: "Failed to delete contract",
        variant: "destructive",
      });
    }
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
        title={editingContract ? `Contracts - Edit ${editingContract.contract_number}` : "Contracts - New Entry"}
        description={editingContract ? "Update contract details" : "Add multiple contracts and generate bills automatically"}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label htmlFor="settlement_id" className="text-sm font-medium">
                    Settlement <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={commonFields.settlement_id}
                    onValueChange={(value) => setCommonFields({ ...commonFields, settlement_id: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={2}>
                      <SelectValue placeholder="Select settlement" />
                    </SelectTrigger>
                    <SelectContent>
                      {settlements.map((settlement) => (
                        <SelectItem key={settlement.id} value={settlement.id}>
                          {settlement.settlement_number} ({settlement.type.toUpperCase()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="broker_id" className="text-sm font-medium">
                    Broker <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={commonFields.broker_id}
                    onValueChange={(value) => setCommonFields({ ...commonFields, broker_id: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={3}>
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

          {/* Contract Items Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
                Contract Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Company/Stock</TableHead>
                      <TableHead className="w-[100px]">Trade Type</TableHead>
                      <TableHead className="w-[100px]">Buy/Sell</TableHead>
                      <TableHead className="w-[130px]">Date</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[100px]">Rate</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      <TableHead className="w-[120px]">Brokerage</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractRows.map((row) => {
                      const quantity = parseInt(row.quantity) || 0;
                      const rate = parseFloat(row.rate) || 0;
                      const amount = quantity * rate;
                      const party = parties.find(p => p.id === commonFields.party_id);
                      const brokerageRate = row.trade_type === 'T' 
                        ? (party?.trading_slab || 0) 
                        : (party?.delivery_slab || 0);
                      const brokerageAmount = (amount * brokerageRate) / 100;

                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Select
                              value={row.company_id}
                              onValueChange={(value) => updateContractRow(row.id, "company_id", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select stock" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.map((company) => (
                                  <SelectItem key={company.id} value={company.id}>
                                    {company.company_code} - {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.trade_type}
                              onValueChange={(value: "T" | "D") => updateContractRow(row.id, "trade_type", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="T">T (Trading)</SelectItem>
                                <SelectItem value="D">D (Delivery)</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.contract_type}
                              onValueChange={(value: "buy" | "sell") => updateContractRow(row.id, "contract_type", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="buy">Buy</SelectItem>
                                <SelectItem value="sell">Sell</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={row.contract_date}
                              onChange={(e) => updateContractRow(row.id, "contract_date", e.target.value)}
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
                              placeholder="Qty"
                              className="h-9"
                              min="1"
                              step="1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={row.rate}
                              onChange={(e) => updateContractRow(row.id, "rate", e.target.value)}
                              placeholder="Rate"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            ₹{amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-amber-600">
                            {brokerageRate}% = ₹{brokerageAmount.toFixed(2)}
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
                      const amount = (parseInt(row.quantity) || 0) * (parseFloat(row.rate) || 0);
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
        title="Contracts"
        description="View and manage contract notes"
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
              Add Contract
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
                <TableHead className="font-semibold">Settlement</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="font-semibold text-right">Rate</TableHead>
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
                    <TableCell className="font-medium">{contract.settlement_number}</TableCell>
                    <TableCell className="text-sm">{new Date(contract.contract_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-accent">{contract.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-accent">₹{Number(contract.rate).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-accent font-medium">₹{Number(contract.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        contract.contract_type === 'buy' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {contract.contract_type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        contract.status === 'active' ? 'bg-green-100 text-green-800' :
                        contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
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
        description={`Are you sure you want to delete contract "${contractToDelete?.contract_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
};

export default Contracts;