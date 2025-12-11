import React, { useState, useRef, useEffect } from 'react';
import { Globe, Camera, Calendar, CheckCircle, XCircle, AlertTriangle, ExternalLink, Loader2, Trash2, Search, BarChart3, Clock, X, Filter, Download, Database, Play, Settings as SettingsIcon, FileDown, Eye, Maximize2, Minimize2, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { checkAvailability, savePageNow, fetchCDX, downloadSnapshotContent } from '../services/waybackService';
import { storageService } from '../services/storageService';
import { AppSettings, WaybackAvailability, CDXRecord, SavedSnapshot, AppView } from '../types';
import { Button } from '../components/ui/Button';
import ExportModal from '../components/ExportModal';

interface Props {
  settings: AppSettings;
  onChangeView?: (view: AppView) => void;
}

interface SaveRequestItem {
  id: string;
  url: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  timestamp: Date;
}

const WaybackTools: React.FC<Props> = ({ settings, onChangeView }) => {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'available' | 'save' | 'cdx' | 'saved'>('available');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<WaybackAvailability | null>(null);
  const [cdxData, setCdxData] = useState<CDXRecord[]>([]);
  const [saveHistory, setSaveHistory] = useState<SaveRequestItem[]>([]);
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Modal States
  const [previewSnapshot, setPreviewSnapshot] = useState<SavedSnapshot | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved snapshots when switching to 'saved' mode
  useEffect(() => {
    if (mode === 'saved') {
      loadSavedSnapshots();
    }
  }, [mode]);

  const loadSavedSnapshots = async () => {
    try {
      const snaps = await storageService.getAllSnapshots();
      setSavedSnapshots(snaps);
    } catch (e) {
      console.error("Failed to load snapshots", e);
    }
  };

  const handleAction = async (e?: React.FormEvent, overrideMode?: 'available' | 'save' | 'cdx' | 'saved') => {
    if (e) e.preventDefault();
    setError(null);

    const activeMode = overrideMode || mode;
    if (overrideMode) setMode(overrideMode);

    if (activeMode === 'saved') {
        loadSavedSnapshots();
        return;
    }

    // Basic URL cleanup
    let targetUrl = url.trim();
    if (!targetUrl) {
        inputRef.current?.focus();
        return;
    }
    
    // Auto-prepend http if missing (heuristic)
    if (!targetUrl.startsWith('http') && targetUrl.includes('.')) {
        targetUrl = 'http://' + targetUrl;
        setUrl(targetUrl); 
    }

    setLoading(true);
    setHasSearched(false);
    setSelectedYear(null);

    // Reset data for the current mode to show fresh loading state
    if (activeMode === 'available') setAvailability(null);
    if (activeMode === 'cdx') setCdxData([]);

    try {
        if (activeMode === 'available') {
            const res = await checkAvailability(targetUrl);
            setAvailability(res);
        } else if (activeMode === 'save') {
            const newItem: SaveRequestItem = {
                id: Date.now().toString(),
                url: targetUrl,
                status: 'pending',
                timestamp: new Date()
            };
            setSaveHistory(prev => [newItem, ...prev]);

            try {
                const res = await savePageNow(targetUrl, settings.accessKey, settings.secretKey);
                setSaveHistory(prev => prev.map(item => 
                    item.id === newItem.id 
                    ? { ...item, status: 'success', message: res.message }
                    : item
                ));
            } catch (err: any) {
                setSaveHistory(prev => prev.map(item => 
                    item.id === newItem.id 
                    ? { ...item, status: 'error', message: err.message || "Capture failed" }
                    : item
                ));
            }
        } else if (activeMode === 'cdx') {
            // Fetch more items for better browsing (3000)
            const res = await fetchCDX(targetUrl, 3000);
            setCdxData(res);
        }
    } catch (e: any) {
        console.error("Wayback Tool Error:", e);
        if (activeMode !== 'save') {
             let msg = e.message || "An unexpected error occurred.";
             if (e.message.includes('Failed to fetch')) {
                 msg = "Network Error: Could not reach Archive.org. Try enabling Demo Mode in Settings if this persists.";
             }
             setError(msg);
        }
    } finally {
        setLoading(false);
        setHasSearched(true);
    }
  };

  const handleDownload = async (row: CDXRecord) => {
      // Create a unique key for UI state
      const dlKey = `${row.timestamp}-${row.original}`;
      setDownloadingId(dlKey);
      
      try {
          const waybackUrl = `https://web.archive.org/web/${row.timestamp}/${row.original}`;
          const content = await downloadSnapshotContent(waybackUrl);
          
          const snapshot: SavedSnapshot = {
              id: dlKey,
              url: waybackUrl,
              originalUrl: row.original,
              timestamp: row.timestamp,
              savedAt: Date.now(),
              mimetype: row.mimetype,
              content: content
          };

          await storageService.saveSnapshot(snapshot);
          // Show quick success state
          const btn = document.getElementById(`btn-dl-${dlKey}`);
          if (btn) btn.classList.add('text-green-500');
          setTimeout(() => {
              if (btn) btn.classList.remove('text-green-500');
          }, 2000);
      } catch (e: any) {
          console.error(e);
          setError(e.message || "Download Failed");
      } finally {
          setDownloadingId(null);
      }
  };

  const handleSaveToLibrary = async () => {
    if (!availability?.archived_snapshots?.closest) return;
    const snap = availability.archived_snapshots.closest;
    const dlKey = 'latest-save';
    
    setDownloadingId(dlKey);
    setError(null);

    try {
        const content = await downloadSnapshotContent(snap.url);
        
        const dbId = `${snap.timestamp}-${availability.url}`;
        const snapshot: SavedSnapshot = {
            id: dbId,
            url: snap.url,
            originalUrl: availability.url,
            timestamp: snap.timestamp,
            savedAt: Date.now(),
            mimetype: 'text/html',
            content: content
        };

        await storageService.saveSnapshot(snapshot);
        alert("Success! Snapshot saved to the 'Saved Snapshots' tab.");
    } catch (e: any) {
        setError(e.message || "Save Failed");
    } finally {
        setDownloadingId(null);
    }
  };

  const handleExportLatest = async () => {
    if (!availability?.archived_snapshots?.closest) return;
    const snap = availability.archived_snapshots.closest;
    const dlKey = 'latest-export';
    setDownloadingId(dlKey);
    setError(null);

    try {
        const content = await downloadSnapshotContent(snap.url);
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wayback-${snap.timestamp}-${availability.url.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e: any) {
        setError(e.message || "Download Failed");
    } finally {
        setDownloadingId(null);
    }
  };

  const handlePreviewSnapshot = (snapshot: SavedSnapshot) => {
      setPreviewSnapshot(snapshot);
  };

  const getPreviewContent = (snap: SavedSnapshot) => {
      // Inject <base> tag to fix relative links/images by pointing them to the live Wayback Machine URL
      // This allows the saved HTML to render images/CSS that are not saved locally.
      const baseTag = `<base href="${snap.url}" target="_blank" />`;
      
      // Inject standard styles to ensure readability if CSS fails
      const styleTag = `<style>body { background: white; color: black; font-family: sans-serif; }</style>`;

      let html = snap.content;
      if (html.toLowerCase().includes('<head>')) {
          html = html.replace(/<head>/i, `<head>${baseTag}${styleTag}`);
      } else {
          html = `${baseTag}${styleTag}${html}`;
      }
      return html;
  };

  const handleExportSnapshot = (snapshot: SavedSnapshot) => {
      const blob = new Blob([snapshot.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wayback-${snapshot.timestamp}-${snapshot.originalUrl.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleDeleteSnapshot = async (id: string) => {
      if (confirm('Delete this saved snapshot?')) {
          await storageService.deleteSnapshot(id);
          loadSavedSnapshots();
          if (previewSnapshot?.id === id) {
              setPreviewSnapshot(null);
          }
      }
  };

  // Process CDX data for the chart
  const getTimelineData = () => {
      if (!cdxData.length) return [];
      const years: Record<string, number> = {};
      cdxData.forEach(row => {
          const year = row.timestamp.substring(0, 4);
          years[year] = (years[year] || 0) + 1;
      });
      return Object.entries(years)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year.localeCompare(b.year));
  };

  const getFilteredCDXData = () => {
      if (!selectedYear) return cdxData;
      return cdxData.filter(row => row.timestamp.startsWith(selectedYear));
  };

  const formatTimestamp = (ts: string) => {
      if (ts.length < 14) return ts;
      return `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)} ${ts.slice(8,10)}:${ts.slice(10,12)}`;
  };

  const getStatusColor = (code: string) => {
      if (code.startsWith('2')) return 'bg-green-500/10 text-green-400 border border-green-500/20';
      if (code.startsWith('3')) return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      if (code.startsWith('4') || code.startsWith('5')) return 'bg-red-500/10 text-red-400 border border-red-500/20';
      return 'bg-gray-700 text-gray-400';
  };

  const hasResults = () => {
    if (mode === 'available') return !!availability;
    if (mode === 'save') return saveHistory.length > 0;
    if (mode === 'cdx') return cdxData.length > 0;
    if (mode === 'saved') return savedSnapshots.length > 0;
    return false;
  };

  const clearInput = () => {
      setUrl('');
      inputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col space-y-6 relative">
      {/* Primary Search Card */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden shrink-0">
         <div className="p-8 pb-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Globe className="w-6 h-6 text-indigo-400" />
                Wayback Machine Tools
            </h2>
            
            <form onSubmit={handleAction} className="relative z-10">
                 <div className="relative flex gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none group-focus-within:text-indigo-400 transition-colors" />
                        
                        <input
                            ref={inputRef}
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={mode === 'saved' ? "Filter saved snapshots..." : "Enter URL to search (e.g. google.com)"}
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-12 pr-10 py-4 text-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-inner transition-all placeholder-gray-600"
                            disabled={mode === 'saved'}
                        />
                        
                        {url && (
                            <button
                                type="button"
                                onClick={clearInput}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <Button 
                        type="submit" 
                        disabled={mode === 'saved' || !url.trim()}
                        isLoading={loading} 
                        className={`px-8 rounded-xl min-w-[120px] text-lg font-medium shadow-lg transition-all active:scale-95 ${
                            mode === 'save' 
                                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' 
                                : 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20'
                        }`}
                    >
                        {mode === 'save' ? 'Save' : 'Search'}
                    </Button>
                 </div>
            </form>
         </div>

         {/* Navigation Tabs */}
         <div className="flex border-t border-gray-700 bg-gray-900/50 overflow-x-auto">
            <button 
                onClick={() => setMode('available')}
                className={`flex-1 min-w-[140px] py-4 px-6 flex items-center justify-center gap-2 transition-all font-medium text-sm uppercase tracking-wide border-b-2 ${
                    mode === 'available' ? 'bg-gray-800 text-teal-400 border-teal-500' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
            >
                <Search className="w-4 h-4" /> Latest Snapshot
            </button>
             <button 
                onClick={() => setMode('cdx')}
                className={`flex-1 min-w-[140px] py-4 px-6 flex items-center justify-center gap-2 transition-all font-medium text-sm uppercase tracking-wide border-b-2 ${
                    mode === 'cdx' ? 'bg-gray-800 text-orange-400 border-orange-500' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
            >
                <Clock className="w-4 h-4" /> History
            </button>
             <button 
                onClick={() => setMode('save')}
                className={`flex-1 min-w-[140px] py-4 px-6 flex items-center justify-center gap-2 transition-all font-medium text-sm uppercase tracking-wide border-b-2 ${
                    mode === 'save' ? 'bg-gray-800 text-indigo-400 border-indigo-500' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
            >
                <Camera className="w-4 h-4" /> Save Page Now
            </button>
            <button 
                onClick={() => handleAction(undefined, 'saved')}
                className={`flex-1 min-w-[140px] py-4 px-6 flex items-center justify-center gap-2 transition-all font-medium text-sm uppercase tracking-wide border-b-2 ${
                    mode === 'saved' ? 'bg-gray-800 text-green-400 border-green-500' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
            >
                <Database className="w-4 h-4" /> Saved Snapshots
            </button>
         </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 shadow-lg min-h-[400px] overflow-hidden flex flex-col p-6 relative">
        
        {!loading && !error && !hasResults() && !hasSearched && mode !== 'saved' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 space-y-6 pointer-events-none opacity-50 select-none">
                {mode === 'available' && <Search className="w-20 h-20" />}
                {mode === 'save' && <Camera className="w-20 h-20" />}
                {mode === 'cdx' && <BarChart3 className="w-20 h-20" />}
                <p className="text-xl font-medium">
                    {mode === 'available' && 'Enter a URL to check for snapshots'}
                    {mode === 'save' && 'Enter a URL to capture it now'}
                    {mode === 'cdx' && 'Enter a URL to view full history'}
                </p>
            </div>
        )}

        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
                <p className="text-gray-300 font-medium animate-pulse">Querying Wayback Machine...</p>
            </div>
        )}

        {error && (
            <div className="w-full max-w-lg mx-auto mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center animate-in fade-in slide-in-from-bottom-2 z-30">
                <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-400 mb-2">Request Failed</h3>
                <p className="text-gray-300 text-sm mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
                    <Button variant="secondary" onClick={() => setError(null)} className="h-9 text-sm">Dismiss</Button>
                    {error.includes('CORS') && onChangeView && (
                        <Button 
                            className="h-9 text-sm bg-indigo-600 hover:bg-indigo-500" 
                            onClick={() => onChangeView(AppView.SETTINGS)}
                        >
                            <SettingsIcon className="w-3 h-3 mr-1" /> Open Settings
                        </Button>
                    )}
                </div>
            </div>
        )}

        {!loading && !error && !hasResults() && hasSearched && mode !== 'saved' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 m-auto animate-in fade-in">
                <p className="text-lg font-medium text-gray-300">No snapshots found</p>
                <p className="text-sm">The Wayback Machine doesn't have any records for this URL.</p>
            </div>
        )}

        {mode === 'available' && availability && !loading && (
            <div className="flex-1 w-full overflow-y-auto custom-scrollbar -m-6 p-6">
                <div className="min-h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                <div className={`w-full max-w-2xl p-8 rounded-3xl border-2 flex flex-col items-center text-center space-y-6 ${availability.archived_snapshots.closest?.available ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'bg-red-500/5 border-red-500/20'}`}>
                     {availability.archived_snapshots.closest?.available ? (
                            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-2 ring-4 ring-green-500/10">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                        ) : (
                             <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-2 ring-4 ring-red-500/10">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                        )}
                    
                    <div>
                        <h3 className="text-3xl font-bold text-white mb-2">
                            {availability.archived_snapshots.closest?.available ? 'Snapshot Found' : 'Not Archived'}
                        </h3>
                        <p className="text-gray-400">
                             {availability.archived_snapshots.closest?.available 
                                ? 'This URL has been saved in the Wayback Machine.' 
                                : 'We could not find a recent snapshot for this URL.'}
                        </p>
                    </div>

                    {availability.archived_snapshots.closest && (
                        <div className="w-full flex flex-col gap-4">
                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50 flex flex-col gap-4">
                                <div className="flex justify-between items-center border-b border-gray-700/50 pb-4">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Latest Timestamp</span>
                                    <span className="font-mono text-lg text-teal-400 font-bold tracking-wide">
                                        {formatTimestamp(availability.archived_snapshots.closest.timestamp)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Original URL</span>
                                    <span className="text-sm text-gray-400 truncate max-w-[250px]" title={availability.url}>{availability.url}</span>
                                </div>
                                
                                <a 
                                    href={availability.archived_snapshots.closest.url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="mt-2 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-teal-500/25"
                                >
                                    Open in Wayback Machine <ExternalLink className="w-4 h-4" />
                                </a>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                    <Button
                                        onClick={handleSaveToLibrary}
                                        disabled={downloadingId === 'latest-save'}
                                        className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-teal-400 px-4 rounded-xl flex items-center justify-center"
                                        title="Save to internal DB"
                                    >
                                        {downloadingId === 'latest-save' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                                        Save to Library
                                    </Button>
                                    <Button
                                        onClick={handleExportLatest}
                                        disabled={downloadingId === 'latest-export'}
                                        className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-indigo-400 px-4 rounded-xl flex items-center justify-center"
                                        title="Download .html file"
                                    >
                                        {downloadingId === 'latest-export' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                                        Download HTML
                                    </Button>
                                </div>
                            </div>
                            
                            <Button 
                                variant="secondary" 
                                onClick={() => handleAction(undefined, 'cdx')}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300"
                            >
                                <BarChart3 className="w-4 h-4 mr-2" /> View Full Capture History
                            </Button>
                        </div>
                    )}
                </div>
                </div>
            </div>
        )}

        {mode === 'save' && saveHistory.length > 0 && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Submission Queue</h3>
                     <button onClick={() => setSaveHistory([])} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                         <Trash2 className="w-3 h-3" /> Clear
                     </button>
                 </div>
                 
                 {!settings.accessKey && (
                     <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg flex items-center gap-3 text-sm">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Warning: No API Keys detected. Submissions are likely to fail or be rate-limited.</span>
                    </div>
                )}

                 <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar">
                    {saveHistory.map(item => (
                        <div key={item.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                            item.status === 'pending' ? 'bg-gray-700/30 border-gray-600' :
                            item.status === 'success' ? 'bg-green-500/5 border-green-500/20' :
                            'bg-red-500/5 border-red-500/20'
                        }`}>
                             <div className="shrink-0">
                                 {item.status === 'pending' && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                                 {item.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                 {item.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <p className="font-medium text-white truncate text-sm">{item.url}</p>
                                 <p className={`text-xs mt-0.5 ${item.status === 'pending' ? 'text-gray-400' : item.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                     {item.status === 'pending' ? 'Sending capture request...' : item.message}
                                 </p>
                             </div>
                             <span className="text-xs text-gray-600 font-mono">{item.timestamp.toLocaleTimeString()}</span>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {mode === 'cdx' && cdxData.length > 0 && !loading && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 gap-6">
                 {/* Chart Section */}
                 <div className="h-48 bg-gray-900/50 rounded-xl border border-gray-700/50 p-4 shrink-0 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Capture Timeline</h3>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span>Click a bar to filter</span>
                            {selectedYear && (
                                <button 
                                    onClick={() => setSelectedYear(null)} 
                                    className="flex items-center gap-1 bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full hover:bg-teal-500/30 transition-colors"
                                >
                                    Filter: {selectedYear} <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={getTimelineData()}
                                onClick={(data) => {
                                    if (data && data.activeLabel) {
                                        setSelectedYear(data.activeLabel);
                                    }
                                }}
                                className="cursor-pointer"
                            >
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                />
                                <XAxis dataKey="year" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {getTimelineData().map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.year === selectedYear ? '#14b8a6' : (entry.count > 5 ? '#f97316' : '#fdba74')} 
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            {selectedYear ? `Snapshots from ${selectedYear}` : 'All Recent Snapshots'}
                            {selectedYear && <Filter className="w-3 h-3 text-teal-500" />}
                        </h3>
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                            {getFilteredCDXData().length} of {cdxData.length} loaded
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-gray-900 rounded-xl border border-gray-700 shadow-inner custom-scrollbar">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-800 text-gray-400 sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Type</th>
                                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {getFilteredCDXData().length > 0 ? getFilteredCDXData().map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-800 transition-colors">
                                        <td className="px-5 py-3 font-mono text-gray-300 whitespace-nowrap">
                                            {formatTimestamp(row.timestamp)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(row.statuscode)}`}>
                                                {row.statuscode}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs truncate max-w-[100px]">{row.mimetype}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a 
                                                    href={`https://web.archive.org/web/${row.timestamp}/${row.original}`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors"
                                                    title="Open on Web"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                                <button
                                                    id={`btn-dl-${row.timestamp}-${row.original}`}
                                                    onClick={() => handleDownload(row)}
                                                    disabled={downloadingId === `${row.timestamp}-${row.original}`}
                                                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${downloadingId === `${row.timestamp}-${row.original}` ? 'text-gray-500' : 'text-teal-400 hover:text-teal-300 hover:bg-teal-500/10'}`}
                                                    title="Download HTML to Database"
                                                >
                                                    {downloadingId === `${row.timestamp}-${row.original}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                                            No snapshots found for the selected filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        )}

        {mode === 'saved' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Local Database ({savedSnapshots.length})</h3>
                     {savedSnapshots.length > 0 && (
                         <Button 
                             onClick={() => setIsExportOpen(true)}
                             className="text-xs h-8 bg-teal-600 hover:bg-teal-500"
                         >
                             <Upload className="w-3 h-3 mr-2" /> Export Data
                         </Button>
                     )}
                </div>

                <div className="flex-1 overflow-auto bg-gray-900 rounded-xl border border-gray-700 shadow-inner custom-scrollbar">
                     {savedSnapshots.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                             <Database className="w-12 h-12 opacity-50" />
                             <p>No snapshots saved locally yet.</p>
                             <p className="text-xs">Search for a URL, then click "Save to Library" in the Latest Snapshot view.</p>
                         </div>
                     ) : (
                         <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-800 text-gray-400 sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Snapshot Date</th>
                                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Original URL</th>
                                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider">Saved At</th>
                                    <th className="px-5 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {savedSnapshots.map((snap) => (
                                    <tr key={snap.id} className="hover:bg-gray-800 transition-colors">
                                        <td className="px-5 py-3 font-mono text-gray-300 whitespace-nowrap">
                                            {formatTimestamp(snap.timestamp)}
                                        </td>
                                        <td className="px-5 py-3 text-gray-400 truncate max-w-xs" title={snap.originalUrl}>
                                            {snap.originalUrl}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">
                                            {new Date(snap.savedAt).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleExportSnapshot(snap)}
                                                    className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold"
                                                    title="Export to Disk"
                                                >
                                                    <FileDown className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handlePreviewSnapshot(snap)}
                                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold"
                                                    title="Preview Content"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSnapshot(snap.id)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     )}
                </div>
            </div>
        )}
      </div>

      {/* Inline Preview Modal */}
      {previewSnapshot && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
              <div className="bg-gray-900 w-full h-full max-w-6xl rounded-2xl shadow-2xl flex flex-col border border-gray-700 overflow-hidden relative">
                   <div className="h-14 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
                       <div className="flex items-center gap-4 min-w-0">
                           <div className="flex items-center gap-2 text-white font-medium truncate">
                               <Globe className="w-4 h-4 text-teal-400" />
                               <span className="truncate">{previewSnapshot.originalUrl}</span>
                           </div>
                           <span className="text-xs text-gray-500 font-mono bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                               {formatTimestamp(previewSnapshot.timestamp)}
                           </span>
                       </div>
                       <div className="flex items-center gap-3">
                            <a 
                                href={previewSnapshot.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1 mr-2"
                            >
                                View Live <ExternalLink className="w-3 h-3" />
                            </a>
                            <button 
                                onClick={() => setPreviewSnapshot(null)}
                                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                       </div>
                   </div>
                   <div className="flex-1 bg-white relative">
                       <iframe 
                           srcDoc={getPreviewContent(previewSnapshot)}
                           className="absolute inset-0 w-full h-full border-0"
                           title="Snapshot Preview"
                           sandbox="allow-same-origin allow-scripts" 
                       />
                   </div>
              </div>
          </div>
      )}
      
      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        data={savedSnapshots} 
      />
    </div>
  );
};

export default WaybackTools;