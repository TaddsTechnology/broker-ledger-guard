import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText } from "lucide-react";

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
  mainBrokerBillTotal?: number; // Main broker bill amount (Net Trade + Broker Brokerage)
  notes?: string; // Add notes property
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

interface BillTemplateProps {
  billData: BillData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillTemplate({ billData, open, onOpenChange }: BillTemplateProps) {
  const printBill = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bill ${billData.billNumber}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                margin: 0; 
                background: white;
                color: black;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
              }
              .bill-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .party-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
              }
              .info-item {
                margin-bottom: 8px;
              }
              .info-label {
                font-weight: bold;
                display: inline-block;
                width: 120px;
              }
              .summary-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              .summary-table th, .summary-table td {
                border: 1px solid #333;
                padding: 8px 12px;
                text-align: left;
              }
              .summary-table th {
                background-color: #f0f0f0;
                font-weight: bold;
              }
              .transactions {
                margin-top: 30px;
              }
              .security-section {
                margin-bottom: 20px;
                border: 1px solid #ccc;
                border-radius: 5px;
                padding: 15px;
              }
              .security-header {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #2563eb;
              }
              .trades-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
              }
              .trades-table th, .trades-table td {
                border: 1px solid #ddd;
                padding: 6px 10px;
                text-align: left;
              }
              .trades-table th {
                background-color: #f8f9fa;
                font-weight: bold;
              }
              .subtotal {
                text-align: right;
                font-weight: bold;
                font-size: 16px;
                margin-top: 5px;
              }
              .footer {
                margin-top: 30px;
                border-top: 1px solid #333;
                padding-top: 15px;
                text-align: center;
                font-size: 14px;
                color: #666;
              }
              @media print {
                body {
                  padding: 10px;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="bill-title">${billData.billType === 'broker' ? 'BROKERAGE BILL' : 'TRADE BILL'}</div>
              <div>Generated on: ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="party-info">
              <div>
                <div class="info-item"><span class="info-label">Bill Number:</span> ${billData.billNumber}</div>
                <div class="info-item"><span class="info-label">File Name:</span> ${billData.fileName}</div>
                <div class="info-item"><span class="info-label">Bill Date:</span> ${billData.billDate}</div>
                ${billData.billType === 'broker' ? `<div class="info-item"><span class="info-label">Broker ID:</span> ${billData.brokerId || 'Not specified'}</div>` : ''}
              </div>
              <div>
                <div class="info-item"><span class="info-label">Party Code:</span> ${billData.partyCode}</div>
                <div class="info-item"><span class="info-label">Party Name:</span> ${billData.partyName}</div>
              </div>
            </div>
            
            <table class="summary-table">
              <thead>
                <tr>
                  <th>Summary</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${billData.billType === 'broker' ? `
                <tr>
                  <td>Total Transaction Value</td>
                  <td>${(billData.totalTransactionValue || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Delivery Amount</td>
                  <td>${billData.deliveryAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Trading Amount</td>
                  <td>${billData.tradingAmount.toFixed(2)}</td>
                </tr>
                ` : `
                <tr>
                  <td>Total Transactions</td>
                  <td>${billData.totalTransactions}</td>
                </tr>
                <tr>
                  <td>Buy Amount</td>
                  <td>${billData.buyAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Sell Amount</td>
                  <td>${billData.sellAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Delivery Amount</td>
                  <td>${billData.deliveryAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Trading Amount</td>
                  <td>${billData.tradingAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Brokerage</td>
                  <td>${((billData.deliveryBrokerageAmount || 0) + (billData.tradingBrokerageAmount || 0)).toFixed(2)}</td>
                </tr>
                `}
                <tr>
                  <td><strong>${billData.billType === 'broker' ? 'Net Payable Amount' : 'Net Amount'}</strong></td>
                  <td><strong>${(billData.netAmount || 0).toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="transactions">
              <h2>${billData.billType === 'broker' ? 'Brokerage Transactions' : 'Detailed Transactions'}</h2>
              ${billData.transactions.map(transaction => `
                <div class="security-section">
                  <div class="security-header">${transaction.security}</div>
                  <table class="trades-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Side</th>
                        <th>Quantity</th>
                        <th>Price (₹)</th>
                        <th>Amount (₹)</th>
                        <th>D/T</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${transaction.trades.map((trade, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${trade.side}</td>
                          <td>${Number(trade.quantity).toFixed(0)}</td>
                          <td>${Number(trade.price).toFixed(2)}</td>
                          <td>${Number(trade.amount).toFixed(2)}</td>
                          <td>${trade.deliveryTrading === 'D' ? 'D' : trade.deliveryTrading === 'T' ? 'T' : ''}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <div class="subtotal">
                    Subtotal: ₹${Number(transaction.subtotal).toFixed(2)}
                  </div>
                </div>
              `).join('')}
            </div>
            
            ${billData.notes ? `
            <div class="notes-section">
              <h3>Notes</h3>
              <div style="border: 1px solid #ccc; border-radius: 5px; padding: 15px; background-color: #f9f9f9; white-space: pre-wrap;">
                ${billData.notes}
              </div>
            </div>
            ` : ''}
            
            <div class="footer">
              <div>Bill Number: ${billData.billNumber}</div>
              <div>Generated on: ${new Date().toLocaleString()}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  const downloadBill = () => {
    // Create a text version of the bill
    let billText = `${billData.billType === 'broker' ? 'BROKERAGE BILL' : 'TRADE BILL'}\n`;
    billText += `${billData.billType === 'broker' ? '==============' : '=========='}\n\n`;
    
    billText += `Bill Number: ${billData.billNumber}\n`;
    billText += `File Name: ${billData.fileName}\n`;
    billText += `Bill Date: ${billData.billDate}\n`;
    if (billData.billType === 'broker') {
      billText += `Broker ID: ${billData.brokerId || 'Not specified'}\n`;
    }
    billText += `Party Code: ${billData.partyCode}\n`;
    billText += `Party Name: ${billData.partyName}\n\n`;
    
    billText += `SUMMARY\n`;
    billText += `-------\n`;
    if (billData.billType === 'broker') {
      billText += `Total Transaction Value: ₹${(billData.totalTransactionValue || 0).toFixed(2)}\n`;
      billText += `Delivery Amount: ₹${billData.deliveryAmount.toFixed(2)}\n`;
      billText += `Trading Amount: ₹${billData.tradingAmount.toFixed(2)}\n`;
    } else {
      billText += `Total Transactions: ${billData.totalTransactions}\n`;
      billText += `Buy Amount: ₹${billData.buyAmount.toFixed(2)}\n`;
      billText += `Sell Amount: ₹${billData.sellAmount.toFixed(2)}\n`;
      billText += `Delivery Amount: ₹${billData.deliveryAmount.toFixed(2)}\n`;
      billText += `Trading Amount: ₹${billData.tradingAmount.toFixed(2)}\n`;
      billText += `Brokerage: ₹${((billData.deliveryBrokerageAmount || 0) + (billData.tradingBrokerageAmount || 0)).toFixed(2)}\n`;
    }
    billText += `${billData.billType === 'broker' ? 'Net Payable Amount' : 'Net Amount'}: ₹${(billData.netAmount || 0).toFixed(2)}\n\n`;
    
    billText += `${billData.billType === 'broker' ? 'BROKERAGE TRANSACTIONS' : 'DETAILED TRANSACTIONS'}\n`;
    billText += `${billData.billType === 'broker' ? '--------------------' : '---------------------'}\n\n`;
    
    billData.transactions.forEach(transaction => {
      billText += `${transaction.security}:\n`;
      transaction.trades.forEach((trade, index) => {
        const dtLabel = trade.deliveryTrading ? ` (${trade.deliveryTrading === 'D' ? 'Delivery' : 'Trading'})` : '';
        billText += `${index + 1}. ${trade.side} ${Number(trade.quantity).toFixed(0)} units @ ₹${Number(trade.price).toFixed(2)} = ₹${Number(trade.amount).toFixed(2)}${dtLabel}\n`;
      });
      billText += `   Subtotal: ₹${Number(transaction.subtotal).toFixed(2)}\n\n`;
    });
    
    // Add notes to the text version if they exist
    if (billData.notes) {
      billText += `NOTES\n`;
      billText += `-----\n`;
      billText += `${billData.notes}\n\n`;
    }
    
    billText += `---\n`;
    billText += `Generated on: ${new Date().toLocaleString()}\n`;
    billText += `Bill Number: ${billData.billNumber}\n`;
    
    const element = document.createElement('a');
    const file = new Blob([billText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `bill-${billData.billNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {billData.billType === 'broker' ? 'Brokerage Bill Details' : 'Trade Bill Details'}
          </DialogTitle>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={printBill}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={downloadBill}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>
        
        <div className="bill-template">
          {/* Header */}
          <div className="border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-center">{billData.billType === 'broker' ? 'BROKERAGE BILL' : 'TRADE BILL'}</h1>
            <p className="text-center text-muted-foreground">Generated on: {new Date().toLocaleString()}</p>
          </div>
          
          {/* Party and Bill Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-3">Bill Information</h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-medium w-32">Bill Number:</span>
                  <span>{billData.billNumber}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-32">File Name:</span>
                  <span>{billData.fileName}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-32">Bill Date:</span>
                  <span>{billData.billDate}</span>
                </div>
                {billData.billType === 'broker' && (
                  <div className="flex">
                    <span className="font-medium w-32">Broker ID:</span>
                    <span>{billData.brokerId || 'Not specified'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Party Information</h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-medium w-32">Party Code:</span>
                  <span>{billData.partyCode}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-32">Party Name:</span>
                  <span>{billData.partyName}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary Table */}
          <div className="mb-8">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Summary</th>
                    <th className="text-right p-3 font-semibold">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {billData.billType === 'broker' ? (
                    <>
                      <tr className="border-b">
                        <td className="p-3">Total Transaction Value</td>
                        <td className="p-3 text-right">₹{(billData.totalTransactionValue || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Delivery Amount</td>
                        <td className="p-3 text-right">₹{billData.deliveryAmount.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Trading Amount</td>
                        <td className="p-3 text-right">₹{billData.tradingAmount.toFixed(2)}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr className="border-b">
                        <td className="p-3">Total Transactions</td>
                        <td className="p-3 text-right">{billData.totalTransactions}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Buy Amount</td>
                        <td className="p-3 text-right">₹{billData.buyAmount.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Sell Amount</td>
                        <td className="p-3 text-right">₹{billData.sellAmount.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Delivery Amount</td>
                        <td className="p-3 text-right">₹{billData.deliveryAmount.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Trading Amount</td>
                        <td className="p-3 text-right">₹{billData.tradingAmount.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Brokerage</td>
                        <td className="p-3 text-right">₹{((billData.deliveryBrokerageAmount || 0) + (billData.tradingBrokerageAmount || 0)).toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td className="p-3 font-semibold">
                      {billData.billType === 'broker' ? 'Net Payable Amount' : 'Net Amount'}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      ₹{(billData.netAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Detailed Transactions */}
          <div>
            <h3 className="font-semibold mb-3">{billData.billType === 'broker' ? 'Brokerage Transactions' : 'Detailed Transactions'}</h3>
            <div className="space-y-6">
              {billData.transactions.map((transaction, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-primary mb-3">{transaction.security}</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-semibold">#</th>
                          <th className="text-left p-2 font-semibold">Side</th>
                          <th className="text-left p-2 font-semibold">Quantity</th>
                          <th className="text-left p-2 font-semibold">Price (₹)</th>
                          <th className="text-right p-2 font-semibold">Amount (₹)</th>
                          <th className="text-left p-2 font-semibold">D/T</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.trades.map((trade, tradeIndex) => (
                          <tr key={tradeIndex} className="border-b">
                            <td className="p-2">{tradeIndex + 1}</td>
                            <td className="p-2">{trade.side}</td>
                            <td className="p-2">{Number(trade.quantity).toFixed(0)}</td>
                            <td className="p-2">₹{Number(trade.price).toFixed(2)}</td>
                            <td className="p-2 text-right">₹{Number(trade.amount).toFixed(2)}</td>
                            <td className="p-2">
                              {trade.deliveryTrading === 'D' ? 'D' : 
                               trade.deliveryTrading === 'T' ? 'T' : 
                               ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="text-right font-semibold mt-2">
                    Subtotal: ₹{Number(transaction.subtotal).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Notes Section */}
          {/* Hidden as per user request - Notes section is not displayed */}
          {/* {billData.notes && (
            <div className="mt-8">
              <h3 className="font-semibold mb-3">Notes</h3>
              <div className="border rounded-lg p-4 bg-muted/50 whitespace-pre-wrap">
                {billData.notes}
              </div>
            </div>
          )} */}
          
          {/* Footer */}
          <div className="border-t pt-4 mt-6 text-center text-sm text-muted-foreground">
            <div>Bill Number: {billData.billNumber}</div>
            <div>Generated on: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
