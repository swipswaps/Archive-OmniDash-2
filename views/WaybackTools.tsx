import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Trash2,
  Search,
  Clock,
  X,
  Download,
  Database,
  FileDown,
  Eye,
  Info,
  Library,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  checkAvailability,
  savePageNow,
  fetchCDX,
  downloadSnapshotContent,
} from '../services/waybackService';
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
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Modal States
  const [previewSnapshot, setPreviewSnapshot] = useState<SavedSnapshot | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved snapshots when switching to 'saved' mode or initially
  useEffect(() => {
    loadSavedSnapshots();
  }, []);

  useEffect(() => {
    if (mode === 'saved') {
      loadSavedSnapshots();
    }
  }, [mode]);

  const loadSavedSnapshots = async () => {
    try {
      const snaps = await storageService.getAllSnapshots();
      setSavedSnapshots(snaps);
    } catch (_e) {
      console.error('Failed to load snapshots', _e);
    }
  };

  const handleAction = async (
    e?: React.FormEvent,
    overrideMode?: 'available' | 'save' | 'cdx' | 'saved'
  ) => {
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
          timestamp: new Date(),
        };
        setSaveHistory(prev => [newItem, ...prev]);

        try {
          const res = await savePageNow(targetUrl, settings.accessKey, settings.secretKey);
          setSaveHistory(prev =>
            prev.map(item =>
              item.id === newItem.id ? { ...item, status: 'success', message: res.message } : item
            )
          );
        } catch (err: any) {
          setSaveHistory(prev =>
            prev.map(item =>
              item.id === newItem.id
                ? { ...item, status: 'error', message: err.message || 'Capture failed' }
                : item
            )
          );
        }
      } else if (activeMode === 'cdx') {
        // Fetch more items for better browsing (3000)
        const res = await fetchCDX(targetUrl, 3000);
        setCdxData(res);
      }
    } catch (e: any) {
      console.error('Wayback Tool Error:', e);
      if (activeMode !== 'save') {
        let msg = e.message || 'An unexpected error occurred.';
        if (e.message.includes('Failed to fetch')) {
          msg =
            'Network Error: Could not reach Archive.org. Try enabling Demo Mode in Settings if this persists.';
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
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
        content: content,
      };

      await storageService.saveSnapshot(snapshot);
      // Update local list
      await loadSavedSnapshots();

      // Show quick success state
      const btn = document.getElementById(`btn-dl-${dlKey}`);
      if (btn) btn.classList.add('text-green-500');
      setTimeout(() => {
        if (btn) btn.classList.remove('text-green-500');
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Download Failed');
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
        content: content,
      };

      await storageService.saveSnapshot(snapshot);
      await loadSavedSnapshots();
      alert("Success! Snapshot saved to the 'Library'.");
    } catch (e: any) {
      setError(e.message || 'Save Failed');
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
      setError(e.message || 'Download Failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreviewSnapshot = (snapshot: SavedSnapshot) => {
    setPreviewSnapshot(snapshot);
  };

  const handleDeleteSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this snapshot?')) {
      const prevSnapshots = [...savedSnapshots];
      setSavedSnapshots(current => current.filter(s => String(s.id) !== String(id)));

      try {
        await storageService.deleteSnapshot(id);
        await loadSavedSnapshots();
      } catch (error) {
        console.error('Delete failed:', error);
        setSavedSnapshots(prevSnapshots);
        alert('Failed to delete snapshot. Please try again.');
      }
    }
  };

  const getPreviewContent = (snap: SavedSnapshot) => {
    const baseUrl = `https://web.archive.org/web/${snap.timestamp}/`;
    const baseTag = `<base href="${baseUrl}" target="_blank" />`;
    if (snap.content.includes('<head>')) {
      return snap.content.replace('<head>', `<head>${baseTag}`);
    }
    return `${baseTag}${snap.content}`;
  };

  const getCdxStats = () => {
    const stats: Record<string, number> = {};
    cdxData.forEach(row => {
      const year = row.timestamp.substring(0, 4);
      stats[year] = (stats[year] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" />
            Wayback Machine Tools
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Interact with the Internet Archive's web archive.
          </p>
        </div>

        <div className="bg-gray-800 p-1 rounded-xl border border-gray-700 flex flex-wrap text-xs font-medium">
          <button
            onClick={() => setMode('available')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${mode === 'available' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Search className="w-3.5 h-3.5" /> Check URL
          </button>
          <button
            onClick={() => setMode('save')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${mode === 'save' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Camera className="w-3.5 h-3.5" /> Save Page
          </button>
          <button
            onClick={() => setMode('cdx')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${mode === 'cdx' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Clock className="w-3.5 h-3.5" /> History
          </button>
          <button
            onClick={() => setMode('saved')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${mode === 'saved' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Library className="w-3.5 h-3.5" /> Library
          </button>

          {/* Direct Export Action */}
          <div className="w-px bg-gray-600 mx-1 my-2"></div>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-teal-400 hover:text-white hover:bg-teal-600/20 transition-all"
            title="Export Saved Data"
          >
            <Database className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 shadow-lg flex flex-col overflow-hidden relative">
        {/* Input Bar (Shared for Available, Save, CDX) */}
        {mode !== 'saved' && (
          <div className="p-6 border-b border-gray-700 bg-gray-850">
            <form onSubmit={e => handleAction(e)} className="flex gap-4">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder={
                    mode === 'available'
                      ? 'Enter URL to check availability (e.g. google.com)'
                      : mode === 'save'
                        ? 'Enter URL to save (e.g. myblog.com)'
                        : 'Enter URL to view history (e.g. example.com)'
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-4 pr-4 py-3 text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-500 shadow-inner"
                />
              </div>
              <Button
                type="submit"
                isLoading={loading}
                className="px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500"
              >
                {mode === 'available' ? 'Check' : mode === 'save' ? 'Save Now' : 'Search History'}
              </Button>
            </form>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-sm animate-in fade-in">
                <AlertTriangle className="w-4 h-4" />
                {error}
                {error.includes('Settings') && (
                  <button
                    onClick={() => onChangeView && onChangeView(AppView.SETTINGS)}
                    className="underline hover:text-red-300 ml-1"
                  >
                    Open Settings
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900/30 custom-scrollbar">
          {/* MODE: AVAILABLE */}
          {mode === 'available' &&
            (availability ? (
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
                {availability.archived_snapshots.closest ? (
                  <div className="bg-gray-800 border border-green-500/30 rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Snapshot Available</h3>
                    <p className="text-gray-400 mb-6">
                      The most recent capture was on{' '}
                      <span className="text-white font-mono">
                        {availability.archived_snapshots.closest.timestamp}
                      </span>
                    </p>
                    <div className="flex justify-center gap-4">
                      <a
                        href={availability.archived_snapshots.closest.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" /> View on Wayback
                      </a>
                      <Button
                        variant="secondary"
                        onClick={handleSaveToLibrary}
                        isLoading={downloadingId === 'latest-save'}
                      >
                        <Download className="w-4 h-4" /> Save to Library
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleExportLatest}
                        isLoading={downloadingId === 'latest-export'}
                        title="Download HTML file"
                      >
                        <FileDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center shadow-lg">
                    <div className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Snapshots Found</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      We couldn't find any archived versions of this URL. You can try to save it
                      now.
                    </p>
                    <Button
                      onClick={() => handleAction(undefined, 'save')}
                      className="bg-indigo-600 hover:bg-indigo-500"
                    >
                      <Camera className="w-4 h-4 mr-2" /> Save Page Now
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              !loading &&
              !error && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                  <Search className="w-16 h-16 mb-4" />
                  <p>Enter a URL to check if it's archived.</p>
                </div>
              )
            ))}

          {/* MODE: SAVE */}
          {mode === 'save' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-6">
                <div className="bg-gray-900 px-6 py-3 border-b border-gray-700 font-medium text-gray-300 flex justify-between items-center">
                  <span>Request History (Session)</span>
                  <span className="text-xs text-gray-500">{saveHistory.length} requests</span>
                </div>
                {saveHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No save requests yet. Enter a URL above to capture it.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {saveHistory.map(req => (
                      <div
                        key={req.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="min-w-0 pr-4">
                          <div className="font-mono text-sm text-gray-300 truncate" title={req.url}>
                            {req.url}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {req.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {req.status === 'pending' && (
                            <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium bg-yellow-400/10 px-2 py-1 rounded-full">
                              <Loader2 className="w-3 h-3 animate-spin" /> Processing
                            </span>
                          )}
                          {req.status === 'success' && (
                            <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium bg-green-400/10 px-2 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Saved
                            </span>
                          )}
                          {req.status === 'error' && (
                            <span
                              className="flex items-center gap-1.5 text-red-400 text-xs font-medium bg-red-400/10 px-2 py-1 rounded-full"
                              title={req.message}
                            >
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg text-sm text-indigo-200">
                <p className="flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> Save Page Now requests are sent to the queue. It may take
                    a few minutes for the snapshot to appear in the 'Available' check or on the
                    public Wayback Machine.
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* MODE: CDX (History) */}
          {mode === 'cdx' && (
            <div className="h-full flex flex-col">
              {cdxData.length > 0 ? (
                <div className="flex-1 flex flex-col space-y-6">
                  {/* Chart Section */}
                  <div className="h-48 bg-gray-800 rounded-xl border border-gray-700 p-4 relative">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 absolute top-4 left-4">
                      Capture Frequency
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getCdxStats()} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                        <Tooltip
                          cursor={{ fill: '#374151', opacity: 0.4 }}
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            borderColor: '#374151',
                            color: '#f3f4f6',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          interval={0}
                          stroke="#4b5563"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          stroke="#4b5563"
                          width={30}
                        />
                        <Bar
                          dataKey="count"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                          onClick={data =>
                            setSelectedYear(data.year === selectedYear ? null : data.year)
                          }
                        >
                          {getCdxStats().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.year === selectedYear ? '#818cf8' : '#4f46e5'}
                              cursor="pointer"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table Section */}
                  <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-700 bg-gray-850 flex justify-between items-center text-xs text-gray-400">
                      <span>
                        {cdxData.length} records found{' '}
                        {selectedYear ? `(Filtering by ${selectedYear})` : ''}
                      </span>
                      {selectedYear && (
                        <button
                          onClick={() => setSelectedYear(null)}
                          className="text-indigo-400 hover:underline"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-900 sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3">MimeType</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {cdxData
                            .filter(row => !selectedYear || row.timestamp.startsWith(selectedYear))
                            .slice(0, 500) // Render limit for performance
                            .map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-700/50">
                                <td className="px-4 py-2 font-mono text-xs">{row.timestamp}</td>
                                <td className="px-4 py-2 text-xs">{row.mimetype}</td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      row.statuscode === '200'
                                        ? 'bg-green-500/10 text-green-400'
                                        : row.statuscode.startsWith('3')
                                          ? 'bg-blue-500/10 text-blue-400'
                                          : row.statuscode.startsWith('4') ||
                                              row.statuscode.startsWith('5')
                                            ? 'bg-red-500/10 text-red-400'
                                            : 'bg-gray-700 text-gray-400'
                                    }`}
                                  >
                                    {row.statuscode}
                                  </span>
                                </td>
                                <td className="px-4 py-2 flex items-center gap-2">
                                  <a
                                    href={`https://web.archive.org/web/${row.timestamp}/${row.original}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                                    title="View"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    id={`btn-dl-${row.timestamp}-${row.original}`}
                                    onClick={() => handleDownload(row)}
                                    disabled={downloadingId !== null}
                                    className={`p-1 hover:bg-gray-600 rounded transition-colors ${downloadingId === `${row.timestamp}-${row.original}` ? 'text-indigo-400 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                                    title="Save to Library"
                                  >
                                    {downloadingId === `${row.timestamp}-${row.original}` ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                !loading &&
                !error && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                    <Clock className="w-16 h-16 mb-4" />
                    <p>Search to see capture history and timeline.</p>
                  </div>
                )
              )}
            </div>
          )}

          {/* MODE: SAVED (Library) */}
          {mode === 'saved' && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Snapshot Library</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => loadSavedSnapshots()}
                    variant="secondary"
                    className="h-8 text-xs"
                  >
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setIsExportOpen(true)}
                    className="h-8 text-xs bg-teal-600 hover:bg-teal-500"
                  >
                    <Database className="w-3 h-3 mr-1" /> Export Data
                  </Button>
                </div>
              </div>

              {savedSnapshots.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                  <Library className="w-12 h-12 mb-3 opacity-50" />
                  <p>No snapshots saved locally.</p>
                  <p className="text-xs mt-1">
                    Use the "Available" or "History" tab to download pages.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                  {savedSnapshots.map(snap => (
                    <div
                      key={snap.id}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col hover:border-gray-600 transition-colors group relative"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="bg-gray-900 text-xs font-mono px-2 py-1 rounded text-teal-400 border border-gray-800">
                          {snap.timestamp}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePreviewSnapshot(snap)}
                            className="p-1.5 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => handleDeleteSnapshot(snap.id, e)}
                            className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 mb-3">
                        <div
                          className="font-medium text-white truncate mb-1"
                          title={snap.originalUrl}
                        >
                          {snap.originalUrl}
                        </div>
                        <div className="text-xs text-gray-500">
                          Saved: {new Date(snap.savedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">Type: {snap.mimetype}</div>
                      </div>
                      <div className="pt-3 border-t border-gray-700 flex justify-between items-center text-xs">
                        <span className="text-gray-600">
                          {(snap.content.length / 1024).toFixed(1)} KB
                        </span>
                        <a
                          href={snap.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          Original <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <h3 className="font-bold text-gray-800 text-sm truncate max-w-md">
                  Preview: {previewSnapshot.originalUrl}
                </h3>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-mono">
                  {previewSnapshot.timestamp}
                </span>
              </div>
              <button
                onClick={() => setPreviewSnapshot(null)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 relative bg-white">
              <iframe
                srcDoc={getPreviewContent(previewSnapshot)}
                className="w-full h-full border-none"
                title="Snapshot Preview"
                sandbox="allow-same-origin allow-scripts" // Security: restrict somewhat, but allow scripts for basic rendering
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
