import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, X } from "lucide-react";

interface Bill {
  id: string;
  bill_number: string;
  broker_code?: string;
  broker_name?: string;
  bill_date: string;
  total_amount: number;
  paid_amount: number;
  status: string;
}

interface BrokerBillViewProps {
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrokerBillView({ bill, open, onOpenChange }: BrokerBillViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [brokerMaster, setBrokerMaster] = useState<any>(null);

  // Fetch bill items and broker master when dialog opens
  useEffect(() => {
    if (open && bill) {
      fetchBillItems();
      fetchBrokerMaster();
    }
  }, [open, bill]);

  const fetchBillItems = async () => {
    if (!bill) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/bills/${bill.id}/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching bill items:', error);
    }
    setLoading(false);
  };

  const fetchBrokerMaster = async () => {
    if (!bill?.broker_code) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/brokers');
      if (response.ok) {
        const brokers = await response.json();
        const broker = brokers.find((b: any) => b.broker_code === bill.broker_code);
        setBrokerMaster(broker);
      }
    } catch (error) {
      console.error('Error fetching broker master:', error);
    }
  };

  if (!bill) return null;

  // Group items by client
  const clientGroups = items.reduce((acc, item) => {
    const client = item.client_code || 'Unknown';
    if (!acc[client]) acc[client] = [];
    acc[client].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate broker's actual share based on broker_master slabs
  const calculateBrokerShare = () => {
    if (!brokerMaster) return bill.total_amount;
    
    let brokerShare = 0;
    items.forEach(item => {
      const rate = item.trade_type === 'T' 
        ? Number(brokerMaster.trading_slab) 
        : Number(brokerMaster.delivery_slab);
      brokerShare += (Number(item.amount) * rate) / 100;
    });
    return brokerShare;
  };

  const brokerActualShare = calculateBrokerShare();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <span>Broker Bill - {bill.bill_number}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Bill Header */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm text-muted-foreground">Broker</p>
                <p className="font-semibold">{bill.broker_code}</p>
                <p className="text-sm">{bill.broker_name || 'Broker'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bill Date</p>
                <p className="font-semibold">
                  {new Date(bill.bill_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-center">
              <p className="text-sm text-muted-foreground mb-2">Broker's Share (Amount to Pay)</p>
              <p className="text-4xl font-bold text-blue-600">
                ₹{brokerActualShare.toLocaleString()}
              </p>
            </div>

            {/* Items by Client */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading items...
              </div>
            ) : Object.keys(clientGroups).length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Brokerage Breakdown by Client</h3>
                {Object.entries(clientGroups).map(([client, clientItems]) => {
                  const clientTotal = clientItems.reduce(
                    (sum, item) => sum + (Number(item.brokerage_amount) || 0),
                    0
                  );
                  return (
                    <div key={client} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-primary">{client}</h4>
                        <span className="font-semibold">
                          Total: ₹{clientTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2">Security</th>
                              <th className="text-right p-2">Quantity</th>
                              <th className="text-right p-2">Rate</th>
                              <th className="text-right p-2">Amount</th>
                              <th className="text-right p-2">Brokerage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientItems.map((item, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="p-2">
                                  {item.company_name 
                                    ? `${item.company_code} - ${item.company_name}` 
                                    : item.description}
                                </td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">
                                  ₹{Number(item.rate).toFixed(2)}
                                </td>
                                <td className="p-2 text-right">
                                  ₹{Number(item.amount).toFixed(2)}
                                </td>
                                <td className="p-2 text-right font-semibold text-blue-600">
                                  ₹{Number(item.brokerage_amount || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items found for this bill
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="font-medium">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bill.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : bill.status === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
              </span>
            </div>
          </div>

        </DialogContent>
      </Dialog>
  );
}
