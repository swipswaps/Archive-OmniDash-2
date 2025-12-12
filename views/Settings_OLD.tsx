import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { Button } from '../components/ui/Button';
import {
  ExternalLink,
  CheckCircle,
  Save,
  Shield,
  TestTube2,
  Globe2,
  AlertCircle,
  Wand2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { PROXY_OPTIONS } from '../constants';

interface Props {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

const Settings: React.FC<Props> = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onUpdate(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUseRecommendedProxy = () => {
    handleChange('corsProxy', PROXY_OPTIONS.CORS_PROXY_IO);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);
  const isValid = settings.accessKey.length > 0 && settings.secretKey.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Configuration</h2>
        <p className="text-gray-400">
          Manage your Internet Archive credentials and application preferences.
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        {/* Developer / Demo Mode Section */}
        <div className="p-6 border-b border-gray-700 bg-gray-900/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <TestTube2 className="w-5 h-5 text-yellow-400" />
                Demo Mode
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Enable mock data to test the UI without making real API calls. Useful if APIs are blocked.
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handleChange('demoMode', !localSettings.demoMode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  localSettings.demoMode ? 'bg-yellow-500' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={localSettings.demoMode}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    localSettings.demoMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Connectivity / CORS Section */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-indigo-400" />
            Connectivity
          </h3>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-200">
                <strong className="text-indigo-100">Search failing?</strong> Internet Archive APIs
                block direct browser requests (CORS). To fix this, you must use a proxy.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              CORS Proxy URL Prefix
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localSettings.corsProxy || ''}
                onChange={e => handleChange('corsProxy', e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600 font-mono"
                placeholder="e.g. https://corsproxy.io/?"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleUseRecommendedProxy}
                title="Use Recommended Public Proxy"
                className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
              >
                <Wand2 className="w-4 h-4 mr-2" /> Auto-Fill
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Recommended: <code>{PROXY_OPTIONS.CORS_PROXY_IO}</code> or{' '}
              <code>{PROXY_OPTIONS.ALL_ORIGINS}</code>
            </p>
          </div>
        </div>

        {/* API Credentials Section */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-400" />
            API Credentials
            <span className="text-xs font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
              Optional (Write Access)
            </span>
          </h3>

          {/* SECURITY WARNING */}
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-bold text-red-300 mb-2">⚠️ Security Warning</div>
                <div className="text-red-200 space-y-2">
                  <p>
                    Your API keys are stored in <strong>browser localStorage</strong> (unencrypted).
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Anyone with access to this computer can view your keys</li>
                    <li>Keys persist even after closing the browser</li>
                    <li><strong>Do NOT use this on public or shared computers</strong></li>
                  </ul>
                  <p className="text-xs mt-3 text-red-300">
                    💡 <strong>Recommendation:</strong> For production use, implement a backend proxy
                    to securely store credentials server-side.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-2">
              Required only for <strong>SavePageNow</strong> operations.
            </p>
            <a
              href="https://archive.org/account/s3.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1 hover:underline w-fit"
            >
              Get S3 Keys <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Access Key</label>
              <input
                type="text"
                value={localSettings.accessKey}
                onChange={e => handleChange('accessKey', e.target.value)}
                autoComplete="off"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder-gray-600 font-mono"
                placeholder="Paste your Access Key here"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Secret Key</label>
              <input
                type="password"
                value={localSettings.secretKey}
                onChange={e => handleChange('secretKey', e.target.value)}
                autoComplete="new-password"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder-gray-600 font-mono"
                placeholder="Paste your Secret Key here"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-sm text-green-400 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle className="w-4 h-4" /> Settings Saved
                </span>
              )}
            </div>
            <Button onClick={handleSave} disabled={!hasChanges} className="min-w-[100px]">
              <Save className="w-4 h-4 mr-2" />
              {hasChanges ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </div>

        {/* Footer Status */}
        <div className="bg-gray-900/50 p-4 flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Keys stored in browser localStorage (not secure for production)
          </span>
          {isValid && !hasChanges && (
            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>{' '}
              Credentials Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
