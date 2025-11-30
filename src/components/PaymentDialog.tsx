import { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  // We no longer allocate payments to a specific bill; everything goes to ledger-level.
  const [applyToBillId, setApplyToBillId] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Check if this is a main broker payment
  const isMainBrokerPayment = partyCode === "MAIN-BROKER";

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

  // We keep bills only for display; payment is not tied to a single bill anymore.
  const selectedBillOutstanding = null;

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

      if (isMainBrokerPayment) {
        // For main broker payments, we need to create a direct ledger entry
        try {
          if (mode === 'fo') {
            // For F&O, we need to get the latest broker bill first
            const billEndpoint = 'http://localhost:3001/api/fo/bills?type=broker';
            
            const billResponse = await fetch(billEndpoint);
            if (billResponse.ok) {
              const bills = await billResponse.json();
              if (bills && bills.length > 0) {
                // Get the most recent broker bill
                const latestBrokerBill = bills[0];
                const billId = latestBrokerBill.id;
                
                // Use the F&O broker payment endpoint
                const endpoint = `http://localhost:3001/api/fo/bills/${billId}/payment`;
                
                // For Main Broker, Pay-In should make the balance zero
                // So we pay the full outstanding amount
                const paymentAmount = paymentType === 'payin' ? Math.abs(currentBalance) : amountValue;
                
                const payload = {
                  amount: paymentAmount,
                  payment_date: new Date().toISOString().split('T')[0],
                  payment_method: "cash",
                  payment_type: paymentType,
                };
                
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
                  description: `Main broker payment recorded successfully.`,
                });
              } else {
                throw new Error('No broker bills found');
              }
            } else {
              throw new Error('Failed to fetch broker bills');
            }
          } else {
            // For Equity, use the broker bill payment endpoint
            // First, get the latest broker bill
            const billEndpoint = 'http://localhost:3001/api/bills?type=broker';
            
            const billResponse = await fetch(billEndpoint);
            if (billResponse.ok) {
              const bills = await billResponse.json();
              if (bills && bills.length > 0) {
                // Get the most recent broker bill
                const latestBrokerBill = bills[0];
                const billId = latestBrokerBill.id;
                
                // Use the broker payment endpoint
                const endpoint = `http://localhost:3001/api/bills/${billId}/payment`;
                
                // For Main Broker, Pay-In should make the balance zero
                // So we pay the full outstanding amount
                const paymentAmount = paymentType === 'payin' ? Math.abs(currentBalance) : amountValue;
                
                const payload = {
                  amount: paymentAmount,
                  payment_date: new Date().toISOString().split('T')[0],
                  payment_method: "cash",
                  payment_type: paymentType,
                };
                
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
                  description: `Main broker payment recorded successfully.`,
                });
              } else {
                throw new Error('No broker bills found');
              }
            } else {
              throw new Error('Failed to fetch broker bills');
            }
          }
        } catch (billError) {
          console.error('Error recording broker payment:', billError);
          throw new Error('Unable to record main broker payment: ' + (billError instanceof Error ? billError.message : 'Unknown error'));
        }
      } else {
        // Handle regular party payments
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
            }
          | {
              party_id: string;
              amount: number;
              date: string;
              apply_to_bill_id: number | null;
              payment_method: string;
              payment_type: string;
            } = {
          payment_id: paymentId,
          party_id: partyId,
          amount: amountValue,
          date: new Date().toISOString().split('T')[0],
          apply_to_bill_id: null,
          payment_method: "cash",
          payment_type: paymentType,
        };

        if (mode === 'fo') {
          endpoint = 'http://localhost:3001/api/fo/payments';
          payload = {
            party_id: partyId,
            amount: amountValue,
            date: new Date().toISOString().split('T')[0],
            apply_to_bill_id: null,
            payment_method: "cash",
            payment_type: paymentType,
          };
        }
        
        // For regular parties, Pay-Out should make the balance zero
        // So we pay the full outstanding amount when it's a payout
        const finalAmount = paymentType === 'payout' ? Math.abs(currentBalance) : amountValue;
        payload.amount = finalAmount;
        
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
          description: `Cash payment recorded successfully. New balance: ₹${result.new_balance?.toFixed(2) || 'N/A'}`,
        });
      }
      
        // Reset form
      setAmount("");
      setPaymentType('payin');
      setApplyToBillId(null);
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
            <Label htmlFor="amount">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={
                isMainBrokerPayment 
                  ? (paymentType === 'payin' 
                      ? `Enter amount (Pay-In clears balance: ₹${Math.abs(currentBalance).toFixed(2)})` 
                      : "Enter payout amount")
                  : (paymentType === 'payout' 
                      ? `Enter amount (Pay-Out clears balance: ₹${Math.abs(currentBalance).toFixed(2)})` 
                      : "Enter pay-in amount")
              }
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>
          
          {/* Apply-to-bill UI removed: payments are now only ledger-level */}

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