import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { Button } from '../components/ui/Button';
import { ExternalLink, CheckCircle, Save, Shield, TestTube2, Globe2, AlertCircle } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

const Settings: React.FC<Props> = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  // Sync local state if props change externally (e.g. initial load from App)
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
    // Hide "Saved" message after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);
  const isValid = settings.accessKey.length > 0 && settings.secretKey.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Configuration</h2>
        <p className="text-gray-400">Manage your Internet Archive credentials and application preferences.</p>
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
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${localSettings.demoMode ? 'bg-teal-500' : 'bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.demoMode ? 'translate-x-6' : 'translate-x-1'}`} />
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
                         <strong className="text-indigo-100">Search failing?</strong> Internet Archive APIs block direct browser requests (CORS). 
                         To fix this, use a proxy.
                         <div className="mt-2 text-indigo-300">
                             Try public proxy: <code className="bg-indigo-900/50 px-1 py-0.5 rounded text-indigo-100">https://cors-anywhere.herokuapp.com/</code>
                             <br/>
                             <span className="text-xs opacity-70">(Or run your own local-cors-proxy)</span>
                         </div>
                     </div>
                 </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">CORS Proxy URL Prefix</label>
                <input 
                    type="text" 
                    value={localSettings.corsProxy || ''}
                    onChange={(e) => handleChange('corsProxy', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600 font-mono"
                    placeholder="e.g. https://cors-anywhere.herokuapp.com/"
                />
            </div>
         </div>

         {/* API Credentials Section */}
         <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                API Credentials
                <span className="text-xs font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-700">Optional (Write Access)</span>
            </h3>
            
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
                        onChange={(e) => handleChange('accessKey', e.target.value)}
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
                        onChange={(e) => handleChange('secretKey', e.target.value)}
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
                <Button 
                    onClick={handleSave} 
                    disabled={!hasChanges}
                    className="min-w-[100px]"
                >
                    {hasChanges ? 'Save Changes' : 'Saved'}
                </Button>
            </div>
         </div>
         
         <div className="bg-gray-900/50 p-4 flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Keys are stored locally.
            </span>
            {isValid && !hasChanges && (
                <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div> Creds Active
                </span>
            )}
         </div>
      </div>
    </div>
  );
};

export default Settings;