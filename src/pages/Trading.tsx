import React, { useState, useCallback, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Download, X, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface ProcessedFile {
  name: string;
  size: number;
  content: string[][];
  headers: string[];
  rowCount: number;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

const Trading = () => {
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newFiles: ProcessedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if file is TXT
      if (!file.name.toLowerCase().endsWith('.txt')) {
        newFiles.push({
          name: file.name,
          size: file.size,
          content: [],
          headers: [],
          rowCount: 0,
          status: 'error',
          error: 'Only TXT files are supported'
        });
        continue;
      }

      try {
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
        const headers = content[0] || [];
        const dataRows = content.slice(1);

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
      const excelName = file.name.replace(/\.txt$/i, '.xlsx');
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
        description="Upload TXT trade files and convert to Excel format"
      />
      <div className="p-6 space-y-6">
        
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload TXT Files
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
              <h3 className="text-lg font-semibold mb-2">Drop TXT files here</h3>
              <p className="text-muted-foreground mb-4">
                or click to browse and select files
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
                accept=".txt"
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
                <div key={index} className="border rounded-lg p-4">
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
                      
                      <Button
                        onClick={() => downloadAsExcel(file)}
                        className="w-full sm:w-auto"
                        tabIndex={4 + index * 2}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download as Excel
                      </Button>
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
                <li>TXT files with comma, tab, pipe (|), or semicolon delimiters</li>
                <li>First row should contain column headers</li>
                <li>Maximum file size: 50MB per file</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab 1</kbd> - Select Files</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab 2</kbd> - Clear All</li>
                <li><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab 3+</kbd> - File actions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
};

export default Trading;
