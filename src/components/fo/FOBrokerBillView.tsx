import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, X, Printer } from "lucide-react";

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

export function FOBrokerBillView({ bill, open, onOpenChange }: BrokerBillViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [brokerMaster, setBrokerMaster] = useState<any>(null);
  const [profitInfo, setProfitInfo] = useState<any>(null);

  // Fetch bill items, broker master, and profit info when dialog opens
  useEffect(() => {
    if (open && bill) {
      fetchBillItems();
      fetchBrokerMaster();
      fetchProfitInfo();
    }
  }, [open, bill]);

  const fetchBillItems = async () => {
    if (!bill) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/fo/bills/${bill.id}/items`);
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

  const fetchProfitInfo = async () => {
    if (!bill?.id) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/fo/bills/${bill.id}/profit`);
      if (response.ok) {
        const data = await response.json();
        setProfitInfo(data);
      }
    } catch (error) {
      console.error('Error fetching profit info:', error);
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
  
  // Calculate total sub-broker brokerage (what clients paid)
  const totalSubBrokerBrokerage = items.reduce(
    (sum, item) => sum + (Number(item.brokerage_amount) || 0),
    0
  );
  
  // Sub-broker profit from profitInfo or calculate manually
  const subBrokerProfit = profitInfo?.profit || (totalSubBrokerBrokerage - brokerActualShare);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-0">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <span>Sub-Broker Bill - {bill.bill_number}</span>
              </DialogTitle>
            </div>
          </DialogHeader>
          
          {/* Print Button - Separate from header to avoid overlap */}
          {/* Hidden in actual print using .no-print class */}
          <div className="flex justify-end -mt-2 mb-4 no-print">
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>

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
            <div className="p-6 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Sub-Broker Profit</p>
              <p className="text-4xl font-bold text-green-600">
                ₹{subBrokerProfit.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                (Client Brokerage: ₹{totalSubBrokerBrokerage.toLocaleString()} - Main Broker: ₹{brokerActualShare.toLocaleString()})
              </p>
            </div>

            {/* Items by Client */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading items...
              </div>
            ) : Object.keys(clientGroups).length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Sub-Broker Profit Breakdown by Client</h3>
                {Object.entries(clientGroups).map(([client, clientItems]) => {
                  // Calculate sub-broker profit for this client
                  const clientSubBrokerBrokerage = clientItems.reduce(
                    (sum, item) => sum + (Number(item.brokerage_amount) || 0),
                    0
                  );
                  
                  // Calculate broker's share for this client
                  let clientBrokerShare = 0;
                  if (brokerMaster) {
                    clientItems.forEach(item => {
                      const rate = item.trade_type === 'T' 
                        ? Number(brokerMaster.trading_slab) 
                        : Number(brokerMaster.delivery_slab);
                      clientBrokerShare += (Number(item.amount) * rate) / 100;
                    });
                  }
                  
                  // Sub-broker profit = Sub-broker brokerage - Broker's share
                  const clientProfit = clientSubBrokerBrokerage - clientBrokerShare;
                  
                  return (
                    <div key={client} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-primary">{client}</h4>
                        <span className="font-semibold text-green-600">
                          Profit: ₹{clientProfit.toFixed(2)}
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
                              <th className="text-right p-2">Client Brokerage</th>
                              <th className="text-right p-2">Broker Share</th>
                              <th className="text-right p-2">Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientItems.map((item, idx) => {
                              // Calculate broker's share for this item
                              const rate = brokerMaster ? (
                                item.trade_type === 'T' 
                                  ? Number(brokerMaster.trading_slab) 
                                  : Number(brokerMaster.delivery_slab)
                              ) : 0;
                              const itemBrokerShare = (Number(item.amount) * rate) / 100;
                              const itemClientBrokerage = Number(item.brokerage_amount || 0);
                              const itemProfit = itemClientBrokerage - itemBrokerShare;
                              
                              return (
                                <tr key={idx} className="border-b">
                                  <td className="p-2">
                                    {item.display_name || item.symbol || item.description}
                                  </td>
                                  <td className="p-2 text-right">{item.quantity}</td>
                                  <td className="p-2 text-right">
                                    ₹{Number(item.rate).toFixed(2)}
                                  </td>
                                  <td className="p-2 text-right">
                                    ₹{Number(item.amount).toFixed(2)}
                                  </td>
                                  <td className="p-2 text-right text-gray-600">
                                    ₹{itemClientBrokerage.toFixed(2)}
                                  </td>
                                  <td className="p-2 text-right text-blue-600">
                                    ₹{itemBrokerShare.toFixed(2)}
                                  </td>
                                  <td className="p-2 text-right font-semibold text-green-600">
                                    ₹{itemProfit.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
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
