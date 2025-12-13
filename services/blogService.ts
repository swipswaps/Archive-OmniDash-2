import { BlogEntry } from '../types';

/**
 * Parse JSON file containing blog entries
 */
export const parseJSONFile = async (file: File): Promise<BlogEntry[]> => {
  const text = await file.text();
  const data = JSON.parse(text);
  
  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error('Invalid JSON format. Expected { "entries": [...] }');
  }
  
  return data.entries;
};

/**
 * Parse XLSX file containing blog entries
 * Expected columns: id, title, slug, date, status, summary, content
 */
export const parseXLSXFile = async (file: File): Promise<BlogEntry[]> => {
  // For XLSX parsing, we'll use a simple CSV-like approach
  // In a real implementation, you'd use a library like xlsx or sheetjs
  const text = await file.text();
  const lines = text.split('\n');
  
  if (lines.length < 2) {
    throw new Error('XLSX/CSV file must have at least a header row and one data row');
  }
  
  const headers = lines[0].split('\t').map(h => h.trim());
  const requiredHeaders = ['id', 'title', 'slug', 'date', 'status', 'summary', 'content'];
  
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }
  
  const entries: BlogEntry[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split('\t');
    const entry: any = {};
    
    headers.forEach((header, idx) => {
      entry[header] = values[idx]?.trim() || '';
    });
    
    // Validate required fields
    if (entry.id && entry.title && entry.date) {
      entries.push({
        id: entry.id,
        title: entry.title,
        slug: entry.slug || entry.title.toLowerCase().replace(/\s+/g, '-'),
        date: entry.date,
        status: entry.status || 'published',
        summary: entry.summary || '',
        content: entry.content || ''
      });
    }
  }
  
  return entries;
};

/**
 * Merge new entries with existing ones, avoiding duplicates
 */
export const mergeEntries = (existing: BlogEntry[], newEntries: BlogEntry[]): BlogEntry[] => {
  const existingIds = new Set(existing.map(e => e.id));
  const uniqueNew = newEntries.filter(e => !existingIds.has(e.id));
  
  // Combine and sort by date (newest first)
  return [...existing, ...uniqueNew].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

/**
 * Save blog entries to localStorage
 */
export const saveBlogEntries = (entries: BlogEntry[], series: string, author: string): void => {
  localStorage.setItem('blog_entries', JSON.stringify({
    series,
    author,
    entries
  }));
};

/**
 * Load blog entries from localStorage
 */
export const loadBlogEntries = (defaultData: any): BlogEntry[] => {
  try {
    const saved = localStorage.getItem('blog_entries');
    if (saved) {
      const data = JSON.parse(saved);
      return data.entries || defaultData.entries;
    }
  } catch (error) {
    console.error('Failed to load blog entries from localStorage:', error);
  }
  return defaultData.entries;
};

/**
 * Export blog entries to JSON file
 */
export const exportToJSON = (entries: BlogEntry[], series: string, author: string): void => {
  const data = {
    series,
    author,
    entries
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blog-posts-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export blog entries to CSV file
 */
export const exportToCSV = (entries: BlogEntry[]): void => {
  const headers = ['id', 'title', 'slug', 'date', 'status', 'summary', 'content'];
  const rows = entries.map(entry => [
    entry.id,
    entry.title,
    entry.slug,
    entry.date,
    entry.status,
    entry.summary,
    entry.content.replace(/\n/g, ' ')
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blog-posts-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

