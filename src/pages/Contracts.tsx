import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { partyQueries, settlementQueries, contractQueries } from "@/lib/database";
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
  contract_date: string;
  quantity: number;
  rate: number;
  amount: number;
  contract_type: 'buy' | 'sell';
  status: 'active' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
}

const Contracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
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

  const [formData, setFormData] = useState({
    contract_number: "",
    party_id: "",
    settlement_id: "",
    contract_date: new Date().toISOString().split('T')[0],
    quantity: "",
    rate: "",
    contract_type: "buy" as "buy" | "sell",
    notes: "",
  });

  useEffect(() => {
    fetchContracts();
    fetchParties();
    fetchSettlements();
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

  const resetForm = () => {
    // Generate next contract number
    let nextContractNumber = "001";
    if (contracts.length > 0) {
      // Find the highest contract number
      const contractNumbers = contracts
        .map(c => c.contract_number)
        .map(cn => parseInt(cn, 10))
        .filter(num => !isNaN(num));
      
      if (contractNumbers.length > 0) {
        const maxNumber = Math.max(...contractNumbers);
        nextContractNumber = `${(maxNumber + 1).toString().padStart(3, '0')}`;
      }
    }
    
    setFormData({
      contract_number: nextContractNumber,
      party_id: "",
      settlement_id: "",
      contract_date: new Date().toISOString().split('T')[0],
      quantity: "",
      rate: "",
      contract_type: "buy",
      notes: "",
    });
    setEditingContract(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // For new contracts, ensure the contract number is auto-generated
    // For editing existing contracts, use the existing contract number
    const contractNumber = editingContract ? 
      editingContract.contract_number : 
      formData.contract_number;
    
    const contractData = {
      contract_number: contractNumber,
      party_id: formData.party_id,
      settlement_id: formData.settlement_id,
      contract_date: formData.contract_date,
      quantity: parseInt(formData.quantity),
      rate: parseFloat(formData.rate),
      amount: parseInt(formData.quantity) * parseFloat(formData.rate),
      contract_type: formData.contract_type,
      status: "active" as const,
      notes: formData.notes || null,
    };

    try {
      if (editingContract) {
        await contractQueries.update(editingContract.id, contractData);
        toast({ title: "Success", description: "Contract updated successfully" });
        setCurrentView('list');
        resetForm();
        fetchContracts();
      } else {
        await contractQueries.create(contractData);
        toast({ 
          title: "Success", 
          description: "Contract created successfully",
          variant: "default"
        });
        resetForm();
        
        // Show success message and ask if user wants to continue
        toast({
          title: "Add Another?",
          description: "Contract created successfully! Would you like to add another contract?",
          action: (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCurrentView('list');
                  toast({ title: "Switched to list view" });
                }}
              >
                View List
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // Stay in form for next entry
                  toast({ title: "Ready for next entry" });
                }}
              >
                Add Another
              </Button>
            </div>
          ),
        });
        fetchContracts();
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      toast({
        title: "Error",
        description: "Failed to save contract",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      contract_number: contract.contract_number,
      party_id: contract.party_id,
      settlement_id: contract.settlement_id,
      contract_date: contract.contract_date,
      quantity: contract.quantity.toString(),
      rate: contract.rate.toString(),
      contract_type: contract.contract_type,
      notes: contract.notes || "",
    });
    setCurrentView('form');
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
        title={editingContract ? "Edit Contract" : "Contracts - New Entry"}
        description={editingContract ? "Update contract information" : "Create new contract"}
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
              {editingContract ? "Update" : "Save"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_number" className="text-sm font-medium">
                    Contract Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={firstInputRef}
                    id="contract_number"
                    value={formData.contract_number}
                    readOnly
                    className="bg-secondary h-10 cursor-not-allowed pointer-events-none select-none"
                    placeholder="Auto-generated"
                    tabIndex={-1}
                    onClick={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                  />
                  <p className="text-xs text-muted-foreground">Auto-generated contract number</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contract_type" className="text-sm font-medium">
                    Contract Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value: "buy" | "sell") => setFormData({ ...formData, contract_type: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={2}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party_id" className="text-sm font-medium">
                    Party <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.party_id}
                    onValueChange={(value) => setFormData({ ...formData, party_id: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={3}>
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
                  <Label htmlFor="settlement_id" className="text-sm font-medium">
                    Settlement <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.settlement_id}
                    onValueChange={(value) => setFormData({ ...formData, settlement_id: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={4}>
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_date" className="text-sm font-medium">
                    Contract Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contract_date"
                    type="date"
                    value={formData.contract_date}
                    onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                    required
                    className="bg-secondary h-10"
                    tabIndex={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="bg-secondary h-10"
                    placeholder="Enter quantity"
                    tabIndex={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-sm font-medium">
                    Rate <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    required
                    className="bg-secondary h-10"
                    placeholder="Enter rate"
                    tabIndex={7}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-secondary min-h-[80px] resize-none"
                  placeholder="Additional notes or remarks"
                  tabIndex={8}
                />
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
              tabIndex={10}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel <kbd className="ml-2 text-xs opacity-50">Esc</kbd>
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-hover px-6"
              tabIndex={9}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingContract ? "Update" : "Save"} <kbd className="ml-2 text-xs opacity-50">F9</kbd>
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