import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, LineChart, ArrowRight } from 'lucide-react';

export function ModuleSelector() {
  const navigate = useNavigate();

  const handleModuleSelect = (module: 'equity' | 'fo') => {
    if (module === 'equity') {
      // Navigate to equity module (current system)
      navigate('/equity/dashboard');
    } else {
      // Navigate to F&O module (to be built)
      navigate('/fo/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Select Trading Module
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Choose the module you want to access
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Equity Module Card */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-blue-500"
            onClick={() => handleModuleSelect('equity')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                Equity (EQ)
              </CardTitle>
              <CardDescription className="text-base">
                Cash Market & Delivery Trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-500" />
                  Buy & Sell Stocks
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-500" />
                  Stock Holdings Management
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-500" />
                  Party Bills & Contracts
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-500" />
                  Broker Billing
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-500" />
                  Ledger & Reports
                </li>
              </ul>
              <div className="pt-4">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200">
                  Open Equity Module
                </button>
              </div>
            </CardContent>
          </Card>

          {/* F&O Module Card */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-500"
            onClick={() => handleModuleSelect('fo')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <LineChart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                F&O
              </CardTitle>
              <CardDescription className="text-base">
                Futures & Options Trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  Futures Contracts
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  Options (Call & Put)
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  MTM & Expiry Management
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  Position Tracking
                </li>
                <li className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-500" />
                  F&O Bills & Reports
                </li>
              </ul>
              <div className="pt-4">
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200">
                  Open F&O Module
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            You can switch between modules anytime from the sidebar
          </p>
        </div>
      </div>
    </div>
  );
}
