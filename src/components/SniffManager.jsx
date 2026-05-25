import React, { useState } from 'react';
import { Plus, Save, History, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * SniffManager
 * CRM-like module for tracking Service Needs Inventory for Families (SNIFF).
 */
export default function SniffManager({ client, onSave, onClose }) {
  const [activeDomain, setActiveDomain] = useState('Child Development');
  const [needs, setNeeds] = useState(client.sniffNeeds || []);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const DOMAINS = [
    'Child Development',
    'Child Health',
    'Caregiver Support',
    'Social Services',
    'Housing',
    'Legal',
    'Financial',
    'Safety'
  ];

  const STATUS_OPTIONS = [
    'Met',
    'Not Met: Referral(s) made and family is still waiting',
    'Not Met: Caregiver did not access available service',
    'Not Met: Client referred, not eligible for service',
    'Not Met: Service not available in community',
    'Not Met: Service not available in required language'
  ];

  const handleCreateNeed = (domain, title) => {
    const newNeed = {
      id: Date.now().toString(),
      domain,
      title,
      originalState: 'YES, I want help getting this NEW service if possible',
      status: 'Pending',
      statusReason: '',
      history: [{ date: new Date().toISOString(), action: 'Need Identified' }]
    };
    setNeeds([...needs, newNeed]);
    setUnsavedChanges(true);
  };

  const handleUpdateStatus = (needId, newStatus, reason = '') => {
    setNeeds(needs.map(n => {
      if (n.id === needId) {
        return {
          ...n,
          status: newStatus.startsWith('Met') ? 'Met' : 'Not Met',
          statusReason: reason || newStatus,
          history: [...n.history, { date: new Date().toISOString(), action: `Status updated to ${newStatus}` }]
        };
      }
      return n;
    }));
    setUnsavedChanges(true);
  };

  const handleCloneNeed = (need) => {
    const clonedNeed = {
      ...need,
      id: need.id + 'b',
      title: `${need.title} (Re-referral)`,
      status: 'Pending',
      statusReason: '',
      history: [{ date: new Date().toISOString(), action: 'Need Re-opened / Cloned' }]
    };
    setNeeds([...needs, clonedNeed]);
    setUnsavedChanges(true);
  };

  const commitChanges = () => {
    onSave({ ...client, sniffNeeds: needs });
    setUnsavedChanges(false);
    alert('Domain saved successfully to CFCR.');
  };

  const handleDomainSwitch = (newDomain) => {
    if (unsavedChanges) {
      if (!window.confirm("You have unsaved changes. Bypassing will discard them. Are you sure?")) {
        return;
      }
    }
    setActiveDomain(newDomain);
    setUnsavedChanges(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/50 backdrop-blur-sm p-6 justify-center items-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex overflow-hidden">
        
        {/* Sidebar Domains */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
          <h2 className="font-bold text-slate-800 mb-4 text-lg">SNIFF Domains</h2>
          <nav className="flex-1 space-y-1">
            {DOMAINS.map(d => (
              <button
                key={d}
                onClick={() => handleDomainSwitch(d)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeDomain === d ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{activeDomain}</h1>
              <p className="text-sm text-slate-500">Track and update family service needs.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => onClose()} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                Close
              </button>
              <button 
                onClick={commitChanges} 
                className={`flex items-center gap-2 px-5 py-2 text-white font-bold rounded-lg transition-colors shadow-sm ${
                  unsavedChanges ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'
                }`}
                disabled={!unsavedChanges}
              >
                <Save className="w-5 h-5" /> Save Page to CFCR
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {unsavedChanges && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">You have unsaved changes on this page. You must click "Save Page to CFCR" before navigating away, or your changes will be discarded.</p>
              </div>
            )}

            {/* List Active Needs */}
            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Active Needs in {activeDomain}
              </h3>
              
              {needs.filter(n => n.domain === activeDomain).length === 0 && (
                <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 border-dashed rounded-xl">
                  No active needs tracked in this domain.
                </div>
              )}

              {needs.filter(n => n.domain === activeDomain).map(need => (
                <div key={need.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{need.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">ID: {need.id} | Opened: {new Date(need.history[0].date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      need.status === 'Met' ? 'bg-emerald-100 text-emerald-800' :
                      need.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {need.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Update Status</label>
                      <select 
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                        value={need.status === 'Met' ? 'Met' : need.statusReason || need.status}
                        onChange={(e) => handleUpdateStatus(need.id, e.target.value)}
                      >
                        <option value="Pending" disabled>Pending...</option>
                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex items-end justify-end gap-2">
                      <button onClick={() => alert(JSON.stringify(need.history, null, 2))} className="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium flex items-center gap-1 transition-colors">
                        <History className="w-4 h-4" /> View History
                      </button>
                      <button onClick={() => handleCloneNeed(need)} className="px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center gap-1 transition-colors" title="Clone for new referral attempt">
                        <Plus className="w-4 h-4" /> Re-referral
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Need */}
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-800 mb-3">Identify New Need</h3>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  id="newNeedInput"
                  placeholder={`e.g. "Early Intervention Evaluation"`} 
                  className="flex-1 p-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('newNeedInput');
                    if (input.value.trim()) {
                      handleCreateNeed(activeDomain, input.value.trim());
                      input.value = '';
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Need
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
