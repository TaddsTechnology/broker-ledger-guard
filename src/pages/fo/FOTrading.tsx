import React, { useState, useCallback, useRef, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Download, X, CheckCircle, AlertCircle, FileSpreadsheet, IndianRupee } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { partyQueries, brokerQueries } from "@/lib/database";
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
  editableContent?: string[][];
  editableHeaders?: string[];
}

const FOTrading = () => {
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [billDate, setBillDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
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
      
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        const editableHeaders = file.editableHeaders || [...file.headers];
        const editableContent = file.editableContent || file.content.map(row => [...row]);
        
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

  // Add a new empty row to the file data
  const addRow = useCallback((fileIndex: number) => {
    setUploadedFiles(prev => prev.map((file, index) => {
      if (index === fileIndex) {
        const editableHeaders = file.editableHeaders || [...file.headers];
        const colCount = editableHeaders.length || (file.content[0]?.length || 0);
        const editableContent = file.editableContent || file.content.map(row => [...row]);
        const emptyRow = Array(colCount).fill("");
        const newContent = [...editableContent, emptyRow];
        return {
          ...file,
          editableHeaders,
          editableContent: newContent,
          rowCount: newContent.length,
        };
      }
      return file;
    }));
  }, []);

  // Update cell value in editable grid
  const updateCellValue = useCallback((fileIndex: number, rowIndex: number, colIndex: number, value: string) => {
    setUploadedFiles(prev => prev.map((file, index) => {
      if (index === fileIndex) {
        const editableContent = file.editableContent || file.content.map(row => [...row]);
        const editableHeaders = file.editableHeaders || [...file.headers];
        
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

  // Import F&O trades and update positions (no direct bills)
  const importTrades = useCallback(async (file: ProcessedFile, fileIndex: number) => {
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
        title: "F&O Trades Import Started",
        description: `Importing F&O trades and updating positions...`
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
      
      // Call the F&O import API endpoint (no bills here)
      const response = await fetch('http://localhost:3001/api/fo/trades/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trades,
          billDate: billDate || new Date().toISOString().split('T')[0],
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process F&O trades');
      }
      
      const result = await response.json();
      
      // Show success message
      toast({
        title: "F&O Trades Imported Successfully",
        description: `Imported ${result.importedCount ?? 0} trades and updated positions. Bills can be generated later from contracts.`
      });
      
      // Remove only the imported file from the list
      setUploadedFiles(prev => prev.filter((_, i) => i !== fileIndex));
    } catch (error) {
      console.error('Error importing F&O trades:', error);
      toast({
        title: "Error",
        description: "Failed to import F&O trades: " + (error as Error).message,
        variant: "destructive"
      });
    }
  }, [toast, billDate]);

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
        title="F&O Trade File Transfer"
        description="Upload F&O trade files (TXT/CSV/XLSX), edit data, and generate party/broker bills"
      />
      <div className="p-6 space-y-6">
        
        {/* Upload Area */}
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Upload className="h-5 w-5" />
              Upload F&O Trade Files
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-border hover:border-purple-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-purple-500" />
              <h3 className="text-lg font-semibold mb-2">Drop F&O trade files here</h3>
              <p className="text-muted-foreground mb-4">
                or click to browse and select files (TXT, CSV, XLSX)
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                tabIndex={1}
                className="bg-purple-600 hover:bg-purple-700"
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
          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between bg-purple-50">
              <div className="flex items-center gap-4">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <FileSpreadsheet className="h-5 w-5" />
                  Processed Files ({uploadedFiles.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-purple-800">Bill Date</span>
                  <Input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="h-8 w-40 text-xs bg-white border-purple-300"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                tabIndex={2}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index} 
                  ref={el => fileRefs.current[index] = el}
                  className={`border rounded-lg p-4 ${index === selectedFileIndex ? 'ring-2 ring-purple-300 bg-purple-50' : ''}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
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
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">{file.name}</span>
                      <Badge variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className={file.status === 'completed' ? 'bg-purple-600' : ''}>
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
                      className="hover:bg-purple-100"
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
                            <Badge key={i} variant="outline" className="text-xs border-purple-300 text-purple-700">
                              {header || `Column ${i + 1}`}
                            </Badge>
                          ))}
                          {file.headers.length > 10 && (
                            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
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
                            <thead className="bg-purple-100">
                              <tr>
                                {(file.editableHeaders || file.headers).map((header, colIndex) => (
                                  <th key={colIndex} className="px-2 py-1 text-left border-r last:border-r-0 sticky top-0 bg-purple-100">
                                    <Input
                                      value={header}
                                      onChange={(e) => {
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
                                <tr key={rowIndex} className="border-b hover:bg-purple-50">
                                  {row.map((cell, colIndex) => {
                                    const headers = file.editableHeaders || file.headers;
                                    const headerName = headers[colIndex] || '';
                                    const normalizedHeader = headerName.replace(/\s+/g, '');
                                    const isClientIdCol = /clientid/i.test(normalizedHeader);
                                    const isBrokerIdCol = /brokerid/i.test(normalizedHeader);
                                    const clientDatalistId = `fo-clientid-options-${index}-${colIndex}`;
                                    const brokerDatalistId = `fo-brokerid-options-${index}-${colIndex}`;
                                    return (
                                      <td key={colIndex} className="px-2 py-1 border-r last:border-r-0">
                                        <Input
                                          value={cell}
                                          list={isClientIdCol ? clientDatalistId : isBrokerIdCol ? brokerDatalistId : undefined}
                                          onChange={(e) => updateCellValue(index, rowIndex, colIndex, e.target.value.toUpperCase())}
                                          className="h-6 px-1 py-0 text-xs"
                                          onBlur={() => {}}
                                        />
                                        {isClientIdCol && (
                                          <datalist id={clientDatalistId}>
                                            {parties.map((p) => (
                                              <option
                                                key={p.id}
                                                value={p.party_code}
                                                label={p.name}
                                              />
                                            ))}
                                          </datalist>
                                        )}
                                        {isBrokerIdCol && (
                                          <datalist id={brokerDatalistId}>
                                            {brokers.map((b) => (
                                              <option
                                                key={b.id}
                                                value={b.broker_code}
                                                label={b.name}
                                              />
                                            ))}
                                          </datalist>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => addRow(index)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          tabIndex={4 + index * 4}
                        >
                          <span className="text-xs">+ Add Row</span>
                        </Button>
                        <Button
                          onClick={() => addColumn(index)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          tabIndex={5 + index * 4}
                        >
                          <span className="text-xs">+ Add Column</span>
                        </Button>
                        <Button
                          onClick={() => importTrades(file, index)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          tabIndex={6 + index * 4}
                        >
                          <IndianRupee className="h-4 w-4 mr-2" />
                          Import F&O Trades
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
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-purple-900">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
              <h4 className="font-semibold mb-2">F&O Bill Generation</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Click "Generate F&O Bills" to create party bills and broker bills from F&O trades</li>
                <li>System automatically handles lot sizes for quantity calculations</li>
                <li>Positions are updated in real-time with each trade</li>
                <li>Supports Futures (FUT), Call Options (CE), and Put Options (PE)</li>
                <li>Brokerage is calculated based on contract value and party rates</li>
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

export default FOTrading;
