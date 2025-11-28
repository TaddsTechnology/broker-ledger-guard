import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface Party {
  id: string;
  party_code: string;
  name: string;
  nse_code: string | null;
  ref_code: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  trading_slab: number;
  delivery_slab: number;
  interest_rate: number;
  created_at: string;
  updated_at: string;
}

const FOPartyMaster = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    party_code: "",
    name: "",
    nse_code: "",
    ref_code: "",
    address: "",
    city: "",
    phone: "",
    trading_slab: "1.00",
    delivery_slab: "0.50",
    interest_rate: "0.00",
  });

  const fetchParties = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchParties();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setCurrentView('form');
      resetForm();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchParties]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredParties(parties);
    } else {
      const filtered = parties.filter(
        (party) =>
          party.party_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (party.city && party.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredParties(filtered);
    }
    setSelectedRowIndex(0);
  }, [parties, searchTerm]);

  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  const resetForm = () => {
    setFormData({
      party_code: "",
      name: "",
      nse_code: "",
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

    if (!formData.party_code.trim() || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Party code and name are required",
        variant: "destructive",
      });
      return;
    }

    const partyData = {
      party_code: formData.party_code.trim().toUpperCase(),
      name: formData.name.trim(),
      nse_code: formData.nse_code.trim() || null,
      ref_code: formData.ref_code.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      phone: formData.phone.trim() || null,
      trading_slab: parseFloat(formData.trading_slab) || 0,
      delivery_slab: parseFloat(formData.delivery_slab) || 0,
      interest_rate: parseFloat(formData.interest_rate) || 0,
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
        });
        resetForm();
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
      name: party.name,
      nse_code: party.nse_code || "",
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

  const handleDelete = async () => {
    if (!partyToDelete) return;

    try {
      await partyQueries.delete(partyToDelete.id);
      toast({ title: "Success", description: "Party deleted successfully" });
      fetchParties();
    } catch (error) {
      console.error('Error deleting party:', error);
      toast({
        title: "Error",
        description: "Failed to delete party",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
    setPartyToDelete(null);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="F&O Party Master" 
        description="Manage client parties for F&O trading (Shared with Equity)"
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
              New Party
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
                placeholder="Search parties..."
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
                {editingParty ? 'Edit Party' : 'Add New Party'}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="party_code">Party Code *</Label>
                    <Input
                      id="party_code"
                      ref={firstInputRef}
                      value={formData.party_code}
                      onChange={(e) => setFormData({ ...formData, party_code: e.target.value })}
                      placeholder="e.g., CLI001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Party name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nse_code">NSE Code</Label>
                    <Input
                      id="nse_code"
                      value={formData.nse_code}
                      onChange={(e) => setFormData({ ...formData, nse_code: e.target.value })}
                      placeholder="NSE client code"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref_code">Reference Code</Label>
                    <Input
                      id="ref_code"
                      value={formData.ref_code}
                      onChange={(e) => setFormData({ ...formData, ref_code: e.target.value })}
                      placeholder="Internal reference"
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

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="interest_rate">Interest Rate (% per 30 days)</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Enter 0 for no interest calculation. Example: 10.00 = 10% per month</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    <Save className="mr-2 h-4 w-4" />
                    {editingParty ? 'Update' : 'Save'}
                  </Button>
                  {editingParty && (
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
              <CardTitle>Parties ({filteredParties.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredParties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No parties found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Party Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>NSE Code</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Trading %</TableHead>
                        <TableHead>Delivery %</TableHead>
                        <TableHead>Interest %</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParties.map((party, index) => (
                        <TableRow key={party.id} data-row-index={index}>
                          <TableCell className="font-medium">{party.party_code}</TableCell>
                          <TableCell>{party.name}</TableCell>
                          <TableCell>{party.nse_code || '-'}</TableCell>
                          <TableCell>{party.city || '-'}</TableCell>
                          <TableCell>{party.phone || '-'}</TableCell>
                          <TableCell>{party.trading_slab}%</TableCell>
                          <TableCell>{party.delivery_slab}%</TableCell>
                          <TableCell>{party.interest_rate || 0}%</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(party)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setPartyToDelete(party);
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
        title="Delete Party"
        description={`Are you sure you want to delete ${partyToDelete?.name}? This action cannot be undone.`}
      />
    </div>
  );
};

export default FOPartyMaster;
