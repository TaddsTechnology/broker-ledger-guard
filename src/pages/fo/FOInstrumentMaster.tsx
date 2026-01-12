import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface FOInstrument {
  id: string;
  symbol: string;
  instrument_type: string;
  expiry_date: string;
  strike_price: number | null;
  lot_size: number;
  segment: string;
  underlying_asset: string | null;
  tick_size: number;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FOInstrumentMaster = () => {
  const [instruments, setInstruments] = useState<FOInstrument[]>([]);
  const [filteredInstruments, setFilteredInstruments] = useState<FOInstrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  const [editingInstrument, setEditingInstrument] = useState<FOInstrument | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instrumentToDelete, setInstrumentToDelete] = useState<FOInstrument | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(0);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    symbol: "",
    instrument_type: "FUT",
    expiry_date: "",
    strike_price: "",
    lot_size: "",
    segment: "NFO",
    underlying_asset: "",
    tick_size: "0.05",
    display_name: "",
    is_active: true,
  });

  const fetchInstruments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/fo/instruments');
      if (response.ok) {
        const data = await response.json();
        setInstruments(data || []);
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch instruments",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchInstruments();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setCurrentView('form');
      resetForm();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchInstruments]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredInstruments(instruments);
    } else {
      const filtered = instruments.filter(
        (inst) =>
          inst.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.instrument_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (inst.display_name && inst.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredInstruments(filtered);
    }
    setSelectedRowIndex(0);
  }, [instruments, searchTerm]);

  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  const resetForm = () => {
    setFormData({
      symbol: "",
      instrument_type: "FUT",
      expiry_date: "",
      strike_price: "",
      lot_size: "",
      segment: "NFO",
      underlying_asset: "",
      tick_size: "0.05",
      display_name: "",
      is_active: true,
    });
    setEditingInstrument(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.symbol.trim() || !formData.expiry_date || !formData.lot_size) {
      toast({
        title: "Error",
        description: "Symbol, expiry date, and lot size are required",
        variant: "destructive",
      });
      return;
    }

    // For options, strike price is required
    if ((formData.instrument_type === 'CE' || formData.instrument_type === 'PE') && !formData.strike_price) {
      toast({
        title: "Error",
        description: "Strike price is required for options",
        variant: "destructive",
      });
      return;
    }

    const instrumentData = {
      symbol: formData.symbol.trim().toUpperCase(),
      instrument_type: formData.instrument_type,
      expiry_date: formData.expiry_date,
      strike_price: formData.strike_price ? parseFloat(formData.strike_price) : null,
      lot_size: parseInt(formData.lot_size),
      segment: formData.segment,
      underlying_asset: formData.underlying_asset.trim() || null,
      tick_size: parseFloat(formData.tick_size),
      display_name: formData.display_name.trim() || null,
      is_active: formData.is_active,
    };

    try {
      const url = editingInstrument
        ? `http://localhost:3001/api/fo/instruments/${editingInstrument.id}`
        : 'http://localhost:3001/api/fo/instruments';
      
      const method = editingInstrument ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instrumentData),
      });

      if (response.ok) {
        toast({ 
          title: "Success", 
          description: `Instrument ${editingInstrument ? 'updated' : 'created'} successfully` 
        });
        if (editingInstrument) {
          setCurrentView('list');
        }
        resetForm();
        fetchInstruments();
      } else {
        throw new Error('Failed to save instrument');
      }
    } catch (error) {
      console.error('Error saving instrument:', error);
      toast({
        title: "Error",
        description: "Failed to save instrument",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (instrument: FOInstrument) => {
    setEditingInstrument(instrument);
    setFormData({
      symbol: instrument.symbol,
      instrument_type: instrument.instrument_type,
      expiry_date: instrument.expiry_date.split('T')[0],
      strike_price: instrument.strike_price?.toString() || "",
      lot_size: instrument.lot_size.toString(),
      segment: instrument.segment,
      underlying_asset: instrument.underlying_asset || "",
      tick_size: instrument.tick_size.toString(),
      display_name: instrument.display_name || "",
      is_active: instrument.is_active,
    });
    setCurrentView('form');
  };

  const handleDelete = async () => {
    if (!instrumentToDelete) return;
    
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
      const response = await fetch(`http://localhost:3001/api/fo/instruments/${instrumentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: 'true' })
      });
      
      if (response.ok) {
        toast({ 
          title: "Success", 
          description: `Instrument "${instrumentToDelete.symbol} ${instrumentToDelete.instrument_type}" deleted successfully` 
        });
        fetchInstruments();
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete instrument');
      }
    } catch (error) {
      console.error('Error deleting instrument:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete instrument",
        variant: "destructive",
      });
    }
    
    // Reset confirmation after deletion attempt
    setDeleteDialogOpen(false);
    setInstrumentToDelete(null);
    setConfirmationStep(0);
  };

  const getInstrumentTypeBadge = (type: string) => {
    const colors = {
      FUT: 'bg-blue-100 text-blue-800',
      CE: 'bg-green-100 text-green-800',
      PE: 'bg-red-100 text-red-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="F&O Instrument Master" 
        description="Manage Futures & Options instruments"
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
            >
              <Plus className="mr-2 h-4 w-4" />
              New Instrument
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
                placeholder="Search instruments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {currentView === 'form' ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingInstrument ? 'Edit Instrument' : 'Add New Instrument'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                      id="symbol"
                      ref={firstInputRef}
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      placeholder="NIFTY, BANKNIFTY, RELIANCE"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instrument_type">Type *</Label>
                    <Select
                      value={formData.instrument_type}
                      onValueChange={(value) => setFormData({ ...formData, instrument_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FUT">Futures</SelectItem>
                        <SelectItem value="CE">Call Option (CE)</SelectItem>
                        <SelectItem value="PE">Put Option (PE)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strike_price">
                      Strike Price {(formData.instrument_type === 'CE' || formData.instrument_type === 'PE') && '*'}
                    </Label>
                    <Input
                      id="strike_price"
                      type="number"
                      step="0.01"
                      value={formData.strike_price}
                      onChange={(e) => setFormData({ ...formData, strike_price: e.target.value })}
                      placeholder="For options only"
                      disabled={formData.instrument_type === 'FUT'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lot_size">Lot Size *</Label>
                    <Input
                      id="lot_size"
                      type="number"
                      value={formData.lot_size}
                      onChange={(e) => setFormData({ ...formData, lot_size: e.target.value })}
                      placeholder="50, 25, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="segment">Segment</Label>
                    <Select
                      value={formData.segment}
                      onValueChange={(value) => setFormData({ ...formData, segment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NFO">NFO (NSE F&O)</SelectItem>
                        <SelectItem value="BFO">BFO (BSE F&O)</SelectItem>
                        <SelectItem value="CDS">CDS (Currency)</SelectItem>
                        <SelectItem value="MCX">MCX (Commodity)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="underlying_asset">Underlying Asset</Label>
                    <Input
                      id="underlying_asset"
                      value={formData.underlying_asset}
                      onChange={(e) => setFormData({ ...formData, underlying_asset: e.target.value })}
                      placeholder="NIFTY 50, BANK NIFTY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tick_size">Tick Size</Label>
                    <Input
                      id="tick_size"
                      type="number"
                      step="0.01"
                      value={formData.tick_size}
                      onChange={(e) => setFormData({ ...formData, tick_size: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="NIFTY 30JAN25 24000 CE"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {editingInstrument ? 'Update' : 'Save'}
                  </Button>
                  {editingInstrument && (
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
              <CardTitle>Instruments ({filteredInstruments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredInstruments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No instruments found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Strike</TableHead>
                        <TableHead>Lot Size</TableHead>
                        <TableHead>Segment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInstruments.map((instrument, index) => (
                        <TableRow key={instrument.id} data-row-index={index}>
                          <TableCell className="font-medium">{instrument.symbol}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getInstrumentTypeBadge(instrument.instrument_type)}`}>
                              {instrument.instrument_type}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(instrument.expiry_date).toLocaleDateString()}</TableCell>
                          <TableCell>{instrument.strike_price || '-'}</TableCell>
                          <TableCell>{instrument.lot_size}</TableCell>
                          <TableCell>{instrument.segment}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${instrument.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {instrument.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(instrument)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setInstrumentToDelete(instrument);
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
        title="Delete Instrument"
        description={
          confirmationStep > 0 
            ? `This is confirmation ${confirmationStep}/3. Please click "Confirm" ${3 - confirmationStep} more time(s) to proceed with deletion.`
            : `Are you sure you want to delete ${instrumentToDelete?.symbol} ${instrumentToDelete?.instrument_type}? This action cannot be undone.`
        }
      />
    </div>
  );
};

export default FOInstrumentMaster;
