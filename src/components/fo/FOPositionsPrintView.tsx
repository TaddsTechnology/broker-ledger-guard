import React from "react";

interface Position {
  id: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  instrument_id: string;
  symbol: string;
  instrument_type: string;
  expiry_date?: string | null;
  strike_price?: number | null;
  quantity: number;
  avg_price: number;
  realized_pnl: number;
  unrealized_pnl: number;
  last_trade_date?: string | null;
  status: string;
  broker_codes?: string;
  broker_qty_breakdown?: string;
}

interface BrokerHolding {
  broker_code: string;
  broker_name?: string;
  nse_code?: string;
  total_quantity: number;
  avg_price: number;
  total_invested: number;
  client_count: number;
  last_trade_date: string | null;
}

interface Transaction {
  id: string;
  bill_id: string;
  bill_number: string;
  bill_date: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  description: string;
  type: string;
  quantity: number;
  rate: number;
  amount: number;
  balance: number;
  created_at: string;
}

interface FOPositionsPrintViewProps {
  clientHoldings: Position[];
  brokerHoldings: BrokerHolding[];
  transactions: Transaction[];
  selectedParty?: string;
  parties: Array<{id: string, party_code: string, name: string}>;
  printDate: string;
  dateRange?: {
    from: string;
    to: string;
  };
  section?: "positions" | "broker" | "transactions" | "all";
}

