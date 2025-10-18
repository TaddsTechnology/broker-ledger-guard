import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, TrendingUp, Receipt } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Parties",
      value: "3",
      icon: Users,
      description: "Active trading parties",
      trend: "+12% from last month",
    },
    {
      title: "Companies",
      value: "3",
      icon: Building2,
      description: "Listed companies",
      trend: "NSE & BSE",
    },
    {
      title: "Today's Volume",
      value: "₹2.4M",
      icon: TrendingUp,
      description: "Trading volume",
      trend: "+8.2% vs yesterday",
    },
    {
      title: "Pending Bills",
      value: "0",
      icon: Receipt,
      description: "Awaiting generation",
      trend: "All settlements current",
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Dashboard"
        description="Overview of your brokerage operations"
      />
      
      <div className="p-6 space-y-6">
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

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: "Party Master", detail: "ABC Trading Pvt Ltd added", time: "2 hours ago" },
                { action: "Settlement", detail: "Settlement #2024001 created", time: "5 hours ago" },
                { action: "Company Master", detail: "TCS data updated", time: "1 day ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium text-sm">{activity.action}</div>
                    <div className="text-xs text-muted-foreground">{activity.detail}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
