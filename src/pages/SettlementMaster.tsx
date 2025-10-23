import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { settlementQueries } from "@/lib/database";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Settlement {
  id: string;
  type: 'nse' | 'fo' | 'bse' | 'mcx';
  settlement_number: string;
  start_date: string;
  end_date: string;
  contract_no: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const SETTLEMENT_TYPES = [
  { value: 'nse', label: 'NSE (National Stock Exchange)' },
  { value: 'fo', label: 'F&O (Futures & Options)' },
  { value: 'bse', label: 'BSE (Bombay Stock Exchange)' },
  { value: 'mcx', label: 'MCX (Multi Commodity Exchange)' },
] as const;

const SettlementMaster = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState<Settlement | null>(null);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: 'nse' as const,
    settlement_number: "",
    start_date: "",
    end_date: "",
    contract_no: "",
    notes: "",
  });

  useEffect(() => {
    fetchSettlements();
    
    // Check if we should auto-open the form
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setCurrentView('form');
      resetForm();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Filter settlements based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSettlements(settlements);
    } else {
      const filtered = settlements.filter(
        (settlement) =>
          settlement.settlement_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          settlement.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (settlement.contract_no && settlement.contract_no.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSettlements(filtered);
    }
    setSelectedRowIndex(0);
  }, [settlements, searchTerm]);

  // Focus first input when form view opens
  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  // Scroll to selected row when index changes
  useEffect(() => {
    if (currentView === 'list' && filteredSettlements.length > 0) {
      const selectedRow = document.querySelector(`[data-row-index="${selectedRowIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedRowIndex, currentView, filteredSettlements.length]);

  const fetchSettlements = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      type: 'nse',
      settlement_number: "",
      start_date: "",
      end_date: "",
      contract_no: "",
      notes: "",
    });
    setEditingSettlement(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.settlement_number.trim() || !formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Settlement number, start date, and end date are required",
        variant: "destructive",
      });
      return;
    }

    // Validate date range
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast({
        title: "Error",
        description: "Start date must be before or equal to end date",
        variant: "destructive",
      });
      return;
    }

    const settlementData = {
      type: formData.type,
      settlement_number: formData.settlement_number.trim().toUpperCase(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      contract_no: formData.contract_no.trim() || null,
      notes: formData.notes.trim() || null,
    };

    try {
      if (editingSettlement) {
        await settlementQueries.update(editingSettlement.id, settlementData);
        toast({ title: "Success", description: "Settlement updated successfully" });
        setCurrentView('list');
        resetForm();
        fetchSettlements();
      } else {
        await settlementQueries.create(settlementData);
        toast({ 
          title: "Success", 
          description: "Settlement created successfully",
          variant: "default"
        });
        resetForm();
        
        // Show success message and ask if user wants to continue
        toast({
          title: "Add Another?",
          description: "Settlement created successfully! Would you like to add another settlement?",
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
        fetchSettlements();
      }
    } catch (error) {
      console.error('Error saving settlement:', error);
      toast({
        title: "Error",
        description: "Failed to save settlement",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (settlement: Settlement) => {
    setEditingSettlement(settlement);
    setFormData({
      type: settlement.type,
      settlement_number: settlement.settlement_number,
      start_date: settlement.start_date,
      end_date: settlement.end_date,
      contract_no: settlement.contract_no || "",
      notes: settlement.notes || "",
    });
    setCurrentView('form');
  };

  const handleDelete = (settlement: Settlement) => {
    setSettlementToDelete(settlement);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!settlementToDelete) return;

    try {
      await settlementQueries.delete(settlementToDelete.id);
      toast({ 
        title: "Success", 
        description: `Settlement "${settlementToDelete.settlement_number}" deleted successfully`,
        variant: "default"
      });
      fetchSettlements();
    } catch (error) {
      console.error('Error deleting settlement:', error);
      toast({
        title: "Error",
        description: "Failed to delete settlement",
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
      if (currentView === 'list' && filteredSettlements[selectedRowIndex]) {
        handleEdit(filteredSettlements[selectedRowIndex]);
      }
    },
    onDelete: () => {
      if (currentView === 'list' && filteredSettlements[selectedRowIndex]) {
        handleDelete(filteredSettlements[selectedRowIndex]);
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
      if (currentView === 'list' && filteredSettlements.length > 0) {
        const prevIndex = Math.max(selectedRowIndex - 1, 0);
        setSelectedRowIndex(prevIndex);
      }
    },
    onDown: () => {
      if (currentView === 'list' && filteredSettlements.length > 0) {
        const nextIndex = Math.min(selectedRowIndex + 1, filteredSettlements.length - 1);
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
        title={editingSettlement ? "Edit Settlement" : "Settlement Master - New Entry"}
        description={editingSettlement ? "Update settlement information" : "Create new settlement period"}
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
              {editingSettlement ? "Update" : "Save"}
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F9
              </kbd>
            </Button>
          </div>
        }
      />
      
      <div className="p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Settlement Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                Settlement Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Settlement Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger ref={firstInputRef} className="bg-secondary h-10" tabIndex={1}>
                      <SelectValue placeholder="Select settlement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETTLEMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="settlement_number" className="text-sm font-medium">
                    Settlement Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="settlement_number"
                    value={formData.settlement_number}
                    onChange={(e) => setFormData({ ...formData, settlement_number: e.target.value.toUpperCase() })}
                    required
                    className="bg-secondary h-10 uppercase"
                    placeholder="e.g., 2024NSE001"
                    tabIndex={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Settlement Period */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
                Settlement Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="bg-secondary h-10"
                    tabIndex={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-sm font-medium">
                    End Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="bg-secondary h-10"
                    tabIndex={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract_no" className="text-sm font-medium">
                  Contract Number
                </Label>
                <Input
                  id="contract_no"
                  value={formData.contract_no}
                  onChange={(e) => setFormData({ ...formData, contract_no: e.target.value })}
                  className="bg-secondary h-10"
                  placeholder="Contract reference number"
                  tabIndex={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-secondary h-10"
                  placeholder="Additional notes or remarks"
                  tabIndex={6}
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
              {editingSettlement ? "Update" : "Save"} <kbd className="ml-2 text-xs opacity-50">F9</kbd>
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
        title="Settlement Master"
        description="Manage settlement periods and configurations"
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search settlements... (F3)"
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
              Add Settlement
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
                <TableHead className="font-semibold">Settlement Number</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Start Date</TableHead>
                <TableHead className="font-semibold">End Date</TableHead>
                <TableHead className="font-semibold">Contract No</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading settlements...
                  </TableCell>
                </TableRow>
              ) : filteredSettlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? `No settlements found matching "${searchTerm}"` : "No settlements found. Add your first settlement to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSettlements.map((settlement, index) => (
                  <TableRow 
                    key={settlement.id} 
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
                    onDoubleClick={() => handleEdit(settlement)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEdit(settlement);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const nextIndex = Math.min(selectedRowIndex + 1, filteredSettlements.length - 1);
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
                        const lastIndex = filteredSettlements.length - 1;
                        setSelectedRowIndex(lastIndex);
                        const lastRow = e.currentTarget.parentElement?.children[lastIndex] as HTMLElement;
                        lastRow?.focus();
                      }
                    }}
                  >
                    <TableCell className="font-mono text-sm font-medium">{settlement.settlement_number}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {settlement.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(settlement.start_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{new Date(settlement.end_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-sm">{settlement.contract_no || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(settlement);
                          }}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(settlement);
                          }}
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
        
        {filteredSettlements.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredSettlements.length} of {settlements.length} settlements
            {searchTerm && ` • Filtered by "${searchTerm}"`}
            • Selected: {selectedRowIndex + 1}
          </div>
        )}
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
        title="Delete Settlement"
        description={`Are you sure you want to delete settlement "${settlementToDelete?.settlement_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
};

export default SettlementMaster;
