import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Printer } from "lucide-react";

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
  const [brokerMaster, setBrokerMaster] = useState<any | null>(null);

  useEffect(() => {
    if (open && bill) {
      fetchBillItemsAndBroker();
    }
  }, [open, bill]);

  const fetchBillItemsAndBroker = async () => {
    if (!bill) return;
    setLoading(true);
    try {
      const [itemsRes, brokersRes] = await Promise.all([
        fetch(`http://localhost:3001/api/bills/${bill.id}/items`),
        fetch("http://localhost:3001/api/brokers"),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data || []);
      }

      if (brokersRes.ok) {
        const brokers = await brokersRes.json();
        const found = brokers.find((b: any) => b.broker_code === bill.broker_code);
        setBrokerMaster(found || null);
      }
    } catch (err) {
      console.error("Error fetching broker bill data", err);
    }
    setLoading(false);
  };

  if (!bill) return null;

  // Group items by client
  const clientGroups = items.reduce((acc, item) => {
    const client = item.client_code || "Unknown";
    if (!acc[client]) acc[client] = [];
    acc[client].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate overall profit summary using slabs from broker master
  let totalClientBrokerage = 0;
  let totalBrokerShare = 0;
  let totalSubBrokerProfit = 0;

  // Broker slab rates are stored as percentages (e.g., 2 for 2%), need to divide by 100
  const tradingRate = brokerMaster ? Number(brokerMaster.trading_slab || 0) : 0;
  const deliveryRate = brokerMaster ? Number(brokerMaster.delivery_slab || 0) : 0;

  items.forEach((item) => {
    const clientB = Number(item.brokerage_amount || 0);
    const amount = Number(item.amount || 0);
    const isTrading = (item.trade_type || "T").toUpperCase() === "T";
    const rate = isTrading ? tradingRate : deliveryRate;
    const brokerShare = (amount * rate) / 100; // FIXED: Use trade amount and divide by 100

    totalClientBrokerage += clientB;
    totalBrokerShare += brokerShare;
  });

   totalSubBrokerProfit = bill.bill_number.includes('FO') ? totalBrokerShare - totalClientBrokerage : totalClientBrokerage - totalBrokerShare;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <span>Sub-Broker Bill - {bill.bill_number}</span>
            </DialogTitle>
            <Button onClick={handlePrint} variant="outline" size="sm" className="no-print flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bill Header */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-xs text-muted-foreground">Main Broker</p>
              <p className="font-semibold">{bill.broker_code}</p>
              <p className="text-sm">{bill.broker_name || brokerMaster?.name || "Broker"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Bill Date</p>
              <p className="font-semibold">
                {new Date(bill.bill_date).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs">
                Main Broker Bill Amount: <span className="font-semibold">
                  ₹{Number(bill.total_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>

          {/* Profit Summary */}
          <div className="p-6 rounded-lg border bg-gradient-to-r from-emerald-50 to-green-50 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Your Sub-Broker Profit</p>
            <p className="text-4xl md:text-5xl font-extrabold text-emerald-800 mt-2">
              ₹{totalSubBrokerProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-emerald-700 mt-2">
              (Client Brokerage: ₹{totalClientBrokerage.toLocaleString("en-IN", { maximumFractionDigits: 2 })} -
              Main Broker: ₹{totalBrokerShare.toLocaleString("en-IN", { maximumFractionDigits: 2 })})
            </p>
          </div>

          {/* Items by Client with per-client profit */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading items...</div>
          ) : Object.keys(clientGroups).length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold">Sub-Broker Bill Items by Client</h3>
              {Object.entries(clientGroups).map(([client, clientItems]) => {
                // Type assertion for clientItems
                const items = clientItems as any[];
                let clientBrokerage = 0;
                let clientBrokerShare = 0;

                items.forEach((item: any) => {
                  const b = Number(item.brokerage_amount || 0);
                  const amt = Number(item.amount || 0);
                  const isTrading = (item.trade_type || "T").toUpperCase() === "T";
                  const rate = isTrading ? tradingRate : deliveryRate;
                  const share = (amt * rate) / 100; // FIXED: Use trade amount and divide by 100
                  clientBrokerage += b;
                  clientBrokerShare += share;
                });

                 const clientProfit = bill.bill_number.includes('FO') ? clientBrokerShare - clientBrokerage : clientBrokerage - clientBrokerShare;

                return (
                  <div key={client} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-primary">{client}</h4>
                      <div className="text-xs">
                         <span className="text-muted-foreground mr-2">Sub-Broker Profit:</span>
                        <span className="font-mono font-semibold text-emerald-700">
                          ₹{clientProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs md:text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2">Security</th>
                            <th className="text-right p-2">Quantity</th>
                            <th className="text-right p-2">Rate</th>
                            <th className="text-right p-2">Amount</th>
                            <th className="text-right p-2">Client Brokerage</th>
                            <th className="text-right p-2">Main Broker Share</th>
                            <th className="text-right p-2">Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item: any, idx: number) => {
                            const amt = Number(item.amount || 0);
                            const b = Number(item.brokerage_amount || 0);
                            const isTrading = (item.trade_type || "T").toUpperCase() === "T";
                            const rate = isTrading ? tradingRate : deliveryRate;
                            const share = (amt * rate) / 100; // FIXED: Use trade amount and divide by 100
                             const profit = bill.bill_number.includes('FO') ? share - b : b - share;

                            return (
                              <tr key={idx} className="border-b">
                                <td className="p-2">
                                  {item.company_name
                                    ? `${item.company_code} - ${item.company_name}`
                                    : item.description}
                                </td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">₹{Number(item.rate).toFixed(2)}</td>
                                <td className="p-2 text-right">₹{amt.toFixed(2)}</td>
                                <td className="p-2 text-right">₹{b.toFixed(2)}</td>
                                <td className="p-2 text-right">₹{share.toFixed(2)}</td>
                                <td className={`p-2 text-right font-mono font-semibold ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                  ₹{profit.toFixed(2)}
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
            <div className="text-center py-8 text-muted-foreground">No items found for this bill</div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="font-medium">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                bill.status === "paid"
                  ? "bg-green-100 text-green-800"
                  : bill.status === "partial" || bill.status === "partially_paid"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
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
