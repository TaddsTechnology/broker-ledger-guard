import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { foBillQueries } from "@/lib/database";

interface BillItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  client_code?: string;
  company_code?: string;
  trade_type?: string;
  brokerage_rate_pct?: number;
  brokerage_amount?: number;
}

interface Bill {
  id: string;
  bill_number: string;
  party_id: string | null;
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

interface FOBillEditorProps {
  bill: Bill;
  onSave: (updatedBill: Bill) => void;
  onCancel: () => void;
}

// Function to parse notes and extract bill items
function parseNotesToItems(notes: string | null): BillItem[] {
  if (!notes) return [];
  
  const items: BillItem[] = [];
  const lines = notes.split('\n');
  
  // Find the detailed transactions section
  const transactionsStartIndex = lines.findIndex(line => line.includes('DETAILED TRANSACTIONS') || line.includes('BROKERAGE TRANSACTIONS'));
  if (transactionsStartIndex === -1) return items;
  
  // Parse transactions
  let currentSecurity = '';
  for (let i = transactionsStartIndex + 3; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we've reached the end of transactions
    if (line.startsWith('---') || line.includes('Generated on:') || line.includes('Bill Number:')) {
      break;
    }
    
    // Check if this is a security header (ends with colon)
    if (line.endsWith(':') && line.length > 1 && !line.match(/^\d+\./)) {
      currentSecurity = line.slice(0, -1);
      continue;
    }
    
    // Check if this is a transaction line
    // Format: "1. BUY 750 units @ ₹929.00 = ₹696750.00 (Brokerage: ₹6967.50)"
    const tradeMatch = line.match(/^(\d+)\.\s+(BUY|SELL)\s+(\d+)\s+units\s+@\s+₹([\d.]+)\s+=\s+₹([\d.]+)(?:\s+\(Brokerage:\s+₹([\d.]+)\))?$/);
    if (tradeMatch) {
      const [, , side, quantityStr, priceStr, amountStr, brokerageStr] = tradeMatch;
      const quantity = parseInt(quantityStr);
      const price = parseFloat(priceStr);
      const amount = parseFloat(amountStr);
      const brokerage_amount = brokerageStr ? parseFloat(brokerageStr) : 0;
      const brokerage_rate_pct = amount > 0 ? (brokerage_amount / amount) * 100 : 0;
      
      items.push({
        description: `${currentSecurity} - ${side} ${quantity} units @ ₹${price.toFixed(2)}`,
        quantity,
        rate: price,
        amount,
        company_code: currentSecurity,
        brokerage_rate_pct,
        brokerage_amount,
      });
    }
  }
  
  return items;
}

export function FOBillEditor({ bill, onSave, onCancel }: FOBillEditorProps) {
  const { toast } = useToast();
  
  // Format dates properly for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState({
    bill_number: bill.bill_number,
    party_id: bill.party_id,
    bill_date: formatDateForInput(bill.bill_date),
    due_date: formatDateForInput(bill.due_date),
    total_amount: bill.total_amount.toString(),
    notes: bill.notes || "",
    bill_type: bill.bill_type || 'party',
  });
  
  const [items, setItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch bill items when component mounts
  useEffect(() => {
    fetchBillItems();
  }, [bill.id]);

  const fetchBillItems = async () => {
    try {
      setLoading(true);
      const billItems = await foBillQueries.getItems(bill.id);
      console.log('Fetched bill items:', billItems);
      
      // If no items in database, try to parse from notes
      if (billItems.length === 0 && bill.notes) {
        const parsedItems = parseNotesToItems(bill.notes);
        console.log('Parsed items from notes:', parsedItems);
        setItems(parsedItems);
      } else {
        setItems(billItems);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bill items:", error);
      toast({
        title: "Error",
        description: "Failed to load bill items: " + (error as Error).message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Recalculate amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        updated[index].amount = updated[index].quantity * updated[index].rate;
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      }
    ]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateItemAmount = (item: BillItem): number => {
    return item.quantity * item.rate;
  };

  const calculateTotalAmount = (): number => {
    return items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate that we have items
      if (items.length === 0) {
        toast({
          title: "Warning",
          description: "No items to save. Please add at least one item.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const updatedBill = {
        ...bill,
        bill_number: formData.bill_number,
        party_id: formData.party_id,
        bill_date: formData.bill_date,
        due_date: formData.due_date || null,
        total_amount: calculateTotalAmount(),
        notes: formData.notes,
        bill_type: formData.bill_type,
        items: items.map(item => ({
          ...item,
          amount: calculateItemAmount(item)
        }))
      };

      await foBillQueries.update(bill.id, updatedBill);
      
      onSave(updatedBill);
      
      toast({
        title: "Success",
        description: "Bill updated successfully",
      });
    } catch (error) {
      console.error("Error saving bill:", error);
      toast({
        title: "Error",
        description: "Failed to save bill: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Bill</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bill Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bill_number">Bill Number</Label>
                <Input
                  id="bill_number"
                  value={formData.bill_number}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill_date">Bill Date</Label>
                <Input
                  id="bill_date"
                  type="date"
                  value={formData.bill_date}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  disabled={saving}
                  placeholder="dd-mm-yyyy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={handleInputChange}
                    disabled={saving}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bill_type">Bill Type</Label>
              <Input
                id="bill_type"
                value={formData.bill_type}
                readOnly
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {formData.bill_type === 'broker' ? 'Client Information' : 'Party Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.bill_type === 'broker' ? (
              <>
                <div className="space-y-2">
                  <Label>Broker Code</Label>
                  <Input value={bill.broker_code || "Not specified"} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Broker Name</Label>
                  <Input value={bill.broker_name || "Unknown"} readOnly />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Party Code</Label>
                  <Input value={bill.party_code || ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Party Name</Label>
                  <Input value={bill.party_name || ""} readOnly />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Bill Items</span>
              <Button onClick={addItem} size="sm" disabled={saving}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  No items found. Add your first item.
                </div>
                <Button onClick={addItem} disabled={saving}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                              disabled={saving}
                              className="pl-6"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={calculateItemAmount(item)}
                              readOnly
                              className="pl-6"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={saving}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Additional notes or remarks"
              disabled={saving}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}