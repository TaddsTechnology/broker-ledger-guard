import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search, Calendar, IndianRupee, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { billQueries, partyQueries } from "@/lib/database";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BillView } from "@/components/BillView";
import { BillEditor } from "@/components/BillEditor";
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

interface Bill {
  id: string;
  bill_number: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  broker_code?: string;
  broker_name?: string;
  bill_date: string;
  due_date: string | null;
  total_amount: number;
  paid_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  bill_type?: 'party' | 'broker';
}

const Bills = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'edit'>('list');
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [viewBillId, setViewBillId] = useState<string | null>(null);
  const [billViewOpen, setBillViewOpen] = useState(false);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    bill_number: "",
    party_id: "",
    bill_date: new Date().toISOString().split('T')[0],
    due_date: "",
    total_amount: "",
    notes: "",
    bill_type: 'party' as 'party' | 'broker',
  });

  useEffect(() => {
    fetchParties();
  }, []);

  // Fetch bills based on bill type from search params
  useEffect(() => {
    const fetchBillsByType = async () => {
      setIsLoading(true);
      try {
        const type = searchParams.get('type') as 'party' | 'broker' | null;
        const result = await billQueries.getAll(type || undefined);
        setBills(result || []);
      } catch (error) {
        console.error('Error fetching bills:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bills",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    };
    
    fetchBillsByType();
  }, [searchParams]);

  // Filter bills based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBills(bills);
    } else {
      const filtered = bills.filter(
        (bill) =>
          bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (bill.party_name && bill.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (bill.party_code && bill.party_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredBills(filtered);
    }
    setSelectedRowIndex(0);
  }, [bills, searchTerm]);

  // Focus first input when form view opens
  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const type = searchParams.get('type') as 'party' | 'broker' | null;
      const result = await billQueries.getAll(type || undefined);
      setBills(result || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bills",
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
      bill_number: "",
      party_id: "",
      bill_date: new Date().toISOString().split('T')[0],
      due_date: "",
      total_amount: "",
      notes: "",
      bill_type: 'party',
    });
    setEditingBill(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const billData = {
      bill_number: formData.bill_number,
      party_id: formData.party_id,
      bill_date: formData.bill_date,
      due_date: formData.due_date || null,
      total_amount: parseFloat(formData.total_amount),
      notes: formData.notes || null,
      bill_type: formData.bill_type,
    };

    try {
      if (editingBill) {
        await billQueries.update(editingBill.id, billData);
        toast({ title: "Success", description: "Bill updated successfully" });
        setCurrentView('list');
        resetForm();
        const type = searchParams.get('type') as 'party' | 'broker' | null;
        const result = await billQueries.getAll(type || undefined);
        setBills(result || []);
      } else {
        await billQueries.create(billData);
        toast({ 
          title: "Success", 
          description: "Bill created successfully",
          variant: "default"
        });
        resetForm();
        
        // Show success message and ask if user wants to continue
        toast({
          title: "Add Another?",
          description: "Bill created successfully! Would you like to add another bill?",
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
        const type2 = searchParams.get('type') as 'party' | 'broker' | null;
        const result2 = await billQueries.getAll(type2 || undefined);
        setBills(result2 || []);
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        title: "Error",
        description: "Failed to save bill",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({
      bill_number: bill.bill_number,
      party_id: bill.party_id,
      bill_date: bill.bill_date,
      due_date: bill.due_date || "",
      total_amount: bill.total_amount.toString(),
      notes: bill.notes || "",
      bill_type: bill.bill_type || 'party',
    });
    setCurrentView('form');
  };

  const handleEditBill = async (bill: Bill) => {
    try {
      // Try to fetch the bill details to ensure we have the latest data
      const updatedBill = await billQueries.getById(bill.id);
      setEditingBill(updatedBill);
      setCurrentView('edit');
    } catch (error) {
      console.error("Error fetching bill details:", error);
      toast({
        title: "Error",
        description: "Failed to load bill details. Please try again.",
        variant: "destructive",
      });
      // Still proceed with the existing bill data
      setEditingBill(bill);
      setCurrentView('edit');
    }
  };

  const handleDelete = (bill: Bill) => {
    setBillToDelete(bill);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!billToDelete) return;

    try {
      await billQueries.delete(billToDelete.id);
      toast({ 
        title: "Success", 
        description: `Bill "${billToDelete.bill_number}" deleted successfully`,
        variant: "default"
      });
      const type = searchParams.get('type') as 'party' | 'broker' | null;
      const result = await billQueries.getAll(type || undefined);
      setBills(result || []);
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Error",
        description: "Failed to delete bill",
        variant: "destructive",
      });
    }
  };

  const handleSaveEditedBill = async (updatedBill: Bill) => {
    try {
      await billQueries.update(updatedBill.id, updatedBill);
      toast({ title: "Success", description: "Bill updated successfully" });
      setCurrentView('list');
      setEditingBill(null);
      const type = searchParams.get('type') as 'party' | 'broker' | null;
      const result = await billQueries.getAll(type || undefined);
      setBills(result || []);
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        title: "Error",
        description: "Failed to save bill",
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
      if (currentView === 'list' && filteredBills[selectedRowIndex]) {
        handleEdit(filteredBills[selectedRowIndex]);
      }
    },
    onDelete: () => {
      if (currentView === 'list' && filteredBills[selectedRowIndex]) {
        handleDelete(filteredBills[selectedRowIndex]);
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
      if (currentView === 'form' || currentView === 'edit') {
        setCurrentView('list');
        resetForm();
      }
    },
    onUp: () => {
      if (currentView === 'list' && bills.length > 0) {
        const prevIndex = Math.max(selectedRowIndex - 1, 0);
        setSelectedRowIndex(prevIndex);
      }
    },
    onDown: () => {
      if (currentView === 'list' && bills.length > 0) {
        const nextIndex = Math.min(selectedRowIndex + 1, bills.length - 1);
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
        title={editingBill ? "Edit Bill" : "New Bill Entry"}
        description={editingBill ? "Update bill information" : "Create new bill"}
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
              {editingBill ? "Update" : "Save"}
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F9
              </kbd>
            </Button>
          </div>
        }
      />
      
      <div className="p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Bill Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                Bill Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bill_number" className="text-sm font-medium">
                    Bill Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={firstInputRef}
                    id="bill_number"
                    value={formData.bill_number}
                    onChange={(e) => setFormData({ ...formData, bill_number: e.target.value.toUpperCase() })}
                    required
                    className="bg-secondary h-10"
                    placeholder="Enter bill number"
                    tabIndex={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="party_id" className="text-sm font-medium">
                    Party <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.party_id}
                    onValueChange={(value) => setFormData({ ...formData, party_id: value })}
                  >
                    <SelectTrigger className="bg-secondary h-10" tabIndex={2}>
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bill_date" className="text-sm font-medium">
                    Bill Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bill_date"
                    type="date"
                    value={formData.bill_date}
                    onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                    required
                    className="bg-secondary h-10"
                    tabIndex={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due_date" className="text-sm font-medium">
                    Due Date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="bg-secondary h-10"
                    tabIndex={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="total_amount" className="text-sm font-medium">
                    Total Amount <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      required
                      className="bg-secondary h-10 pl-10"
                      placeholder="0.00"
                      tabIndex={5}
                    />
                  </div>
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
                  tabIndex={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bill_type" className="text-sm font-medium">
                  Bill Type
                </Label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      id="bill_type_party"
                      name="bill_type"
                      value="party"
                      checked={formData.bill_type === 'party'}
                      onChange={() => setFormData({ ...formData, bill_type: 'party' })}
                      className="form-radio h-4 w-4 text-primary"
                    />
                    <span className="ml-2">Party Bill</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      id="bill_type_broker"
                      name="bill_type"
                      value="broker"
                      checked={formData.bill_type === 'broker'}
                      onChange={() => setFormData({ ...formData, bill_type: 'broker' })}
                      className="form-radio h-4 w-4 text-primary"
                    />
                    <span className="ml-2">Broker Bill</span>
                  </label>
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
              {editingBill ? "Update" : "Save"} <kbd className="ml-2 text-xs opacity-50">F9</kbd>
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
        title="Bills"
        description="Generate and manage billing"
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search bills... (F3)"
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
              Add Bill
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
                <TableHead className="font-semibold">Bill Number</TableHead>
                <TableHead className="font-semibold">Party</TableHead>
                <TableHead className="font-semibold">Bill Date</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold text-right">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading bills...
                  </TableCell>
                </TableRow>
              ) : filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No bills found. Add your first bill to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill, index) => (
                  <TableRow 
                    key={bill.id} 
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
                    onDoubleClick={() => handleEdit(bill)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEdit(bill);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const nextIndex = Math.min(selectedRowIndex + 1, filteredBills.length - 1);
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
                        const lastIndex = filteredBills.length - 1;
                        setSelectedRowIndex(lastIndex);
                        const lastRow = e.currentTarget.parentElement?.children[lastIndex] as HTMLElement;
                        lastRow?.focus();
                      }
                    }}
                  >
                    <TableCell className="font-mono text-sm font-medium">{bill.bill_number}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {bill.bill_type === 'broker' ? (
                          bill.broker_code ? (
                            <span className="text-blue-600">{bill.broker_code}</span>
                          ) : (
                            <span className="text-blue-600">Broker Bill</span>
                          )
                        ) : (
                          bill.party_code
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {bill.bill_type === 'broker' ? (
                          bill.broker_name || 'Brokerage Bill'
                        ) : bill.party_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(bill.bill_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">
                      {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent font-medium">
                      ₹{Number(bill.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                        bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setViewBillId(bill.id);
                            setBillViewOpen(true);
                          }}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBill(bill)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(bill)}
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
      {currentView === 'form' ? renderFormView() : 
       currentView === 'edit' && editingBill ? (
        <BillEditor 
          bill={editingBill} 
          onSave={handleSaveEditedBill} 
          onCancel={() => {
            setCurrentView('list');
            setEditingBill(null);
          }} 
        />
      ) : renderListView()}
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Bill"
        description={`Are you sure you want to delete bill "${billToDelete?.bill_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
      
      {viewBillId && (
        (() => {
          const billToView = bills.find(b => b.id === viewBillId);
          console.log('Bill to view:', billToView, 'View bill ID:', viewBillId, 'Available bills:', bills);
          return (
            <BillView
              bill={billToView}
              billId={viewBillId}
              open={billViewOpen}
              onOpenChange={setBillViewOpen}
            />
          );
        })()
      )}
    </>
  );
};

export default Bills;