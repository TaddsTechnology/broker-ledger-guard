import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, ArrowLeft, Construction } from 'lucide-react';

export function FODashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/modules')}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Module Selection
        </Button>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-purple-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <LineChart className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                F&O Module
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
                <Construction className="w-6 h-6" />
                <span className="text-xl font-semibold">Coming Soon</span>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                The Futures & Options module is currently under development.
              </p>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">
                  Upcoming Features:
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>✓ Futures Contract Management</li>
                  <li>✓ Options (Call & Put) Trading</li>
                  <li>✓ MTM (Mark to Market) Calculations</li>
                  <li>✓ Expiry Date Management</li>
                  <li>✓ Position Tracking & Analysis</li>
                  <li>✓ F&O Specific Billing System</li>
                  <li>✓ Lot Size Management</li>
                  <li>✓ Strike Price Tracking</li>
                  <li>✓ F&O Reports & Analytics</li>
                </ul>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/equity/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Equity Module Instead
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
