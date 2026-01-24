import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface LedgerEntry {
  id: string;
  party_id: string;
  party_code?: string;
  party_name?: string;
  entry_date: string;
  particulars: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  created_at: string;
  bill_number?: string;
  bill_id?: string;
  reference_type?: string;
}

interface Party {
  id: string;
  party_code: string;
  name: string;
}

interface FOLedgerPrintViewProps {
  ledgerEntries: LedgerEntry[];
  selectedPartyId?: string;
  parties: Party[];
  selectedBrokerId?: string;
  printDate: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const FOLedgerPrintView: React.FC<FOLedgerPrintViewProps> = ({
  ledgerEntries,
  selectedPartyId,
  parties,
  selectedBrokerId,
  printDate,
  open,
  onOpenChange
}) => {
  // Don't render if modal mode is used and not open
  if (open !== undefined && !open) return null;
  
  // If no modal props provided, auto-trigger print
  const isDirectMode = open === undefined && onOpenChange === undefined;

  // Get party information for header
  const selectedParty = selectedPartyId && selectedPartyId !== "all" 
    ? parties.find(p => p.id === selectedPartyId)
    : null;

  // Calculate totals and running balance
  const totalDebit = ledgerEntries.reduce((sum, entry) => sum + Number(entry.debit_amount), 0);
  const totalCredit = ledgerEntries.reduce((sum, entry) => sum + Number(entry.credit_amount), 0);
  
  // Calculate running balance properly for F&O ledger
  let runningBalance = 0;
  const entriesWithBalance = ledgerEntries.map(entry => {
    const debit = Number(entry.debit_amount) || 0;
    const credit = Number(entry.credit_amount) || 0;
    // In F&O ledger accounting:
    // - Debit entries (bills, expenses) increase what party owes → ADD to balance
    // - Credit entries (payments, receipts) decrease what party owes → SUBTRACT from balance
    runningBalance = runningBalance + debit - credit;
    return {
      ...entry,
      calculated_balance: runningBalance
    };
  });
  
  const closingBalance = entriesWithBalance.length > 0 ? entriesWithBalance[entriesWithBalance.length - 1].calculated_balance : 0;

  // Handle print action - open in new window
  const handlePrint = () => {
    // Create HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>F&O Ledger Print</title>
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
          .party-code { font-weight: bold; font-size: 11px; }
          .party-name { font-size: 9px; color: #666; }
          .summary-box { 
            display: inline-block; 
            width: 30%; 
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
          <h1>F&O LEDGER WITH BILL DETAILS</h1>
          ${selectedParty ? 
            `<div class="header-info">Party: <strong>${selectedParty.party_code}</strong> - ${selectedParty.name}</div>` : 
            '<div class="header-info"><strong>All Parties</strong> - Consolidated Ledger</div>'
          }
          <div class="header-info">Print Date: ${printDate}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Party</th>
              <th>Particulars</th>
              <th class="text-right">Debit (₹)</th>
              <th class="text-right">Credit (₹)</th>
              <th class="text-right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${entriesWithBalance.map(entry => `
              <tr>
                <td>${new Date(entry.entry_date).toLocaleDateString('en-IN')}</td>
                <td>
                  ${entry.party_code ? 
                    `<div class="font-medium">${entry.party_code}</div>
                     <div style="font-size: 10px; color: #666;">${entry.party_name || 'Unknown Party'}</div>` : 
                    '<div class="font-medium">-</div>'
                  }
                </td>
                <td>
                  <div>${entry.particulars}</div>
                  ${entry.bill_number ? `<div style="font-size: 10px; color: #0066cc;">Bill: ${entry.bill_number}</div>` : ''}
                  ${entry.reference_type ? `<div style="font-size: 9px; color: #888;">Type: ${entry.reference_type}</div>` : ''}
                </td>
                <td class="text-right font-mono">${Number(entry.debit_amount) > 0 ? Number(entry.debit_amount).toFixed(2) : '-'}</td>
                <td class="text-right font-mono">${Number(entry.credit_amount) > 0 ? Number(entry.credit_amount).toFixed(2) : '-'}</td>
                <td class="text-right font-mono" style="color: ${Number(entry.calculated_balance) >= 0 ? '#008000' : '#ff0000'}; font-weight: bold;">
                  ${Number(entry.calculated_balance).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
          ${ledgerEntries.length > 0 ? `
            <tfoot>
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td>Total</td>
                <td></td>
                <td class="text-right font-mono">${totalDebit.toFixed(2)}</td>
                <td class="text-right font-mono">${totalCredit.toFixed(2)}</td>
                <td class="text-right font-mono" style="color: ${closingBalance >= 0 ? '#008000' : '#ff0000'};">
                  ${closingBalance.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          ` : ''}
        </table>
        
        <div class="summary-container">
          <div class="summary-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Total Debit</div>
            <div style="font-size: 18px; color: #ff0000; font-weight: bold;">₹${totalDebit.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Total Credit</div>
            <div style="font-size: 18px; color: #008000; font-weight: bold;">₹${totalCredit.toFixed(2)}</div>
          </div>
          <div class="summary-box">
            <div style="font-weight: bold; margin-bottom: 10px;">Closing Balance</div>
            <div style="font-size: 18px; font-weight: bold; color: ${closingBalance >= 0 ? '#008000' : '#ff0000'};">₹${closingBalance.toFixed(2)}</div>
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
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Auto-trigger print when component mounts
  React.useEffect(() => {
    if (isDirectMode) {
      // Direct mode - trigger print immediately
      handlePrint();
      return;
    }
    
    if (open) {
      handlePrint();
      // Close the modal after opening print window
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  }, [open, isDirectMode]);



  // Return null since we're opening in new window
  return null;
};