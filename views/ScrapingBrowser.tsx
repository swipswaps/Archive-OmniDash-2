import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Download,
  ExternalLink,
  Loader2,
  Info,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Globe,
  TestTube2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { searchItems } from '../services/iaService';
import { IASearchResult, AppSettings, AppView } from '../types';
import { Button } from '../components/ui/Button';

interface Props {
  settings: AppSettings;
  initialQuery?: string;
  onClearQuery?: () => void;
  // Optional: Allow switching views from here if we detect user wants Wayback
  onChangeView?: (view: AppView) => void;
}

type SearchMode = 'general' | 'scrape';

const ScrapingBrowser: React.FC<Props> = ({
  settings,
  initialQuery,
  onClearQuery,
  onChangeView,
}) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('general');
  const [items, setItems] = useState<IASearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalFound, setTotalFound] = useState<number | undefined>(undefined);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with initialQuery if provided
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setMode('general');
      performSearch(initialQuery, true, 'general');
      if (onClearQuery) onClearQuery();
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string, isNew: boolean, searchMode: SearchMode) => {
    if (!searchQuery) return;
    setLoading(true);
    setError(null);

    try {
      const currentCursor = isNew ? null : cursor;
      const result = await searchItems(searchQuery, currentCursor, searchMode);

      setItems(prev => (isNew ? result.items : [...prev, ...result.items]));
      setCursor(result.cursor || null);
      setTotalFound(result.total);
      setHasSearched(true);

      if (isNew && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, true, mode);
  };

  const loadMore = () => {
    performSearch(query, false, mode);
  };

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode);
    setItems([]);
    setCursor(null);
    setHasSearched(false);
    setError(null);
  };

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `ia_results_${mode}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const enableDemoMode = () => {
    // Force enable demo mode in localStorage
    try {
      const current = localStorage.getItem('omnidash_settings');
      const parsed = current ? JSON.parse(current) : {};
      localStorage.setItem('omnidash_settings', JSON.stringify({ ...parsed, demoMode: true }));
      window.location.reload(); // Simple reload to pick up new settings context
    } catch (_e) {
      console.error(_e);
    }
  };

  const isUrlLike = (txt: string) => (txt.includes('.') || txt.includes(':')) && !txt.includes(' ');

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Deep Search Browser
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'general'
              ? 'Standard full-text search (for general keywords)'
              : 'Scrape API (for precise cursor-based iteration)'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-800 p-1 rounded-lg border border-gray-700 flex text-xs font-medium">
            <button
              onClick={() => handleModeChange('general')}
              className={`px-3 py-1.5 rounded-md transition-all ${mode === 'general' ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Standard
            </button>
            <button
              onClick={() => handleModeChange('scrape')}
              className={`px-3 py-1.5 rounded-md transition-all ${mode === 'scrape' ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Scrape API
            </button>
          </div>
          <Button
            onClick={handleExport}
            disabled={items.length === 0}
            variant="secondary"
            className="h-[38px]"
          >
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={
                mode === 'general'
                  ? 'Search for anything (e.g. sunelec.com, grateful dead)'
                  : 'Scrape Query (e.g. collection:nasa)'
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
          <Button type="submit" isLoading={loading} className="px-6">
            Search
          </Button>
        </form>
      </div>

      <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col shadow-inner relative">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"
        >
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in">
              <div className="bg-red-500/10 p-4 rounded-full mb-4">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Search Connection Failed</h3>
              <p className="text-sm text-gray-300 max-w-md mb-6 leading-relaxed">
                The Internet Archive API often blocks direct browser requests (CORS).
                <br />
                <span className="text-gray-500">Error: {error}</span>
              </p>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 max-w-lg mb-6 text-sm text-left">
                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Recommended Solution
                </h4>
                <p className="text-gray-400 mb-2">
                  Go to <strong>Settings</strong> and set a <strong>CORS Proxy</strong> (e.g.{' '}
                  <code>https://cors-anywhere.herokuapp.com/</code>).
                </p>
                <Button
                  variant="secondary"
                  className="w-full mt-2 text-xs h-8"
                  onClick={() => onChangeView && onChangeView(AppView.SETTINGS)}
                >
                  <SettingsIcon className="w-3 h-3 mr-1" /> Open Settings
                </Button>
              </div>

              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => performSearch(query, true, mode)}>
                  Retry
                </Button>
                <Button
                  variant="primary"
                  onClick={enableDemoMode}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white"
                >
                  <TestTube2 className="w-4 h-4" /> Enable Demo Mode
                </Button>
              </div>
            </div>
          )}

          {!error && items.length === 0 && hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center h-80 text-gray-500 animate-in fade-in">
              <div className="bg-gray-700/30 p-4 rounded-full mb-4">
                <Info className="w-8 h-8 opacity-70" />
              </div>
              <p className="text-lg font-medium text-white mb-2">No metadata found</p>

              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 max-w-md text-sm text-left space-y-3">
                {/* URL Hint - Crucial for users confusing Metadata search with Wayback */}
                {isUrlLike(query) && (
                  <div className="flex items-start gap-3 text-indigo-300 bg-indigo-500/10 p-3 rounded border border-indigo-500/20">
                    <Globe className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <strong>Looking for a web snapshot?</strong>
                      <p className="text-xs opacity-80 mt-1 mb-2">
                        This search tool looks for <i>Item Metadata</i> (books, movies, etc). For
                        website history, you need the Wayback Machine.
                      </p>
                      <button
                        className="underline font-bold"
                        onClick={e => {
                          e.preventDefault();
                          if (onChangeView) onChangeView(AppView.WAYBACK);
                        }}
                      >
                        Use the Wayback Machine Tool
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 text-gray-400">
                  <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tip:</strong> Try simplifying your keywords or removing special
                    characters.
                  </span>
                </div>

                {mode === 'scrape' && (
                  <div className="flex items-start gap-2 text-gray-400">
                    <RefreshCw className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <div>
                      The Scrape API is strict. <br />
                      <button
                        onClick={() => {
                          handleModeChange('general');
                          performSearch(query, true, 'general');
                        }}
                        className="text-teal-400 hover:underline font-medium"
                      >
                        Switch to Standard Search
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasSearched && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-600">
              <Search className="w-12 h-12 mb-4 opacity-30" />
              <p>Enter a query to begin searching</p>
            </div>
          )}

          {items.map((item, idx) => (
            <div
              key={`${item.identifier}-${idx}`}
              className="bg-gray-900/40 border border-gray-800/50 p-4 rounded-lg flex justify-between items-start hover:bg-gray-900 transition-colors group"
            >
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-teal-400 truncate max-w-lg" title={item.title}>
                    {item.title || item.identifier}
                  </h3>
                  {item.mediatype && (
                    <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded">
                      {item.mediatype}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                  {item.identifier}
                  {item.downloads !== undefined && (
                    <span className="text-gray-600">
                      • {item.downloads.toLocaleString()} downloads
                    </span>
                  )}
                </div>
                {item.description && (
                  <div className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {Array.isArray(item.description) ? item.description[0] : item.description}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs text-gray-500 font-medium">
                  {item.date?.toString().substring(0, 10)}
                </span>
                <a
                  href={`https://archive.org/details/${item.identifier}`}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-teal-500/20 text-gray-400 hover:text-teal-400 rounded-lg"
                  title="View on Archive.org"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-teal-500 w-8 h-8" />
            </div>
          )}

          {!loading && cursor && items.length > 0 && (
            <div className="flex justify-center pt-6 pb-2">
              <Button variant="secondary" onClick={loadMore} className="w-full max-w-xs">
                Load More Results
              </Button>
            </div>
          )}

          {!loading && !cursor && items.length > 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">End of results</div>
          )}
        </div>

        {items.length > 0 && (
          <div className="bg-gray-900 px-6 py-3 border-t border-gray-800 text-xs text-gray-400 flex justify-between items-center z-10">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500"></div>
              Showing {items.length.toLocaleString()}{' '}
              {totalFound ? `of ~${totalFound.toLocaleString()}` : ''} items
            </span>
            <span className="font-mono opacity-50">
              Mode: {mode.toUpperCase()} {cursor ? '| Next Cursor: Active' : '| End'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapingBrowser;
