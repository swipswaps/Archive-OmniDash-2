import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Sparkles, AlertTriangle, Lightbulb, Settings as SettingsIcon, TestTube2, Info, Search, ArrowRight, X } from 'lucide-react';
import { fetchViews, searchItems } from '../services/iaService';
import { AppSettings, AppView } from '../types';
import { Button } from '../components/ui/Button';

interface Props {
  settings: AppSettings;
  // Optional: Allow switching views from here
  onChangeView?: (view: AppView) => void;
}

const AnalyticsDashboard: React.FC<Props> = ({ settings, onChangeView }) => {
  const [identifier, setIdentifier] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCorsError, setIsCorsError] = useState(false);
  const [resolvedItem, setResolvedItem] = useState<{original: string, final: string, title?: string} | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const SUGGESTIONS = ['nasa', 'georgejung', 'grateful-dead', 'blockbuster-logo'];

  const extractId = (input: string) => {
      // If it's a URL, extract ID
      const match = input.match(/details\/([^/?#&]+)/);
      if (match) return match[1];
      return input.trim();
  };

  const processData = (rawData: any) => {
      // Filter out summary keys (all_time, last_7day, etc.) and keep only date keys (YYYYMMDD)
      return Object.entries(rawData)
        .filter(([key]) => /^\d{8}$/.test(key)) 
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, val]) => {
            const year = key.substring(0, 4);
            const month = key.substring(4, 6);
            const day = key.substring(6, 8);
            return {
                date: `${year}-${month}-${day}`,
                views: Number(val) || 0
            };
        });
  };

  const loadData = async (e?: React.FormEvent, idOverride?: string) => {
    if (e) e.preventDefault();
    let term = idOverride || identifier;
    
    // Auto-clean input
    let target = extractId(term);
    
    // If user clicked suggestion, update input
    if (idOverride) setIdentifier(target);
    if (!target) return;

    setLoading(true);
    setError('');
    setIsCorsError(false);
    setResolvedItem(null);
    setData([]);
    
    try {
      // Strategy:
      // 1. Try to fetch views directly (assuming input is an Identifier)
      // 2. If result is empty (all zeros), assume input might be a Search Term.
      // 3. Perform a Metadata Search to find the best matching Identifier.
      // 4. Fetch views for that resolved Identifier.

      let rawData = await fetchViews(target);
      let chartData = processData(rawData);

      // Check if data is effectively empty (common for invalid IDs that return 200 OK)
      const totalViews = chartData.reduce((acc, curr) => acc + curr.views, 0);

      if (totalViews === 0) {
          // Attempt Auto-Resolution
          console.log(`No views found for '${target}'. Attempting to resolve as search term...`);
          try {
              const searchRes = await searchItems(target, null, 'general');
              if (searchRes.items && searchRes.items.length > 0) {
                  const bestMatch = searchRes.items[0];
                  
                  // Only proceed if the ID is different or if we just want to be sure
                  if (bestMatch.identifier !== target) {
                      const resolvedRawData = await fetchViews(bestMatch.identifier);
                      const resolvedChartData = processData(resolvedRawData);
                      
                      // If the resolved item has data, or at least exists, switch to it
                      if (resolvedChartData.length > 0) {
                          chartData = resolvedChartData;
                          setResolvedItem({
                              original: target,
                              final: bestMatch.identifier,
                              title: bestMatch.title
                          });
                      }
                  }
              }
          } catch (resolutionErr) {
              console.warn("Search resolution failed", resolutionErr);
          }
      }
        
      if (chartData.length === 0) {
          // If still empty after resolution attempt
          setError('No view data found. The identifier may be incorrect, or the item has no recent traffic.');
      } else {
          setData(chartData);
      }
      
    } catch (e: any) {
      console.error(e);
      // Detect potential CORS or Network error
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
          setIsCorsError(true);
          setError('Connection failed. The Analytics API blocks direct browser access (CORS).');
      } else {
          setError('Failed to load analytics data.');
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
    } catch(e) { console.error(e); }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden shrink-0">
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
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
                    className={`transition-colors p-2 rounded-lg ${showHelp ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}
                    title="Help"
                >
                    <Info className="w-5 h-5" />
                </button>
            </div>
            
            {showHelp && (
                <div className="mb-6 bg-gray-900/80 p-4 rounded-xl border border-gray-700 text-sm text-gray-300 animate-in fade-in slide-in-from-top-1">
                    <p className="mb-2"><strong>How to use:</strong></p>
                    <p className="mb-2">Enter a valid <strong>Item Identifier</strong> (e.g., <code>nasa_audio_collection</code>) to see its view counts over the last 30 days.</p>
                    <p>If you don't know the ID, just type a <strong>Search Keyword</strong> (e.g., "Space") and we'll automatically find the most popular matching item for you.</p>
                </div>
            )}

            <form onSubmit={(e) => loadData(e)} className="flex gap-4 mb-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none group-focus-within:text-orange-400 transition-colors" />
                    <input 
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-12 pr-10 py-3 text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none shadow-inner transition-all placeholder-gray-500 text-lg" 
                        placeholder="Enter Identifier (e.g. nasa) or Keywords"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                    />
                    {identifier && (
                        <button
                            type="button"
                            onClick={() => setIdentifier('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <Button type="submit" isLoading={loading} className="px-8 rounded-xl bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/20 text-lg font-medium">
                    Analyze
                </Button>
            </form>

            <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Try:</span>
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

        {/* Error Handling UI */}
        {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 relative z-10">
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
                                    The Analytics API blocks direct browser access. You must enable Demo Mode or configure a Proxy in settings.
                                </p>
                                <div className="flex gap-3">
                                    {onChangeView && (
                                        <Button variant="secondary" onClick={() => onChangeView(AppView.SETTINGS)} className="h-8 text-xs">
                                            <SettingsIcon className="w-3 h-3 mr-1" /> Configure Proxy
                                        </Button>
                                    )}
                                    <Button onClick={enableDemoMode} className="h-8 text-xs bg-yellow-600 hover:bg-yellow-500 text-white">
                                        <TestTube2 className="w-3 h-3 mr-1" /> Enable Demo Mode
                                    </Button>
                                </div>
                            </div>
                        ) : (
                             <div className="mt-2 flex gap-2">
                                <Button 
                                    variant="secondary" 
                                    className="text-xs h-8"
                                    onClick={() => {
                                        // Try to help user by sending them to search
                                        if (onChangeView) onChangeView(AppView.SCRAPING);
                                    }}
                                >
                                    <Search className="w-3 h-3 mr-1" /> Search for "{identifier}" in Library
                                </Button>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Auto-Resolution Banner */}
      {resolvedItem && !error && (
          <div className="bg-teal-500/10 border border-teal-500/20 px-6 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shrink-0">
              <div className="bg-teal-500/20 p-1.5 rounded-full">
                <Search className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-sm">
                  <span className="text-gray-400">We couldn't find stats for "{resolvedItem.original}", so we found the top match: </span>
                  <strong className="text-teal-400">{resolvedItem.title || resolvedItem.final}</strong>
                  <span className="text-gray-500 ml-2 font-mono text-xs">({resolvedItem.final})</span>
              </div>
          </div>
      )}

      {data.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
                <div className="lg:col-span-2 h-96 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col">
                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-6">Daily Views Trend (Last 30 Days)</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#9ca3af" 
                            tick={{fontSize: 12}} 
                            tickFormatter={(val) => val.slice(5)} // Show MM-DD
                        />
                        <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem' }}
                            itemStyle={{ color: '#fb923c' }}
                        />
                        <Area type="monotone" dataKey="views" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Total Views (Period)</h3>
                        <div className="text-4xl font-bold text-white">
                            {data.reduce((acc, curr) => acc + curr.views, 0).toLocaleString()}
                        </div>
                        <div className="text-orange-400 text-sm mt-1 font-medium">Recorded interactions</div>
                    </div>
                    
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Peak Day</h3>
                        <div className="text-2xl font-bold text-white">
                            {data.length > 0 ? [...data].sort((a,b) => b.views - a.views)[0].date : '-'}
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                            {data.length > 0 ? [...data].sort((a,b) => b.views - a.views)[0].views.toLocaleString() : 0} views
                        </div>
                    </div>

                    {resolvedItem && (
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                            <h3 className="text-gray-500 text-xs font-bold uppercase mb-3">View Item Details</h3>
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
        </div>
      ) : (
         !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-6 opacity-60 min-h-[300px]">
                <div className="bg-gray-800 p-6 rounded-full">
                    <BarChart3 className="w-16 h-16 text-orange-400" />
                </div>
                <div className="text-center max-w-md">
                    <h3 className="text-lg font-bold text-white mb-2">Ready to Analyze</h3>
                    <p className="text-sm leading-relaxed">
                        Enter an <strong>Identifier</strong> (like <code>nasa</code>) or a <strong>Search Keyword</strong> (like "Apollo 11") to view popularity trends.
                    </p>
                </div>
            </div>
         )
      )}
    </div>
  );
};

export default AnalyticsDashboard;