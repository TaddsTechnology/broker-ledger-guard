import React from 'react';
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface LedgerBillEntry {
  id: string;
  entry_date: string;
  party_code?: string;
  party_name?: string;
  particulars: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  reference_type?: string;
  reference_id?: string;
  bill_number?: string;
}

interface LedgerBillsPrintViewProps {
  ledgerEntries: LedgerBillEntry[];
  selectedPartyId?: string;
  parties: Array<{id: string, party_code: string, name: string}>;
  selectedBrokerId?: string;
  printDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LedgerBillsPrintView: React.FC<LedgerBillsPrintViewProps> = ({
  ledgerEntries,
  selectedPartyId,
  parties,
  selectedBrokerId,
  printDate,
  open,
  onOpenChange
}) => {
  // Don't render if not open
  if (!open) return null;

  // Get party information for header
  const selectedParty = selectedPartyId && selectedPartyId !== "all" && selectedPartyId !== ""
    ? parties.find(p => p.id === selectedPartyId)
    : null;

  // Handle print action - open in new window
  const handlePrint = () => {
    // Calculate totals
    const totalDebit = ledgerEntries.reduce((sum, entry) => sum + Number(entry.debit_amount || 0), 0);
    const totalCredit = ledgerEntries.reduce((sum, entry) => sum + Number(entry.credit_amount || 0), 0);
    const netBalance = totalDebit - totalCredit;

    // Create HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Equity Ledger Bills Print</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
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
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EQUITY LEDGER WITH BILL DETAILS</h1>
          <div class="header-info">
            ${selectedParty ? `Party: ${selectedParty.party_code} - ${selectedParty.name}` : 
              selectedBrokerId && selectedBrokerId !== "all" && selectedBrokerId !== "none" ? 'Broker Entries' : 'All Transactions'}
          </div>
          <div class="header-info">Print Date: ${printDate}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Party</th>
              <th>Particulars</th>
              <th class="text-right">Debit</th>
              <th class="text-right">Credit</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerEntries.map((entry, index) => `
              <tr>
                <td>${new Date(entry.entry_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}</td>
                <td>
                  <div class="font-medium">${entry.party_code || 
                    (entry.particulars.includes('Sub-Broker Profit') ? 'Sub-Broker' :
                     entry.particulars.includes('Brokerage') || entry.particulars.includes('Main Broker Payment') ? 'Main Broker' : 'N/A')}</div>
                  <div style="font-size: 10px; color: #666;">
                    ${entry.party_name || 
                      (entry.particulars.includes('Sub-Broker Profit') ? 'Profit Entry' :
                       entry.particulars.includes('Brokerage') || entry.particulars.includes('Main Broker Payment') ? 'Broker Transaction' : 'N/A')}
                  </div>
                </td>
                <td style="max-width: 200px;">
                  <div>${entry.particulars}</div>
                  ${entry.bill_number ? `<div style="font-size: 10px; color: #007bff; margin-top: 2px;">Bill: ${entry.bill_number}</div>` : ''}
                </td>
                <td class="text-right font-mono">
                  ${Number(entry.debit_amount) > 0 ? '₹' + Number(entry.debit_amount).toFixed(2) : '-'}
                </td>
                <td class="text-right font-mono">
                  ${Number(entry.credit_amount) > 0 ? '₹' + Number(entry.credit_amount).toFixed(2) : '-'}
                </td>
                <td class="text-right font-mono" style="color: ${Number(entry.balance) >= 0 ? '#008000' : '#ff0000'}; font-weight: bold;">
                  ${Number(entry.balance) >= 0 ? '+' : ''}₹${Math.abs(Number(entry.balance)).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f0f0f0; font-weight: bold;">
              <td colspan="3" class="text-right">TOTALS:</td>
              <td class="text-right font-mono">₹${totalDebit.toFixed(2)}</td>
              <td class="text-right font-mono">₹${totalCredit.toFixed(2)}</td>
              <td class="text-right font-mono">₹${netBalance.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div class="summary-container">
          <div class="summary-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Total Entries</div>
            <div style="font-size: 18px; font-weight: bold;">${ledgerEntries.length}</div>
          </div>
          <div class="summary-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Total Debit</div>
            <div style="font-size: 18px; color: #ff0000; font-weight: bold;">₹${totalDebit.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Total Credit</div>
            <div style="font-size: 18px; color: #008000; font-weight: bold;">₹${totalCredit.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Net Balance</div>
            <div style="font-size: 18px; font-weight: bold; color: ${netBalance >= 0 ? '#008000' : '#ff0000'};">
              ₹${netBalance.toFixed(2)}
            </div>
          </div>
        </div>
        
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
    
    // Open in new browser tab (not popup window)
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(printContent);
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
        fallbackWindow.document.write(printContent);
        fallbackWindow.document.close();
        fallbackWindow.focus();
        setTimeout(() => {
          fallbackWindow.print();
        }, 500);
      }
    }
  };

  // Handle close action - just close the modal and call onOpenChange
  const handleClose = () => {
    onOpenChange(false);
  };

  // Auto-trigger print when component mounts
  React.useEffect(() => {
    if (open) {
      handlePrint();
      // Close the modal after opening print window
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  }, [open]);

  // Return null since we're opening in new window
  return null;
};