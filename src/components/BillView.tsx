import { useState, useEffect } from "react";
import { BillTemplate } from "@/components/BillTemplate";
import { billQueries } from "@/lib/database";

interface Bill {
  id: string;
  bill_number: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  bill_date: string;
  due_date: string | null;
  total_amount: number;
  paid_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  bill_type?: 'party' | 'broker';
}

interface BillData {
  billNumber: string;
  partyCode: string;
  partyName: string;
  billDate: string;
  fileName: string;
  totalTransactions: number;
  buyAmount: number;
  sellAmount: number;
  netAmount: number;
  deliveryAmount: number;
  tradingAmount: number;
  billType: 'party' | 'broker';
  brokerId?: string;
  totalTransactionValue?: number;
  brokerageRate?: number;
  deliveryBrokerageAmount?: number;
  tradingBrokerageAmount?: number;
  deliverySlab?: number;
  tradingSlab?: number;
  transactions: {
    security: string;
    trades: {
      side: string;
      quantity: number;
      price: number;
      amount: number;
      deliveryTrading?: string;
      brokerageAmount?: number;
    }[];
    subtotal: number;
    deliverySubtotal?: number;
    tradingSubtotal?: number;
    deliveryBrokerageSubtotal?: number;
    tradingBrokerageSubtotal?: number;
  }[];
}

