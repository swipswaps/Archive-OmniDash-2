import React from 'react';
import {
  Database,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Search,
  Info,
  Globe,
} from 'lucide-react';
import { AppView, AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  onChangeView: (view: AppView) => void;
}

const Dashboard: React.FC<Props> = ({ settings, onChangeView }) => {
  const hasCreds = settings.accessKey && settings.secretKey;

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Archive OmniDash</h1>
        <p className="text-gray-400 text-lg max-w-3xl">
          A unified toolkit for the Internet Archive. Access metadata, perform deep queries, and
          analyze item popularity.
        </p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-teal-400" />
          Active Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div className="space-y-2">
            <span className="font-bold text-teal-400 uppercase tracking-wider text-xs">
              Library
            </span>
            <p className="text-gray-300 font-medium">Item Lookup</p>
            <p className="text-gray-500">
              Inspect technical metadata and file lists by Identifier.
            </p>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-indigo-400 uppercase tracking-wider text-xs">Web</span>
            <p className="text-gray-300 font-medium">Wayback Machine</p>
            <p className="text-gray-500">
              Search by URL, check availability, and view capture history.
            </p>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-blue-400 uppercase tracking-wider text-xs">Search</span>
            <p className="text-gray-300 font-medium">Deep Search</p>
            <p className="text-gray-500">
              Query specific collections or keywords with JSON export.
            </p>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-orange-400 uppercase tracking-wider text-xs">
              Stats
            </span>
            <p className="text-gray-300 font-medium">Analytics</p>
            <p className="text-gray-500">Visualize daily view counts and trends.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div
          onClick={() => onChangeView(AppView.METADATA)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChangeView(AppView.METADATA);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Navigate to Item Lookup - Search metadata by identifier"
          className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-500/50 rounded-2xl p-6 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          <div className="bg-teal-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
            <Database className="w-6 h-6 text-teal-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
            Item Lookup
          </h3>
          <p className="text-gray-400 text-xs mb-4">Metadata by ID.</p>
          <div className="flex items-center text-teal-500 text-xs font-medium">
            Search IDs{' '}
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onChangeView(AppView.WAYBACK)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChangeView(AppView.WAYBACK);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Navigate to Wayback Tools - Check URL availability and capture history"
          className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-indigo-500/50 rounded-2xl p-6 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
            <Globe className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
            Wayback Tools
          </h3>
          <p className="text-gray-400 text-xs mb-4">Check URLs & Availability.</p>
          <div className="flex items-center text-indigo-400 text-xs font-medium">
            Search URLs{' '}
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onChangeView(AppView.SCRAPING)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChangeView(AppView.SCRAPING);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Navigate to Deep Search - Perform advanced queries and export results"
          className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500/50 rounded-2xl p-6 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
            <Search className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
            Deep Search
          </h3>
          <p className="text-gray-400 text-xs mb-4">Advanced queries.</p>
          <div className="flex items-center text-blue-400 text-xs font-medium">
            Open Browser{' '}
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onChangeView(AppView.ANALYTICS)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChangeView(AppView.ANALYTICS);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Navigate to Analytics - View traffic statistics and trends"
          className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-orange-500/50 rounded-2xl p-6 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          <div className="bg-orange-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
            <BarChart3 className="w-6 h-6 text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
            Analytics
          </h3>
          <p className="text-gray-400 text-xs mb-4">View traffic stats.</p>
          <div className="flex items-center text-orange-400 text-xs font-medium">
            View Charts{' '}
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div
        className={`rounded-xl p-6 border ${hasCreds ? 'bg-gray-800/50 border-gray-700' : 'bg-yellow-500/5 border-yellow-500/20'}`}
        role="region"
        aria-label="API authentication status"
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-2 rounded-full ${hasCreds ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}
            aria-hidden="true"
          >
            {hasCreds ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-1">
              {hasCreds ? 'S3 API Connected' : 'Limited Access Mode'}
            </h3>
            <p className="text-gray-400 text-sm">
              {hasCreds
                ? 'Your Archive.org keys are configured. You have full access to authenticated APIs.'
                : 'You are viewing public data. To enable authenticated features, please configure your API keys in Settings.'}
            </p>
            {!hasCreds && (
              <button
                onClick={() => onChangeView(AppView.SETTINGS)}
                className="mt-3 text-sm text-yellow-500 hover:text-yellow-400 font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded px-1"
                aria-label="Navigate to Settings to configure API keys"
              >
                Configure Keys &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