export const FOPositionsPrintView: React.FC<FOPositionsPrintViewProps> = ({
  clientHoldings,
  brokerHoldings,
  transactions,
  selectedParty,
  parties,
  printDate,
  dateRange,
  section = "all"
}) => {
  // Get party information
  const selectedPartyInfo = selectedParty && selectedParty !== "all" 
    ? parties.find(p => p.id === selectedParty)
    : null;

  // Calculate totals
  const totalClientHoldings = clientHoldings.length;
  const longPositions = clientHoldings.filter(p => p.quantity > 0);
  const shortPositions = clientHoldings.filter(p => p.quantity < 0);
  const totalLongQty = longPositions.reduce((sum, pos) => sum + Math.abs(pos.quantity), 0);
  const totalShortQty = shortPositions.reduce((sum, pos) => sum + Math.abs(pos.quantity), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Generate HTML content for printing
  const generateHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FO Positions Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            color: #333;
          }
          .header-info {
            font-size: 14px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-mono { font-family: monospace; }
          .summary-box {
            display: inline-block;
            width: 23%;
            margin: 10px;
            padding: 15px;
            border: 1px solid #333;
            text-align: center;
          }
          .summary-container {
            margin: 30px 0;
            text-align: center;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 25px 0 15px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #ccc;
            color: #333;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>
              ${section === "positions" ? "F&O CLIENT HOLDINGS REPORT" : 
                section === "broker" ? "F&O BROKER HOLDINGS REPORT" : 
                section === "transactions" ? "F&O TRANSACTION HISTORY REPORT" : 
                "F&O POSITIONS REPORT"}
            </h1>
            <div class="header-info">
              ${selectedPartyInfo ? 
                `Client: <strong>${selectedPartyInfo.party_code}</strong> - ${selectedPartyInfo.name}` : 
                "<strong>All Clients Summary</strong>"
              }
            </div>
            <div class="header-info">
              ${dateRange ? 
                `Date Range: ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}` : 
                "Current Positions & Transactions"
              }
            </div>
            <div class="header-info">Report Generated: ${printDate}</div>
          </div>
          
          ${(section === "all" || section === "positions") ? `
            <div class="summary-container">
              <div class="summary-box">
                <div style="font-weight: bold; margin-bottom: 10px;">Total Holdings</div>
                <div style="font-size: 18px; font-weight: bold;">${totalClientHoldings}</div>
              </div>
              <div class="summary-box">
                <div style="font-weight: bold; margin-bottom: 10px;">Long Positions</div>
                <div style="font-size: 18px; color: #008000; font-weight: bold;">${longPositions.length}</div>
                <div style="font-size: 12px; color: #008000;">${totalLongQty.toLocaleString()} qty</div>
              </div>
              <div class="summary-box">
                <div style="font-weight: bold; margin-bottom: 10px;">Short Positions</div>
                <div style="font-size: 18px; color: #ff0000; font-weight: bold;">${shortPositions.length}</div>
                <div style="font-size: 12px; color: #ff0000;">${totalShortQty.toLocaleString()} qty</div>
              </div>
              ${(section === "all") ? `
                <div class="summary-box">
                  <div style="font-weight: bold; margin-bottom: 10px;">Transactions</div>
                  <div style="font-size: 18px; color: #800080; font-weight: bold;">${transactions.length}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          ${(section === "transactions" && transactions.length > 0) ? `
            <div class="summary-container">
              <div class="summary-box">
                <div style="font-weight: bold; margin-bottom: 10px;">Total Transactions</div>
                <div style="font-size: 18px; color: #800080; font-weight: bold;">${transactions.length}</div>
              </div>
            </div>
          ` : ''}
          
          ${(section === "broker" && brokerHoldings.length > 0) ? `
            <div class="summary-container">
              <div class="summary-box">
                <div style="font-weight: bold; margin-bottom: 10px;">Total Brokers</div>
                <div style="font-size: 18px; color: #4B0082; font-weight: bold;">${brokerHoldings.length}</div>
              </div>
            </div>
          ` : ''}
          
          ${(section === "positions" || section === "all") && clientHoldings.length > 0 ? `
            <div class="section-title">CLIENT HOLDINGS</div>
            <table>
              <thead>
                <tr>
                  <th>Instrument</th>
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
                ${clientHoldings.map(holding => {
                  const qty = Number(holding.quantity || 0);
                  const avgPrice = Number(holding.avg_price || 0);
                  const marketValue = Math.abs(qty) * avgPrice;
                  const pnl = Number(holding.unrealized_pnl || 0);
                  const isLong = holding.quantity > 0;
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
                        <span style="padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; 
                          background-color: ${isLong ? '#d1fad1' : '#ffd1d1'}; 
                          color: ${isLong ? '#006400' : '#8b0000'}">
                          ${isLong ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td class="text-right font-mono" style="color: ${isLong ? '#008000' : '#ff0000'}; font-weight: bold;">
                        ${isLong ? '+' : ''}${Number(holding.quantity || 0).toLocaleString()}
                      </td>
                      <td class="text-right font-mono">₹${Number(holding.avg_price || 0).toFixed(2)}</td>
                      <td class="text-right font-mono">₹${Number(marketValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td class="text-right font-mono" style="color: ${pnl > 0 ? '#008000' : pnl < 0 ? '#ff0000' : '#666'}; font-weight: bold;">
                        ${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td>${holding.last_trade_date ? formatDate(holding.last_trade_date) : '-'}</td>
                      <td style="word-break: break-word;">${holding.broker_codes || '-'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${(section === "broker" || section === "all") && brokerHoldings.length > 0 ? `
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
                ${brokerHoldings.map(holding => `
                  <tr>
                    <td>
                      <div><strong>${holding.broker_code}</strong></div>
                      ${holding.broker_name ? `<div style="font-size: 10px; color: #666;">${holding.broker_name}</div>` : ''}
                    </td>
                    <td class="text-center">${holding.client_count}</td>
                    <td class="text-right font-mono">${Number(holding.total_quantity || 0).toLocaleString()}</td>
                    <td class="text-right font-mono">₹${Number(holding.avg_price || 0).toFixed(2)}</td>
                    <td class="text-right font-mono">₹${Number(holding.total_invested || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>${holding.last_trade_date ? formatDate(holding.last_trade_date) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${(section === "transactions" || section === "all") && transactions.length > 0 ? `
            <div class="section-title">TRANSACTION HISTORY</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill No</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Amount</th>
                  <th class="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map(txn => `
                  <tr>
                    <td>${formatDate(txn.bill_date)}</td>
                    <td class="font-mono">${txn.bill_number}</td>
                    <td style="word-break: break-word;">${txn.description}</td>
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
          ` : ''}
          
          <div style="margin-top: 30px; text-align: center;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
              Print
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Close
            </button>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Open in new browser tab
  const openInNewTab = () => {
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
    } else {
      // Fallback if popup blocker prevents new tab
      console.log("Popup blocker detected, trying alternative method");
      const fallbackWindow = window.open('', '_blank');
      if (fallbackWindow) {
        fallbackWindow.document.write(generateHTML());
        fallbackWindow.document.close();
        fallbackWindow.focus();
        setTimeout(() => {
          fallbackWindow.print();
        }, 500);
      }
    }
  };

  // Trigger print when component mounts
  React.useEffect(() => {
    openInNewTab();
  }, []);

  // Return null since we're opening in new tab
  return null;
};