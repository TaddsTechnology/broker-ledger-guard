import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOPositionsPrintView } from "@/components/fo/FOPositionsPrintView";
import { TrendingUp, TrendingDown, Package, History, Users, Printer, Download } from "lucide-react";

interface Party {
  id: string;
  party_code: string;
  name: string;
}

interface Broker {
  id: string;
  broker_code: string;
  name: string;
}

interface Position {
  id: string;
  party_id: string;
  instrument_id: string;
  quantity: number;
  avg_price: number;
  realized_pnl: number;
  unrealized_pnl: number;
  last_trade_date?: string | null;
  status: string;
  party_code?: string;
  party_name?: string;
  symbol: string;
  instrument_type: string;
  expiry_date: string;
  strike_price: number | null;
  display_name: string;
  lot_size: number;
  broker_codes?: string | null;
  broker_qty_breakdown?: string | null; // e.g. "4622:70, 5001:-30"
}

interface Transaction {
  id: string;
  bill_id: string;
  bill_number: string;
  bill_date: string;
  party_id: string;
  party_code: string;
  party_name: string;
  instrument_id: string;
  symbol: string;
  display_name: string;
  instrument_type: string;
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

const FOHoldings = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [selectedBroker, setSelectedBroker] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [brokerHoldings, setBrokerHoldings] = useState<any[]>([]);
  const [isLoadingBrokerHoldings, setIsLoadingBrokerHoldings] = useState(false);
  const [activeTab, setActiveTab] = useState("positions");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [confirmationStep, setConfirmationStep] = useState(0); // 0 = not started, 1-3 = confirmation steps
  const { toast } = useToast();

  // Helper function to format instrument name like NIFTY25OCT24800PE
  const formatInstrumentName = (holding: Position): string => {
    if (!holding.expiry_date) {
      return holding.symbol; // For stocks without expiry
    }
    
    const expiry = new Date(holding.expiry_date);
    const day = expiry.getDate().toString().padStart(2, '0');
    const monthMap = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthMap[expiry.getMonth()];
    
    let displayName = `${holding.symbol}${day}${month}`;
    
    if (holding.strike_price) {
      // Convert to integer to remove decimals
      displayName += Math.round(Number(holding.strike_price)).toString();
    }
    
    if (holding.instrument_type === 'CE' || holding.instrument_type === 'PE') {
      displayName += holding.instrument_type;
    }
    
    return displayName;
  };

