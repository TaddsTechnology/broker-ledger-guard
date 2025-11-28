import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { partyQueries } from "@/lib/database";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Party {
  id: string;
  party_code: string;
  nse_code: string | null;
  name: string;
  ref_code: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  trading_slab: number;
  delivery_slab: number;
  interest_rate: number;
  created_at: string;
}

const PartyMaster = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Autocomplete states
  const [partySuggestions, setPartySuggestions] = useState<Party[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    party_code: "",
    nse_code: "",
    name: "",
    ref_code: "",
    address: "",
    city: "",
    phone: "",
    trading_slab: "0.00",
    delivery_slab: "0.00",
    interest_rate: "0.00",
  });

  useEffect(() => {
    fetchParties();
    
    // Check if we should auto-open the form (e.g., when navigating with Enter from sidebar)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setCurrentView('form');
      resetForm();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Filter parties based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredParties(parties);
    } else {
      const filtered = parties.filter(
        (party) =>
          party.party_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (party.nse_code && party.nse_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredParties(filtered);
    }
    setSelectedRowIndex(0);
  }, [parties, searchTerm]);

  // Handle party code autocomplete
  const handlePartyCodeChange = (value: string) => {
    setFormData({ ...formData, party_code: value.toUpperCase() });
    
    if (value.trim() !== "") {
      // Find parties that match the code
      const suggestions = parties.filter(
        party => party.party_code.toLowerCase().startsWith(value.toLowerCase())
      );
      setPartySuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setPartySuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select a party from suggestions
  const selectPartySuggestion = (party: Party) => {
    setFormData({
      party_code: party.party_code,
      nse_code: party.nse_code || "",
      name: party.name,
      ref_code: party.ref_code || "",
      address: party.address || "",
      city: party.city || "",
      phone: party.phone || "",
      trading_slab: party.trading_slab.toString(),
      delivery_slab: party.delivery_slab.toString(),
      interest_rate: party.interest_rate?.toString() || "0.00",
    });
    setPartySuggestions([]);
    setShowSuggestions(false);
  };

  // Focus first input when form view opens
  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  // Scroll to selected row when index changes
  useEffect(() => {
    if (currentView === 'list' && parties.length > 0) {
      const selectedRow = document.querySelector(`[data-row-index="${selectedRowIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedRowIndex, currentView, parties.length]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        const target = event.target as HTMLElement;
        const suggestionsContainer = document.querySelector('.absolute.z-10');
        if (suggestionsContainer && !suggestionsContainer.contains(target)) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const fetchParties = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      party_code: "",
      nse_code: "",
      name: "",
      ref_code: "",
      address: "",
      city: "",
      phone: "",
      trading_slab: "0.10",
      delivery_slab: "1.30",
      interest_rate: "0.00",
    });
    setEditingParty(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const partyData = {
      party_code: formData.party_code,
      nse_code: formData.nse_code || null,
      name: formData.name,
      ref_code: formData.ref_code || null,
      address: formData.address || null,
      city: formData.city || null,
      phone: formData.phone || null,
      trading_slab: parseFloat(formData.trading_slab),
      delivery_slab: parseFloat(formData.delivery_slab),
      interest_rate: parseFloat(formData.interest_rate),
    };

    try {
      if (editingParty) {
        await partyQueries.update(editingParty.id, partyData);
        toast({ title: "Success", description: "Party updated successfully" });
        setCurrentView('list');
        resetForm();
        fetchParties();
      } else {
        await partyQueries.create(partyData);
        toast({ 
          title: "Success", 
          description: "Party created successfully",
          variant: "default"
        });
        resetForm();
        
        // Show success message and ask if user wants to continue
        toast({
          title: "Add Another?",
          description: "Party created successfully! Would you like to add another party?",
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
        fetchParties();
      }
    } catch (error) {
      console.error('Error saving party:', error);
      toast({
        title: "Error",
        description: "Failed to save party",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setFormData({
      party_code: party.party_code,
      nse_code: party.nse_code || "",
      name: party.name,
      ref_code: party.ref_code || "",
      address: party.address || "",
      city: party.city || "",
      phone: party.phone || "",
      trading_slab: party.trading_slab.toString(),
      delivery_slab: party.delivery_slab.toString(),
      interest_rate: party.interest_rate?.toString() || "0.00",
    });
    setCurrentView('form');
  };

  const handleDelete = (party: Party) => {
    setPartyToDelete(party);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!partyToDelete) return;

    try {
      await partyQueries.delete(partyToDelete.id);
      toast({ 
        title: "Success", 
        description: `Party "${partyToDelete.name}" deleted successfully`,
        variant: "default"
      });
      fetchParties();
    } catch (error) {
      console.error('Error deleting party:', error);
      toast({
        title: "Error",
        description: "Failed to delete party",
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
      if (currentView === 'list' && filteredParties[selectedRowIndex]) {
        handleEdit(filteredParties[selectedRowIndex]);
      }
    },
    onDelete: () => {
      if (currentView === 'list' && filteredParties[selectedRowIndex]) {
        handleDelete(filteredParties[selectedRowIndex]);
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
      if (currentView === 'list' && parties.length > 0) {
        const prevIndex = Math.max(selectedRowIndex - 1, 0);
        setSelectedRowIndex(prevIndex);
      }
    },
    onDown: () => {
      if (currentView === 'list' && parties.length > 0) {
        const nextIndex = Math.min(selectedRowIndex + 1, parties.length - 1);
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
        title={editingParty ? "Edit Party" : "Party Master - New Entry"}
        description={editingParty ? "Update party information" : "Add new trading party"}
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
              {editingParty ? "Update" : "Save"}
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F9
              </kbd>
            </Button>
          </div>
        }
      />
      
      <div className="p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party_code" className="text-sm font-medium">
                    Party Code <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      ref={firstInputRef}
                      id="party_code"
                      value={formData.party_code}
                      onChange={(e) => handlePartyCodeChange(e.target.value)}
                      required
                      className="bg-secondary h-10"
                      placeholder="Enter party code"
                      tabIndex={1}
                    />
                    {showSuggestions && partySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {partySuggestions.map((party) => (
                          <div
                            key={party.id}
                            className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                            onClick={() => selectPartySuggestion(party)}
                          >
                            <span className="font-medium">{party.party_code}</span>
                            <span className="text-sm text-muted-foreground">{party.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nse_code" className="text-sm font-medium">
                    NSE Code
                  </Label>
                  <Input
                    id="nse_code"
                    value={formData.nse_code}
                    onChange={(e) => setFormData({ ...formData, nse_code: e.target.value.toUpperCase() })}
                    className="bg-secondary h-10"
                    placeholder="NSE trading code"
                    tabIndex={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ref_code" className="text-sm font-medium">
                    Reference Code
                  </Label>
                  <Input
                    id="ref_code"
                    value={formData.ref_code}
                    onChange={(e) => setFormData({ ...formData, ref_code: e.target.value })}
                    className="bg-secondary h-10"
                    placeholder="Internal reference"
                    tabIndex={3}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Party Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-secondary h-10"
                  placeholder="Full party/company name"
                  tabIndex={4}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Contact Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-secondary min-h-[80px] resize-none"
                  placeholder="Complete address"
                  tabIndex={5}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-secondary h-10"
                    placeholder="City name"
                    tabIndex={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-secondary h-10"
                    placeholder="Contact number"
                    tabIndex={7}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Trading Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
                Trading Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trading_slab" className="text-sm font-medium">
                    Trading Slab (%)
                  </Label>
                  <Input
                    id="trading_slab"
                    type="number"
                    step="0.01"
                    value={formData.trading_slab}
                    onChange={(e) => setFormData({ ...formData, trading_slab: e.target.value })}
                    className="bg-secondary h-10"
                    placeholder="0.00"
                    tabIndex={8}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delivery_slab" className="text-sm font-medium">
                    Delivery Slab (%)
                  </Label>
                  <Input
                    id="delivery_slab"
                    type="number"
                    step="0.01"
                    value={formData.delivery_slab}
                    onChange={(e) => setFormData({ ...formData, delivery_slab: e.target.value })}
                    className="bg-secondary h-10"
                    placeholder="0.00"
                    tabIndex={9}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interest_rate" className="text-sm font-medium">
                  Interest Rate (% per 30 days)
                </Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  className="bg-secondary h-10"
                  placeholder="0.00"
                  tabIndex={10}
                />
                <p className="text-xs text-muted-foreground">Enter 0 for no interest calculation. Example: 10.00 = 10% per month</p>
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
              tabIndex={11}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel <kbd className="ml-2 text-xs opacity-50">Esc</kbd>
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-hover px-6"
              tabIndex={10}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingParty ? "Update" : "Save"} <kbd className="ml-2 text-xs opacity-50">F9</kbd>
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
        title="Party Master"
        description="Manage trading parties and their configurations"
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search parties... (F3)"
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
              Add Party
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
                <TableHead className="font-semibold">Party Code</TableHead>
                <TableHead className="font-semibold">NSE Code</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">City</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold text-right">Trading Slab %</TableHead>
                <TableHead className="font-semibold text-right">Delivery Slab %</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading parties...
                  </TableCell>
                </TableRow>
              ) : parties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No parties found. Add your first party to get started.
                  </TableCell>
                </TableRow>
              ) : (
                parties.map((party, index) => (
                  <TableRow 
                    key={party.id} 
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
                    onDoubleClick={() => handleEdit(party)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEdit(party);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const nextIndex = Math.min(selectedRowIndex + 1, parties.length - 1);
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
                        const lastIndex = parties.length - 1;
                        setSelectedRowIndex(lastIndex);
                        const lastRow = e.currentTarget.parentElement?.children[lastIndex] as HTMLElement;
                        lastRow?.focus();
                      }
                    }}
                  >
                    <TableCell className="font-mono text-sm">{party.party_code}</TableCell>
                    <TableCell className="font-mono text-sm">{party.nse_code || "-"}</TableCell>
                    <TableCell className="font-medium">{party.name}</TableCell>
                    <TableCell>{party.city || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{party.phone || "-"}</TableCell>
                    <TableCell className="text-right font-mono text-accent">{party.trading_slab}%</TableCell>
                    <TableCell className="text-right font-mono text-accent">{party.delivery_slab}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(party)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(party)}
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
        title="Delete Party"
        description={`Are you sure you want to delete "${partyToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
};

export default PartyMaster;
