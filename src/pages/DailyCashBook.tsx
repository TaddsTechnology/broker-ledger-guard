import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CashTransaction {
  id: string;
  date: string;
  party_code: string;
  amount: number;
  type: "RECEIPT" | "PAYMENT";
  narration: string | null;
  mode: string;
  created_at: string;
}

const DailyCashBook = () => {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('list');
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState<CashTransaction[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<CashTransaction | null>(null);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [bookDate, setBookDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    party_code: "",
    amount: "",
    type: "RECEIPT" as "RECEIPT" | "PAYMENT",
    narration: "",
  });

  useEffect(() => {
    fetchCashBook(bookDate);
  }, [bookDate]);

  // Filter transactions based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(
        (transaction) =>
          transaction.party_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (transaction.narration && transaction.narration.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTransactions(filtered);
    }
    setSelectedRowIndex(0);
  }, [transactions, searchTerm]);

  // Focus first input when form view opens
  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  // Scroll to selected row when index changes
  useEffect(() => {
    if (currentView === 'list' && transactions.length > 0) {
      const selectedRow = document.querySelector(`[data-row-index="${selectedRowIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedRowIndex, currentView, transactions.length]);

  const fetchCashBook = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/cash/book?date=${encodeURIComponent(date)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load cash book");
      }
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (error: unknown) {
      console.error('Error fetching cash book:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch cash book",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      party_code: "",
      amount: "",
      type: "RECEIPT",
      narration: "",
    });
    setEditingTransaction(null);
  };

  const handleCreateCash = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = Number(formData.amount);
    if (!formData.party_code) {
      toast({
        title: "Error",
        description: "Party code is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.amount || !Number.isFinite(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/cash/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          party_code: formData.party_code,
          amount: amount,
          type: formData.type,
          narration: formData.narration,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create cash transaction");
      }

      toast({
        title: "Success",
        description: "Cash transaction created successfully",
      });

      resetForm();
      setCurrentView('list');
      fetchCashBook(bookDate);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create cash transaction",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return "₹0.00";
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatType = (type: string) => {
    return type === "RECEIPT" ? "Receipt" : "Payment";
  };

  const renderListView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Date</Label>
          <Input
            type="date"
            value={bookDate}
            onChange={(e) => setBookDate(e.target.value)}
            className="h-8 w-40"
          />
          <Button 
            size="sm" 
            onClick={() => fetchCashBook(bookDate)}
            variant="outline"
          >
            Refresh
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          <Button onClick={() => {
            resetForm();
            setCurrentView('form');
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Party Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction.id} 
                    data-row-index={index}
                    className={`${index === selectedRowIndex ? 'bg-muted' : ''}`}
                  >
                    <TableCell className="font-medium">
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.party_code}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'RECEIPT' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {formatType(transaction.type)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {transaction.narration}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Removed edit and delete buttons since there are no backend endpoints for them */}

                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderFormView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            New Cash Transaction
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('list')}
          >
            <List className="w-4 h-4 mr-2" />
            List View
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleCreateCash} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                ref={firstInputRef}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="party_code">Party Code</Label>
              <Input
                id="party_code"
                value={formData.party_code}
                onChange={(e) => setFormData({ ...formData, party_code: e.target.value.toUpperCase() })}
                placeholder="Enter party code"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "RECEIPT" | "PAYMENT") => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIPT">Receipt</SelectItem>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="narration">Narration</Label>
            <Textarea
              id="narration"
              value={formData.narration}
              onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
              placeholder="Enter transaction details"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setCurrentView('list');
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {editingTransaction ? "Update" : "Save"} Transaction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Daily Cash Book"
        description="Manage daily cash receipts and payments"
      />
      
      {currentView === 'list' ? renderListView() : renderFormView()}
    </div>
  );
};

export default DailyCashBook;