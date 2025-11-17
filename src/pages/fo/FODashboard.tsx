import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, TrendingUp, Receipt, DollarSign } from "lucide-react";

const FODashboard = () => {
  const [subBrokerProfit, setSubBrokerProfit] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
                  ₹{Number(subBrokerProfit?.current_balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Total Profit: ₹{Number(subBrokerProfit?.total_profit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                  <div key={contract.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
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
                        ₹{Number(contract.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
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