  // Handle print functionality for Current Positions
  const handlePrintPositions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch positions data
      const response = await fetch(`http://localhost:3001/api/fo/positions${selectedParty && selectedParty !== "all" ? `?party_id=${selectedParty}` : ""}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch positions data for printing");
      }

      const positionsData = await response.json();
      const positionsArray = Array.isArray(positionsData) ? positionsData : [];
      
      // Generate HTML content for printing
      const generateHTML = () => {
        const partyInfo = selectedParty !== "all" 
          ? parties.find(p => p.id === selectedParty) 
          : null;
        
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>F&O Positions Print</title>
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
              <h1>F&O CURRENT POSITIONS</h1>
              ${partyInfo ? `<p>Party: ${partyInfo.party_code} - ${partyInfo.name}</p>` : '<p>All Parties</p>'}
              <p>Print Date: ${new Date().toLocaleString('en-IN')}</p>
            </div>
            
            <div class="section-title">POSITIONS DETAIL</div>
            <table>
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Party</th>
                  <th>Type</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Avg Price</th>
                  <th class="text-right">Market Value</th>
                  <th class="text-right">P&L</th>
                  <th>Last Trade</th>
                  <th>Brokers</th>
                </tr>
              </thead>
              <tbody>
                ${positionsArray.map(holding => {
                  const qty = Number(holding.quantity || 0);
                  const avgPrice = Number(holding.avg_price || 0);
                  const marketValue = Math.abs(qty) * avgPrice;
                  const pnl = Number(holding.unrealized_pnl || 0);
                  const isLong = qty > 0;
                  return `
                    <tr>
                      <td>
                        <div><strong>${holding.symbol}</strong></div>
                        <div style="font-size: 10px; color: #666;">
                          ${holding.instrument_type} ${holding.strike_price ? `@${holding.strike_price}` : ''}
                          ${holding.expiry_date ? ` (${new Date(holding.expiry_date).toLocaleDateString()})` : ''}
                        </div>
                      </td>
                      <td>
                        <div>${holding.party_name || '-'}</div>
                        <div style="font-size: 10px; color: #666;">
                          ${holding.party_code || ''}
                        </div>
                      </td>
                      <td>
                        <span style="padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; 
                          background-color: ${isLong ? '#d1fad1' : '#ffd1d1'}; 
                          color: ${isLong ? '#006400' : '#8b0000'}">
                          ${isLong ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td class="text-right font-mono" style="color: ${isLong ? '#008000' : '#ff0000'}; font-weight: bold;">
                        ${isLong ? '+' : ''}${Number(qty).toLocaleString()}
                      </td>
                      <td class="text-right font-mono">₹${Number(avgPrice).toFixed(2)}</td>
                      <td class="text-right font-mono">₹${Number(marketValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td class="text-right font-mono" style="color: ${pnl > 0 ? '#008000' : pnl < 0 ? '#ff0000' : '#666'}; font-weight: bold;">
                        ${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td>${holding.last_trade_date ? new Date(holding.last_trade_date).toLocaleDateString() : '-'}</td>
                      <td style="word-break: break-word;">${holding.broker_codes || '-'}</td>
                    </tr>
                  `;
                }).join('')}
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
      console.error("Error preparing positions print data:", error);
      toast({
        title: "Error",
        description: "Failed to prepare positions data for printing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle print functionality for Broker Holdings
  const handlePrintBrokerHoldings = async () => {
    try {
      setIsLoadingBrokerHoldings(true);
      
      // Fetch broker holdings data
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (selectedBroker && selectedBroker !== "all") {
        const broker = brokers.find(b => b.id === selectedBroker);
        if (broker) {
          params.append('broker_code', broker.broker_code);
        }
      }
      
      const queryString = params.toString();
      const endpoint = `/api/fo/positions/broker${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch broker holdings data for printing");
      }

      const brokerHoldingsData = await response.json();
      const brokerHoldingsArray = Array.isArray(brokerHoldingsData) ? brokerHoldingsData : [];
      
      // Generate HTML content for printing
      const generateHTML = () => {
        const brokerInfo = selectedBroker !== "all" 
          ? brokers.find(b => b.id === selectedBroker) 
          : null;
        
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>F&O Broker Holdings Print</title>
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
              <h1>F&O BROKER HOLDINGS</h1>
              ${brokerInfo ? `<p>Broker: ${brokerInfo.broker_code} - ${brokerInfo.name}</p>` : '<p>All Brokers</p>'}
              <p>Print Date: ${new Date().toLocaleString('en-IN')}</p>
              ${fromDate || toDate ? `<p>Date Range: ${fromDate ? new Date(fromDate).toLocaleDateString('en-IN') : 'All'} to ${toDate ? new Date(toDate).toLocaleDateString('en-IN') : 'All'}</p>` : ''}
            </div>
            
            <div class="section-title">BROKER HOLDINGS SUMMARY</div>
            <table>
              <thead>
                <tr>
                  <th>Broker Code</th>
                  <th>Clients</th>
                  <th class="text-right">Total Qty</th>
                  <th class="text-right">Avg Price</th>
                  <th class="text-right">Investment</th>
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
                    <td class="text-center">${holding.client_count}</td>
                    <td class="text-right font-mono">${Number(holding.total_quantity || 0).toLocaleString()}</td>
                    <td class="text-right font-mono">₹${Number(holding.avg_price || 0).toFixed(2)}</td>
                    <td class="text-right font-mono">₹${Number(holding.total_invested || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
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
      setIsLoadingBrokerHoldings(false);
    }
  };

  // Handle print functionality for Transaction History
  const handlePrintTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      
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
      
      const endpoint = `/api/fo/positions/transactions${params.toString() ? `?${params.toString()}` : ""}`;
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
            <title>F&O Transaction History Print</title>
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
              <h1>F&O TRANSACTION HISTORY</h1>
              ${partyInfo ? `<p>Party: ${partyInfo.party_code} - ${partyInfo.name}</p>` : '<p>All Parties</p>'}
              <p>Print Date: ${new Date().toLocaleString('en-IN')}</p>
              ${fromDate || toDate ? `<p>Date Range: ${fromDate ? new Date(fromDate).toLocaleDateString('en-IN') : 'All'} to ${toDate ? new Date(toDate).toLocaleDateString('en-IN') : 'All'}</p>` : ''}
            </div>
            
            <div class="section-title">TRANSACTION HISTORY</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill No</th>
                  <th>Party</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Amount</th>
                  <th class="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${transactionsArray.map(txn => `
                  <tr>
                    <td>${new Date(txn.bill_date).toLocaleDateString('en-IN')}</td>
                    <td class="font-mono">${txn.bill_number}</td>
                    <td>${txn.party_name || txn.party_code || '-'}</td>
                    <td style="word-break: break-word;">${txn.symbol || txn.description}</td>
                    <td>
                      <span style="padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; 
                        background-color: ${txn.type === 'BUY' ? '#d1fad1' : txn.type === 'SELL' ? '#ffd1d1' : '#f0f0f0'}; 
                        color: ${txn.type === 'BUY' ? '#006400' : txn.type === 'SELL' ? '#8b0000' : '#333'}">
                        ${txn.type}
                      </span>
                    </td>
                    <td class="text-right font-mono">${Number(txn.quantity || 0).toLocaleString()}</td>
                    <td class="text-right font-mono">₹${Number(txn.rate || 0).toFixed(2)}</td>
                    <td class="text-right font-mono">₹${Number(txn.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td class="text-right font-mono" style="font-weight: bold; color: ${Number(txn.balance || 0) > 0 ? '#008000' : Number(txn.balance || 0) < 0 ? '#ff0000' : '#666'}">
                      ${Number(txn.balance || 0).toLocaleString()}
                    </td>
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
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchParties();
    fetchBrokers();
    fetchPositions();
  }, []);

  useEffect(() => {
    // Always fetch positions when party filter changes
    fetchPositions();
    
    // Also fetch transactions if we're on the transactions tab
    if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [selectedParty, fromDate, toDate]);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchParties = async () => {
    try {
      // Use Equity API - parties are shared between Equity and F&O
      const response = await fetch('http://localhost:3001/api/parties');
      const result = await response.json();
      setParties(result || []);
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch parties",
        variant: "destructive",
      });
    }
  };

  const fetchBrokers = async () => {
    try {
      // Use Equity API - brokers are shared between Equity and F&O
      const response = await fetch('http://localhost:3001/api/brokers');
      const result = await response.json();
      setBrokers(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch brokers",
        variant: "destructive",
      });
    }
  };

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      // Debug logging
      console.log("fetchPositions called with:", { selectedParty, fromDate, toDate });
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedParty && selectedParty !== "all") {
        params.append('party_id', selectedParty);
      }
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      const queryString = params.toString();
      const endpoint = `/api/fo/positions${queryString ? `?${queryString}` : ""}`;
      
      console.log("Making API call to:", `http://localhost:3001${endpoint}`);
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch F&O positions");
      
      const result = await response.json();
      console.log("Received positions data:", result);
      setPositions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching F&O positions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch F&O positions",
        variant: "destructive",
      });
    }
    setIsLoading(false);
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
      
