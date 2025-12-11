import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, FileText, Table, FileJson, Database, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SavedSnapshot } from '../types';
import { Button } from './ui/Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SavedSnapshot[];
}

type ExportFormat = 'text' | 'csv' | 'json' | 'xlsx' | 'sql';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, data }) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [content, setContent] = useState('');
  const [xlsxPreview, setXlsxPreview] = useState('');
  const [copied, setCopied] = useState(false);

  // Prepare data for export
  const getExportData = (forExcel = false) => {
    return data.map((item) => {
      let pageContent = item.content || '';
      // Excel has a cell character limit of 32,767 characters.
      // We truncate it to avoid file corruption for the XLSX format.
      if (forExcel && pageContent.length > 32000) {
        pageContent = pageContent.substring(0, 32000) + '...[TRUNCATED FOR EXCEL LIMIT]';
      }

      return {
        id: item.id,
        url: item.url,
        originalUrl: item.originalUrl,
        timestamp: item.timestamp,
        savedAtISO: new Date(item.savedAt).toISOString(),
        mimetype: item.mimetype,
        page_content: pageContent
      };
    });
  };

  useEffect(() => {
    if (isOpen) {
      generateContent(format);
    }
  }, [format, isOpen, data]);

  const generateContent = (fmt: ExportFormat) => {
    setContent('');
    setXlsxPreview('');

    const fullData = getExportData(false);
    const excelData = getExportData(true);

    switch (fmt) {
      case 'json':
        setContent(JSON.stringify(fullData, null, 2));
        break;
      case 'csv':
        const csvWs = XLSX.utils.json_to_sheet(fullData);
        // Using sheet_to_csv handles quoting and escaping better than manual string manipulation
        setContent(XLSX.utils.sheet_to_csv(csvWs));
        break;
      case 'text':
        setContent(generateText(fullData));
        break;
      case 'sql':
        setContent(generateSQL(fullData));
        break;
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(excelData);
        // Generate HTML table for preview
        const html = XLSX.utils.sheet_to_html(ws, { id: "xlsx-preview", header: "", footer: "" });
        setXlsxPreview(html);
        break;
    }
  };

  const generateText = (items: any[]) => {
    return items.map(item => `
==================================================
ID: ${item.id}
Original URL: ${item.originalUrl}
Wayback URL: ${item.url}
Timestamp: ${item.timestamp}
Saved At: ${item.savedAtISO}
MimeType: ${item.mimetype}
--------------------------------------------------
CONTENT PREVIEW:
${item.page_content.substring(0, 500)}${item.page_content.length > 500 ? '...' : ''}
==================================================
`).join('\n\n');
  };

  const generateSQL = (items: any[]) => {
    if (items.length === 0) return '-- No data to export';
    const tableName = 'snapshots';
    const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
  id VARCHAR(255) PRIMARY KEY,
  url TEXT,
  original_url TEXT,
  timestamp VARCHAR(20),
  saved_at VARCHAR(30),
  mimetype VARCHAR(50),
  page_content TEXT
);\n\n`;

    const inserts = items.map(item => {
      const values = Object.values(item)
        .map(val => {
           // Basic SQL escaping: replace single quotes with two single quotes
           const str = String(val).replace(/'/g, "''");
           return `'${str}'`;
        }) 
        .join(', ');
      return `INSERT INTO ${tableName} VALUES (${values});`;
    }).join('\n');

    return createTable + inserts;
  };

  const handleCopy = () => {
    let textToCopy = content;
    
    // For XLSX, we copy a TSV (Tab Separated Values) representation 
    // which allows pasting directly into Excel/Sheets
    if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(getExportData(true));
        textToCopy = XLSX.utils.sheet_to_csv(ws, { FS: "\t" });
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `omnidash_export_${timestamp}`;

    if (format === 'xlsx') {
      const excelData = getExportData(true);
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Snapshots");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else {
      const mimeTypes = {
        json: 'application/json',
        csv: 'text/csv',
        text: 'text/plain',
        sql: 'application/sql'
      };
      
      const blob = new Blob([content], { type: mimeTypes[format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 w-full max-w-5xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" /> Export Database
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-950/50 p-2 gap-1 border-b border-gray-800 overflow-x-auto shrink-0">
           {[
             { id: 'json', label: 'JSON', icon: FileJson },
             { id: 'csv', label: 'CSV', icon: Table },
             { id: 'text', label: 'Text', icon: FileText },
             { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
             { id: 'sql', label: 'SQL', icon: Database },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setFormat(tab.id as ExportFormat)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                 format === tab.id 
                   ? 'bg-gray-800 text-teal-400 border border-gray-700 shadow-sm' 
                   : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
               }`}
             >
               <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-0 overflow-hidden relative bg-gray-950">
          {format === 'xlsx' ? (
             <div className="w-full h-full overflow-auto p-6 bg-gray-100 text-gray-900">
                 {/* XLSX Preview Styling */}
                 <style>{`
                    table { border-collapse: collapse; width: 100%; font-size: 12px; font-family: sans-serif; }
                    th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    th { background-color: #f3f4f6; font-weight: bold; }
                 `}</style>
                 <div dangerouslySetInnerHTML={{ __html: xlsxPreview }} />
             </div>
          ) : (
            <textarea
              readOnly
              value={content}
              className="w-full h-full bg-gray-950 text-gray-300 font-mono text-xs p-6 resize-none focus:outline-none"
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-between items-center shrink-0">
            <div className="text-xs text-gray-500">
                Exporting {data.length} records. {format === 'xlsx' ? '(Content truncated to 32k chars)' : '(Full Content Included)'}
            </div>
            <div className="flex gap-3">
                <Button variant="secondary" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied' : 'Copy to Clipboard'}
                </Button>
                <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" /> Download File
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;