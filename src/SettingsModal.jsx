import React, { useState, useEffect } from 'react';
import { X, Save, Key, ExternalLink, AlertTriangle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('cf_gemini_api_key') || '';
      setApiKey(savedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('cf_gemini_api_key', apiKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Settings</h2>
            <p className="text-sm text-slate-500 mt-1">Configure app integrations</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" /> Google Gemini API Key
            </label>
            <input 
              type="password" 
              placeholder="AIzaSy..." 
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Required for the Magic Import feature. Your key is saved locally in your browser and is never sent to our servers.
            </p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
            >
              Get a free API key here <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="pt-6 mt-6 border-t border-red-100 space-y-2">
            <label className="block text-sm font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Danger Zone
            </label>
            <button 
              onClick={() => {
                if(confirm("DANGER: Are you absolutely sure you want to delete ALL clients? This cannot be undone. You will lose everything.")) {
                   localStorage.removeItem('cf_clients');
                   window.location.reload();
                }
              }}
              className="w-full py-3 bg-red-50 text-red-600 font-bold hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors border border-red-200"
            >
              Delete All Clients & Start Fresh
            </button>
            <p className="text-xs text-red-400">
              This will permanently delete all client records from your local storage. Make sure you have exported a backup first!
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
