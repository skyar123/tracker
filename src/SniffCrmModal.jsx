import React, { useState, useMemo } from 'react';
import { X, Plus, CheckCircle, AlertTriangle, BarChart3, Info, ChevronDown, ChevronRight, Archive } from 'lucide-react';
import { calculateBenchmark31, calculateBenchmark32, RESOLUTION_STATUS, RESOLUTION_LABELS, SNIFF_STATUS } from './scoringEngine.js';

// ─── SNIFF Domain Configuration ───────────────────────────────────────────────

const SNIFF_DOMAINS = [
  {
    id: 'child_development',
    label: 'Child Development',
    needs: [
      'Speech/Language evaluation or services',
      'Developmental evaluation or services',
      'Early intervention (0-3 services)',
      'Special education services',
      'Occupational/Physical therapy',
    ],
  },
  {
    id: 'child_health',
    label: 'Child Health',
    needs: [
      'Pediatric primary care',
      'Dental care',
      'Specialty medical care',
      'Mental health services for child',
      'Medications/prescription access',
    ],
  },
  {
    id: 'early_care',
    label: 'Early Care & Education',
    needs: [
      'Child care / Daycare',
      'Head Start / Early Head Start',
      'Preschool enrollment',
      'School enrollment support',
    ],
  },
  {
    id: 'caregiver_mh',
    label: 'Caregiver Mental Health',
    needs: [
      'Individual therapy or counseling',
      'Psychiatric evaluation or medication management',
      'Substance use treatment',
      'Domestic violence services',
      'Peer support / support groups',
    ],
  },
  {
    id: 'caregiver_health',
    label: 'Caregiver Physical Health',
    needs: [
      'Primary care / OB-GYN',
      'Dental care',
      'Specialty medical care',
      'Medications/prescription access',
    ],
  },
  {
    id: 'housing_safety',
    label: 'Housing & Safety',
    needs: [
      'Stable housing assistance',
      'Emergency shelter',
      'Utility assistance',
      'Home safety resources',
      'Domestic violence shelter/safety planning',
    ],
  },
  {
    id: 'social_services',
    label: 'Social Services & Benefits',
    needs: [
      'Food/nutrition assistance (WIC, SNAP)',
      'Financial assistance / TANF',
      'Transportation assistance',
      'Clothing/household goods',
      'Legal services / immigration',
    ],
  },
  {
    id: 'family_support',
    label: 'Family & Community Support',
    needs: [
      'Parenting classes/support',
      'Respite care',
      'Family support/home visiting',
      'Community/cultural resources',
      'Employment/job training',
    ],
  },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Select status...' },
  { value: SNIFF_STATUS.PAST, label: '1 — Had this in the PAST, do not need now' },
  { value: SNIFF_STATUS.CURRENT, label: '2 — Have this NOW, no further help needed' },
  { value: SNIFF_STATUS.WANT_NEW, label: '3 — YES, want help getting this NEW service' },
  { value: SNIFF_STATUS.NOT_WANT, label: '4 — NO, do not want this service' },
  { value: SNIFF_STATUS.TEAM_RECOMMENDS, label: '5 — Family does not want, but team recommends' },
  { value: SNIFF_STATUS.UNKNOWN, label: '6 — Do not know' },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function BenchmarkCard({ bench }) {
  if (!bench) return null;
  const pct = bench.percentage;
  const color = pct === null ? 'slate' : pct >= 80 ? 'emerald' : pct >= 60 ? 'amber' : 'red';
  const colors = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', bar: 'bg-emerald-500' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   bar: 'bg-amber-500' },
    red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     bar: 'bg-red-500' },
    slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-600',   bar: 'bg-slate-300' },
  };
  const c = colors[color];
  return (
    <div className={`rounded-xl border p-3 ${c.bg} ${c.border}`}>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{bench.label}</span>
        <span className={`text-xl font-black ${c.text}`}>{pct !== null ? `${pct}%` : '—'}</span>
      </div>
      <p className="text-[10px] text-slate-500 mb-2">{bench.description}</p>
      <div className="w-full bg-white rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${pct || 0}%` }} />
      </div>
      <p className="text-[10px] text-slate-400 mt-1">{bench.numerator} / {bench.denominator} needs</p>
    </div>
  );
}

