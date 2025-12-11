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
  const [copied, setCopied] = useState(false);

  // Strip large HTML content for metadata export to prevent UI lag
  const getCleanData = () => {
    return data.map(({ content, ...rest }) => ({
      ...rest,
      savedAtISO: new Date(rest.savedAt).toISOString()
    }));
  };

  useEffect(() => {
    if (isOpen) {
      generateContent(format);
    }
  }, [format, isOpen, data]);

  const generateContent = (fmt: ExportFormat) => {
    const cleanData = getCleanData();

    switch (fmt) {
      case 'json':
        setContent(JSON.stringify(cleanData, null, 2));
        break;
      case 'csv':
        setContent(generateCSV(cleanData));
        break;
      case 'text':
        setContent(generateText(cleanData));
        break;
      case 'sql':
        setContent(generateSQL(cleanData));
        break;
      case 'xlsx':
        setContent("Binary Excel file ready for download.\n\nPreview not available for binary formats.");
        break;
    }
  };

  const generateCSV = (items: any[]) => {
    if (items.length === 0) return '';
    const headers = Object.keys(items[0]).join(',');
    const rows = items.map(item => Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    return [headers, ...rows].join('\n');
  };

  const generateText = (items: any[]) => {
    return items.map(item => `
--------------------------------------------------
ID: ${item.id}
Original URL: ${item.originalUrl}
Wayback URL: ${item.url}
Timestamp: ${item.timestamp}
Saved At: ${item.savedAtISO}
MimeType: ${item.mimetype}
--------------------------------------------------
`).join('');
  };

  const generateSQL = (items: any[]) => {
    if (items.length === 0) return '-- No data to export';
    const tableName = 'snapshots';
    const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
  id VARCHAR(255) PRIMARY KEY,
  url TEXT,
  original_url TEXT,
  timestamp VARCHAR(20),
  saved_at BIGINT,
  mimetype VARCHAR(50)
);\n\n`;

    const inserts = items.map(item => {
      const values = Object.values(item)
        .map(val => `'${String(val).replace(/'/g, "''")}'`) // Simple SQL escaping
        .join(', ');
      return `INSERT INTO ${tableName} VALUES (${values});`;
    }).join('\n');

    return createTable + inserts;
  };

  const handleCopy = () => {
    if (format === 'xlsx') return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const cleanData = getCleanData();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `omnidash_export_${timestamp}`;

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(cleanData);
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
      <div className="bg-gray-900 w-full max-w-4xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" /> Export Database
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-950/50 p-2 gap-1 border-b border-gray-800 overflow-x-auto">
           {[
             { id: 'text', label: 'Text', icon: FileText },
             { id: 'csv', label: 'CSV', icon: Table },
             { id: 'json', label: 'JSON', icon: FileJson },
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
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <FileSpreadsheet className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Preview not available for binary XLSX.</p>
                <p className="text-sm">Click "Download File" to save the spreadsheet.</p>
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
        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-between items-center">
            <div className="text-xs text-gray-500">
                Exporting {data.length} records. (Content HTML excluded)
            </div>
            <div className="flex gap-3">
                {format !== 'xlsx' && (
                    <Button variant="secondary" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copied' : 'Copy to Clipboard'}
                    </Button>
                )}
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