      const endpoint = `/api/fo/positions/transactions${params.toString() ? `?${params.toString()}` : ""}`;
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

  const fetchBrokerHoldings = async () => {
    setIsLoadingBrokerHoldings(true);
    try {
      // Debug logging
      console.log("fetchBrokerHoldings - Selected broker ID:", selectedBroker);
      console.log("fetchBrokerHoldings - Available brokers:", brokers);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (selectedBroker && selectedBroker !== "all") {
        const broker = brokers.find(b => b.id === selectedBroker);
        console.log("fetchBrokerHoldings - Found broker:", broker);
        if (broker) {
          params.append('broker_code', broker.broker_code);
          console.log("fetchBrokerHoldings - Adding broker_code parameter:", broker.broker_code);
        } else {
          console.log("fetchBrokerHoldings - Broker not found in brokers array");
        }
      }
      
      const queryString = params.toString();
      const endpoint = `/api/fo/positions/broker${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch broker holdings");
      
      const result = await response.json();
      setBrokerHoldings(Array.isArray(result) ? result : []);
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

  useEffect(() => {
    if (activeTab === "broker") {
      fetchBrokerHoldings();
    }
  }, [activeTab, fromDate, toDate]);

  // Calculate total positions and P&L
  const calculateTotals = () => {
    const longPositions = positions.filter(p => p.quantity > 0);
    const shortPositions = positions.filter(p => p.quantity < 0);
    const totalInvested = longPositions.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.avg_price || 0)), 0);
    const totalRealizedPnl = positions.reduce((sum, p) => sum + Number(p.realized_pnl || 0), 0);
    const totalUnrealizedPnl = positions.reduce((sum, p) => sum + Number(p.unrealized_pnl || 0), 0);
    const totalQuantity = longPositions.reduce((sum, p) => sum + Number(p.quantity), 0);
    const shortQuantity = Math.abs(shortPositions.reduce((sum, p) => sum + Number(p.quantity), 0));
    return { 
      totalInvested, 
      totalQuantity, 
      shortQuantity,
      longCount: longPositions.length,
      shortCount: shortPositions.length,
      totalRealizedPnl,
      totalUnrealizedPnl,
    };
  };

  const totals = useMemo(() => calculateTotals(), [positions]);
  
  const handleClearPositions = async () => {
    try {
      // Increment confirmation step
      const newConfirmationStep = confirmationStep + 1;
      setConfirmationStep(newConfirmationStep);
      
      // If we haven't reached 3 confirmations yet, show toast and return
      if (newConfirmationStep < 3) {
        toast({
          title: `Confirmation ${newConfirmationStep}/3`,
          description: `Please click "Clear All Positions" ${3 - newConfirmationStep} more time(s) to proceed with deletion.`,
          variant: "destructive",
        });
        return; // Early return
      }
      
      // On the 3rd click, perform the actual deletion
      const response = await fetch('http://localhost:3001/api/fo/positions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: 'true' })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear positions');
      }
      
      toast({
        title: "Success",
        description: result.message || "All positions cleared successfully",
      });
      
      // Refresh positions
      fetchPositions();
    } catch (error) {
      console.error('Error clearing positions:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear positions",
        variant: "destructive",
      });
    }
    
    // Reset confirmation after deletion attempt
    setConfirmationStep(0);
  };
  
  // Separate long, short, and closed positions
  const longPositions = positions.filter(p => p.quantity > 0);
  const shortPositions = positions.filter(p => p.quantity < 0);
  const closedPositions = positions.filter(p => p.quantity === 0);

  // Group long positions by party
  const longPositionsByParty = longPositions.reduce((acc, position) => {
    const partyName = position.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(position);
    return acc;
  }, {} as Record<string, Position[]>);
  
  // Group short positions by party
  const shortPositionsByParty = shortPositions.reduce((acc, position) => {
    const partyName = position.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(position);
    return acc;
  }, {} as Record<string, Position[]>);
  
  // Group closed positions by party
  const closedPositionsByParty = closedPositions.reduce((acc, position) => {
    const partyName = position.party_name || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = [];
    }
    acc[partyName].push(position);
    return acc;
  }, {} as Record<string, Position[]>);

  // Function to download current positions as Excel
  const downloadCurrentPositions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedParty && selectedParty !== "all") {
        params.append('party_id', selectedParty);
      }
      
      const queryString = params.toString();
      const endpoint = `/api/fo/positions/export${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch current positions");
      
      const result = await response.json();
      
      // Import xlsx dynamically
      const XLSX = await import('xlsx');
      
      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(result.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Current Positions");
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `current_positions_${timestamp}.xlsx`;
      
      // Download the file
      XLSX.writeFile(wb, filename);
      
      toast({
        title: "Success",
        description: `Current positions exported successfully (${result.count} positions)`
      });
    } catch (error) {
      console.error('Error downloading current positions:', error);
      toast({
        title: "Error",
        description: "Failed to download current positions",
        variant: "destructive",
      });
    }
  };

  // Function to download reversed positions as Excel
  const downloadReversedPositions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedParty && selectedParty !== "all") {
        params.append('party_id', selectedParty);
      }
      
      const queryString = params.toString();
      const endpoint = `/api/fo/positions/export-reversed${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(`http://localhost:3001${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch reversed positions");
      
      const result = await response.json();
      
      // Import xlsx dynamically
      const XLSX = await import('xlsx');
      
      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(result.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reversed Positions");
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `reversed_positions_${timestamp}.xlsx`;
      
      // Download the file
      XLSX.writeFile(wb, filename);
      
      toast({
        title: "Success",
        description: `Reversed positions exported successfully (${result.count} trades)`
      });
    } catch (error) {
      console.error('Error downloading reversed positions:', error);
      toast({
        title: "Error",
        description: "Failed to download reversed positions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="F&O Positions"
        description="Track F&O positions, carry forward trades, and client portfolios"
      />

      <div className="p-6 space-y-6">
        {/* Action buttons section */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              onClick={downloadCurrentPositions}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Current Positions
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={downloadReversedPositions}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Download Reversed Trades
            </Button>
            
            <Button 
              onClick={handleClearPositions}
              variant="outline"
              className="flex items-center gap-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              disabled={isLoading}
            >
              Clear All Positions {confirmationStep > 0 ? `(${confirmationStep}/3)` : ''}
            </Button>
          </div>
        </div>
        {/* Filter Section */}
        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center justify-between gap-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filter by Client</label>
              <Select value={selectedParty} onValueChange={(value) => {
                console.log("Party filter changed from", selectedParty, "to", value);
                setSelectedParty(value);
              }}>
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
        
        {/* Date Filters */}
        <div className="flex flex-wrap gap-4">
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
            <Button 
              onClick={() => {
                // Trigger refresh with all current filters (party, dates)
                if (activeTab === "positions") {
                  fetchPositions();
                } else {
                  fetchTransactions();
                }
              }} 
              disabled={isLoading || isLoadingTransactions}
            >
              {isLoading || isLoadingTransactions ? "Loading..." : "Apply Filters"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFromDate("");
                setToDate("");
                // Trigger refresh after clearing filters
                setTimeout(() => {
                  if (activeTab === "positions") {
                    fetchPositions();
                  } else {
                    fetchTransactions();
                  }
                }, 0);
              }}
              disabled={isLoading || isLoadingTransactions}
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
                    Bought stocks
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

        {/* Tabs: Positions, Broker Holdings and Transaction History */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Current Positions
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

          <TabsContent value="positions" className="space-y-6">
        {/* Long Positions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Long Positions (Buy)</CardTitle>
              <Button 
                onClick={handlePrintPositions}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Printer className="w-4 h-4" />
                Print Positions
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
                    const partyTotalInvested = partyHoldings.reduce((sum, h) => sum + (Number(h.quantity) * Number(h.avg_price || 0)), 0);
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
                              <TableHead>Instrument</TableHead>
                              <TableHead className="text-right">Strike/Expiry</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Invested</TableHead>
                              <TableHead>Last Trade</TableHead>
                              <TableHead>Broker Codes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partyHoldings.map((holding) => {
                              const totalInvested = Number(holding.quantity) * Number(holding.avg_price || 0);
                              return (
                              <TableRow key={holding.id}>
                                <TableCell>
                                  <div className="font-medium text-base">{formatInstrumentName(holding)}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {holding.symbol}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {holding.strike_price ? (
                                    <div>
                                      <div className="font-semibold">₹{Number(holding.strike_price).toLocaleString()}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                                      </div>
                                    </div>
                                  ) : (
                                    holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {Number(holding.quantity).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  ₹{Number(holding.avg_price || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                              );
                            })}
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
                          <TableHead>Instrument</TableHead>
                          <TableHead className="text-right">Strike/Expiry</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Price</TableHead>
                          <TableHead className="text-right">Total Invested</TableHead>
                          <TableHead>Last Trade</TableHead>
                          <TableHead>Broker Codes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {longPositions.map((holding) => {
                          const totalInvested = Number(holding.quantity) * Number(holding.avg_price || 0);
                          return (
                          <TableRow key={holding.id}>
                            <TableCell>
                              <div className="font-medium text-base">{formatInstrumentName(holding)}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {holding.symbol}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {holding.strike_price ? (
                                <div>
                                  <div className="font-semibold">₹{Number(holding.strike_price).toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                                  </div>
                                </div>
                              ) : (
                                holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {Number(holding.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{Number(holding.avg_price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                          );
                        })}
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
                              <TableHead>Instrument</TableHead>
                              <TableHead className="text-right">Strike/Expiry</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Avg Price</TableHead>
                              <TableHead className="text-right">Total Value</TableHead>
                              <TableHead>Last Trade</TableHead>
                              <TableHead>Broker Codes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partyHoldings.map((holding) => {
                              const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_price || 0);
                              return (
                                <TableRow key={holding.id} className="bg-red-50/30">
                                  <TableCell>
                                    <div className="font-medium text-base">{formatInstrumentName(holding)}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {holding.symbol}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {holding.strike_price ? (
                                      <div>
                                        <div className="font-semibold">₹{Number(holding.strike_price).toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                                        </div>
                                      </div>
                                    ) : (
                                      holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-red-600 font-bold">
                                    {Number(holding.quantity).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    ₹{Number(holding.avg_price || 0).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-medium text-red-600">
                                    ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                          <TableHead>Instrument</TableHead>
                          <TableHead className="text-right">Strike/Expiry</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Price</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                          <TableHead>Last Trade</TableHead>
                          <TableHead>Broker Codes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shortPositions.map((holding) => {
                          const totalValue = Math.abs(Number(holding.quantity)) * Number(holding.avg_price || 0);
                          return (
                            <TableRow key={holding.id} className="bg-red-50/30">
                              <TableCell>
                                <div className="font-medium text-base">{formatInstrumentName(holding)}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {holding.symbol}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {holding.strike_price ? (
                                  <div>
                                    <div className="font-semibold">₹{Number(holding.strike_price).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                                    </div>
                                  </div>
                                ) : (
                                  holding.expiry_date ? new Date(holding.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-red-600 font-bold">
                                {Number(holding.quantity).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ₹{Number(holding.avg_price || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-red-600">
                                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                    disabled={isLoadingBrokerHoldings}
                  >
                    <Printer className="w-4 h-4" />
                    Print Broker Holdings
                  </Button>
                </div>
              </CardHeader>
              
              {/* Filters */}
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
                <div className="space-y-2">
                  <Label htmlFor="broker-filter" className="text-xs font-semibold uppercase tracking-wide">
                    Broker
                  </Label>
                  <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Brokers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brokers</SelectItem>
                      {brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.broker_code} - {broker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          <TableHead>Instrument</TableHead>
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
                              <div className="font-medium">{holding.display_name || holding.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {holding.symbol || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {Number(holding.total_quantity).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{Number(holding.avg_price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{Number(holding.total_invested || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {holding.client_count || 0}
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
            {/* Date Filter Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="fromDate" className="text-xs font-semibold uppercase">From Date</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="toDate" className="text-xs font-semibold uppercase">To Date</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={fetchTransactions}
                    className="bg-[#9333ea] hover:bg-[#7e22ce]"
                  >
                    Apply Filter
                  </Button>
                  <Button 
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setTimeout(() => fetchTransactions(), 100);
                    }}
                    variant="outline"
                  >
                    All Time
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Transaction History (Date-wise Buy/Sell)</CardTitle>
                  <Button 
                    onClick={handlePrintTransactions}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isLoadingTransactions}
                  >
                    <Printer className="w-4 h-4" />
                    Print Transactions
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Party filter inside Transactions tab */}
                <div className="flex items-end gap-4 mb-4">
                  <div className="w-64">
                    <Label htmlFor="foPartyFilter" className="text-xs font-semibold uppercase">Party</Label>
                    <Select
                      value={selectedParty}
                      onValueChange={(value) => setSelectedParty(value)}
                    >
                      <SelectTrigger id="foPartyFilter" className="mt-1 h-9">
                        <SelectValue placeholder="All Parties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Parties</SelectItem>
                        {parties.map((party) => (
                          <SelectItem key={party.id} value={party.id}>
                            {party.party_code} - {party.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          <TableHead>Bill No</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Instrument</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Running Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell className="text-sm">
                              {new Date(txn.bill_date).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs text-[#9333ea] cursor-pointer hover:underline">
                                {txn.bill_number}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div className="font-medium">{txn.party_code}</div>
                                <div className="text-muted-foreground">{txn.party_name}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              <div className="font-medium">{txn.display_name || txn.symbol}</div>
                              <div className="text-xs text-muted-foreground">{txn.symbol}</div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                txn.type === 'BUY' ? 'bg-green-100 text-green-700' : 
                                txn.type === 'SELL' ? 'bg-red-100 text-red-700' : 
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {txn.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {(txn.quantity || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              ₹{(txn.rate || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ₹{(txn.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className={`text-right font-mono font-bold ${
                              (txn.balance || 0) > 0 ? 'text-green-600' : 
                              (txn.balance || 0) < 0 ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {(txn.balance || 0).toLocaleString()}
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

export default FOHoldings;
