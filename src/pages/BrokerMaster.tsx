import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { brokerQueries } from "@/lib/database";
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

interface Broker {
  id: string;
  broker_code: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  trading_slab: number;
  delivery_slab: number;
  created_at: string;
}

const BrokerMaster = () => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBrokers, setFilteredBrokers] = useState<Broker[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brokerToDelete, setBrokerToDelete] = useState<Broker | null>(null);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    broker_code: "",
    name: "",
    address: "",
    city: "",
    phone: "",
    trading_slab: "0.00",
    delivery_slab: "0.00",
  });

  useEffect(() => {
    fetchBrokers();
  }, []);

  // Filter brokers based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBrokers(brokers);
    } else {
      const filtered = brokers.filter(
        (broker) =>
          broker.broker_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          broker.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrokers(filtered);
    }
    setSelectedRowIndex(0);
  }, [brokers, searchTerm]);

  // Focus first input when form view opens
  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  // Scroll to selected row when index changes
  useEffect(() => {
    if (currentView === 'list' && brokers.length > 0) {
      const selectedRow = document.querySelector(`[data-row-index="${selectedRowIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedRowIndex, currentView, brokers.length]);

  const fetchBrokers = async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      broker_code: "",
      name: "",
      address: "",
      city: "",
      phone: "",
      trading_slab: "0.00",
      delivery_slab: "0.00",
    });
    setEditingBroker(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const brokerData = {
      broker_code: formData.broker_code,
      name: formData.name,
      address: formData.address || null,
      city: formData.city || null,
      phone: formData.phone || null,
      trading_slab: parseFloat(formData.trading_slab),
      delivery_slab: parseFloat(formData.delivery_slab),
    };

    try {
      if (editingBroker) {
        await brokerQueries.update(editingBroker.id, brokerData);
        toast({ title: "Success", description: "Broker updated successfully" });
      } else {
        await brokerQueries.create(brokerData);
        toast({ 
          title: "Success", 
          description: "Broker created successfully",
          variant: "default"
        });
      }
      setCurrentView('list');
      resetForm();
      fetchBrokers();
    } catch (error) {
      console.error('Error saving broker:', error);
      toast({
        title: "Error",
        description: "Failed to save broker",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (broker: Broker) => {
    setEditingBroker(broker);
    setFormData({
      broker_code: broker.broker_code,
      name: broker.name,
      address: broker.address || "",
      city: broker.city || "",
      phone: broker.phone || "",
      trading_slab: broker.trading_slab.toString(),
      delivery_slab: broker.delivery_slab.toString(),
    });
    setCurrentView('form');
  };

  const handleDelete = (broker: Broker) => {
    setBrokerToDelete(broker);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!brokerToDelete) return;

    try {
      await brokerQueries.delete(brokerToDelete.id);
      toast({ 
        title: "Success", 
        description: `Broker "${brokerToDelete.broker_code}" deleted successfully`,
        variant: "default"
      });
      fetchBrokers();
    } catch (error) {
      console.error('Error deleting broker:', error);
      toast({
        title: "Error",
        description: "Failed to delete broker",
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
      if (currentView === 'list' && filteredBrokers[selectedRowIndex]) {
        handleEdit(filteredBrokers[selectedRowIndex]);
      }
    },
    onDelete: () => {
      if (currentView === 'list' && filteredBrokers[selectedRowIndex]) {
        handleDelete(filteredBrokers[selectedRowIndex]);
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
      if (currentView === 'list' && brokers.length > 0) {
        const prevIndex = Math.max(selectedRowIndex - 1, 0);
        setSelectedRowIndex(prevIndex);
      }
    },
    onDown: () => {
      if (currentView === 'list' && brokers.length > 0) {
        const nextIndex = Math.min(selectedRowIndex + 1, brokers.length - 1);
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
        title={editingBroker ? "Edit Broker" : "New Broker Entry"}
        description={editingBroker ? "Update broker information" : "Create new broker"}
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
              {editingBroker ? "Update" : "Save"}
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F9
              </kbd>
            </Button>
          </div>
        }
      />
      
      <div className="p-6">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Broker Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                Broker Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="broker_code" className="text-sm font-medium">
                    Broker Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={firstInputRef}
                    id="broker_code"
                    value={formData.broker_code}
                    onChange={(e) => setFormData({ ...formData, broker_code: e.target.value.toUpperCase() })}
                    required
                    className="bg-secondary h-10"
                    placeholder="Enter broker code"
                    tabIndex={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Broker Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-secondary h-10"
                    placeholder="Enter broker name"
                    tabIndex={2}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-secondary"
                  placeholder="Enter address"
                  tabIndex={3}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-secondary h-10"
                    placeholder="Enter city"
                    tabIndex={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-secondary h-10"
                    placeholder="Enter phone number"
                    tabIndex={5}
                  />
                </div>
                
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
                    tabIndex={6}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    tabIndex={7}
                  />
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
              tabIndex={9}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel <kbd className="ml-2 text-xs opacity-50">Esc</kbd>
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-hover px-6"
              tabIndex={8}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingBroker ? "Update" : "Save"} <kbd className="ml-2 text-xs opacity-50">F9</kbd>
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
        title="Broker Master"
        description="Manage broker information and slab rates"
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search brokers... (F3)"
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
              Add Broker
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
                <TableHead className="font-semibold">Broker Code</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">City</TableHead>
                <TableHead className="font-semibold text-right">Trading Slab (%)</TableHead>
                <TableHead className="font-semibold text-right">Delivery Slab (%)</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading brokers...
                  </TableCell>
                </TableRow>
              ) : brokers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No brokers found. Add your first broker to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrokers.map((broker, index) => (
                  <TableRow 
                    key={broker.id} 
                    data-row-index={index}
                    className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                      index === selectedRowIndex ? 'bg-muted/50' : ''
                    }`}
                    onDoubleClick={() => handleEdit(broker)}
                  >
                    <TableCell className="font-medium">{broker.broker_code}</TableCell>
                    <TableCell>{broker.name}</TableCell>
                    <TableCell>{broker.city || "-"}</TableCell>
                    <TableCell className="text-right">{Number(broker.trading_slab).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(broker.delivery_slab).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(broker)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(broker)}
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
        title="Delete Broker"
        description={`Are you sure you want to delete broker "${brokerToDelete?.broker_code}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
};

export default BrokerMaster;