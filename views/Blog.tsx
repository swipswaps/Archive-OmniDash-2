import React, { useState } from 'react';
import { Calendar, User, ArrowLeft, BookOpen, Clock, Tag, FileText, FileJson, Table, Database, FileSpreadsheet, X } from 'lucide-react';
import { BlogEntry } from '../types';
import blogData from '../data/blog_entries.json';

interface BlogProps {
  onChangeView?: (view: any) => void;
}

type ExportFormat = 'json' | 'csv' | 'text' | 'xlsx' | 'sql';

const Blog: React.FC<BlogProps> = () => {
  const [selectedEntry, setSelectedEntry] = useState<BlogEntry | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportContent, setExportContent] = useState('');
  const [xlsxPreview, setXlsxPreview] = useState('');
  const entries = blogData.entries;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const formatInlineCode = (text: string) => {
    // Handle inline code with single backticks
    const parts: (string | JSX.Element)[] = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add inline code
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-teal-300 font-mono text-sm">
          {match[1]}
        </code>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const formatContent = (content: string) => {
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    // Regex to match code blocks: ```language\ncode\n```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > currentIndex) {
        const textBefore = content.substring(currentIndex, match.index);
        textBefore.split('\n\n').forEach((paragraph, idx) => {
          if (paragraph.trim()) {
            elements.push(
              <p key={`p-${currentIndex}-${idx}`} className="mb-4 text-gray-300 leading-relaxed text-lg">
                {paragraph.split('\n').map((line, lineIdx) => (
                  <React.Fragment key={lineIdx}>
                    {formatInlineCode(line)}
                    {lineIdx < paragraph.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            );
          }
        });
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2];
      elements.push(
        <div key={`code-${match.index}`} className="mb-6 rounded-lg overflow-hidden border border-gray-700">
          {language && (
            <div className="bg-gray-900 px-4 py-2 text-xs text-gray-400 font-mono border-b border-gray-700">
              {language}
            </div>
          )}
          <pre className="bg-gray-900 p-4 overflow-x-auto">
            <code className="text-sm font-mono text-teal-300">
              {code}
            </code>
          </pre>
        </div>
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text after last code block
    if (currentIndex < content.length) {
      const textAfter = content.substring(currentIndex);
      textAfter.split('\n\n').forEach((paragraph, idx) => {
        if (paragraph.trim()) {
          elements.push(
            <p key={`p-${currentIndex}-${idx}`} className="mb-4 text-gray-300 leading-relaxed text-lg">
              {paragraph.split('\n').map((line, lineIdx) => (
                <React.Fragment key={lineIdx}>
                  {formatInlineCode(line)}
                  {lineIdx < paragraph.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        }
      });
    }

    return elements;
  };

  // Export functions
  const jsonToCSV = (items: BlogEntry[]) => {
    if (items.length === 0) return '';
    const headers = ['id', 'title', 'slug', 'date', 'status', 'summary', 'content'];
    const csvRows = [
      headers.join(','),
      ...items.map(entry =>
        headers.map(header => {
          const val = entry[header as keyof BlogEntry] || '';
          const escaped = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
          return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ];
    return csvRows.join('\n');
  };

  const generateText = (items: BlogEntry[]) => {
    return items
      .map(
        entry => `
==================================================
ID: ${entry.id}
Title: ${entry.title}
Slug: ${entry.slug}
Date: ${entry.date}
Status: ${entry.status}
--------------------------------------------------
SUMMARY:
${entry.summary}
--------------------------------------------------
CONTENT:
${entry.content}
==================================================
`
      )
      .join('\n\n');
  };

  const generateSQL = (items: BlogEntry[]) => {
    if (items.length === 0) return '-- No data to export';
    const tableName = 'blog_posts';
    const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT,
  slug VARCHAR(255),
  date DATE,
  status VARCHAR(50),
  summary TEXT,
  content TEXT
);\n\n`;

    const inserts = items
      .map(entry => {
        const valArray = [
          entry.id,
          entry.title,
          entry.slug,
          entry.date,
          entry.status,
          entry.summary,
          entry.content,
        ];

        const values = valArray
          .map(val => {
            const str = String(val).replace(/'/g, "''");
            return `'${str}'`;
          })
          .join(', ');
        return `INSERT INTO ${tableName} VALUES (${values});`;
      })
      .join('\n');

    return createTable + inserts;
  };

  const generateExcelPreview = (items: BlogEntry[]) => {
    if (items.length === 0) {
      setXlsxPreview('<p>No data to preview</p>');
      return;
    }

    const headers = ['id', 'title', 'slug', 'date', 'status', 'summary', 'content'];
    let html = '<table id="xlsx-preview"><thead><tr>';
    headers.forEach(h => {
      html += `<th>${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    items.forEach(entry => {
      html += '<tr>';
      headers.forEach(h => {
        const val = entry[h as keyof BlogEntry] || '';
        const escaped = String(val).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Truncate content for preview
        const displayVal = escaped.length > 100 ? escaped.substring(0, 100) + '...' : escaped;
        html += `<td title="${escaped}">${displayVal}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    setXlsxPreview(html);
  };

  const generateExportContent = async (format: ExportFormat) => {
    const data = {
      series: blogData.series,
      author: blogData.author,
      entries: entries
    };

    setExportContent('');
    setXlsxPreview('');

    switch (format) {
      case 'json':
        setExportContent(JSON.stringify(data, null, 2));
        break;
      case 'csv':
        setExportContent(jsonToCSV(entries));
        break;
      case 'text':
        setExportContent(generateText(entries));
        break;
      case 'sql':
        setExportContent(generateSQL(entries));
        break;
      case 'xlsx':
        generateExcelPreview(entries);
        break;
    }
  };

  const handleOpenExport = () => {
    setExportFormat('json');
    generateExportContent('json');
    setShowExportModal(true);
  };

  const handleExportFormatChange = (format: ExportFormat) => {
    setExportFormat(format);
    generateExportContent(format);
  };

  const handleDownloadExport = async () => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (exportFormat === 'xlsx') {
      // Dynamic import of ExcelJS
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Blog Posts');

      if (entries.length > 0) {
        const headers = ['id', 'title', 'slug', 'date', 'status', 'summary', 'content'];
        worksheet.addRow(headers);

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data rows
        entries.forEach(entry => {
          worksheet.addRow([
            entry.id,
            entry.title,
            entry.slug,
            entry.date,
            entry.status,
            entry.summary,
            entry.content
          ]);
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell?.({ includeEmpty: false }, cell => {
            const length = cell.value ? String(cell.value).length : 0;
            maxLength = Math.max(maxLength, length);
          });
          column.width = Math.min(maxLength + 2, 50);
        });
      }

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blog-posts-${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const mimeTypes: Record<string, string> = {
        json: 'application/json',
        csv: 'text/csv',
        text: 'text/plain',
        sql: 'application/sql',
      };
      const extensions: Record<string, string> = {
        json: 'json',
        csv: 'csv',
        text: 'txt',
        sql: 'sql',
      };

      const blob = new Blob([exportContent], { type: mimeTypes[exportFormat] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blog-posts-${timestamp}.${extensions[exportFormat]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyExport = async () => {
    let textToCopy = exportContent;

    // For XLSX, copy as TSV (Tab Separated Values)
    if (exportFormat === 'xlsx') {
      if (entries.length > 0) {
        const headers = ['id', 'title', 'slug', 'date', 'status', 'summary', 'content'];
        const tsvRows = [
          headers.join('\t'),
          ...entries.map(entry => headers.map(h => entry[h as keyof BlogEntry] || '').join('\t'))
        ];
        textToCopy = tsvRows.join('\n');
      }
    }

    await navigator.clipboard.writeText(textToCopy);
  };

  if (selectedEntry) {
    const currentIndex = entries.findIndex(e => e.id === selectedEntry.id);
    // prevEntry = newer post (lower index), nextEntry = older post (higher index)
    const prevEntry = currentIndex > 0 ? entries[currentIndex - 1] : null;
    const nextEntry = currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;

    return (
      <div className="h-full flex flex-col overflow-auto">
        <div className="max-w-4xl mx-auto w-full">
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedEntry(null)}
              className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all posts</span>
            </button>
          </div>

          {/* Article */}
          <article className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Hero header */}
            <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 border-b border-gray-700 p-8 md:p-12">
              <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-4">
                <Tag className="w-4 h-4" />
                <span>{blogData.series}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                {selectedEntry.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedEntry.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{blogData.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{getReadingTime(selectedEntry.content)} min read</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12">
              <div className="prose prose-invert prose-lg max-w-none">
                {formatContent(selectedEntry.content)}
              </div>
            </div>

            {/* Navigation footer */}
            <div className="border-t border-gray-700 p-6 bg-gray-800/50">
              <div className="flex justify-between gap-4">
                {prevEntry ? (
                  <button
                    onClick={() => setSelectedEntry(prevEntry)}
                    className="text-left p-4 rounded-lg border border-gray-700 hover:border-teal-500/50 hover:bg-gray-700/50 transition-all group flex-1 max-w-md"
                  >
                    <div className="text-xs text-gray-500 mb-1">← Previous Post</div>
                    <div className="text-white font-medium group-hover:text-teal-400 transition-colors">
                      {prevEntry.title}
                    </div>
                  </button>
                ) : (
                  <div className="flex-1"></div>
                )}
                {nextEntry ? (
                  <button
                    onClick={() => setSelectedEntry(nextEntry)}
                    className="text-right p-4 rounded-lg border border-gray-700 hover:border-teal-500/50 hover:bg-gray-700/50 transition-all group flex-1 max-w-md"
                  >
                    <div className="text-xs text-gray-500 mb-1">Next Post →</div>
                    <div className="text-white font-medium group-hover:text-teal-400 transition-colors">
                      {nextEntry.title}
                    </div>
                  </button>
                ) : (
                  <div className="flex-1"></div>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/10 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{blogData.series}</h1>
              <p className="text-sm text-gray-500 mt-1">{entries.length} posts</p>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={handleOpenExport}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-lg text-teal-400 transition-colors"
            title="Export blog posts"
          >
            <FileText className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        <p className="text-gray-400">Technical insights and lessons learned from building Archive-OmniDash</p>
      </div>

      {/* Blog entries list */}
      <div className="grid gap-6 overflow-auto pb-4">
        {entries.map((entry, idx) => (
          <article
            key={entry.id}
            className="bg-gray-800 rounded-xl border border-gray-700 hover:border-teal-500/50 transition-all group overflow-hidden"
          >
            <div className="p-6">
              {/* Post number badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-teal-400">
                    <Tag className="w-3 h-3" />
                    <span>{blogData.series}</span>
                  </div>
                  {entry.status === 'draft' && (
                    <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                      Draft
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{getReadingTime(entry.content)} min</span>
                </div>
              </div>

              <div onClick={() => setSelectedEntry(entry)} className="cursor-pointer">
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">
                  {entry.title}
                </h2>

                <p className="text-gray-400 mb-4 leading-relaxed line-clamp-2">
                  {entry.summary}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(entry.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{blogData.author}</span>
                    </div>
                  </div>

                  <span className="text-teal-400 text-sm font-medium group-hover:underline flex items-center gap-1">
                    Read article
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p>No blog posts available yet.</p>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-5xl w-full h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
              <h3 className="text-xl font-bold text-white">Export Blog Posts</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
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
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleExportFormatChange(tab.id as ExportFormat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    exportFormat === tab.id
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
              {exportFormat === 'xlsx' ? (
                <div className="w-full h-full overflow-auto p-0 bg-white text-gray-900">
                  <style>{`
                    #xlsx-preview { border-collapse: collapse; font-size: 12px; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; width: 100%; table-layout: fixed; }
                    #xlsx-preview td, #xlsx-preview th { border: 1px solid #e5e7eb; padding: 4px 8px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; height: 28px; box-sizing: border-box; }
                    #xlsx-preview td { max-width: 300px; color: #1f2937; }
                    #xlsx-preview th { background-color: #f9fafb; font-weight: 600; color: #374151; position: sticky; top: 0; z-index: 10; box-shadow: 0 1px 0 #e5e7eb; }
                    #xlsx-preview tr:nth-child(even) { background-color: #f9fafb; }
                    #xlsx-preview tr:hover { background-color: #eff6ff; }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: xlsxPreview }} />
                </div>
              ) : (
                <textarea
                  readOnly
                  value={exportContent}
                  className="w-full h-full bg-gray-950 text-gray-300 font-mono text-xs p-6 resize-none focus:outline-none"
                  spellCheck={false}
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-between items-center shrink-0">
              <div className="text-xs text-gray-500">
                Exporting {entries.length} blog post{entries.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyExport}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Copy to Clipboard
                </button>
                <button
                  onClick={handleDownloadExport}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white transition-colors"
                >
                  <FileJson className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;

