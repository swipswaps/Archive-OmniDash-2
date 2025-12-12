import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Settings as SettingsIcon,
  TestTube2,
  Info,
  Search,
  ArrowRight,
  X,
  Database,
  Globe,
} from 'lucide-react';
import { fetchViews, searchItems } from '../services/iaService';
import { AppView } from '../types';
import { Button } from '../components/ui/Button';

interface Props {
  // Optional: Allow switching views from here
  onChangeView?: (view: AppView) => void;
}

const AnalyticsDashboard: React.FC<Props> = ({ onChangeView }) => {
  const [identifier, setIdentifier] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCorsError, setIsCorsError] = useState(false);
  const [resolvedItem, setResolvedItem] = useState<{
    original: string;
    final: string;
    title?: string;
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const SUGGESTIONS = ['nasa', 'georgejung', 'grateful-dead', 'blockbuster-logo'];

  const extractId = (input: string) => {
    // If it's a URL, extract ID
    const match = input.match(/details\/([^/?#&]+)/);
    if (match) return match[1];
    return input.trim();
  };

  const isLikeDomain = (txt: string) =>
    /^[a-z0-9]+([\-[a-zA-Z0-9@+-]]{1}[a-z0-9]+)*[a-zA-Z0-9@+-][a-z]{2,5}$/i.test(txt);

  const processData = (rawData: any) => {
    // Filter out summary keys (all_time, last_7day, etc.) and keep only date keys (YYYYMMDD)
    return Object.entries(rawData)
      .filter(([key]) => /^[a-zA-Z0-9@+-]{8}$/.test(key))
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => {
        const year = key.substring(0, 4);
        const month = key.substring(4, 6);
        const day = key.substring(6, 8);
        return {
          date: `${year}-${month}-${day}`,
          views: Number(val) || 0,
        };
      });
  };

  const loadData = async (e?: React.FormEvent, idOverride?: string) => {
    if (e) e.preventDefault();
    let term = idOverride || identifier;
    let target = extractId(term);

    if (idOverride) setIdentifier(target);
    if (!target) return;

    setLoading(true);
    setError('');
    setIsCorsError(false);
    setResolvedItem(null);
    setData([]);

    try {
      let finalData: any[] = [];
      let initialError: Error | null = null;

      // 1. Attempt Direct Fetch
      try {
        const rawData = await fetchViews(target);
        finalData = processData(rawData);
      } catch (err: any) {
        initialError = err;
        // Don't throw yet, try resolution if it might be a keyword search
      }

      // 2. If direct fetch failed or returned no data, try Search Resolution
      if (finalData.reduce((acc, curr) => acc + curr.views, 0) === 0) {
        console.warn(
          `Direct fetch empty/failed for '${target}'. Attempting to resolve as search term...`
        );

        try {
          // We use the 'general' search which falls back to scrape if needed
          const searchRes = await searchItems(target, null, 'general');

          if (searchRes.items && searchRes.items.length > 0) {
            const bestMatch = searchRes.items[0];

            // Avoid infinite loop if best match is same as input and it already failed
            if (bestMatch.identifier !== target || initialError) {
              const resolvedRawData = await fetchViews(bestMatch.identifier);
              const resolvedChartData = processData(resolvedRawData);

              if (resolvedChartData.length > 0) {
                finalData = resolvedChartData;
                setResolvedItem({
                  original: target,
                  final: bestMatch.identifier,
                  title: bestMatch.title,
                });
                // Clear initial error since we resolved it
                initialError = null;
              }
            }
          }
        } catch (resolutionErr) {
          console.warn('Search resolution failed', resolutionErr);
        }
      }

      // 3. Final Check
      if (finalData.length === 0) {
        // If the input looks like a domain, the user probably wants Wayback analytics, not Item analytics.
        if (isLikeDomain(target)) {
          throw new Error(
            `'${target}' looks like a website domain. Item Analytics tracks Archive.org digital items (books, audio), not external websites. Use the Wayback Machine tool for website history.`
          );
        }
        if (initialError) throw initialError; // Throw the original error if we couldn't resolve
        throw new Error(
          'No view data found. The item Identifier might be incorrect, or the item has no recorded traffic.'
        );
      } else {
        setData(finalData);
      }
    } catch (e: any) {
      console.error(e);
      // Detect potential CORS or Network error
      if (
        e.message &&
        (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'))
      ) {
        setIsCorsError(true);
        setError('Connection failed. The Analytics API blocks direct browser access (CORS).');
      } else {
        setError(e.message || 'Failed to load analytics data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const enableDemoMode = () => {
    try {
      const current = localStorage.getItem('omnidash_settings');
      const parsed = current ? JSON.parse(current) : {};
      localStorage.setItem('omnidash_settings', JSON.stringify({ ...parsed, demoMode: true }));
      window.location.reload();
    } catch (_e) {
      console.error(_e);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 pb-6 mb-6 -mx-8 px-8 pt-1">
        <div className="flex justify-between items-start mb-4 pt-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-orange-400" />
              Item Analytics
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Visualize traffic trends for Archive.org items.
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`transition-colors p-2 rounded-lg ${showHelp ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
            title="Help"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {showHelp && (
          <div className="mb-4 bg-gray-800 p-4 rounded-xl border border-gray-700 text-sm text-gray-300 animate-in fade-in slide-in-from-top-1 shadow-lg">
            <p className="mb-2">
              <strong>How to use:</strong>
            </p>
            <p className="mb-2">
              Enter a valid <strong>Item Identifier</strong> (e.g.,{' '}
              <code>nasa_audio_collection</code>) to see its view counts over the last 30 days.
            </p>
            <p>
              If you don't know the ID, just type a <strong>Search Keyword</strong> (e.g., "Space")
              and we'll automatically find the most popular matching item for you.
            </p>
          </div>
        )}

        <form onSubmit={e => loadData(e)} className="flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none group-focus-within:text-orange-400 transition-colors" />
            <input
              className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-12 pr-10 py-3 text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none shadow-inner transition-all placeholder-gray-500 text-lg"
              placeholder="Enter Identifier (e.g. nasa) or Keywords"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
            />
            {identifier && (
              <button
                type="button"
                onClick={() => setIdentifier('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            isLoading={loading}
            className="px-8 rounded-xl bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/20 text-lg font-medium"
          >
            Analyze
          </Button>
        </form>

        <div className="flex items-center gap-3 text-sm mt-3">
          <span className="text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Try:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => loadData(undefined, s)}
                className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 px-2 py-1 rounded transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Error Handling UI */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 relative z-10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-400 font-bold mb-1">Request Failed</h4>
                <p className="text-gray-300 text-sm mb-3">{error}</p>

                {isCorsError ? (
                  <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 text-sm">
                    <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold">
                      <Lightbulb className="w-4 h-4" /> Solution: CORS Proxy
                    </div>
                    <p className="text-gray-400 mb-3">
                      The Analytics API blocks direct browser access. You must enable Demo Mode or
                      configure a Proxy in settings.
                    </p>
                    <div className="flex gap-3">
                      {onChangeView && (
                        <Button
                          variant="secondary"
                          onClick={() => onChangeView(AppView.SETTINGS)}
                          className="h-8 text-xs"
                        >
                          <SettingsIcon className="w-3 h-3 mr-1" /> Configure Proxy
                        </Button>
                      )}
                      <Button
                        onClick={enableDemoMode}
                        className="h-8 text-xs bg-yellow-600 hover:bg-yellow-500 text-white"
                      >
                        <TestTube2 className="w-3 h-3 mr-1" /> Enable Demo Mode
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {/* If it looks like a domain, suggest Wayback. Otherwise general help. */}
                    {identifier && isLikeDomain(identifier) ? (
                      <div className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20 flex gap-3">
                        <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-sm text-indigo-200 font-bold">
                            Want traffic stats for a website?
                          </p>
                          <p className="text-xs text-gray-400 mt-1 mb-2">
                            You might be looking for the Wayback Machine instead. This tool is for
                            Archive.org library items.
                          </p>
                          <Button
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500"
                            onClick={() => onChangeView && onChangeView(AppView.WAYBACK)}
                          >
                            Go to Wayback Tools <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400">
                          Not sure if "{identifier}" is the correct ID? Use the Item Lookup tool to
                          verify.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="text-xs h-8"
                            onClick={() => {
                              if (onChangeView) onChangeView(AppView.METADATA);
                            }}
                          >
                            <Database className="w-3 h-3 mr-1" /> Lookup Item ID
                          </Button>
                          <Button
                            variant="secondary"
                            className="text-xs h-8"
                            onClick={() => {
                              if (onChangeView) onChangeView(AppView.SCRAPING);
                            }}
                          >
                            <Search className="w-3 h-3 mr-1" /> Deep Search
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Auto-Resolution Banner */}
        {resolvedItem && !error && (
          <div className="mb-6 bg-teal-500/10 border border-teal-500/20 px-6 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shrink-0">
            <div className="bg-teal-500/20 p-1.5 rounded-full">
              <Search className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-sm">
              <span className="text-gray-400">
                We couldn't find stats for "{resolvedItem.original}", so we found the top
                match:{' '}
              </span>
              <strong className="text-teal-400">{resolvedItem.title || resolvedItem.final}</strong>
              <span className="text-gray-500 ml-2 font-mono text-xs">({resolvedItem.final})</span>
            </div>
          </div>
        )}

        {data.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
            <div className="lg:col-span-2 h-96 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-6">
                Daily Views Trend (Last 30 Days)
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      tickFormatter={val => val.slice(5)} // Show MM-DD
                    />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        color: '#f3f4f6',
                        borderRadius: '0.5rem',
                      }}
                      itemStyle={{ color: '#fb923c' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#f97316"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">
                  Total Views (Period)
                </h3>
                <div className="text-4xl font-bold text-white">
                  {data.reduce((acc, curr) => acc + curr.views, 0).toLocaleString()}
                </div>
                <div className="text-orange-400 text-sm mt-1 font-medium">
                  Recorded interactions
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Peak Day</h3>
                <div className="text-2xl font-bold text-white">
                  {data.length > 0 ? [...data].sort((a, b) => b.views - a.views)[0].date : '-'}
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  {data.length > 0
                    ? [...data].sort((a, b) => b.views - a.views)[0].views.toLocaleString()
                    : 0}{' '}
                  views
                </div>
              </div>

              {resolvedItem && (
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                  <h3 className="text-gray-500 text-xs font-bold uppercase mb-3">
                    View Item Details
                  </h3>
                  <Button
                    className="w-full bg-gray-700 hover:bg-gray-600"
                    onClick={() => {
                      window.open(`https://archive.org/details/${resolvedItem.final}`, '_blank');
                    }}
                  >
                    Open on Archive.org <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          !loading &&
          !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-6 opacity-60 min-h-[300px]">
              <div className="bg-gray-800 p-6 rounded-full">
                <BarChart3 className="w-16 h-16 text-orange-400" />
              </div>
              <div className="text-center max-w-md">
                <h3 className="text-lg font-bold text-white mb-2">Ready to Analyze</h3>
                <p className="text-sm leading-relaxed">
                  Enter an <strong>Identifier</strong> (like <code>nasa</code>) or a{' '}
                  <strong>Search Keyword</strong> (like "Apollo 11") to view popularity trends.
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
