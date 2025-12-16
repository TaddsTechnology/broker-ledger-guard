import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, TrendingUp, Receipt, DollarSign, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FODashboard = () => {
  const [subBrokerProfit, setSubBrokerProfit] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [clientBills, setClientBills] = useState<any[]>([]);
  const [clientLedger, setClientLedger] = useState<any[]>([]);
  const [clientLoading, setClientLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profitRes, statsRes, contractsRes] = await Promise.all([
        fetch('http://localhost:3001/api/fo/ledger/sub-broker-profit'),
        fetch('http://localhost:3001/api/fo/dashboard'),
        fetch('http://localhost:3001/api/fo/dashboard/recent-contracts')
      ]);
      
      setSubBrokerProfit(await profitRes.json());
      setDashboardStats(await statsRes.json());
      setRecentContracts(await contractsRes.json());
    } catch (error) {
      console.error('Error fetching F&O dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: string, clientCode: string, clientName: string) => {
    setClientLoading(true);
    try {
      // Fetch client summary
      const summaryRes = await fetch(`http://localhost:3001/api/summary/parties?module=fo`);
      const summaryData = await summaryRes.json();
      
      // Find the specific client
      const client = summaryData.find((c: any) => c.party_code === clientCode);
      
      // Fetch client bills (using F&O endpoint)
      const billsRes = await fetch(`http://localhost:3001/api/fo/bills/outstanding/${clientId}`);
      const billsData = await billsRes.json();
      
      // Fetch client ledger (using F&O endpoint)
      const ledgerRes = await fetch(`http://localhost:3001/api/fo/ledger/party/${clientId}`);
      const ledgerData = await ledgerRes.json();
      
      setClientDetails(client);
      // Ensure billsData is an array, if not set to empty array
      setClientBills(Array.isArray(billsData) ? billsData : []);
      // Ensure ledgerData is an array, if not set to empty array
      setClientLedger(Array.isArray(ledgerData) ? ledgerData : []);
      setSelectedClient({ id: clientId, code: clientCode, name: clientName });
    } catch (error) {
      console.error('Error fetching client details:', error);
      // Set to empty arrays in case of error
      setClientBills([]);
      setClientLedger([]);
    } finally {
      setClientLoading(false);
    }
  };

  const closeClientView = () => {
    setSelectedClient(null);
    setClientDetails(null);
    setClientBills([]);
    setClientLedger([]);
  };

  const stats = [
    {
      title: "Active Clients",
      value: isLoading ? "..." : String(dashboardStats?.active_clients || 0),
      icon: Users,
      description: "F&O trading parties",
      trend: "Total unique clients",
    },
    {
      title: "Total Billed",
      value: isLoading ? "..." : `₹${(Number(dashboardStats?.total_billed || 0) / 100000).toFixed(1)}L`,
      icon: Building2,
      description: "Total F&O bills",
      trend: "All time",
    },
    {
      title: "Pending Receivables",
      value: isLoading ? "..." : `₹${(Number(dashboardStats?.pending_receivables || 0) / 100000).toFixed(1)}L`,
      icon: Receipt,
      description: "Unpaid F&O bills",
      trend: `${dashboardStats?.pending_bills_count || 0} bills pending`,
    },
    {
      title: "Open Positions",
      value: isLoading ? "..." : String(dashboardStats?.open_positions || 0),
      icon: TrendingUp,
      description: "Active F&O positions",
      trend: "Currently open",
    },
  ];

  // Client detail view
  if (selectedClient) {
    return (
      <div className="flex-1 overflow-auto">
        <PageHeader
          title={`${selectedClient.code} - ${selectedClient.name}`}
          description="F&O Client Details"
          action={
            <Button onClick={closeClientView} variant="outline">
              Back to Dashboard
            </Button>
          }
        />
        
        <div className="p-6 space-y-6">
          {/* Client Summary */}
          {clientLoading ? (
            <div className="text-center py-4">Loading client details...</div>
          ) : (
            <>
              {clientDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle>F&O Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Total Debit</div>
                      <div className="text-xl font-bold">₹{Number(clientDetails.total_debit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Total Credit</div>
                      <div className="text-xl font-bold">₹{Number(clientDetails.total_credit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Closing Balance</div>
                      <div className="text-xl font-bold">
                        ₹{Math.abs(Number(clientDetails.closing_balance || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        <span className="text-sm ml-2">
                          {Number(clientDetails.closing_balance) >= 0 ? 'DR' : 'CR'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Outstanding Bills */}
              <Card>
                <CardHeader>
                  <CardTitle>Outstanding F&O Bills</CardTitle>
                  <CardDescription>F&O bills that are not fully paid</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientBills.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No outstanding bills</div>
                  ) : (
                    <div className="space-y-3">
                      {clientBills.map((bill: any) => (
                        <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{bill.bill_number}</div>
                            <div className="text-sm text-muted-foreground">
                              Status: {bill.status}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ₹{(Number(bill.total_amount) - Number(bill.paid_amount)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Total: ₹{Number(bill.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Ledger Entries */}
              <Card>
                <CardHeader>
                  <CardTitle>F&O Ledger Entries</CardTitle>
                  <CardDescription>Recent F&O financial transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientLedger.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No ledger entries</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Date</th>
                            <th className="text-left py-2">Particulars</th>
                            <th className="text-right py-2">Debit</th>
                            <th className="text-right py-2">Credit</th>
                            <th className="text-right py-2">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientLedger.slice(0, 10).map((entry: any) => (
                            <tr key={entry.id} className="border-b">
                              <td className="py-2">
                                {new Date(entry.entry_date).toLocaleDateString('en-IN')}
                              </td>
                              <td className="py-2 max-w-xs truncate">{entry.particulars}</td>
                              <td className="py-2 text-right">
                                {Number(entry.debit_amount) > 0 
                                  ? `₹${Number(entry.debit_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
                                  : '-'}
                              </td>
                              <td className="py-2 text-right">
                                {Number(entry.credit_amount) > 0 
                                  ? `₹${Number(entry.credit_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
                                  : '-'}
                              </td>
                              <td className="py-2 text-right font-medium">
                                ₹{Math.abs(Number(entry.balance)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                <span className="text-xs ml-1">
                                  {Number(entry.balance) >= 0 ? 'DR' : 'CR'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="F&O Dashboard"
        description="Overview of your brokerage operations"
      />
      
      <div className="p-6 space-y-6">
        {/* Sub-Broker Earnings Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              My F&O Brokerage Earnings (Sub-Broker)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold text-green-600">Loading...</div>
            ) : (
              <>
                <div className="text-4xl font-bold text-green-600">
                  ₹{Math.abs(Number(subBrokerProfit?.current_balance || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Total Profit: ₹{Math.abs(Number(subBrokerProfit?.total_profit || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {subBrokerProfit?.transaction_count || 0} transactions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-card border-border hover:shadow-glow transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
                <p className="text-xs text-accent mt-2">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <button className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
              <div className="font-semibold mb-1">Upload Trade File</div>
              <div className="text-sm text-muted-foreground">
                Process exchange data
              </div>
            </button>
            <button className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
              <div className="font-semibold mb-1">Generate Bills</div>
              <div className="text-sm text-muted-foreground">
                Create contract notes
              </div>
            </button>
            <button className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left">
              <div className="font-semibold mb-1">View Reports</div>
              <div className="text-sm text-muted-foreground">
                Analytics & insights
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Recent Contracts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Contracts</CardTitle>
            <CardDescription>Latest F&O contracts created</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : recentContracts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No contracts yet</div>
            ) : (
              <div className="space-y-3">
                {recentContracts.map((contract) => (
                  <div 
                    key={contract.id} 
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => fetchClientDetails(contract.party_id, contract.party_code, contract.party_name)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{contract.instrument_name || contract.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {contract.party_code} - {contract.party_name}
                      </div>
                    </div>
                    <div className="text-center mx-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        contract.trade_type === 'BUY' ? 'bg-green-100 text-green-700' :
                        contract.trade_type === 'SELL' ? 'bg-red-100 text-red-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {contract.trade_type}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-medium">
                        {contract.quantity.toLocaleString()} qty
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        ₹{Number(contract.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Brokerage: ₹{Number(contract.brokerage_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FODashboard;