function NeedResolutionRow({ need, onUpdateResolution, onAddSubNeed }) {
  const resLabel = RESOLUTION_LABELS[need.resolutionStatus] || 'Pending';
  const isMet = need.resolutionStatus === RESOLUTION_STATUS.MET;
  const isSystemic = [RESOLUTION_STATUS.NOT_AVAILABLE_COMMUNITY, RESOLUTION_STATUS.NOT_AVAILABLE_LANGUAGE].includes(need.resolutionStatus);

  return (
    <div className={`border rounded-xl p-3 space-y-2 ${isMet ? 'bg-emerald-50 border-emerald-200' : isSystemic ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">{need.needType}</p>
          <p className="text-[10px] text-slate-500">{need.domain} · Created {need.createdAt}</p>
        </div>
        {isMet && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
      </div>
      <div>
        <select
          value={need.resolutionStatus || ''}
          onChange={e => onUpdateResolution(need.id, e.target.value)}
          className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
        >
          <option value="pending">In Progress / Pending</option>
          {Object.entries(RESOLUTION_LABELS).filter(([k]) => k !== 'pending').map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      {isMet && (
        <button
          onClick={() => onAddSubNeed(need)}
          className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add new referral for this need
        </button>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function SniffCrmModal({ isOpen, onClose, client, onSave }) {
  const [activeSection, setActiveSection] = useState('needs');
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [savedAlert, setSavedAlert] = useState(false);

  const sniffNeeds = client?.sniff_needs || [];
  const sniffResponses = client?.sniff_responses || {};

  const activeNeeds = useMemo(
    () => sniffNeeds.filter(n => !n.archived),
    [sniffNeeds],
  );

  const bench31 = useMemo(() => calculateBenchmark31(activeNeeds), [activeNeeds]);
  const bench32 = useMemo(() => calculateBenchmark32(activeNeeds), [activeNeeds]);

  const pendingCount = activeNeeds.filter(n =>
    !n.resolutionStatus || n.resolutionStatus === RESOLUTION_STATUS.PENDING,
  ).length;

  if (!isOpen) return null;

  const generateId = () =>
    `need_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const handleStatusChange = (domainId, needType, newStatus) => {
    const updatedResponses = {
      ...sniffResponses,
      [domainId]: {
        ...(sniffResponses[domainId] || {}),
        [needType]: newStatus,
      },
    };

    let updatedNeeds = [...sniffNeeds];

    // If status 3 (WANT_NEW) → create an active need object
    if (newStatus === SNIFF_STATUS.WANT_NEW) {
      const alreadyExists = sniffNeeds.some(
        n => n.domainId === domainId && n.needType === needType && !n.archived,
      );
      if (!alreadyExists) {
        const domain = SNIFF_DOMAINS.find(d => d.id === domainId);
        updatedNeeds = [
          ...updatedNeeds,
          {
            id: generateId(),
            domainId,
            domain: domain?.label || domainId,
            needType,
            resolutionStatus: RESOLUTION_STATUS.PENDING,
            createdAt: new Date().toISOString().split('T')[0],
            archived: false,
            subIndex: null,
          },
        ];
      }
    }

    const updatedClient = {
      ...client,
      sniff_needs: updatedNeeds,
      sniff_responses: updatedResponses,
    };
    onSave(updatedClient);
  };

  const handleUpdateResolution = (needId, newStatus) => {
    const updatedNeeds = sniffNeeds.map(n =>
      n.id === needId ? { ...n, resolutionStatus: newStatus } : n,
    );
    onSave({ ...client, sniff_needs: updatedNeeds });
  };

  const handleAddSubNeed = (originalNeed) => {
    const existingSubs = sniffNeeds.filter(
      n => n.parentId === originalNeed.id || n.id === originalNeed.id,
    );
    const nextIndex = String.fromCharCode(97 + existingSubs.length); // a, b, c...
    const subNeed = {
      id: generateId(),
      parentId: originalNeed.id,
      domainId: originalNeed.domainId,
      domain: originalNeed.domain,
      needType: `${originalNeed.needType} (follow-up ${nextIndex})`,
      resolutionStatus: RESOLUTION_STATUS.PENDING,
      createdAt: new Date().toISOString().split('T')[0],
      archived: false,
      subIndex: nextIndex,
    };
    onSave({ ...client, sniff_needs: [...sniffNeeds, subNeed] });
  };

  const domainNeedCounts = useMemo(() => {
    const counts = {};
    SNIFF_DOMAINS.forEach(d => {
      counts[d.id] = activeNeeds.filter(n => n.domainId === d.id).length;
    });
    return counts;
  }, [activeNeeds]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> SNIFF — Service Needs
            </h2>
            <p className="text-teal-100 text-xs mt-0.5">{client?.nickname || client?.name} · {activeNeeds.length} active needs · {pendingCount} pending</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benchmarks */}
        <div className="px-5 pt-4 pb-2 grid grid-cols-2 gap-3 shrink-0">
          <BenchmarkCard bench={bench31} />
          <BenchmarkCard bench={bench32} />
        </div>

        {/* Section tabs */}
        <div className="px-5 pb-3 flex gap-2 shrink-0">
          {[
            { id: 'needs', label: 'Active Needs' },
            { id: 'domains', label: 'Domain Survey' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeSection === s.id
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-100 text-slate-500 hover:text-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">

          {/* ── Active Needs tab ── */}
          {activeSection === 'needs' && (
            <>
              {activeNeeds.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No active service needs yet.</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Switch to <strong>Domain Survey</strong> and select status&nbsp;3 to create a need.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      Update resolution status for each active need. Frozen &quot;Met&quot; needs cannot be changed — use <em>Add new referral</em> if re-referral is needed.
                    </p>
                  </div>
                  {activeNeeds.map(need => (
                    <NeedResolutionRow
                      key={need.id}
                      need={need}
                      onUpdateResolution={handleUpdateResolution}
                      onAddSubNeed={handleAddSubNeed}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* ── Domain Survey tab ── */}
          {activeSection === 'domains' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Selecting <strong>Status 3 (YES, want help)</strong> automatically creates an active need in the tracker.
                  All other statuses are recorded for reference only.
                </p>
              </div>
              {SNIFF_DOMAINS.map(domain => {
                const isOpen = expandedDomain === domain.id;
                const count = domainNeedCounts[domain.id] || 0;
                const domainResponses = sniffResponses[domain.id] || {};
                return (
                  <div key={domain.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedDomain(isOpen ? null : domain.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <span className="font-semibold text-sm text-slate-800">{domain.label}</span>
                        {count > 0 && (
                          <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                            {count} active need{count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{domain.needs.length} items</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 divide-y divide-slate-50">
                        {domain.needs.map(needType => {
                          const currentStatus = domainResponses[needType] || '';
                          const hasActiveNeed = activeNeeds.some(
                            n => n.domainId === domain.id && n.needType === needType && !n.archived,
                          );
                          return (
                            <div key={needType} className={`px-4 py-3 flex items-center justify-between gap-3 ${hasActiveNeed ? 'bg-teal-50' : ''}`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {hasActiveNeed && <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />}
                                <span className="text-sm text-slate-700 truncate">{needType}</span>
                              </div>
                              <select
                                value={currentStatus}
                                onChange={e => handleStatusChange(domain.id, needType, e.target.value)}
                                className={`text-xs p-1.5 border rounded-lg focus:ring-2 focus:ring-teal-400 outline-none shrink-0 ${
                                  currentStatus === SNIFF_STATUS.WANT_NEW
                                    ? 'border-teal-400 bg-teal-50 text-teal-900 font-bold'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-400">
            SNIFF data saved automatically. Route completed SNIFF to CFCR.
          </p>
          <button onClick={onClose} className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
