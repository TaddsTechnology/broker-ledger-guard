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
import { useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";

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

  // Keyboard shortcuts
  useBusinessKeyboard({
    onUp: () => {
      if (selectedFileIndex > 0) {
        const newIndex = selectedFileIndex - 1;
        setSelectedFileIndex(newIndex);
        fileRefs.current[newIndex]?.focus();
      }
    },
    onDown: () => {
      if (selectedFileIndex < uploadedFiles.length - 1) {
        const newIndex = selectedFileIndex + 1;
        setSelectedFileIndex(newIndex);
        fileRefs.current[newIndex]?.focus();
      }
    },
  });

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

  // Convert to Excel, download, and auto-open in new tab
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
      
      // Generate blob and create URL for auto-open
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      // Download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = excelName;
      link.click();
      
      // Auto-open in new Chrome tab
      window.open(url, '_blank');
      
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  // Generate bills from trade data with correct buy/sell ledger logic
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
      
      // Show processing message
      toast({
        title: "Bill Generation Started",
        description: `Processing stock trades with correct ledger logic...`
      });
      
      // Use editable data if available, otherwise use original data
      const headersToUse = file.editableHeaders || file.headers;
      const contentToUse = file.editableContent || file.content;
      
      // Convert CSV rows to trade objects
      const trades = contentToUse.map(row => {
        const trade: any = {};
        headersToUse.forEach((header, index) => {
          trade[header] = row[index];
        });
        return trade;
      });
      
      // Call the stock-trades API endpoint with correct ledger logic
      const response = await fetch('http://localhost:3001/api/stock-trades/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trades,
          billDate: new Date().toISOString().split('T')[0]
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process trades');
      }
      
      const result = await response.json();
      
      // Show success message
      toast({
        title: "Bills Generated Successfully",
        description: `Created ${result.clientBills?.length || 0} client bills with correct BUY/SELL ledger entries. Broker earned total brokerage.`
      });
      
      // Clear the uploaded files after successful bill generation
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error generating bills:', error);
      toast({
        title: "Error",
        description: "Failed to generate bills: " + (error as Error).message,
        variant: "destructive"
      });
    }
  }, [toast]);

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
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Open in Excel
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
