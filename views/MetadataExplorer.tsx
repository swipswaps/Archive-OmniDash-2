import React, { useState } from 'react';
import {
  Search,
  Save,
  Trash2,
  FileText,
  Code,
  Sparkles,
  Database,
  ArrowRight,
  AlertCircle,
  Info,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { fetchMetadata } from '../services/iaService';
import { IAMetadata, AppSettings, AppView } from '../types';
import { Button } from '../components/ui/Button';

interface Props {
  settings: AppSettings;
  onChangeView?: (view: AppView) => void;
  onSearchTransfer?: (query: string) => void;
}

const MetadataExplorer: React.FC<Props> = ({ _settings, onChangeView, onSearchTransfer }) => {
  const [identifier, setIdentifier] = useState('');
  const [data, setData] = useState<IAMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'view' | 'json'>('view');

  const SUGGESTIONS = ['internetarchive', 'nasa', 'grateful-dead', 'prelinger', 'librivoxaudio'];

  const extractIdFromInput = (input: string): string => {
    const trimmed = input.trim();

    // Handle standard Archive.org details URLs
    // e.g. https://archive.org/details/nasa_audio_collection
    const detailsMatch = trimmed.match(/archive\.org\/details\/([^/?#&]+)/i);
    if (detailsMatch && detailsMatch[1]) {
      return detailsMatch[1];
    }

    // Handle simple domain-like inputs that are clearly not IDs (heuristic)
    // If it starts with http/https but isn't archive.org, it's likely a misplace search
    if (trimmed.startsWith('http') && !trimmed.includes('archive.org')) {
      return trimmed; // Return as is, let validation handle it or pass to deep search logic
    }

    return trimmed;
  };

  const handleFetch = async (e?: React.FormEvent, idOverride?: string) => {
    if (e) e.preventDefault();
    let rawInput = idOverride || identifier;

    // Auto-clean the input
    const targetId = extractIdFromInput(rawInput);

    // Update UI to show the cleaned ID if it was a URL
    if (rawInput !== targetId && !idOverride) {
      setIdentifier(targetId);
    }

    if (!targetId) return;

    // Check if user is trying to search a generic URL (not an archive ID)
    if (
      targetId.includes('.') &&
      !targetId.includes(' ') &&
      !targetId.includes('_') &&
      !targetId.includes('-')
    ) {
      // Heuristic: IDs usually don't have dots unless they are domains,
      // but if it looks like 'google.com', they probably want Deep Search.
      // We'll let the API try, but be ready to suggest Deep Search.
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const result = await fetchMetadata(targetId);

      if (
        !result ||
        Object.keys(result).length === 0 ||
        (result.metadata && Object.keys(result.metadata).length === 0)
      ) {
        throw new Error('Item not found. Double check the identifier.');
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
    } finally {
      setLoading(false);
    }
  };

  const renderDescription = (desc: any) => {
    if (!desc) return 'No description available.';
    if (typeof desc === 'string') return desc;
    if (Array.isArray(desc)) return desc.join('\n\n');
    return JSON.stringify(desc);
  };

  const isLikelySearchQuery = (input: string) => {
    // Basic heuristic: contains spaces or looks like a domain or is very short/long
    return input.includes(' ') || (input.includes('.') && input.length > 5) || input.length < 3;
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-400" />
          Item Lookup
        </h2>
        <form onSubmit={e => handleFetch(e)} className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Enter Identifier or paste Archive.org URL"
              className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-4 pr-4 py-3 text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-gray-500 shadow-inner"
            />
          </div>
          <Button type="submit" isLoading={loading} className="px-8 rounded-xl">
            Fetch Metadata
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Try:
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleFetch(undefined, s)}
                  className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 px-2 py-1 rounded transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {onChangeView && (
            <button
              onClick={() => onChangeView(AppView.SCRAPING)}
              className="text-gray-500 hover:text-white flex items-center gap-1 transition-colors text-xs"
            >
              Not finding it? Try Deep Search <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            {/* Intelligent Error Suggestions */}
            {onSearchTransfer && (
              <div className="ml-8 text-sm text-red-300/80 space-y-3">
                {identifier.includes('archive.org') ? (
                  <p>
                    It looks like you pasted a URL but we couldn't extract a valid ID. Try pasting
                    just the identifier (the part after <code>/details/</code>).
                  </p>
                ) : isLikelySearchQuery(identifier) ? (
                  <div className="flex flex-col items-start gap-2">
                    <p>
                      "{identifier}" looks like a search query or a generic URL, not an Item
                      Identifier.
                    </p>
                    <Button
                      variant="secondary"
                      className="text-xs h-8 bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-200"
                      onClick={() => onSearchTransfer(identifier)}
                    >
                      Search for "{identifier}" in Deep Search
                    </Button>
                  </div>
                ) : (
                  <p>Ensure the ID is correct. If you are looking for keywords, use Deep Search.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {data ? (
        <div className="flex-1 min-h-0 flex flex-col bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex border-b border-gray-700 px-6 bg-gray-850 justify-between items-center">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('view')}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-all ${
                  activeTab === 'view'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" /> Formatted View
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-all ${
                  activeTab === 'json'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Code className="w-4 h-4" /> Raw JSON
              </button>
            </div>
            {data.metadata?.identifier && (
              <a
                href={`https://archive.org/details/${data.metadata.identifier}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1"
              >
                View on Archive.org <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex-1 overflow-auto p-8 custom-scrollbar">
            {activeTab === 'view' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Core Metadata
                      </h3>
                      <div className="bg-gray-900/50 rounded-xl p-5 space-y-4 border border-gray-700/50">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Title</label>
                          <p className="text-xl font-bold text-white">
                            {data.metadata?.title || 'Untitled'}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Identifier</label>
                            <p className="text-gray-300 font-mono text-sm bg-gray-950 px-2 py-1 rounded inline-block select-all">
                              {data.metadata?.identifier}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Date</label>
                            <p className="text-gray-300">{data.metadata?.date || 'N/A'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Creator</label>
                          <p className="text-gray-300">{data.metadata?.creator || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Statistics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                          <div className="text-3xl font-bold text-teal-400 mb-1">
                            {data.files_count}
                          </div>
                          <div className="text-xs text-gray-500 font-medium uppercase">
                            Total Files
                          </div>
                        </div>
                        <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50">
                          <div className="text-3xl font-bold text-indigo-400 mb-1">
                            {((data.item_size || 0) / 1024 / 1024).toFixed(2)} MB
                          </div>
                          <div className="text-xs text-gray-500 font-medium uppercase">
                            Total Size
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Description
                  </h3>
                  <div className="bg-gray-900/50 rounded-xl p-6 text-sm text-gray-300 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-gray-700/50 shadow-inner">
                    {renderDescription(data.metadata?.description)}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    File Listing
                  </h3>
                  <div className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700/50 shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-900 text-gray-400 border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-3 font-medium">Name</th>
                          <th className="px-6 py-3 font-medium">Format</th>
                          <th className="px-6 py-3 font-medium">Size</th>
                          <th className="px-6 py-3 font-medium">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {data.files?.slice(0, 15).map((file, idx) => (
                          <tr key={idx} className="hover:bg-gray-800 transition-colors">
                            <td
                              className="px-6 py-3 text-gray-300 font-mono truncate max-w-xs"
                              title={file.name}
                            >
                              {file.name}
                            </td>
                            <td className="px-6 py-3 text-gray-400">{file.format}</td>
                            <td className="px-6 py-3 text-gray-400">{file.size}</td>
                            <td className="px-6 py-3 text-gray-400">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${file.source === 'original' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-gray-700 text-gray-400'}`}
                              >
                                {file.source}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(data.files?.length || 0) > 15 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-3 text-center text-gray-500 text-xs italic bg-gray-900/30"
                            >
                              ... and {(data.files?.length || 0) - 15} more files
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <pre className="text-xs text-green-400 font-mono bg-gray-950 p-6 rounded-xl overflow-auto h-full shadow-inner border border-gray-800">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-90 animate-in fade-in">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-2xl w-full shadow-2xl">
              <div className="flex items-start gap-6">
                <div className="bg-teal-500/10 p-4 rounded-xl shrink-0 hidden sm:block">
                  <LinkIcon className="w-8 h-8 text-teal-400" />
                </div>
                <div className="space-y-6 flex-1">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Metadata & Item Lookup</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Fetch technical data, file lists, and stats for any Internet Archive item.
                    </p>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-5 border border-gray-700 shadow-inner">
                    <div className="text-gray-500 mb-3 text-xs uppercase tracking-wider font-bold">
                      Supported Inputs
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          1. Archive.org URL (We auto-extract the ID)
                        </div>
                        <div className="font-mono text-sm text-gray-300 bg-gray-950 p-2 rounded border border-gray-800">
                          https://archive.org/details/
                          <span className="text-teal-400 font-bold">nasa_audio_collection</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">2. Direct Identifier</div>
                        <div className="font-mono text-sm text-teal-400 bg-gray-950 p-2 rounded border border-gray-800">
                          nasa_audio_collection
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-2 border-t border-gray-700/50">
                    <p className="text-sm text-gray-400">Searching for a website URL?</p>
                    <Button
                      variant="ghost"
                      onClick={() => onChangeView && onChangeView(AppView.SCRAPING)}
                      className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 -ml-4 sm:ml-0"
                    >
                      Use Deep Search <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default MetadataExplorer;
