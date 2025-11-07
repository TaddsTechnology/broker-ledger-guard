import React, { useState, useCallback, useRef, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Download, X, CheckCircle, AlertCircle, FileSpreadsheet, IndianRupee } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { billQueries, partyQueries, ledgerQueries, brokerQueries } from "@/lib/database";

interface Party {
  id: string;
  party_code: string;
  name: string;
  nse_code: string | null;
  trading_slab: number;
  delivery_slab: number;
}

interface Broker {
  id: string;
  broker_code: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  trading_slab: number;
  delivery_slab: number;
}

interface ProcessedFile {
  name: string;
  size: number;
  content: string[][];
  headers: string[];
  rowCount: number;
  status: 'processing' | 'completed' | 'error';
  error?: string;
  // Added for manual column functionality
  editableContent?: string[][];
  editableHeaders?: string[];
}

const Trading = () => {
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [parties, setParties] = useState<Party[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();

  // Fetch parties and brokers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch parties
        const partyResult = await partyQueries.getAll();
        setParties(partyResult || []);
        
        // Fetch brokers
        const brokerResult = await brokerQueries.getAll();
        setBrokers(brokerResult || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      }
    };
    
    fetchData();
  }, [toast]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newFiles: ProcessedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if file is TXT, CSV, or XLSX
      const isTxt = file.name.toLowerCase().endsWith('.txt');
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
      
      if (!isTxt && !isCsv && !isXlsx) {
        newFiles.push({
          name: file.name,
          size: file.size,
          content: [],
          headers: [],
          rowCount: 0,
          status: 'error',
          error: 'Only TXT, CSV, and XLSX files are supported'
        });
        continue;
      }

      try {
        let headers: string[] = [];
        let dataRows: string[][] = [];
        
        if (isXlsx) {
          // Handle XLSX file
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          if (jsonData.length === 0) {
            newFiles.push({
              name: file.name,
              size: file.size,
              content: [],
              headers: [],
              rowCount: 0,
              status: 'error',
              error: 'File is empty'
            });
            continue;
          }
          
          // Assume first row is headers
          headers = jsonData[0] || [];
          dataRows = jsonData.slice(1);
        } else {
          // Handle TXT/CSV files
          const text = await file.text();
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            newFiles.push({
              name: file.name,
              size: file.size,
              content: [],
              headers: [],
              rowCount: 0,
              status: 'error',
              error: 'File is empty'
            });
            continue;
          }

          // Try to detect delimiter (comma, tab, pipe, semicolon)
          const firstLine = lines[0];
          let delimiter = ',';
          if (firstLine.includes('\t')) delimiter = '\t';
          else if (firstLine.includes('|')) delimiter = '|';
          else if (firstLine.includes(';')) delimiter = ';';

          // Parse content
          const content = lines.map(line => 
            line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
          );
          
          // Assume first row is headers
          headers = content[0] || [];
          dataRows = content.slice(1);
        }

        newFiles.push({
          name: file.name,
          size: file.size,
          content: dataRows,
          headers,
          rowCount: dataRows.length,
          status: 'completed'
        });
      } catch (error) {
        newFiles.push({
          name: file.name,
          size: file.size,
          content: [],
          headers: [],
          rowCount: 0,
          status: 'error',
          error: 'Failed to parse file'
        });
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(false);
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // Convert to Excel and download
  const downloadAsExcel = useCallback((file: ProcessedFile) => {
    try {
      const wb = XLSX.utils.book_new();
      const wsData = [file.headers, ...file.content];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Auto-size columns
      const colWidths = file.headers.map((_, colIndex) => {
        const maxLength = Math.max(
          file.headers[colIndex]?.length || 0,
          ...file.content.map(row => (row[colIndex]?.toString() || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, "Trade Data");
      // Generate filename - convert TXT to XLSX, keep XLSX/XLS as is but with standardized name
      let excelName = file.name;
      if (file.name.toLowerCase().endsWith('.txt')) {
        excelName = file.name.replace(/\.txt$/i, '.xlsx');
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        excelName = file.name.replace(/\.csv$/i, '.xlsx');
      } else if (!file.name.toLowerCase().endsWith('.xlsx')) {
        // For any other file type, add .xlsx extension
        excelName = file.name.replace(/\.[^/.]+$/, "") + '.xlsx';
      }
      XLSX.writeFile(wb, excelName);
    } catch (error) {
      alert('Failed to convert to Excel. Please try again.');
    }
  }, []);

  // Remove file
  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all files
  const clearAll = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  // Add a new column to the file data
  const addColumn = useCallback((fileIndex: number) => {
    setUploadedFiles(prev => prev.map((file, index) => {
      if (index === fileIndex) {
        // Initialize editable headers and content if not already done
        const editableHeaders = file.editableHeaders || [...file.headers];
        const editableContent = file.editableContent || file.content.map(row => [...row]);
        
        // Add new column to headers and content
        editableHeaders.push(`Column ${editableHeaders.length + 1}`);
        const newContent = editableContent.map(row => [...row, '']);
        
        return {
          ...file,
          editableHeaders,
          editableContent: newContent
        };
      }
      return file;
    }));
  }, []);

  // Update cell value in editable grid
  const updateCellValue = useCallback((fileIndex: number, rowIndex: number, colIndex: number, value: string) => {
    setUploadedFiles(prev => prev.map((file, index) => {
      if (index === fileIndex) {
        // Initialize editable content if not already done
        const editableContent = file.editableContent || file.content.map(row => [...row]);
        const editableHeaders = file.editableHeaders || [...file.headers];
        
        // Update the specific cell
        if (!editableContent[rowIndex]) {
          editableContent[rowIndex] = Array(editableHeaders.length).fill('');
        }
        editableContent[rowIndex][colIndex] = value;
        
        return {
          ...file,
          editableHeaders,
          editableContent
        };
      }
      return file;
    }));
  }, []);

  // Find broker by broker ID
  const findBrokerByBrokerId = useCallback((brokerId: string) => {
    return brokers.find(broker => broker.broker_code.trim() === brokerId.trim());
  }, [brokers]);
  
  // Find broker by broker ID with provided broker list
  const findBrokerByBrokerIdWithList = (brokerId: string, brokerList: Broker[]) => {
    return brokerList.find(broker => broker.broker_code.trim() === brokerId.trim());
  };

  // Generate bills from trade data
  const generateBills = useCallback(async (file: ProcessedFile) => {
    try {
      if (!(file.editableContent || file.content).length) {
        toast({
          title: "Error",
          description: "No data found in the file to generate bills",
          variant: "destructive"
        });
        return;
      }
      
      // Ensure brokers are loaded
      let currentBrokers = brokers;
      if (currentBrokers.length === 0) {
        console.log('Brokers not loaded, fetching brokers...');
        const brokerResult = await brokerQueries.getAll();
        console.log('Fetched brokers for bill generation:', brokerResult);
        currentBrokers = brokerResult || [];
      }
      
      // Show processing message
      toast({
        title: "Bill Generation Started",
        description: `Generating bills from ${file.name}. This may take a moment...`
      });
      
      // Use editable data if available, otherwise use original data
      const headersToUse = file.editableHeaders || file.headers;
      const contentToUse = file.editableContent || file.content;
      
      // Find important columns
      const sideIndex = headersToUse.findIndex(header => 
        header.toLowerCase().includes('side') || 
        header.toLowerCase().includes('type') ||
        header.toLowerCase().includes('buy') ||
        header.toLowerCase().includes('sell')
      );
      
      // Find party code column with better prioritization
      const partyCodeIndex = headersToUse.findIndex(header => 
        (header.toLowerCase().includes('client') && header.toLowerCase().includes('id')) ||
        header.toLowerCase() === 'clientid' ||
        header.toLowerCase() === 'partyid' ||
        header.toLowerCase() === 'partycode' ||
        header.toLowerCase() === 'party_code' ||
        header.toLowerCase() === 'client_code' ||
        header.toLowerCase() === 'clientid' ||
        (header.toLowerCase().includes('party') && header.toLowerCase().includes('code')) ||
        header.toLowerCase().includes('party_code') ||
        header.toLowerCase().includes('client_code') ||
        header.toLowerCase() === 'clientid' ||
        header.toLowerCase() === 'partyid'
      );
      
      // If no specific party column found, try generic terms but exclude 'side'
      const fallbackPartyIndex = partyCodeIndex === -1 ? 
        headersToUse.findIndex((header, index) => 
          (header.toLowerCase().includes('party') || 
           header.toLowerCase().includes('client') ||
           header.toLowerCase().includes('customer') ||
           header.toLowerCase().includes('code') ||
           header.toLowerCase().includes('id')) &&
          !header.toLowerCase().includes('side') &&
          index !== sideIndex
        ) : -1;
      
      const finalPartyIndex = partyCodeIndex !== -1 ? partyCodeIndex : fallbackPartyIndex;
      
      // Find broker-related columns
      const brokerIdIndex = headersToUse.findIndex(header => 
        (header.toLowerCase().includes('broker') && header.toLowerCase().includes('id')) ||
        header.toLowerCase().includes('brokerid') ||
        header.toLowerCase().includes('broker_code')
      );
      
      // Find delivery/trading column (D/T)
      // Check for 'Type' column first (common in CSV exports), then d/t, delivery, trading
      const deliveryTradingIndex = headersToUse.findIndex(header => 
        header.toLowerCase() === 'type' ||
        header.toLowerCase().includes('d/t') ||
        header.toLowerCase().includes('delivery') ||
        header.toLowerCase().includes('trading')
      );
      
      // Find company/security column
      const companyCodeIndex = headersToUse.findIndex(header => 
        header.toLowerCase().includes('security') || 
        header.toLowerCase().includes('company') ||
        header.toLowerCase().includes('stock') ||
        header.toLowerCase().includes('script') ||
        header.toLowerCase().includes('name')
      );
      
      // Find quantity column
      const quantityIndex = headersToUse.findIndex(header => 
        header.toLowerCase().includes('quantity') || 
        header.toLowerCase().includes('qty')
      );
      
      // Find price column
      const priceIndex = headersToUse.findIndex(header => 
        header.toLowerCase().includes('price') || 
        header.toLowerCase().includes('rate')
      );
      
      // Validate required columns
      if (finalPartyIndex === -1) {
        toast({
          title: "Error",
          description: "Could not find party/client ID column in the file",
          variant: "destructive"
        });
        return;
      }
      
      if (quantityIndex === -1) {
        toast({
          title: "Error",
          description: "Could not find quantity column in the file",
          variant: "destructive"
        });
        return;
      }
      
      if (priceIndex === -1) {
        toast({
          title: "Error",
          description: "Could not find price column in the file",
          variant: "destructive"
        });
        return;
      }
      
      // Group data by party code
      const partyGroups: { 
        [key: string]: { 
          rows: string[][], 
          totalAmount: number,
          buyAmount: number,
          sellAmount: number,
          deliveryAmount: number,
          tradingAmount: number,
          transactions: {
            security: string,
            quantity: number,
            price: number,
            amount: number,
            side: string,
            deliveryTrading?: string
          }[],
          hasBrokerage: boolean,
          brokerId?: string
        } 
      } = {};
      
      // Track invalid entries for error reporting
      const invalidEntries: { row: number; errors: string[] }[] = [];
      const validPartyCodes: string[] = [];
      const invalidPartyCodes: string[] = [];
      
      contentToUse.forEach((row, rowIndex) => {
        const partyCode = row[finalPartyIndex] || 'Unknown Party';
        const companyCode = companyCodeIndex !== -1 ? row[companyCodeIndex] : 'Unknown Security';
        const quantity = quantityIndex !== -1 && row[quantityIndex] ? 
          Number(parseFloat(row[quantityIndex])) || 0 : 0;
        const price = priceIndex !== -1 && row[priceIndex] ? 
          Number(parseFloat(row[priceIndex])) || 0 : 0;
        const side = sideIndex !== -1 && row[sideIndex] ? 
          row[sideIndex] : 'Unknown';
        const brokerId = brokerIdIndex !== -1 && row[brokerIdIndex] ? 
          row[brokerIdIndex] : '';
        const deliveryTrading = deliveryTradingIndex !== -1 && row[deliveryTradingIndex] ? 
          row[deliveryTradingIndex].toUpperCase() : '';
        
        const amount = Number(quantity) * Number(price);
        
        // Validate party code
        const party = parties.find(p => p.party_code === partyCode);
        if (!party && partyCode !== 'Unknown Party') {
          invalidEntries.push({
            row: rowIndex + 2, // +2 because of header row and 0-based index
            errors: [`Invalid party code: ${partyCode}`]
          });
          
          if (!invalidPartyCodes.includes(partyCode)) {
            invalidPartyCodes.push(partyCode);
          }
        } else if (partyCode !== 'Unknown Party') {
          if (!validPartyCodes.includes(partyCode)) {
            validPartyCodes.push(partyCode);
          }
        }
        
        // Validate quantity and price
        if (quantity <= 0) {
          invalidEntries.push({
            row: rowIndex + 2,
            errors: [`Invalid quantity: ${quantity}`]
          });
        }
        
        if (price <= 0) {
          invalidEntries.push({
            row: rowIndex + 2,
            errors: [`Invalid price: ${price}`]
          });
        }
        
        if (!partyGroups[partyCode]) {
          partyGroups[partyCode] = { 
            rows: [], 
            totalAmount: 0,
            buyAmount: 0,
            sellAmount: 0,
            deliveryAmount: 0,
            tradingAmount: 0,
            transactions: [],
            hasBrokerage: brokerId ? true : false,
            brokerId: brokerId || undefined
          };
        }
        
        partyGroups[partyCode].rows.push(row);
        partyGroups[partyCode].totalAmount += Number(amount);
        partyGroups[partyCode].transactions.push({
          security: companyCode,
          quantity: Number(quantity),
          price: Number(price),
          amount: Number(amount),
          side: side,
          deliveryTrading: deliveryTrading
        });
        
        // Track buy/sell amounts separately
        if (side.toLowerCase().includes('buy')) {
          partyGroups[partyCode].buyAmount += Number(amount);
        } else if (side.toLowerCase().includes('sell')) {
          partyGroups[partyCode].sellAmount += Number(amount);
        }
        
        // Track delivery/trading amounts
        if (deliveryTrading === 'D') {
          partyGroups[partyCode].deliveryAmount += Number(amount);
        } else if (deliveryTrading === 'T') {
          partyGroups[partyCode].tradingAmount += Number(amount);
        }
        
        // Update brokerage info - every row with a brokerId contributes to brokerage
        if (brokerId) {
          partyGroups[partyCode].hasBrokerage = true;
          const trimmedBrokerId = brokerId.trim();
          // Only set brokerId if not already set, or if it's the same
          if (!partyGroups[partyCode].brokerId || partyGroups[partyCode].brokerId === trimmedBrokerId) {
            partyGroups[partyCode].brokerId = trimmedBrokerId;
          } else {
            console.warn('Different broker IDs found for same party:', partyCode, partyGroups[partyCode].brokerId, trimmedBrokerId);
          }
        }
      });
      
      // Report validation errors
      if (invalidEntries.length > 0) {
        const errorMessages = invalidEntries
          .slice(0, 5) // Limit to first 5 errors
          .map(entry => `Row ${entry.row}: ${entry.errors.join(', ')}`)
          .join('; ');
        
        const moreErrors = invalidEntries.length > 5 ? 
          ` and ${invalidEntries.length - 5} more errors` : '';
        
        toast({
          title: "Validation Errors",
          description: `${errorMessages}${moreErrors}. Please correct these entries before generating bills.`,
          variant: "destructive"
        });
        
        // If all entries are invalid, stop processing
        if (invalidEntries.length === contentToUse.length) {
          return;
        }
      }
      
      // Generate bills for each party group
      let billsCreated = 0;
      const errors: string[] = [];
      
      for (const [partyCode, groupData] of Object.entries(partyGroups)) {
        try {
          // Find party by code
          const party = parties.find(p => p.party_code === partyCode);
          
          // Generate party bill
          const today = new Date();
          const partyBillNumber = `PTY${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          
          // Create detailed notes with transaction summary in a proper format
          let partyNotes = `TRADE BILL\n`;
          partyNotes += `==========\n\n`;
          partyNotes += `Generated from file: ${file.name}\n`;
          partyNotes += `Party Code: ${partyCode}\n`;
          partyNotes += `Party Name: ${party ? party.name : 'Unknown Party'}\n`;
          partyNotes += `Bill Date: ${today.toLocaleDateString()}\n\n`;
          partyNotes += `SUMMARY\n`;
          partyNotes += `-------\n`;
          partyNotes += `Total Transactions: ${groupData.transactions.length}\n`;
          partyNotes += `Buy Amount: ₹${groupData.buyAmount.toFixed(2)}\n`;
          partyNotes += `Sell Amount: ₹${groupData.sellAmount.toFixed(2)}\n`;
          partyNotes += `Delivery Amount: ₹${groupData.deliveryAmount.toFixed(2)}\n`;
          partyNotes += `Trading Amount: ₹${groupData.tradingAmount.toFixed(2)}\n`;
          partyNotes += `Net Amount: ₹${groupData.totalAmount.toFixed(2)}\n\n`;
          
          partyNotes += `DETAILED TRANSACTIONS\n`;
          partyNotes += `---------------------\n`;
          
          // Group transactions by security for better organization
          const securityGroups: { [key: string]: typeof groupData.transactions } = {};
          groupData.transactions.forEach(tx => {
            if (!securityGroups[tx.security]) {
              securityGroups[tx.security] = [];
            }
            securityGroups[tx.security].push(tx);
          });
          
          // Add transactions grouped by security
          Object.entries(securityGroups).forEach(([security, transactions]) => {
            partyNotes += `\n${security}:\n`;
            
            let securityTotal = 0;
            let securityDeliveryAmount = 0;
            let securityTradingAmount = 0;
            
            transactions.forEach((tx, index) => {
              const dtLabel = tx.deliveryTrading ? ` (${tx.deliveryTrading === 'D' ? 'Delivery' : 'Trading'})` : '';
              partyNotes += `${index + 1}. ${tx.side.toUpperCase()} ${Number(tx.quantity).toFixed(0)} units @ ₹${Number(tx.price).toFixed(2)} = ₹${Number(tx.amount).toFixed(2)}${dtLabel}\n`;
              securityTotal += Number(tx.amount);
              
              // Track delivery/trading amounts for this security
              if (tx.deliveryTrading === 'D') {
                securityDeliveryAmount += Number(tx.amount);
              } else if (tx.deliveryTrading === 'T') {
                securityTradingAmount += Number(tx.amount);
              }
            });
            
            partyNotes += `   Subtotal: ₹${Number(securityTotal).toFixed(2)}`;
            if (securityDeliveryAmount > 0 || securityTradingAmount > 0) {
              partyNotes += ` (Delivery: ₹${securityDeliveryAmount.toFixed(2)}, Trading: ₹${securityTradingAmount.toFixed(2)})`;
            }
            partyNotes += `\n`;
          });
          
          // Add footer
          partyNotes += `\n---\n`;
          partyNotes += `Generated on: ${new Date().toLocaleString()}\n`;
          partyNotes += `Bill Number: ${partyBillNumber}\n`;
          
          // Create party bill data
          const partyBillData = {
            bill_number: partyBillNumber,
            party_id: party ? party.id : "", // Use actual party ID if found
            bill_date: today.toISOString().split('T')[0],
            due_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            total_amount: Number(groupData.totalAmount.toFixed(2)),
            notes: partyNotes,
            bill_type: 'party' as 'party' | 'broker' // Specify bill type
          };
          
          // Create the party bill in the database with items
          if (party) {
            const createdBill = await billQueries.create(partyBillData);
            
            // Now create bill_items for this bill
            if (createdBill && createdBill.id) {
              // Prepare items array from transactions
              const billItems = groupData.transactions.map(tx => ({
                description: `${tx.side.toUpperCase()} ${tx.security}`,
                quantity: Number(tx.quantity),
                rate: Number(tx.price),
                amount: Number(tx.amount),
                client_code: partyCode,
                company_code: tx.security,
                trade_type: tx.deliveryTrading || null, // D, T, or null
                brokerage_rate_pct: 0,
                brokerage_amount: 0
              }));
              
              // Update the bill to include items
              await billQueries.update(createdBill.id, {
                ...partyBillData,
                items: billItems
              });
            }
            
            billsCreated++;
            
            // Create ledger entry for party
            try {
              // Get current balance for this party
              const currentLedgerEntries = await ledgerQueries.getByPartyId(party.id);
              const currentBalance = currentLedgerEntries.length > 0 
                ? Number(currentLedgerEntries[0].balance) 
                : 0;
              const newBalance = currentBalance + Number(groupData.totalAmount.toFixed(2));
              
              await ledgerQueries.create({
                party_id: party.id,
                entry_date: today.toISOString().split('T')[0],
                particulars: `Trade bill ${partyBillNumber}`,
                debit_amount: Number(groupData.totalAmount.toFixed(2)),
                credit_amount: 0,
                balance: newBalance
              });
            } catch (ledgerError) {
              console.warn(`Failed to create ledger entry for party bill ${partyBillNumber}:`, ledgerError);
            }
          } else {
            // If party not found, we could either skip or create with empty party_id
            // For now, we'll create with empty party_id and log a warning
            const createdBill = await billQueries.create(partyBillData);
            
            // Now create bill_items for this bill
            if (createdBill && createdBill.id) {
              // Prepare items array from transactions
              const billItems = groupData.transactions.map(tx => ({
                description: `${tx.side.toUpperCase()} ${tx.security}`,
                quantity: Number(tx.quantity),
                rate: Number(tx.price),
                amount: Number(tx.amount),
                client_code: partyCode,
                company_code: tx.security,
                trade_type: tx.deliveryTrading || null, // D, T, or null
                brokerage_rate_pct: 0,
                brokerage_amount: 0
              }));
              
              // Update the bill to include items
              await billQueries.update(createdBill.id, {
                ...partyBillData,
                items: billItems
              });
            }
            
            billsCreated++;
            console.warn(`Party bill created for party code '${partyCode}' but party not found in database`);
          }
          
          // Generate broker bill if this party has brokerage transactions
          if (groupData.hasBrokerage && groupData.brokerId) {
            // Find the broker party by broker ID
            const brokerParty = findBrokerByBrokerIdWithList(groupData.brokerId, currentBrokers);
            
            if (brokerParty) {
              const brokerBillNumber = `BRK${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
              
              // Use brokerage rates from broker master data
              let totalBrokerageAmount = 0;
              let deliveryBrokerageAmount = 0;
              let tradingBrokerageAmount = 0;
              
              // Calculate brokerage for each transaction based on delivery/trading type
              groupData.transactions.forEach(tx => {
                let txBrokerageRate = 0;
                if (tx.deliveryTrading === 'D' && brokerParty?.delivery_slab) {
                  // Use delivery slab rate for delivery transactions
                  txBrokerageRate = brokerParty.delivery_slab / 100;
                  deliveryBrokerageAmount += Number(tx.amount) * txBrokerageRate;
                } else if (tx.deliveryTrading === 'T' && brokerParty?.trading_slab) {
                  // Use trading slab rate for trading transactions
                  txBrokerageRate = brokerParty.trading_slab / 100;
                  tradingBrokerageAmount += Number(tx.amount) * txBrokerageRate;
                } else if (brokerParty?.trading_slab) {
                  // Default to trading slab rate if no D/T specified
                  txBrokerageRate = brokerParty.trading_slab / 100;
                  tradingBrokerageAmount += Number(tx.amount) * txBrokerageRate;
                }
                
                totalBrokerageAmount += Number(tx.amount) * txBrokerageRate;
              });
              
              // If no transactions had specific rates, use broker's trading slab as default
              if (totalBrokerageAmount === 0 && brokerParty?.trading_slab) {
                const defaultRate = brokerParty.trading_slab / 100;
                totalBrokerageAmount = Number(groupData.totalAmount) * defaultRate;
                tradingBrokerageAmount = totalBrokerageAmount;
              }
              
              // Create broker bill notes
              let brokerNotes = `BROKERAGE BILL\n`;
              brokerNotes += `==============\n\n`;
              brokerNotes += `Generated from file: ${file.name}\n`;
              brokerNotes += `Broker Code: ${groupData.brokerId}\n`;
              brokerNotes += `Broker Name: ${brokerParty.name}\n`;
              brokerNotes += `Client Code: ${partyCode}\n`;
              brokerNotes += `Client Name: ${party ? party.name : 'Unknown Party'}\n`;
              brokerNotes += `Bill Date: ${today.toLocaleDateString()}\n\n`;
              
              brokerNotes += `BROKERAGE RATES\n`;
              brokerNotes += `---------------\n`;
              brokerNotes += `Trading Slab: ${brokerParty?.trading_slab || 0}%\n`;
              brokerNotes += `Delivery Slab: ${brokerParty?.delivery_slab || 0}%\n\n`;
              
              brokerNotes += `TRANSACTION SUMMARY\n`;
              brokerNotes += `-------------------\n`;
              brokerNotes += `Total Transaction Value: ₹${Number(groupData.totalAmount).toFixed(2)}\n`;
              brokerNotes += `Delivery Amount: ₹${Number(groupData.deliveryAmount).toFixed(2)}\n`;
              brokerNotes += `Trading Amount: ₹${Number(groupData.tradingAmount).toFixed(2)}\n`;
              brokerNotes += `Delivery Brokerage: ₹${Number(deliveryBrokerageAmount).toFixed(2)}\n`;
              brokerNotes += `Trading Brokerage: ₹${Number(tradingBrokerageAmount).toFixed(2)}\n`;
              brokerNotes += `Total Brokerage Amount: ₹${Number(totalBrokerageAmount).toFixed(2)}\n\n`;
              
              brokerNotes += `DETAILED TRANSACTIONS\n`;
              brokerNotes += `---------------------\n`;
              
              // Add transactions grouped by security
              Object.entries(securityGroups).forEach(([security, transactions]) => {
                brokerNotes += `\n${security}:\n`;
                
                let securityTotal = 0;
                let securityDeliveryAmount = 0;
                let securityTradingAmount = 0;
                let securityDeliveryBrokerage = 0;
                let securityTradingBrokerage = 0;
                
                transactions.forEach((tx, index) => {
                  let txBrokerage = 0;
                  let txBrokerageRate = 0;
                  
                  if (tx.deliveryTrading === 'D' && brokerParty?.delivery_slab) {
                    txBrokerageRate = brokerParty.delivery_slab / 100;
                    txBrokerage = Number(tx.amount) * txBrokerageRate;
                    securityDeliveryBrokerage += txBrokerage;
                    securityDeliveryAmount += Number(tx.amount);
                  } else if (tx.deliveryTrading === 'T' && brokerParty?.trading_slab) {
                    txBrokerageRate = brokerParty.trading_slab / 100;
                    txBrokerage = Number(tx.amount) * txBrokerageRate;
                    securityTradingBrokerage += txBrokerage;
                    securityTradingAmount += Number(tx.amount);
                  } else if (brokerParty?.trading_slab) {
                    txBrokerageRate = brokerParty.trading_slab / 100;
                    txBrokerage = Number(tx.amount) * txBrokerageRate;
                    securityTradingBrokerage += txBrokerage;
                    securityTradingAmount += Number(tx.amount);
                  }
                  
                  const dtLabel = tx.deliveryTrading ? ` (${tx.deliveryTrading === 'D' ? 'Delivery' : 'Trading'})` : '';
                  brokerNotes += `${index + 1}. ${tx.side.toUpperCase()} ${Number(tx.quantity).toFixed(0)} units @ ₹${Number(tx.price).toFixed(2)} = ₹${Number(tx.amount).toFixed(2)}${dtLabel} (Brokerage: ₹${txBrokerage.toFixed(2)})\n`;
                  securityTotal += Number(tx.amount);
                });
                
                const securityTotalBrokerage = securityDeliveryBrokerage + securityTradingBrokerage;
                brokerNotes += `   Subtotal: ₹${Number(securityTotal).toFixed(2)} (Delivery: ₹${securityDeliveryAmount.toFixed(2)}, Trading: ₹${securityTradingAmount.toFixed(2)}, Delivery Brokerage: ₹${securityDeliveryBrokerage.toFixed(2)}, Trading Brokerage: ₹${securityTradingBrokerage.toFixed(2)}, Total Brokerage: ₹${securityTotalBrokerage.toFixed(2)})\n`;
              });
              
              // Add footer
              brokerNotes += `\n---\n`;
              brokerNotes += `Generated on: ${new Date().toLocaleString()}\n`;
              brokerNotes += `Bill Number: ${brokerBillNumber}\n`;
              
              // Prepare bill items for broker bill
              const brokerBillItems = groupData.transactions.map(tx => {
                let txBrokerageRate = 0;
                let txBrokerage = 0;
                
                if (tx.deliveryTrading === 'D' && brokerParty?.delivery_slab) {
                  txBrokerageRate = brokerParty.delivery_slab;
                  txBrokerage = Number(tx.amount) * (brokerParty.delivery_slab / 100);
                } else if (tx.deliveryTrading === 'T' && brokerParty?.trading_slab) {
                  txBrokerageRate = brokerParty.trading_slab;
                  txBrokerage = Number(tx.amount) * (brokerParty.trading_slab / 100);
                } else if (brokerParty?.trading_slab) {
                  txBrokerageRate = brokerParty.trading_slab;
                  txBrokerage = Number(tx.amount) * (brokerParty.trading_slab / 100);
                }
                
                return {
                  description: `${tx.side.toUpperCase()} ${tx.security}`,
                  quantity: Number(tx.quantity),
                  rate: Number(tx.price),
                  amount: Number(tx.amount),
                  client_code: partyCode, // Store which party this brokerage is for
                  company_code: tx.security,
                  trade_type: tx.deliveryTrading || null, // D, T, or null
                  brokerage_rate_pct: txBrokerageRate,
                  brokerage_amount: txBrokerage
                };
              });
              
              // Create broker bill data
              const brokerBillData = {
                bill_number: brokerBillNumber,
                party_id: null, // Don't set party_id for broker bills
                broker_id: brokerParty.id, // Store broker ID
                broker_code: groupData.brokerId, // Store broker code
                bill_date: today.toISOString().split('T')[0],
                due_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                total_amount: Number(totalBrokerageAmount.toFixed(2)),
                notes: brokerNotes,
                bill_type: 'broker' as 'party' | 'broker'
              };
              
              // Create the broker bill in the database with items
              const createdBrokerBill = await billQueries.create(brokerBillData);
              
              // Update the bill to include items
              if (createdBrokerBill && createdBrokerBill.id) {
                await billQueries.update(createdBrokerBill.id, {
                  ...brokerBillData,
                  items: brokerBillItems
                });
              }
              billsCreated++;
              
              // Create ledger entry for broker (what we owe the broker)
              try {
                await ledgerQueries.create({
                  party_id: null, // party_id is null for broker ledger entries
                  entry_date: today.toISOString().split('T')[0],
                  particulars: `Brokerage for client ${partyCode} - Bill ${brokerBillNumber}`,
                  debit_amount: 0,
                  credit_amount: Number(totalBrokerageAmount.toFixed(2)),
                  balance: 0
                });
              } catch (ledgerError) {
                console.warn(`Failed to create ledger entry for broker bill ${brokerBillNumber}:`, ledgerError);
              }
              
              // Create party ledger entry (add brokerage to party's debit - what they owe us)
              if (party) {
                try {
                  // Get current balance for this party
                  const currentLedgerEntries = await ledgerQueries.getByPartyId(party.id);
                  const currentBalance = currentLedgerEntries.length > 0 
                    ? Number(currentLedgerEntries[0].balance) 
                    : 0;
                  const newBalance = currentBalance + Number(totalBrokerageAmount.toFixed(2));
                  
                  await ledgerQueries.create({
                    party_id: party.id,
                    entry_date: today.toISOString().split('T')[0],
                    particulars: `Brokerage charges - Bill ${brokerBillNumber}`,
                    debit_amount: Number(totalBrokerageAmount.toFixed(2)),
                    credit_amount: 0,
                    balance: newBalance
                  });
                } catch (partyLedgerError) {
                  console.warn(`Failed to create party ledger entry for broker bill ${brokerBillNumber}:`, partyLedgerError);
                }
              }
            } else {
              console.warn(`Broker bill not created - broker with ID '${groupData.brokerId}' not found`);
            }
          }
        } catch (error) {
          errors.push(`Failed to create bill for party ${partyCode}: ${(error as Error).message}`);
        }
      }
      
      // Show results
      setTimeout(() => {
        if (errors.length > 0) {
          toast({
            title: "Bill Generation Completed with Errors",
            description: `Created ${billsCreated} bill(s). ${errors.length} error(s) occurred.`,
            variant: "destructive"
          });
        } else if (invalidEntries.length > 0) {
          toast({
            title: "Bills Generated with Warnings",
            description: `Created ${billsCreated} bill(s) for ${Object.keys(partyGroups).length} parties. ${invalidEntries.length} invalid entries were skipped. Valid party codes: ${validPartyCodes.length}, Invalid: ${invalidPartyCodes.length}`,
          });
        } else {
          toast({
            title: "Bills Generated Successfully",
            description: `Created ${billsCreated} bill(s) for ${Object.keys(partyGroups).length} parties. All party codes validated successfully.`
          });
          
          // Clear the uploaded files after successful bill generation
          setUploadedFiles([]);
        }
      }, 2000);
    } catch (error) {
      console.error('Error generating bills:', error);
      toast({
        title: "Error",
        description: "Failed to generate bills: " + (error as Error).message,
        variant: "destructive"
      });
    }
  }, [toast, parties]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Trade File Transfer"
        description="Upload trade files (TXT/CSV/XLSX), edit data, and generate party/broker bills"
      />
      <div className="p-6 space-y-6">
        
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
              <p className="text-muted-foreground mb-4">
                or click to browse and select files (TXT, CSV, XLSX)
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                tabIndex={1}
              >
                {isProcessing ? 'Processing...' : 'Select Files'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Processed Files ({uploadedFiles.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                tabIndex={2}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index} 
                  ref={el => fileRefs.current[index] = el}
                  className={`border rounded-lg p-4 ${index === selectedFileIndex ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    // Don't handle arrow keys when in input fields
                    const target = e.target as HTMLElement;
                    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
                    const isContentEditable = target.isContentEditable || target.hasAttribute('contenteditable');
                    
                    if (isInputField || isContentEditable) {
                      return;
                    }
                    
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      const nextIndex = Math.min(selectedFileIndex + 1, uploadedFiles.length - 1);
                      setSelectedFileIndex(nextIndex);
                      fileRefs.current[nextIndex]?.focus();
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      const prevIndex = Math.max(selectedFileIndex - 1, 0);
                      setSelectedFileIndex(prevIndex);
                      fileRefs.current[prevIndex]?.focus();
                    } else if (e.key === "Home") {
                      e.preventDefault();
                      setSelectedFileIndex(0);
                      fileRefs.current[0]?.focus();
                    } else if (e.key === "End") {
                      e.preventDefault();
                      const lastIndex = uploadedFiles.length - 1;
                      setSelectedFileIndex(lastIndex);
                      fileRefs.current[lastIndex]?.focus();
                    } else if (e.key === "Delete") {
                      e.preventDefault();
                      removeFile(index);
                    }
                  }}
                  onClick={() => setSelectedFileIndex(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{file.name}</span>
                      <Badge variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'}>
                        {file.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {file.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {file.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      tabIndex={3 + index * 2}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    Size: {formatFileSize(file.size)}
                    {file.status === 'completed' && (
                      <span> • Rows: {file.rowCount} • Columns: {file.headers.length}</span>
                    )}
                  </div>

                  {file.status === 'error' && file.error && (
                    <Alert className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{file.error}</AlertDescription>
                    </Alert>
                  )}

                  {file.status === 'completed' && (
                    <>
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Columns detected:</p>
                        <div className="flex flex-wrap gap-1">
                          {file.headers.slice(0, 10).map((header, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {header || `Column ${i + 1}`}
                            </Badge>
                          ))}
                          {file.headers.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{file.headers.length - 10} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Editable Grid */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Editable Data Grid</h4>
                        <div className="overflow-x-auto max-h-60 overflow-y-auto border rounded">
                          <table className="w-full text-xs">
                            <thead className="bg-muted">
                              <tr>
                                {(file.editableHeaders || file.headers).map((header, colIndex) => (
                                  <th key={colIndex} className="px-2 py-1 text-left border-r last:border-r-0 sticky top-0 bg-muted">
                                    <Input
                                      value={header}
                                      onChange={(e) => {
                                        // For now, we'll just display headers as read-only
                                        // In a full implementation, you'd make these editable too
                                        console.log('Header change:', e.target.value);
                                      }}
                                      className="h-6 px-1 py-0 text-xs font-medium bg-transparent border-none focus:ring-1"
                                      readOnly
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(file.editableContent || file.content).map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b hover:bg-muted/50">
                                  {row.map((cell, colIndex) => (
                                    <td key={colIndex} className="px-2 py-1 border-r last:border-r-0">
                                      <Input
                                        value={cell}
                                        onChange={(e) => updateCellValue(index, rowIndex, colIndex, e.target.value)}
                                        className="h-6 px-1 py-0 text-xs"
                                        onBlur={() => {
                                          // Any additional logic on blur
                                        }}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => downloadAsExcel(file)}
                          className="flex-1"
                          tabIndex={4 + index * 4}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download as Excel
                        </Button>
                        <Button
                          onClick={() => addColumn(index)}
                          className="flex-1"
                          tabIndex={5 + index * 4}
                        >
                          <span className="text-xs">+ Add Column</span>
                        </Button>
                        <Button
                          onClick={() => generateBills(file)}
                          className="flex-1"
                          tabIndex={6 + index * 4}
                        >
                          <IndianRupee className="h-4 w-4 mr-2" />
                          Generate Bills
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Supported File Formats</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>TXT, CSV, and XLSX files</li>
                <li>First row should contain column headers</li>
                <li>Maximum file size: 50MB per file</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Bill Generation</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Click "Generate Bills" to create party bills and broker bills from your data</li>
                <li>Party bills are generated for all transactions</li>
                <li>Broker bills are generated for rows with "Type" column value "Brokerage"</li>
                <li>Brokerage rates are automatically applied based on party master data</li>
                <li>Delivery/Trading type is detected from "D/T" column (D = Delivery, T = Trading)</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab 1</kbd> - Select Files</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab 2</kbd> - Clear All</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab 3+</kbd> - File actions</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑/↓</kbd> - Navigate between files</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Home/End</kbd> - First/Last file</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Delete</kbd> - Remove selected file</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
};

export default Trading;
