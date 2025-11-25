import { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getOutstandingBills, getOutstandingFoBills } from "@/lib/database";

interface Bill {
  id: string;
  bill_number: string;
  total_amount: number;
  paid_amount: number;
  status: string;
}

type RawBill = Bill & { id: string | number };

interface Party {
  id: string;
  party_code: string;
  name: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partyId: string;
  partyCode: string;
  currentBalance: number;
  onPaymentSuccess: () => void;
  mode?: 'equity' | 'fo';
}

export function PaymentDialog({
  open,
  onOpenChange,
  partyId,
  partyCode,
  currentBalance,
  onPaymentSuccess,
  mode = 'equity',
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<'payin' | 'payout'>('payin');
  const [applyToBillId, setApplyToBillId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const quickAmountPresets = [5000, 10000, 25000, 50000];

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return "₹0.00";
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const outstandingTotal = useMemo(
    () => bills.reduce((sum, bill) => sum + (bill.total_amount - bill.paid_amount), 0),
    [bills]
  );

  const selectedBillOutstanding = useMemo(() => {
    if (!applyToBillId) return null;
    const bill = bills.find((b) => b.id === applyToBillId);
    if (!bill) return null;
    return bill.total_amount - bill.paid_amount;
  }, [applyToBillId, bills]);

  const fetchOutstandingBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const partyBills = mode === 'fo'
        ? await getOutstandingFoBills(partyId)
        : await getOutstandingBills(partyId);
      const normalizedBills = ((partyBills || []) as RawBill[]).map((bill) => ({
        ...bill,
        id: bill.id?.toString?.() ?? String(bill.id),
      }));
      setBills(normalizedBills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to fetch outstanding bills",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [mode, partyId, toast]);

  // Fetch outstanding bills for the party
  useEffect(() => {
    if (open && partyId) {
      fetchOutstandingBills();
    }
  }, [open, partyId, fetchOutstandingBills]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!amount) {
      newErrors.amount = "Amount is required";
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const amountValue = parseFloat(amount);
      const paymentId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      let endpoint = 'http://localhost:3001/api/payments';
      let payload:
        | {
            payment_id: string;
            party_id: string;
            amount: number;
            date: string;
            apply_to_bill_id: string | null;
            payment_method: string;
            payment_type: string;
            notes: string | null;
          }
        | {
            party_id: string;
            amount: number;
            date: string;
            apply_to_bill_id: number | null;
            payment_method: string;
            payment_type: string;
            notes: string | null;
          } = {
        payment_id: paymentId,
        party_id: partyId,
        amount: amountValue,
        date: new Date().toISOString().split('T')[0],
        apply_to_bill_id: applyToBillId,
        payment_method: "cash",
        payment_type: paymentType,
        notes: notes || null,
      };

      if (mode === 'fo') {
        endpoint = 'http://localhost:3001/api/fo/payments';
        const foBillId = applyToBillId ? Number(applyToBillId) : null;
        if (applyToBillId && (foBillId === null || Number.isNaN(foBillId))) {
          throw new Error('Invalid bill selected');
        }
        payload = {
          party_id: partyId,
          amount: amountValue,
          date: new Date().toISOString().split('T')[0],
          apply_to_bill_id: foBillId,
          payment_method: "cash",
          payment_type: paymentType,
          notes: notes || null,
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Cash payment recorded successfully. New balance: ₹${result.new_balance.toFixed(2)}`,
      });
      
      // Reset form
      setAmount("");
      setPaymentType('payin');
      setApplyToBillId(null);
      setNotes("");
      setErrors({});
      
      // Close dialog and refresh ledger
      onOpenChange(false);
      onPaymentSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate outstanding amount for selected bill
  const getBillOutstanding = (bill: Bill) => {
    return bill.total_amount - bill.paid_amount;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cash Payment</DialogTitle>
          <DialogDescription>
            Record and allocate cash against outstanding bills
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Party
                </p>
                <p className="text-lg font-semibold">{partyCode}</p>
              </div>
              <Badge className={currentBalance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                {currentBalance >= 0 ? "CR" : "DR"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Current Balance</p>
                <p className="text-xl font-semibold">{formatCurrency(Math.abs(currentBalance))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Outstanding Bills</p>
                <p className="text-xl font-semibold">{formatCurrency(outstandingTotal)}</p>
                <p className="text-xs text-muted-foreground">{bills.length} open {bills.length === 1 ? "bill" : "bills"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="payment_type">
                Payment Type <span className="text-destructive">*</span>
              </Label>
              <Select value={paymentType} onValueChange={(value: 'payin' | 'payout') => setPaymentType(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payin">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-semibold">Pay-In</span>
                      <span className="text-xs text-muted-foreground">(Party pays you)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="payout">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-semibold">Pay-Out</span>
                      <span className="text-xs text-muted-foreground">(You pay party)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Quick fill
              </p>
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter ${paymentType === 'payin' ? 'received' : 'paid'} amount`}
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {quickAmountPresets.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => setAmount(preset.toString())}
                >
                  {formatCurrency(preset)}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="applyToBill">Apply to Bill</Label>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <Select 
              value={applyToBillId || "none"} 
              onValueChange={(value) => setApplyToBillId(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading bills..." : "Select a bill"} />
              </SelectTrigger>
              <SelectContent>
                {bills.map((bill) => (
                  <SelectItem key={bill.id} value={bill.id}>
                    {bill.bill_number} · {formatCurrency(getBillOutstanding(bill))}
                  </SelectItem>
                ))}
                <SelectItem value="none">Don't apply to a specific bill</SelectItem>
              </SelectContent>
            </Select>
            {selectedBillOutstanding !== null && (
              <p className="text-xs text-muted-foreground">
                Outstanding on selected bill: <span className="font-medium">{formatCurrency(selectedBillOutstanding)}</span>
              </p>
            )}
            <div className="rounded-lg border bg-muted/20">
              <ScrollArea className="max-h-48">
                {isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Fetching outstanding bills...</div>
                ) : bills.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No outstanding bills for this party.</div>
                ) : (
                  bills.map((bill) => {
                    const outstanding = getBillOutstanding(bill);
                    return (
                      <div key={bill.id} className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium">{bill.bill_number}</p>
                          <p className="text-xs text-muted-foreground">Outstanding {formatCurrency(outstanding)}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {bill.status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </div>
          </div>
          
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any remarks about this payment"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Recording..." : "Record Cash Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
