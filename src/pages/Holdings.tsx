import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { partyQueries } from "@/lib/database";
import { format } from "date-fns";
import { History, Package, TrendingDown, TrendingUp, Users, Printer } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface Party {
  id: string;
  party_code: string;
  name: string;
}

interface Holding {
  id: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  company_id: string;
  company_code: string;
  company_name?: string;
  nse_code?: string;
  quantity: number;
  avg_buy_price: number;
  total_invested: number;
  last_trade_date: string | null;
  broker_codes?: string | null;
  broker_qty_breakdown?: string | null; // e.g. "4622:1000, 2025:1500"
}

interface Transaction {
  id: string;
  bill_id: string;
  bill_number: string;
  bill_date: string;
  party_id: string;
  party_code: string;
  party_name: string;
  company_code: string;
  description: string;
  type: 'BUY' | 'SELL' | 'UNKNOWN';
  quantity: number;
  rate: number;
  amount: number;
  brokerage_amount: number;
  trade_type: string;
  balance: number;
  created_at: string;
}

interface BrokerHolding {
  broker_code: string;
  broker_name?: string;
  company_code: string;
  company_name?: string;
  nse_code?: string;
  total_quantity: number;
  avg_price: number;
  total_invested: number;
  client_count: number;
  last_trade_date: string | null;
}

