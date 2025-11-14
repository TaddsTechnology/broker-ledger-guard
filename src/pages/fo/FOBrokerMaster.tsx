import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
  updated_at: string;
}

const FOBrokerMaster = () => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [filteredBrokers, setFilteredBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
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
    trading_slab: "0.50",
    delivery_slab: "0.25",
  });

  const fetchBrokers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await brokerQueries.getAll();
      setBrokers(result || []);
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch brokers",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchBrokers();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setCurrentView('form');
      resetForm();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchBrokers]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBrokers(brokers);
    } else {
      const filtered = brokers.filter(
        (broker) =>
          broker.broker_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (broker.city && broker.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredBrokers(filtered);
    }
    setSelectedRowIndex(0);
  }, [brokers, searchTerm]);

  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  const resetForm = () => {
    setFormData({
      broker_code: "",
      name: "",
      address: "",
      city: "",
      phone: "",
      trading_slab: "0.50",
      delivery_slab: "0.25",
    });
    setEditingBroker(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.broker_code.trim() || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Broker code and name are required",
        variant: "destructive",
      });
      return;
    }

    const brokerData = {
      broker_code: formData.broker_code.trim().toUpperCase(),
      name: formData.name.trim(),
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      phone: formData.phone.trim() || null,
      trading_slab: parseFloat(formData.trading_slab) || 0,
      delivery_slab: parseFloat(formData.delivery_slab) || 0,
    };

    try {
      if (editingBroker) {
        await brokerQueries.update(editingBroker.id, brokerData);
        toast({ title: "Success", description: "Broker updated successfully" });
        setCurrentView('list');
        resetForm();
        fetchBrokers();
      } else {
        await brokerQueries.create(brokerData);
        toast({ 
          title: "Success", 
          description: "Broker created successfully",
        });
        resetForm();
        fetchBrokers();
      }
    } catch (error) {
      console.error('Error saving party:', error);
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

  const handleDelete = async () => {
    if (!brokerToDelete) return;

    try {
      await brokerQueries.delete(brokerToDelete.id);
      toast({ title: "Success", description: "Broker deleted successfully" });
      fetchBrokers();
    } catch (error) {
      console.error('Error deleting party:', error);
      toast({
        title: "Error",
        description: "Failed to delete broker",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
    setBrokerToDelete(null);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="F&O Broker Master" 
        description="Manage brokers for F&O trading (Shared with Equity)"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setCurrentView('form');
                resetForm();
              }}
              variant={currentView === 'form' ? 'default' : 'outline'}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Broker
            </Button>
            <Button
              onClick={() => setCurrentView('list')}
              variant={currentView === 'list' ? 'default' : 'outline'}
              size="sm"
            >
              <List className="mr-2 h-4 w-4" />
              View List
            </Button>
          </div>

          {currentView === 'list' && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search brokers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {currentView === 'form' ? (
          <Card className="border-purple-200">
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-purple-900">
                {editingBroker ? 'Edit Broker' : 'Add New Broker'}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="broker_code">Broker Code *</Label>
                    <Input
                      id="broker_code"
                      ref={firstInputRef}
                      value={formData.broker_code}
                      onChange={(e) => setFormData({ ...formData, broker_code: e.target.value })}
                      placeholder="e.g., BRK01"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Broker name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Contact number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full address"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trading_slab">Trading Slab (%)</Label>
                    <Input
                      id="trading_slab"
                      type="number"
                      step="0.01"
                      value={formData.trading_slab}
                      onChange={(e) => setFormData({ ...formData, trading_slab: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_slab">Delivery Slab (%)</Label>
                    <Input
                      id="delivery_slab"
                      type="number"
                      step="0.01"
                      value={formData.delivery_slab}
                      onChange={(e) => setFormData({ ...formData, delivery_slab: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    <Save className="mr-2 h-4 w-4" />
                    {editingBroker ? 'Update' : 'Save'}
                  </Button>
                  {editingBroker && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setCurrentView('list');
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Brokers ({filteredBrokers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredBrokers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No brokers found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Broker Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Trading %</TableHead>
                        <TableHead>Delivery %</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBrokers.map((broker, index) => (
                        <TableRow key={broker.id} data-row-index={index}>
                          <TableCell className="font-medium">{broker.broker_code}</TableCell>
                          <TableCell>{broker.name}</TableCell>
                          <TableCell>{broker.city || '-'}</TableCell>
                          <TableCell>{broker.phone || '-'}</TableCell>
                          <TableCell>{broker.trading_slab}%</TableCell>
                          <TableCell>{broker.delivery_slab}%</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(broker)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setBrokerToDelete(broker);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Broker"
        description={`Are you sure you want to delete ${brokerToDelete?.name}? This action cannot be undone.`}
      />
    </div>
  );
};

export default FOBrokerMaster;