export function BillView({ bill: propBill, billId, open, onOpenChange }: { bill?: Bill; billId?: string; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const [bill, setBill] = useState<Bill | null>(propBill || null);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setBill(propBill || null);
      setBillData(null);
      setError(null);
    }
  }, [open, propBill]);

  // Fetch bill data when dialog opens and billId changes (only if no bill was passed as prop)
  useEffect(() => {
    if (open && billId && !propBill) {
      fetchBillData();
    } else if (open && propBill) {
      // If bill was passed as prop, use it directly
      setBill(propBill);
      parseBillNotes(propBill);
    }
  }, [open, billId, propBill]);

  // Re-parse notes when propBill changes
  useEffect(() => {
    if (propBill && open) {
      setBill(propBill);
      parseBillNotes(propBill);
    }
  }, [propBill, open]);

  const fetchBillData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch bill details
      const billData = await billQueries.getById(billId!);
      
      if (billData && billData.id) {
        setBill(billData);
        // Parse the notes to extract bill data
        parseBillNotes(billData);
      } else {
        setError("Bill not found");
        setBill(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bill data:", error);
      setError("Failed to load bill details");
      setBill(null);
      setLoading(false);
    }
  };

  const parseBillNotes = (bill: Bill) => {
    if (!bill.notes) {
      // If no notes, create minimal bill data from bill fields
      const parsedBillData: BillData = {
        billNumber: bill.bill_number,
        partyCode: bill.party_code || 'Unknown',
        partyName: bill.party_name || 'Unknown Party',
        billDate: bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : new Date().toLocaleDateString(),
        fileName: 'Unknown',
        totalTransactions: 0,
        buyAmount: 0,
        sellAmount: 0,
        netAmount: bill.total_amount ? Number(bill.total_amount) : 0,
        deliveryAmount: 0,
        tradingAmount: 0,
        billType: bill.bill_type || 'party',
        deliveryBrokerageAmount: 0,
        tradingBrokerageAmount: 0,
        deliverySlab: 0,
        tradingSlab: 0,
        transactions: []
      };
      setBillData(parsedBillData);
      return;
    }

    try {
      // Parse the notes field to extract structured data
      const lines = bill.notes.split('\n');
      
      // Determine bill type from the title
      const isBrokerBill = lines[0].includes('BROKERAGE');
      const billType = isBrokerBill ? 'broker' : 'party';
      
      // Extract basic info
      const fileNameLine = lines.find(line => line.startsWith('Generated from file:'));
      const partyCodeLine = lines.find(line => line.startsWith('Party Code:'));
      const partyNameLine = lines.find(line => line.startsWith('Party Name:'));
      const billDateLine = lines.find(line => line.startsWith('Bill Date:'));
      const brokerIdLine = isBrokerBill ? lines.find(line => line.startsWith('Broker ID:')) : null;
      
      const fileName = fileNameLine ? fileNameLine.replace('Generated from file: ', '') : 'Unknown';
      const partyCode = partyCodeLine ? partyCodeLine.replace('Party Code: ', '') : 'Unknown';
      const partyName = partyNameLine ? partyNameLine.replace('Party Name: ', '') : 'Unknown';
      const billDate = billDateLine ? billDateLine.replace('Bill Date: ', '') : new Date().toLocaleDateString();
      const brokerId = brokerIdLine ? brokerIdLine.replace('Broker ID: ', '') : undefined;
      
      // Extract summary
      let totalTransactions = 0;
      let buyAmount = 0;
      let sellAmount = 0;
      let deliveryAmount = 0;
      let tradingAmount = 0;
      let netAmount = bill.total_amount ? Number(bill.total_amount) : 0;
      let totalTransactionValue = 0;
      let brokerageRate = 0;
      let deliveryBrokerageAmount = 0;
      let tradingBrokerageAmount = 0;
      let deliverySlab = 0;
      let tradingSlab = 0;
      
      if (isBrokerBill) {
        const totalValueLine = lines.find(line => line.startsWith('Total Transaction Value:'));
        const deliveryAmountLine = lines.find(line => line.startsWith('Delivery Amount:'));
        const tradingAmountLine = lines.find(line => line.startsWith('Trading Amount:'));
        const deliveryBrokerageLine = lines.find(line => line.startsWith('Delivery Brokerage:'));
        const tradingBrokerageLine = lines.find(line => line.startsWith('Trading Brokerage:'));
        const totalBrokerageLine = lines.find(line => line.startsWith('Total Brokerage Amount:'));
        const deliverySlabLine = lines.find(line => line.startsWith('Delivery Slab:'));
        const tradingSlabLine = lines.find(line => line.startsWith('Trading Slab:'));
        
        totalTransactionValue = totalValueLine ? Number(parseFloat(totalValueLine.replace('Total Transaction Value: ₹', ''))) : 0;
        deliveryAmount = deliveryAmountLine ? Number(parseFloat(deliveryAmountLine.replace('Delivery Amount: ₹', ''))) : 0;
        tradingAmount = tradingAmountLine ? Number(parseFloat(tradingAmountLine.replace('Trading Amount: ₹', ''))) : 0;
        deliveryBrokerageAmount = deliveryBrokerageLine ? Number(parseFloat(deliveryBrokerageLine.replace('Delivery Brokerage: ₹', ''))) : 0;
        tradingBrokerageAmount = tradingBrokerageLine ? Number(parseFloat(tradingBrokerageLine.replace('Trading Brokerage: ₹', ''))) : 0;
        brokerageRate = totalTransactionValue ? Number((deliveryBrokerageAmount + tradingBrokerageAmount) / totalTransactionValue) : 0;
        deliverySlab = deliverySlabLine ? Number(parseFloat(deliverySlabLine.replace('Delivery Slab: ', '').replace('%', ''))) : 0;
        tradingSlab = tradingSlabLine ? Number(parseFloat(tradingSlabLine.replace('Trading Slab: ', '').replace('%', ''))) : 0;
      } else {
        const totalTransactionsLine = lines.find(line => line.startsWith('Total Transactions:'));
        const buyAmountLine = lines.find(line => line.startsWith('Buy Amount:'));
        const sellAmountLine = lines.find(line => line.startsWith('Sell Amount:'));
        const deliveryAmountLine = lines.find(line => line.startsWith('Delivery Amount:'));
        const tradingAmountLine = lines.find(line => line.startsWith('Trading Amount:'));
        
        totalTransactions = totalTransactionsLine ? Number(parseInt(totalTransactionsLine.replace('Total Transactions: ', ''))) : 0;
        buyAmount = buyAmountLine ? Number(parseFloat(buyAmountLine.replace('Buy Amount: ₹', ''))) : 0;
        sellAmount = sellAmountLine ? Number(parseFloat(sellAmountLine.replace('Sell Amount: ₹', ''))) : 0;
        deliveryAmount = deliveryAmountLine ? Number(parseFloat(deliveryAmountLine.replace('Delivery Amount: ₹', ''))) : 0;
        tradingAmount = tradingAmountLine ? Number(parseFloat(tradingAmountLine.replace('Trading Amount: ₹', ''))) : 0;
      }
      
      // Extract transactions
      const transactionsStartIndex = lines.findIndex(line => line.includes('TRANSACTIONS'));
      const transactionsEndIndex = lines.findIndex(line => line === '---');
      
      // If we can't find the transactions section, try to find it with more flexible matching
      const startIndex = transactionsStartIndex >= 0 ? transactionsStartIndex : lines.findIndex(line => line.includes('TRANSACTIONS'));
      const endIndex = transactionsEndIndex >= 0 ? transactionsEndIndex : lines.findIndex((line, index) => index > Math.max(0, startIndex) && line.startsWith('---'));
      
      const transactionLines = startIndex >= 0 ? 
        lines.slice(startIndex + 3, endIndex > startIndex ? endIndex : lines.length) : 
        [];
      
      // Debug: Log the transaction lines to see what we're processing
      console.log('Transaction lines:', transactionLines);
      
      // Group transactions by security
      const transactions: BillData['transactions'] = [];
      let currentSecurity: string | null = null;
      let currentTrades: BillData['transactions'][0]['trades'] = [];
      let currentSubtotal = 0;
      
      transactionLines.forEach(line => {
        if (line.trim().endsWith(':') && line.trim().length > 1) {
          console.log('Found security section:', line);
          // New security section
          if (currentSecurity && currentTrades.length > 0) {
            transactions.push({
              security: currentSecurity,
              trades: currentTrades,
              subtotal: currentSubtotal
            });
          }
          
          currentSecurity = line.trim().replace(':', '');
          currentTrades = [];
          currentSubtotal = 0;
        } else if (line.trim().startsWith('   Subtotal:')) {
          // Subtotal line
          const subtotalMatch = line.trim().match(/Subtotal: ₹([\d.]+)(?: \(Delivery: ₹([\d.]+), Trading: ₹([\d.]+)(?:, Delivery Brokerage: ₹([\d.]+), Trading Brokerage: ₹([\d.]+), Total Brokerage: ₹([\d.]+))?\))?/);
          if (subtotalMatch) {
            currentSubtotal = Number(parseFloat(subtotalMatch[1]));
            // For broker bills, also extract brokerage subtotals
            if (isBrokerBill && subtotalMatch[4] && subtotalMatch[5]) {
              currentTrades.forEach(trade => {
                // Add brokerage information to trades if not already present
                if (trade.brokerageAmount === undefined) {
                  // This is a simplification - in reality, we'd need to distribute the subtotal brokerage
                  // across individual trades, but that's complex without the original calculation logic
                  trade.brokerageAmount = 0;
                }
              });
            }
          }
        } else if (line.trim().match(/^\d+\./)) {
          // Trade line
          const tradeMatch = line.trim().match(/^(\d+)\.\s+(BUY|SELL)\s+(\d+)\s+units\s+@\s+₹([\d.]+)\s+=\s+₹([\d.]+)(?:\s+\((Delivery|Trading)\))?(?:\s+\(Brokerage:\s+₹([\d.]+)\))?$/);
          
          if (tradeMatch) {
            console.log('Matched trade line:', line, 'with groups:', tradeMatch);
            currentTrades.push({
              side: tradeMatch[2],
              quantity: Number(parseInt(tradeMatch[3])),
              price: Number(parseFloat(tradeMatch[4])),
              amount: Number(parseFloat(tradeMatch[5])),
              deliveryTrading: tradeMatch[6] === 'Delivery' ? 'D' : tradeMatch[6] === 'Trading' ? 'T' : undefined,
              brokerageAmount: tradeMatch[7] ? Number(parseFloat(tradeMatch[7])) : undefined
            });
          } else {
            console.log('Failed to match trade line:', line);
          }
        }
      });
      
      // Add the last security section
      if (currentSecurity && currentTrades.length > 0) {
        console.log('Adding final security section:', currentSecurity, 'with trades:', currentTrades);
        transactions.push({
          security: currentSecurity,
          trades: currentTrades,
          subtotal: currentSubtotal
        });
      }
      
      console.log('Final transactions:', transactions);
      
      const parsedBillData: BillData = {
        billNumber: bill.bill_number,
        partyCode,
        partyName,
        billDate,
        fileName,
        totalTransactions,
        buyAmount,
        sellAmount,
        netAmount,
        deliveryAmount,
        tradingAmount,
        billType,
        brokerId,
        totalTransactionValue,
        brokerageRate,
        deliveryBrokerageAmount,
        tradingBrokerageAmount,
        deliverySlab,
        tradingSlab,
        transactions
      };
      
      console.log('Parsed bill data:', parsedBillData);
      setBillData(parsedBillData);
    } catch (error) {
      console.error("Error parsing bill notes:", error);
      // Even if parsing fails, create minimal bill data from bill fields
      const fallbackBillData: BillData = {
        billNumber: bill.bill_number,
        partyCode: bill.party_code || 'Unknown',
        partyName: bill.party_name || 'Unknown Party',
        billDate: bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : new Date().toLocaleDateString(),
        fileName: 'Unknown',
        totalTransactions: 0,
        buyAmount: 0,
        sellAmount: 0,
        netAmount: bill.total_amount ? Number(bill.total_amount) : 0,
        deliveryAmount: 0,
        tradingAmount: 0,
        billType: bill.bill_type || 'party',
        deliveryBrokerageAmount: 0,
        tradingBrokerageAmount: 0,
        deliverySlab: 0,
        tradingSlab: 0,
        transactions: []
      };
      setBillData(fallbackBillData);
    }
  };

  // If we don't have a bill, don't render anything
  if (!open || !bill) return null;

  return (
    <BillTemplate 
      billData={billData || {
        billNumber: bill.bill_number || 'Unknown',
        partyCode: bill.party_code || 'Unknown',
        partyName: bill.party_name || 'Unknown Party',
        billDate: bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : new Date().toLocaleDateString(),
        fileName: 'Unknown',
        totalTransactions: 0,
        buyAmount: 0,
        sellAmount: 0,
        netAmount: bill.total_amount ? Number(bill.total_amount) : 0,
        deliveryAmount: 0,
        tradingAmount: 0,
        billType: bill.bill_type || 'party',
        deliveryBrokerageAmount: 0,
        tradingBrokerageAmount: 0,
        deliverySlab: 0,
        tradingSlab: 0,
        transactions: []
      }} 
      open={open} 
      onOpenChange={onOpenChange} 
    />
  );
}