const Holdings = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [brokerHoldings, setBrokerHoldings] = useState<BrokerHolding[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBrokerHoldings, setIsLoadingBrokerHoldings] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState("holdings");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isLoadingPrint, setIsLoadingPrint] = useState(false);
  const [isLoadingBrokerPrint, setIsLoadingBrokerPrint] = useState(false);
  const [isLoadingTransactionPrint, setIsLoadingTransactionPrint] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchParties();
    fetchHoldings();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      if (activeTab === "holdings") {
        fetchHoldings();
      } else if (activeTab === "transactions") {
        fetchTransactions();
      }
    }
  }, [selectedParty, activeTab, fromDate, toDate]);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    } else if (activeTab === "broker") {
      fetchBrokerHoldings();
    } else if (activeTab === "holdings") {
      fetchHoldings();
    }
  }, [activeTab, fromDate, toDate]);

  const fetchParties = async () => {
    try {
      const result = await partyQueries.getAll();
      setParties(result || []);
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast({
        title: "Error",
        description: "Failed to fetch parties",
        variant: "destructive",
      });
    }
  };

  const fetchHoldings = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      const queryString = params.toString();
      
      const endpoint =
        selectedParty === "all" || !selectedParty
          ? `/api/holdings${queryString ? `?${queryString}` : ''}`
          : `/api/holdings/party/${selectedParty}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch holdings");
      
      const result = await response.json();
      setHoldings(result || []);
    } catch (error) {
      console.error("Error fetching holdings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch holdings",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const fetchBrokerHoldings = async () => {
    setIsLoadingBrokerHoldings(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      const queryString = params.toString();
      const endpoint = `/api/holdings/broker${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch broker holdings");
      
      const result = await response.json();
      setBrokerHoldings(result || []);
    } catch (error) {
      console.error("Error fetching broker holdings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch broker holdings",
        variant: "destructive",
      });
    }
    setIsLoadingBrokerHoldings(false);
  };

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const params = new URLSearchParams();
      if (selectedParty && selectedParty !== "all") {
        params.append("party_id", selectedParty);
      }
      if (fromDate) {
        params.append("from_date", fromDate);
      }
      if (toDate) {
        params.append("to_date", toDate);
      }
      
      const endpoint = `/api/holdings/transactions${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      
      const result = await response.json();
      setTransactions(result || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive",
      });
    }
    setIsLoadingTransactions(false);
  };

  // Handle print functionality for Equity Positions
  const handlePrintPositions = async () => {
    try {
      setIsLoadingPrint(true);
      
      // Fetch positions data
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      const queryString = params.toString();
      const endpoint = selectedParty === "all" || !selectedParty
        ? `/api/holdings${queryString ? `?${queryString}` : ''}`
        : `/api/holdings/party/${selectedParty}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch positions data for printing");
      }

      const positionsData = await response.json();
      const positionsArray = Array.isArray(positionsData) ? positionsData : [];
      
      // Separate long and short positions
      const longPositions = positionsArray.filter(p => p.quantity > 0);
      const shortPositions = positionsArray.filter(p => p.quantity < 0);
      
      // Generate HTML content for printing
      const generateHTML = () => {
        const partyInfo = selectedParty !== "all" 
          ? parties.find(p => p.id === selectedParty) 
          : null;
        
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Equity Positions Print</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; border-bottom: 2px solid #333; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-mono { font-family: monospace; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>EQUITY CURRENT POSITIONS</h1>
              ${partyInfo ? `<p>Party: ${partyInfo.party_code} - ${partyInfo.name}</p>` : '<p>All Parties</p>'}
              <p>Print Date: ${new Date().toLocaleString('en-IN')}</p>
              ${fromDate || toDate ? `<p>Date Range: ${fromDate ? new Date(fromDate).toLocaleDateString('en-IN') : 'All'} to ${toDate ? new Date(toDate).toLocaleDateString('en-IN') : 'All'}</p>` : ''}
            </div>
            
            ${longPositions.length > 0 ? `
            <div class="section-title">LONG POSITIONS (BUY)</div>
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Client Name</th>
                  <th>NSE Code</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Avg Price</th>
                  <th class="text-right">Total Invested</th>
                  <th>Last Trade</th>
                  <th>Brokers</th>
                </tr>
              </thead>
              <tbody>
                ${longPositions.map(holding => `
                  <tr>
                    <td class="font-medium">${holding.company_code}</td>
                    <td>${holding.party_name || '-'}</td>
                    <td class="font-mono">${holding.nse_code || '-'}</td>
                    <td class="text-right font-mono">${Number(holding.quantity).toLocaleString()}</td>
                    <td class="text-right font-mono">₹${Number(holding.avg_buy_price).toFixed(2)}</td>
                    <td class="text-right font-mono">₹${Number(holding.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td>${holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}</td>
                    <td style="word-break: break-word;">${holding.broker_codes || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}
            
            ${shortPositions.length > 0 ? `
            <div class="section-title">SHORT POSITIONS (SELL)</div>
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Client Name</th>
                  <th>NSE Code</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Avg Price</th>
                  <th class="text-right">Total Value</th>
                  <th>Last Trade</th>
                  <th>Brokers</th>
                </tr>
              </thead>
              <tbody>
                ${shortPositions.map(holding => {
                  const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_buy_price);
                  return `
                    <tr>
                      <td class="font-medium">${holding.company_code}</td>
                      <td>${holding.party_name || '-'}</td>
                      <td class="font-mono">${holding.nse_code || '-'}</td>
                      <td class="text-right font-mono text-red-600 font-bold">${Number(holding.quantity).toLocaleString()}</td>
                      <td class="text-right font-mono">₹${Number(holding.avg_buy_price).toFixed(2)}</td>
                      <td class="text-right font-mono font-medium text-red-600">₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td>${holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}</td>
                      <td style="word-break: break-word;">${holding.broker_codes || '-'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            ` : ''}
            
            <div style="margin-top: 30px; text-align: center;" class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                Print
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Close
              </button>
            </div>
          </body>
          </html>
        `;
      };
      
      // Open in new browser tab
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(generateHTML());
        newTab.document.close();
        newTab.focus();
        // Auto-print after content loads
        newTab.onload = () => {
          setTimeout(() => {
            newTab.print();
          }, 1000);
        };
      }
      
    } catch (error) {
      console.error("Error preparing positions print data:", error);
      toast({
        title: "Error",
        description: "Failed to prepare positions data for printing",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrint(false);
    }
  };

  // Handle print functionality for Broker Holdings
  const handlePrintBrokerHoldings = async () => {
    try {
      setIsLoadingBrokerPrint(true);
      
      // Fetch broker holdings data
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      const queryString = params.toString();
      const endpoint = `/api/holdings/broker${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch broker holdings data for printing");
      }

      const brokerHoldingsData = await response.json();
      const brokerHoldingsArray = Array.isArray(brokerHoldingsData) ? brokerHoldingsData : [];
      
      // Generate HTML content for printing
      const generateHTML = () => {
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Equity Broker Holdings Print</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; border-bottom: 2px solid #333; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-mono { font-family: monospace; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>EQUITY BROKER HOLDINGS</h1>
              <p>Print Date: ${new Date().toLocaleString('en-IN')}</p>
              ${fromDate || toDate ? `<p>Date Range: ${fromDate ? new Date(fromDate).toLocaleDateString('en-IN') : 'All'} to ${toDate ? new Date(toDate).toLocaleDateString('en-IN') : 'All'}</p>` : ''}
            </div>
            
            <div class="section-title">BROKER HOLDINGS SUMMARY</div>
            <table>
              <thead>
                <tr>
                  <th>Broker Code</th>
                  <th>Company</th>
                  <th>NSE Code</th>
                  <th class="text-right">Total Qty</th>
                  <th class="text-right">Avg Price</th>
                  <th class="text-right">Investment</th>
                  <th class="text-right">Clients</th>
                  <th>Last Trade</th>
                </tr>
              </thead>
              <tbody>
                ${brokerHoldingsArray.map(holding => `
                  <tr>
                    <td>
                      <div><strong>${holding.broker_code}</strong></div>
                      ${holding.broker_name ? `<div style="font-size: 10px; color: #666;">${holding.broker_name}</div>` : ''}
                    </td>
                    <td>
                      <div class="font-medium">${holding.company_code}</div>
                      ${holding.company_name ? `<div style="font-size: 10px; color: #666;">${holding.company_name}</div>` : ''}
                    </td>
                    <td class="font-mono">${holding.nse_code || '-'}</td>
                    <td class="text-right font-mono">${Number(holding.total_quantity).toLocaleString()}</td>
                    <td class="text-right font-mono">₹${Number(holding.avg_price || 0).toFixed(2)}</td>
                    <td class="text-right font-mono">₹${Number(holding.total_invested || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td class="text-right font-mono">${holding.client_count || 0}</td>
                    <td>${holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: center;" class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                Print
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Close
              </button>
            </div>
          </body>
          </html>
        `;
      };
      
      // Open in new browser tab
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(generateHTML());
        newTab.document.close();
        newTab.focus();
        // Auto-print after content loads
        newTab.onload = () => {
          setTimeout(() => {
            newTab.print();
          }, 1000);
        };
      }
      
    } catch (error) {
      console.error("Error preparing broker holdings print data:", error);
      toast({
        title: "Error",
        description: "Failed to prepare broker holdings data for printing",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBrokerPrint(false);
    }
  };

  // Handle print functionality for Transaction History
  const handlePrintTransactions = async () => {
    try {
      setIsLoadingTransactionPrint(true);
      
      // Fetch transactions data
      const params = new URLSearchParams();
      if (selectedParty && selectedParty !== "all") {
        params.append("party_id", selectedParty);
      }
      if (fromDate) {
        params.append("from_date", fromDate);
      }
      if (toDate) {
        params.append("to_date", toDate);
      }
      
      const endpoint = `/api/holdings/transactions${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(`http://localhost:3001${endpoint}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch transactions data for printing");
      }

      const transactionsData = await response.json();
      const transactionsArray = Array.isArray(transactionsData) ? transactionsData : [];
      
      // Generate HTML content for printing
      const generateHTML = () => {
        const partyInfo = selectedParty !== "all" 
          ? parties.find(p => p.id === selectedParty) 
          : null;
        
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Equity Transaction History Print</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; border-bottom: 2px solid #333; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-mono { font-family: monospace; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>EQUITY TRANSACTION HISTORY</h1>
              ${partyInfo ? `<p>Party: ${partyInfo.party_code} - ${partyInfo.name}</p>` : '<p>All Parties</p>'}
              <p>Print Date: ${new Date().toLocaleString('en-IN')}</p>
              ${fromDate || toDate ? `<p>Date Range: ${fromDate ? new Date(fromDate).toLocaleDateString('en-IN') : 'All'} to ${toDate ? new Date(toDate).toLocaleDateString('en-IN') : 'All'}</p>` : ''}
            </div>
            
            <div class="section-title">TRANSACTION HISTORY</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Stock</th>
                  <th>Type</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Amount</th>
                  <th class="text-right">Brokerage</th>
                  <th>Bill No</th>
                </tr>
              </thead>
              <tbody>
                ${transactionsArray.map(txn => `
                  <tr>
                    <td>${new Date(txn.bill_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div class="font-medium">${txn.party_code}</div>
                      <div style="font-size: 10px; color: #666;">${txn.party_name}</div>
                    </td>
                    <td class="font-medium">${txn.company_code}</td>
                    <td>
                      <span style="padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; 
                        background-color: ${txn.type === 'BUY' ? '#d1fad1' : txn.type === 'SELL' ? '#ffd1d1' : '#f0f0f0'}; 
                        color: ${txn.type === 'BUY' ? '#006400' : txn.type === 'SELL' ? '#8b0000' : '#333'}">
                        ${txn.type}
                      </span>
                    </td>
                    <td class="text-right font-mono">${Number(txn.quantity || 0).toLocaleString()}</td>
                    <td class="text-right font-mono">₹${Number(txn.rate || 0).toFixed(2)}</td>
                    <td class="text-right font-mono">₹${Number(txn.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td class="text-right font-mono">₹${Number(txn.brokerage_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td class="font-mono">${txn.bill_number}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: center;" class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                Print
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Close
              </button>
            </div>
          </body>
          </html>
        `;
      };
      
      // Open in new browser tab
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(generateHTML());
        newTab.document.close();
        newTab.focus();
        // Auto-print after content loads
        newTab.onload = () => {
          setTimeout(() => {
            newTab.print();
          }, 1000);
        };
      }
      
    } catch (error) {
      console.error("Error preparing transactions print data:", error);
      toast({
        title: "Error",
        description: "Failed to prepare transactions data for printing",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactionPrint(false);
    }
  };

  // Calculate total portfolio value and P&L (simplified - would need current prices)
  const calculateTotals = () => {
    const longPositions = holdings.filter(h => h.quantity > 0);
    const shortPositions = holdings.filter(h => h.quantity < 0);
    const totalInvested = longPositions.reduce((sum, h) => sum + Number(h.total_invested), 0);
    const totalQuantity = longPositions.reduce((sum, h) => sum + Number(h.quantity), 0);
    const shortQuantity = Math.abs(shortPositions.reduce((sum, h) => sum + Number(h.quantity), 0));
    return { 
      totalInvested, 
      totalQuantity, 
      shortQuantity,
      longCount: longPositions.length,
      shortCount: shortPositions.length,
    };
  };

  const totals = useMemo(() => calculateTotals(), [holdings]);
  
  // Separate long, short, and closed positions
  const longPositions = holdings.filter(h => h.quantity > 0);
  const shortPositions = holdings.filter(h => h.quantity < 0);
  const closedPositions = holdings.filter(h => h.quantity === 0);

  // Group long positions by party
  const longPositionsByParty = longPositions.reduce((acc, holding) => {
    const partyName = holding.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(holding);
    return acc;
  }, {} as Record<string, Holding[]>);
  
  // Group short positions by party
  const shortPositionsByParty = shortPositions.reduce((acc, holding) => {
    const partyName = holding.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(holding);
    return acc;
  }, {} as Record<string, Holding[]>);
  
  // Group closed positions by party
  const closedPositionsByParty = closedPositions.reduce((acc, holding) => {
    const partyName = holding.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(holding);
    return acc;
  }, {} as Record<string, Holding[]>);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Stock Holdings"
        description="Track delivery positions and client portfolios"
      />

      <div className="p-6 space-y-6">
        {/* Filter Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between gap-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filter by Client</label>
              <Select value={selectedParty} onValueChange={setSelectedParty}>
                <SelectTrigger className="w-72 h-10 bg-white border-gray-300 shadow-sm">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.party_code} - {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right bg-white rounded-lg px-10 py-5 shadow-sm border border-green-200 min-w-[300px]">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Invested</p>
              <p className="text-3xl font-bold text-green-600 tabular-nums">
                ₹{totals.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs: Holdings, Broker Holdings and Transaction History */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="holdings" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Current Holdings
            </TabsTrigger>
            <TabsTrigger value="broker" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Broker Holdings
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Transaction History
            </TabsTrigger>
          </TabsList>

          {/* Current Holdings Tab */}
          <TabsContent value="holdings" className="space-y-6">
            {/* Date Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="holdings-from-date" className="text-xs font-semibold uppercase tracking-wide">
                  From Date
                </Label>
                <Input
                  id="holdings-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holdings-to-date" className="text-xs font-semibold uppercase tracking-wide">
                  To Date
                </Label>
                <Input
                  id="holdings-to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={fetchHoldings} disabled={isLoading}>
                  {isLoading ? "Loading..." : "Apply Filters"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setTimeout(() => fetchHoldings(), 0);
                  }}
                  disabled={isLoading}
                >
                  Reset
                </Button>
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Long Positions</p>
                      <h3 className="text-2xl font-bold">{totals.longCount}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Open Positions
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Long Quantity</p>
                      <h3 className="text-2xl font-bold text-green-600">{totals.totalQuantity.toLocaleString()}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Shares held (long)
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Short Quantity</p>
                      <h3 className="text-2xl font-bold text-red-600">
                        {totals.shortQuantity.toLocaleString()}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Shares sold short
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Long Positions Table */}
            <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Long Positions (Buy)</CardTitle>
              <Button 
                onClick={handlePrintPositions}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isLoadingPrint}
              >
                <Printer className="w-4 h-4" />
                {isLoadingPrint ? "Preparing Print..." : "Print Positions"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading holdings...
              </div>
            ) : longPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No long positions found.
              </div>
            ) : (
              <div className="space-y-6">
                {selectedParty === "all" ? (
                  // Group by party when showing all
                  Object.entries(longPositionsByParty).map(([partyName, partyHoldings]) => {
                    const partyTotalInvested = partyHoldings.reduce((sum, h) => sum + Number(h.total_invested), 0);
                    return (
                    <div key={partyName} className="space-y-2">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-sm font-semibold text-primary">
                          {partyName}
                        </h3>
                        <span className="text-sm font-bold text-green-600">
                          Total Invested: ₹{partyTotalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Stock</TableHead>
                              <TableHead>Client Name</TableHead>
                              <TableHead>NSE Code</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Invested</TableHead>
                              <TableHead>Last Trade</TableHead>
                              <TableHead>Brokers</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partyHoldings.map((holding) => (
                              <TableRow key={holding.id}>
                                <TableCell>
                                  <div className="font-medium">{holding.company_code}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {holding.company_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{holding.party_code}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {holding.party_name}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {holding.nse_code || "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {Number(holding.quantity).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  ₹{Number(holding.avg_buy_price).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  ₹{Number(holding.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {holding.broker_qty_breakdown
                                    ? holding.broker_qty_breakdown
                                    : (holding.broker_codes || '-')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  // Single table for specific party
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Stock</TableHead>
                          <TableHead>Client Name</TableHead>
                          <TableHead>NSE Code</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Price</TableHead>
                          <TableHead className="text-right">Total Invested</TableHead>
                          <TableHead>Last Trade</TableHead>
                          <TableHead>Brokers</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {longPositions.map((holding) => (
                          <TableRow key={holding.id}>
                            <TableCell>
                              <div className="font-medium">{holding.company_code}</div>
                              <div className="text-sm text-muted-foreground">
                                {holding.company_name || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{holding.party_name || holding.party_code}</div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {holding.nse_code || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {Number(holding.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{Number(holding.avg_buy_price).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{Number(holding.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {holding.broker_qty_breakdown
                                ? holding.broker_qty_breakdown
                                : (holding.broker_codes || '-')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

            {/* Short Positions Table */}
            {shortPositions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Short Positions (Sell)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedParty === "all" ? (
                      // Group by party when showing all
                      Object.entries(shortPositionsByParty).map(([partyName, partyHoldings]) => (
                        <div key={partyName} className="space-y-2">
                          <h3 className="text-sm font-semibold text-primary border-b pb-2">
                            {partyName}
                          </h3>
                          <div className="rounded-lg border border-red-200">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-red-50">
                                  <TableHead>Stock</TableHead>
                                  <TableHead>Client Name</TableHead>
                                  <TableHead>NSE Code</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Avg Price</TableHead>
                                  <TableHead className="text-right">Total Value</TableHead>
                                  <TableHead>Last Trade</TableHead>
                                  <TableHead>Brokers</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {partyHoldings.map((holding) => {
                                  const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_buy_price);
                                  return (
                                    <TableRow key={holding.id} className="bg-red-50/30">
                                      <TableCell>
                                        <div className="font-medium">{holding.company_code}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {holding.company_name || "-"}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium">{holding.party_code}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {holding.party_name}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-mono text-sm">
                                        {holding.nse_code || "-"}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-red-600 font-bold">
                                        {Number(holding.quantity).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right font-mono">
                                        ₹{Number(holding.avg_buy_price).toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-right font-mono font-medium text-red-600">
                                        ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {holding.broker_codes || '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Single table for specific party
                      <div className="rounded-lg border border-red-200">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-red-50">
                              <TableHead>Stock</TableHead>
                              <TableHead>Client Name</TableHead>
                              <TableHead>NSE Code</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Value</TableHead>
                              <TableHead>Last Trade</TableHead>
                              <TableHead>Brokers</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shortPositions.map((holding) => {
                              const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_buy_price);
                              return (
                                <TableRow key={holding.id} className="bg-red-50/30">
                                  <TableCell>
                                    <div className="font-medium">{holding.company_code}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {holding.company_name || "-"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{holding.party_name || holding.party_code}</div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {holding.nse_code || "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-red-600 font-bold">
                                    {Number(holding.quantity).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    ₹{Number(holding.avg_buy_price).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-medium text-red-600">
                                    ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {holding.broker_codes || '-'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Closed Positions Table */}
            {closedPositions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-600">Closed Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedParty === "all" ? (
                      // Group by party when showing all
                      Object.entries(closedPositionsByParty).map(([partyName, partyHoldings]) => (
                        <div key={partyName} className="space-y-2">
                          <h3 className="text-sm font-semibold text-primary border-b pb-2">
                            {partyName}
                          </h3>
                          <div className="rounded-lg border border-gray-200">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50">
                                  <TableHead>Stock</TableHead>
                                  <TableHead>Client Name</TableHead>
                                  <TableHead>NSE Code</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Avg Price</TableHead>
                                  <TableHead className="text-right">Total Invested</TableHead>
                                  <TableHead>Last Trade</TableHead>
                                  <TableHead>Brokers</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {partyHoldings.map((holding) => (
                                  <TableRow key={holding.id} className="bg-gray-50/30">
                                    <TableCell>
                                      <div className="font-medium">{holding.company_code}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {holding.company_name}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">{holding.party_code}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {holding.party_name}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {holding.nse_code || "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {Number(holding.quantity).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      ₹{Number(holding.avg_buy_price).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium">
                                      ₹{Number(holding.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {holding.broker_codes || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Single table for specific party
                      <div className="rounded-lg border border-gray-200">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead>Stock</TableHead>
                              <TableHead>Client Name</TableHead>
                              <TableHead>NSE Code</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Invested</TableHead>
                              <TableHead>Last Trade</TableHead>
                              <TableHead>Brokers</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {closedPositions.map((holding) => (
                              <TableRow key={holding.id} className="bg-gray-50/30">
                                <TableCell>
                                  <div className="font-medium">{holding.company_code}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {holding.company_name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{holding.party_name || holding.party_code}</div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {holding.nse_code || "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {Number(holding.quantity).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  ₹{Number(holding.avg_buy_price).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  ₹{Number(holding.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {holding.broker_codes || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Broker Holdings Tab */}
          <TabsContent value="broker" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Broker Holdings Summary</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      View holdings aggregated by broker across all clients
                    </p>
                  </div>
                  <Button 
                    onClick={handlePrintBrokerHoldings}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isLoadingBrokerPrint}
                  >
                    <Printer className="w-4 h-4" />
                    {isLoadingBrokerPrint ? "Preparing Print..." : "Print Broker Holdings"}
                  </Button>
                </div>
              </CardHeader>
              
              {/* Date Filters */}
              <div className="px-6 pb-4 flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label htmlFor="broker-holdings-from-date" className="text-xs font-semibold uppercase tracking-wide">
                    From Date
                  </Label>
                  <Input
                    id="broker-holdings-from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="broker-holdings-to-date" className="text-xs font-semibold uppercase tracking-wide">
                    To Date
                  </Label>
                  <Input
                    id="broker-holdings-to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={fetchBrokerHoldings} disabled={isLoadingBrokerHoldings}>
                    {isLoadingBrokerHoldings ? "Loading..." : "Apply Filters"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setTimeout(() => fetchBrokerHoldings(), 0);
                    }}
                    disabled={isLoadingBrokerHoldings}
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <CardContent>
                {isLoadingBrokerHoldings ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading broker holdings...
                  </div>
                ) : brokerHoldings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No broker holdings found.
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Broker</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>NSE Code</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Price</TableHead>
                          <TableHead className="text-right">Total Invested</TableHead>
                          <TableHead className="text-right">Clients</TableHead>
                          <TableHead>Last Trade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {brokerHoldings.map((holding, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="font-medium">{holding.broker_code}</div>
                              <div className="text-sm text-muted-foreground">
                                {holding.broker_name || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{holding.company_code}</div>
                              <div className="text-sm text-muted-foreground">
                                {holding.company_name || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {holding.nse_code || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {Number(holding.total_quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{Number(holding.avg_price).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{Number(holding.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {holding.client_count}
                            </TableCell>
                            <TableCell className="text-sm">
                              {holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Transaction History</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Detailed history of buy/sell transactions
                    </p>
                  </div>
                  <Button 
                    onClick={handlePrintTransactions}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isLoadingTransactionPrint}
                  >
                    <Printer className="w-4 h-4" />
                    {isLoadingTransactionPrint ? "Preparing Print..." : "Print Transactions"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="from-date" className="text-xs font-semibold uppercase tracking-wide">
                      From Date
                    </Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to-date" className="text-xs font-semibold uppercase tracking-wide">
                      To Date
                    </Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={fetchTransactions} disabled={isLoadingTransactions}>
                      {isLoadingTransactions ? "Loading..." : "Apply Filters"}
                    </Button>
                  </div>
                </div>

                {isLoadingTransactions ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading transaction history...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Date</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Brokerage</TableHead>
                          <TableHead>Bill No</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="text-sm">
                              {new Date(transaction.bill_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transaction.party_code}</div>
                              <div className="text-sm text-muted-foreground">
                                {transaction.party_name}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.company_code}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.type === 'BUY' 
                                  ? 'bg-green-100 text-green-800' 
                                  : transaction.type === 'SELL' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {Number(transaction.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{Number(transaction.rate).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{Number(transaction.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{Number(transaction.brokerage_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {transaction.bill_number}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Holdings;
