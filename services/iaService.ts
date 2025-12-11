import { API_BASE } from '../constants';
import { IAMetadata, IASearchResult, ViewCountData } from '../types';
import { getMockMetadata, getMockSearchResults, getMockViews } from './mockService';

const getSettings = () => {
  try {
    const settings = localStorage.getItem('omnidash_settings');
    return settings ? JSON.parse(settings) : {};
  } catch(e) { return {}; }
};

const isDemoMode = () => !!getSettings().demoMode;

const getProxiedUrl = (url: string) => {
  const { corsProxy } = getSettings();
  if (corsProxy && corsProxy.trim().length > 0) {
      return `${corsProxy}${url}`;
  }
  return url;
};

export const fetchMetadata = async (identifier: string): Promise<IAMetadata> => {
  if (isDemoMode()) {
    return new Promise(resolve => setTimeout(() => resolve(getMockMetadata(identifier)), 600));
  }

  const res = await fetch(getProxiedUrl(`${API_BASE.METADATA}/${identifier}`));
  if (!res.ok) throw new Error(`Metadata fetch failed: ${res.statusText}`);
  return await res.json();
};

export interface SearchResponse {
  items: IASearchResult[];
  cursor?: string;
  total?: number;
}

// Helper to sanitize queries for Solr
const sanitizeQuery = (query: string): string => {
  let q = query.trim();
  // Remove protocol
  q = q.replace(/^https?:\/\//, '');
  if (q.endsWith('/')) q = q.slice(0, -1);
  
  // If it contains dots (like a domain) but no spaces/quotes, quote it
  if (q.includes('.') && !q.includes(' ') && !q.includes('"') && !q.includes(':')) {
    return `"${q}"`;
  }
  return q;
};

export const searchItems = async (
  query: string, 
  cursor: string | null, 
  mode: 'general' | 'scrape' = 'general'
): Promise<SearchResponse> => {
  
  // Only use mock data if explicitly enabled in settings
  if (isDemoMode()) {
    const mock = getMockSearchResults(query);
    return new Promise(resolve => setTimeout(() => resolve({ items: mock, total: 1250, cursor: 'mock-cursor' }), 800));
  }

  const sanitizedQuery = sanitizeQuery(query);

  // 1. Explicit Scrape Mode (User selected "Scrape API")
  if (mode === 'scrape') {
    return executeScrapeSearch(sanitizedQuery, cursor);
  }

  // 2. General Mode (Try Advanced Search, Fallback to Scrape if it fails)
  try {
    return await executeAdvancedSearch(sanitizedQuery, cursor ? parseInt(cursor) : 1);
  } catch (error) {
    console.warn("Advanced Search failed (likely CORS). Attempting fallback to V1 Scrape API...", error);
    // Fallback: The Scrape API is much more CORS friendly. 
    // We try to fetch the first page of results using the scrape API instead.
    try {
        return await executeScrapeSearch(sanitizedQuery, null); // Cursor logic differs, so we reset cursor for fallback
    } catch (fallbackError: any) {
        throw new Error(`Search failed: ${fallbackError.message || "Connection refused"}`);
    }
  }
};

const executeAdvancedSearch = async (query: string, page: number): Promise<SearchResponse> => {
  const rows = 50;
  const url = new URL(API_BASE.SEARCH);
  url.searchParams.append('q', query);
  
  ['identifier', 'title', 'mediatype', 'date', 'downloads', 'description'].forEach(field => {
    url.searchParams.append('fl[]', field);
  });

  url.searchParams.append('rows', rows.toString());
  url.searchParams.append('page', page.toString());
  url.searchParams.append('output', 'json');
  
  if (!query.includes('sort:')) {
      url.searchParams.append('sort[]', 'downloads desc');
  }

  // Use proxy helper
  const res = await fetch(getProxiedUrl(url.toString()));
  if (!res.ok) {
      const text = await res.text();
      // Solr errors are often HTML, we want a clean message
      if (text.includes('<html')) throw new Error(`Search API returned ${res.status} (Solr Syntax Error)`);
      throw new Error(`Search API returned ${res.status}`);
  }
  
  const data = await res.json();
  const docs = data.response?.docs || [];
  const numFound = data.response?.numFound || 0;
  const nextCursor = (page * rows < numFound) ? (page + 1).toString() : undefined;

  return { 
    items: docs, 
    cursor: nextCursor,
    total: numFound 
  };
};

const executeScrapeSearch = async (query: string, cursor: string | null): Promise<SearchResponse> => {
  const url = new URL(API_BASE.SCRAPE);
  url.searchParams.append('q', query);
  url.searchParams.append('fields', 'identifier,title,mediatype,date,downloads,description');
  // Sort is hardcoded in scrape API usually, but we can try basic sort
  url.searchParams.append('sort', 'downloads desc'); 
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(getProxiedUrl(url.toString()));
  if (!res.ok) throw new Error(`V1 API returned ${res.status}`);
  
  const data = await res.json();
  return { 
    items: data.items || [], 
    cursor: data.cursor,
    total: data.total 
  };
};

export const fetchViews = async (identifier: string): Promise<ViewCountData> => {
  if (isDemoMode()) {
    return new Promise(resolve => setTimeout(() => resolve(getMockViews()), 500));
  }

  const res = await fetch(getProxiedUrl(`${API_BASE.VIEWS}/${identifier}`));
  if (!res.ok) throw new Error(`Views fetch failed`);
  return await res.json();
};