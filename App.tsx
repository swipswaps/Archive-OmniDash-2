import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import MetadataExplorer from './views/MetadataExplorer';
import ScrapingBrowser from './views/ScrapingBrowser';
import AnalyticsDashboard from './views/AnalyticsDashboard';
import WaybackTools from './views/WaybackTools';
import Settings from './views/Settings';
import { AppView, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [globalQuery, setGlobalQuery] = useState('');

  // Initialize settings from localStorage if available
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('omnidash_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with default to ensure new fields (like demoMode) exist
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('OmniDash: Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Persist settings changes
  useEffect(() => {
    try {
      localStorage.setItem('omnidash_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('OmniDash: Failed to save settings', e);
    }
  }, [settings]);

  const handleNavigateToSearch = (query: string) => {
    setGlobalQuery(query);
    setCurrentView(AppView.SCRAPING);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard settings={settings} onChangeView={setCurrentView} />;
      case AppView.METADATA:
        return (
          <MetadataExplorer
            settings={settings}
            onChangeView={setCurrentView}
            onSearchTransfer={handleNavigateToSearch}
          />
        );
      case AppView.SCRAPING:
        return (
          <ScrapingBrowser
            settings={settings}
            initialQuery={globalQuery}
            onClearQuery={() => setGlobalQuery('')}
            onChangeView={setCurrentView}
          />
        );
      case AppView.ANALYTICS:
        return <AnalyticsDashboard settings={settings} onChangeView={setCurrentView} />;
      case AppView.WAYBACK:
        return <WaybackTools settings={settings} onChangeView={setCurrentView} />;
      case AppView.SETTINGS:
        return <Settings settings={settings} onUpdate={setSettings} />;
      default:
        return <Dashboard settings={settings} onChangeView={setCurrentView} />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return 'Home';
      case AppView.METADATA:
        return 'Item Search';
      case AppView.SCRAPING:
        return 'Deep Search';
      case AppView.ANALYTICS:
        return 'Analytics';
      case AppView.WAYBACK:
        return 'Wayback Machine';
      case AppView.SETTINGS:
        return 'Settings';
      default:
        return 'OmniDash';
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />

      <main id="main-content" className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-900" role="main">
        {/* Top Header Bar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-lg font-bold text-white tracking-wide">{getViewTitle()}</h2>
          <div className="flex items-center gap-4" role="status" aria-label="Application status">
            {settings.demoMode && (
              <div
                className="px-3 py-1 rounded-md text-xs font-bold border border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                role="status"
                aria-label="Demo mode active"
                title="Demo mode is enabled - using sample data"
              >
                DEMO MODE
              </div>
            )}
            <div
              className="px-3 py-1 rounded-md text-xs font-bold border border-teal-500/30 text-teal-400 bg-teal-500/5"
              role="status"
              aria-label="API version 1"
              title="Using Internet Archive API version 1"
            >
              API V1
            </div>
            {settings.accessKey && (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
                role="status"
                aria-label="Authenticated with API key"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" aria-hidden="true"></div>
                <span>Authenticated</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto h-full animate-in fade-in duration-300">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
