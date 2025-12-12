import { API_BASE } from '../constants';
import { IAMetadata, IASearchResult, ViewCountData } from '../types';
import { getMockMetadata, getMockSearchResults, getMockViews } from './mockService';

const getSettings = () => {
  try {
    const settings = localStorage.getItem('omnidash_settings');
    return settings ? JSON.parse(settings) : {};
  } catch {
    return {};
  }
};

const isDemoMode = () => !!getSettings().demoMode;

const getProxiedUrl = (url: string) => {
  const { corsProxy } = getSettings();
  if (corsProxy && corsProxy.trim().length > 0) {
    return `${corsProxy}${encodeURIComponent(url)}`;
  }
  return url;
};

export const fetchMetadata = async (identifier: string): Promise<IAMetadata> => {
  if (isDemoMode()) {
    return new Promise(resolve => setTimeout(() => resolve(getMockMetadata(identifier)), 600));
  }

  const url = `${API_BASE.METADATA}/${identifier}`;
  const res = await fetch(getProxiedUrl(url));
  if (!res.ok) {
    throw new Error(`Failed to fetch metadata for ${identifier}: ${res.statusText}`);
  }
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
    return new Promise(resolve =>
      setTimeout(() => resolve({ items: mock, total: 1250, cursor: 'mock-cursor' }), 800)
    );
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
    console.warn(
      'Advanced Search failed (likely CORS). Attempting fallback to V1 Scrape API...',
      error
    );
    // Fallback: The Scrape API is much more CORS friendly.
    try {
      return await executeScrapeSearch(sanitizedQuery, null);
    } catch (fallbackError: unknown) {
      const msg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
      throw new Error(`Both search methods failed: ${msg}`);
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

  const res = await fetch(getProxiedUrl(url.toString()));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Advanced search failed (${res.status}): ${text.substring(0, 200)}`);
  }

  const data = await res.json();
  const docs = data.response?.docs || [];
  const numFound = data.response?.numFound || 0;
  const nextCursor = page * rows < numFound ? (page + 1).toString() : undefined;

  return {
    items: docs,
    cursor: nextCursor,
    total: numFound,
  };
};

const executeScrapeSearch = async (
  query: string,
  cursor: string | null
): Promise<SearchResponse> => {
  const url = new URL(API_BASE.SCRAPE);
  url.searchParams.append('q', query);
  url.searchParams.append('fields', 'identifier,title,mediatype,date,downloads,description');
  url.searchParams.append('sort', 'downloads desc');
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(getProxiedUrl(url.toString()));
  if (!res.ok) {
    throw new Error(`Scrape search failed (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  return {
    items: data.items || [],
    cursor: data.cursor,
    total: data.total,
  };
};

export const fetchViews = async (identifier: string): Promise<ViewCountData> => {
  if (isDemoMode()) {
    return new Promise(resolve => setTimeout(() => resolve(getMockViews()), 500));
  }

  const url = `${API_BASE.VIEWS}/${identifier}`;
  const res = await fetch(getProxiedUrl(url));
  if (!res.ok) {
    throw new Error(`Views fetch failed (${res.status}): ${res.statusText}`);
  }
  return await res.json();
};
