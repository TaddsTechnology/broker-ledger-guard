import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, TrendingUp, Receipt, DollarSign } from "lucide-react";

const Dashboard = () => {
  const [subBrokerProfit, setSubBrokerProfit] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profitRes, statsRes, billsRes] = await Promise.all([
        fetch('http://localhost:3001/api/ledger/sub-broker-profit'),
        fetch('http://localhost:3001/api/dashboard/stats'),
        fetch('http://localhost:3001/api/dashboard/recent-bills')
      ]);
      
      setSubBrokerProfit(await profitRes.json());
      setDashboardStats(await statsRes.json());
      setRecentBills(await billsRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      title: "Active Clients",
      value: isLoading ? "..." : String(dashboardStats?.active_clients || 0),
      icon: Users,
      description: "Trading parties",
      trend: "Total unique clients",
    },
    {
      title: "Total Billed",
      value: isLoading ? "..." : `₹${(Number(dashboardStats?.total_billed || 0) / 100000).toFixed(1)}L`,
      icon: Building2,
      description: "Total bills generated",
      trend: "All time",
    },
    {
      title: "Pending Receivables",
      value: isLoading ? "..." : `₹${(Number(dashboardStats?.pending_receivables || 0) / 100000).toFixed(1)}L`,
      icon: Receipt,
      description: "Unpaid bills",
      trend: `${dashboardStats?.pending_bills_count || 0} bills pending`,
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Dashboard"
        description="Overview of your brokerage operations"
      />
      
      <div className="p-6 space-y-6">
        {/* Sub-Broker Earnings Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              My Brokerage Earnings (Sub-Broker)
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

        {/* Recent Bills */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
            <CardDescription>Latest party bills generated</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : recentBills.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No bills yet</div>
            ) : (
              <div className="space-y-3">
                {recentBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{bill.bill_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {bill.party_code} - {bill.party_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-medium">
                        ₹{Number(bill.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(bill.bill_date).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="ml-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                        bill.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {bill.status}
                      </span>
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

export default Dashboard;
