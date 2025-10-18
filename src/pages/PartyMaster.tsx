import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  created_at: string;
}

const PartyMaster = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);

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
  });

  useEffect(() => {
    fetchParties();
  }, []);

  // Focus first input when dialog opens
  useEffect(() => {
    if (dialogOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [dialogOpen]);

  // Keyboard shortcuts for table navigation
  useKeyboardShortcuts([
    {
      key: "n",
      alt: true,
      action: () => {
        resetForm();
        setDialogOpen(true);
      },
      description: "Add new party",
    },
    {
      key: "ArrowDown",
      action: () => {
        if (!dialogOpen && parties.length > 0) {
          setSelectedRowIndex((prev) => Math.min(prev + 1, parties.length - 1));
        }
      },
      description: "Navigate down",
    },
    {
      key: "ArrowUp",
      action: () => {
        if (!dialogOpen && parties.length > 0) {
          setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
        }
      },
      description: "Navigate up",
    },
    {
      key: "e",
      action: () => {
        if (!dialogOpen && parties[selectedRowIndex]) {
          handleEdit(parties[selectedRowIndex]);
        }
      },
      description: "Edit selected party",
    },
    {
      key: "Delete",
      action: () => {
        if (!dialogOpen && parties[selectedRowIndex]) {
          handleDelete(parties[selectedRowIndex].id);
        }
      },
      description: "Delete selected party",
    },
  ]);

  const fetchParties = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("party_master")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch parties",
        variant: "destructive",
      });
    } else {
      setParties(data || []);
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
      trading_slab: "0.00",
      delivery_slab: "0.00",
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
    };

    if (editingParty) {
      const { error } = await supabase
        .from("party_master")
        .update(partyData)
        .eq("id", editingParty.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update party",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Party updated successfully" });
        setDialogOpen(false);
        resetForm();
        fetchParties();
      }
    } else {
      const { error } = await supabase.from("party_master").insert([partyData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create party",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Party created successfully" });
        setDialogOpen(false);
        resetForm();
        fetchParties();
      }
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
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this party?")) return;

    const { error } = await supabase.from("party_master").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete party",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Party deleted successfully" });
      fetchParties();
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Party Master"
        description="Manage trading parties and their configurations"
        action={
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary-hover group relative"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Party
            <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
              Alt+N
            </kbd>
          </Button>
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
                    className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                      index === selectedRowIndex ? "bg-primary/10 ring-2 ring-primary/20" : ""
                    }`}
                    onClick={() => setSelectedRowIndex(index)}
                    onDoubleClick={() => handleEdit(party)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(party);
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
                          onClick={() => handleDelete(party.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle>{editingParty ? "Edit Party" : "Add New Party"}</DialogTitle>
            <DialogDescription>
              {editingParty ? "Update party information" : "Create a new trading party"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party_code">Party Code *</Label>
                  <Input
                    ref={firstInputRef}
                    id="party_code"
                    value={formData.party_code}
                    onChange={(e) => setFormData({ ...formData, party_code: e.target.value })}
                    required
                    className="bg-secondary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        document.getElementById("nse_code")?.focus();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nse_code">NSE Code</Label>
                  <Input
                    id="nse_code"
                    value={formData.nse_code}
                    onChange={(e) => setFormData({ ...formData, nse_code: e.target.value })}
                    className="bg-secondary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-secondary"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-secondary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trading_slab">Trading Slab %</Label>
                  <Input
                    id="trading_slab"
                    type="number"
                    step="0.01"
                    value={formData.trading_slab}
                    onChange={(e) => setFormData({ ...formData, trading_slab: e.target.value })}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_slab">Delivery Slab %</Label>
                  <Input
                    id="delivery_slab"
                    type="number"
                    step="0.01"
                    value={formData.delivery_slab}
                    onChange={(e) => setFormData({ ...formData, delivery_slab: e.target.value })}
                    className="bg-secondary"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setDialogOpen(false);
                    resetForm();
                  }
                }}
              >
                Cancel <kbd className="ml-2 text-xs opacity-50">Esc</kbd>
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-hover"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
              >
                {editingParty ? "Update" : "Create"} Party <kbd className="ml-2 text-xs opacity-50">Enter</kbd>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartyMaster;
