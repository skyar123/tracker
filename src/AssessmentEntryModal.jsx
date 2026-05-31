import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, AlertTriangle, Calendar, Info, ShieldAlert, TrendingUp } from 'lucide-react';
import { getAssessmentDate, getAssessment } from './assessmentUtils.js';
import {
  interpretCESDR, interpretPCL5, interpretPSI, interpretCCIS,
  interpretMCHAT, interpretASQSE2, interpretBITSEA, interpretPKBS2,
  interpretEPDS, interpretASQ3, classifyASQ3Domain,
} from './scoringEngine.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectType(key) {
  if (!key) return 'standard';
  if (key.includes('cesdr')) return 'cesdr';
  if (key.includes('psi') && !key.includes('epds')) return 'psi';
  if (key.includes('pcl5')) return 'pcl5';
  if (key.includes('ccis')) return 'ccis';
  if (key.includes('asq3') || key.includes('_asq3') || key === 'base_asq3' || key === '6mo_asq3') return 'asq3';
  if (key.includes('mchat')) return 'mchat';
  if (key.includes('epds')) return 'epds';
  if (key.includes('lscr')) return 'lscr';
  if (key.includes('tesi')) return 'tesi';
  if (key.includes('hope')) return 'hope';
  if (key.includes('pq') && !key.includes('sniff')) return 'pq';
  // SE tool: could be asqse2, bitsea, pkbs2 — passed via assessmentDef.seToolType
  if (key.includes('_se') || key === 'base_se' || key === '6mo_se' || key === 'dc_se') return 'se';
  return 'standard';
}

const CLASSIFICATION_STYLE = {
  NO_CONCERN:       { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', label: 'No Concern' },
  MONITOR:          { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   label: 'Monitor' },
  EXPLORE_FURTHER:  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   label: 'Explore Further' },
  REFERRAL:         { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     label: 'Referral Indicated' },
  CLINICAL_THRESHOLD: { bg: 'bg-red-50',   border: 'border-red-200',     text: 'text-red-800',     label: 'Clinical Threshold' },
  CLINICAL:         { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     label: 'Clinical Range' },
  HIGH:             { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   label: 'High' },
  VERY_LOW:         { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    label: 'Very Low — Review' },
  NORMATIVE:        { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', label: 'Normative' },
  RESPONSIVE:       { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', label: 'Responsive' },
  ADEQUATE:         { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    label: 'Adequate' },
  CONCERN:          { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   label: 'Clinical Concern' },
  HIGH_CONCERN:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     label: 'High Concern' },
  LOW:              { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', label: 'Low Risk' },
  MEDIUM:           { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   label: 'Medium Risk' },
  HIGH_RISK:        { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     label: 'High Risk' },
};

const ALERT_STYLE = {
  safety:   { bg: 'bg-red-100',    border: 'border-red-400',    text: 'text-red-900',    icon: ShieldAlert },
  critical: { bg: 'bg-red-50',     border: 'border-red-300',    text: 'text-red-800',    icon: AlertTriangle },
  warning:  { bg: 'bg-amber-50',   border: 'border-amber-300',  text: 'text-amber-800',  icon: AlertTriangle },
  info:     { bg: 'bg-blue-50',    border: 'border-blue-300',   text: 'text-blue-800',   icon: Info },
};

function AlertBox({ alert }) {
  const style = ALERT_STYLE[alert.level] || ALERT_STYLE.info;
  const Icon = style.icon;
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${style.bg} ${style.border} ${style.text}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="text-sm font-medium">{alert.message}</p>
    </div>
  );
}

function ResultPanel({ result, classification }) {
  if (!classification) return null;
  const style = CLASSIFICATION_STYLE[classification] || CLASSIFICATION_STYLE.NO_CONCERN;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${style.bg} ${style.border}`}>
      <TrendingUp className={`w-4 h-4 ${style.text}`} />
      <span className={`text-sm font-bold ${style.text}`}>{style.label}</span>
      {result?.action && <span className={`text-xs ${style.text} opacity-80`}>— {result.action}</span>}
    </div>
  );
}

const ASQ3_DOMAIN_LABELS = {
  communication: 'Communication',
  grossMotor: 'Gross Motor',
  fineMotor: 'Fine Motor',
  problemSolving: 'Problem Solving',
  personalSocial: 'Personal-Social',
};

const ASQ3_ZONE_STYLE = {
  black: { bg: 'bg-slate-800', text: 'text-white', label: 'Delay' },
  grey:  { bg: 'bg-slate-300', text: 'text-slate-900', label: 'Monitor' },
  white: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Typical' },
  null:  { bg: 'bg-slate-100', text: 'text-slate-400', label: '—' },
};

// ─── Score input sections per instrument ──────────────────────────────────────

function CesdRInputs({ scores, onChange, result }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Enter the total score (0–60) and the values for Items 14 &amp; 15 (suicidal ideation check).
        Both Items score 0–3 using the same Likert as other items.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <label className="block text-xs font-bold text-slate-600 mb-1">Total Score (0–60)</label>
          <input type="number" min="0" max="60" className="w-full p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
            value={scores.total ?? ''} onChange={e => onChange('total', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-red-600 mb-1">Item 14 (0–3)</label>
          <input type="number" min="0" max="3" className="w-full p-2 border-2 border-red-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-red-400 outline-none"
            value={scores.item14 ?? ''} onChange={e => onChange('item14', e.target.value)}
            placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-bold text-red-600 mb-1">Item 15 (0–3)</label>
          <input type="number" min="0" max="3" className="w-full p-2 border-2 border-red-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-red-400 outline-none"
            value={scores.item15 ?? ''} onChange={e => onChange('item15', e.target.value)}
            placeholder="0" />
        </div>
      </div>
      {scores.total !== undefined && scores.total !== '' && (
        <>
          <ResultPanel result={result} classification={result?.classification} />
          {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
        </>
      )}
      <p className="text-[10px] text-slate-400">Items 14 &amp; 15 relate to suicidal ideation/self-harm. Any score &gt; 0 triggers an immediate safety alert.</p>
    </div>
  );
}

function PsiInputs({ scores, onChange, result }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Enter the composite percentile from the PSI-4-SF scoring software or manual tables (1–99).
      </p>
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Composite Percentile (1–99)</label>
          <input type="number" min="1" max="99" className="w-28 p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
            value={scores.percentile ?? ''} onChange={e => onChange('percentile', e.target.value)} />
        </div>
        <div className="text-xs text-slate-400">
          <p>16–84 = Normative</p>
          <p>85–89 = High</p>
          <p className="text-red-500">≥ 90 = Clinical</p>
          <p className="text-blue-500">&lt; 16 = Review</p>
        </div>
      </div>
      {scores.percentile !== undefined && scores.percentile !== '' && (
        <>
          <ResultPanel result={result} classification={result?.classification} />
          {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
        </>
      )}
    </div>
  );
}

function Pcl5Inputs({ scores, onChange, result }) {
  const clusters = scores.clusters || {};
  const setCluster = (k, v) => onChange('clusters', { ...clusters, [k]: v });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Total Score (0–80)</label>
          <input type="number" min="0" max="80" className="w-full p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
            value={scores.total ?? ''} onChange={e => onChange('total', e.target.value)} />
        </div>
        <div className="text-xs text-slate-400 flex items-center">
          <p>&gt; 33 = Symptomatic (possible PTSD)</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-700">DSM-5 Cluster Analysis</p>
        <p className="text-xs text-slate-500">Check each criterion if it is met (a response ≥ 2 on any item in that cluster):</p>
        {[
          { key: 'criteriaB', label: 'Criteria B', detail: 'Items 1–5 (≥ 1 symptomatic)' },
          { key: 'criteriaC', label: 'Criteria C', detail: 'Items 6–7 (≥ 1 symptomatic)' },
          { key: 'criteriaD', label: 'Criteria D', detail: 'Items 8–14 (≥ 2 symptomatic)' },
          { key: 'criteriaE', label: 'Criteria E', detail: 'Items 15–20 (≥ 2 symptomatic)' },
        ].map(({ key, label, detail }) => (
          <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded"
              checked={!!clusters[key]}
              onChange={e => setCluster(key, e.target.checked)} />
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className="text-xs text-slate-500">{detail}</span>
          </label>
        ))}
      </div>
      {(scores.total !== undefined && scores.total !== '') && (
        <>
          {result?.provisionalPTSD && (
            <div className="p-3 rounded-lg border-2 border-red-400 bg-red-50 text-red-900 font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Provisional PTSD Diagnosis — all cluster criteria met
            </div>
          )}
          {!result?.provisionalPTSD && (
            <ResultPanel result={result} classification={Number(scores.total) > 33 ? 'CLINICAL_THRESHOLD' : 'NO_CONCERN'} />
          )}
          {result?.alerts?.filter(a => !a.message.includes('Provisional')).map((a, i) => <AlertBox key={i} alert={a} />)}
        </>
      )}
    </div>
  );
}

function CcisInputs({ scores, onChange, result, observationCount }) {
  return (
    <div className="space-y-4">
      <div className={`p-3 rounded-lg border text-sm ${observationCount >= 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        <strong>Observations recorded:</strong> {observationCount}
        {observationCount < 4 && ' — Score requires ≥ 4 dyadic observations'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Total Score (20–100)</label>
          <input type="number" min="20" max="100" className="w-full p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
            value={scores.total ?? ''} onChange={e => onChange('total', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Highest Single Item (1–5)</label>
          <input type="number" min="1" max="5" className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-400 outline-none"
            value={scores.maxItem ?? ''} onChange={e => onChange('maxItem', e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-slate-400">Total ≥ 35 or any single item ≥ 3 = clinical concern. Lower is more responsive.</p>
      {scores.total !== undefined && scores.total !== '' && (
        <>
          <ResultPanel result={result} classification={result?.classification} />
          {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
        </>
      )}
    </div>
  );
}

function MChatInputs({ scores, onChange, result }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-800">
        <strong>Scoring reminder:</strong> Items 2, 5, and 12 are reverse-scored (Yes = risk).
        For all other items: No = risk (1 point). Sum all risk points for total.
      </div>
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Total Score (0–20)</label>
          <input type="number" min="0" max="20" className="w-24 p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
            value={scores.total ?? ''} onChange={e => onChange('total', e.target.value)} />
        </div>
        <div className="text-xs text-slate-400">
          <p className="text-emerald-600">0–2 = Low Risk</p>
          <p className="text-amber-600">3–7 = Medium Risk</p>
          <p className="text-red-600">8–20 = High Risk</p>
        </div>
      </div>
      {scores.total !== undefined && scores.total !== '' && (
        <>
          <div className={`px-3 py-2 rounded-lg font-bold text-sm ${
            result?.riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800' :
            result?.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
          }`}>
            {result?.riskLevel} RISK — {result?.action}
          </div>
          {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
        </>
      )}
    </div>
  );
}

function Asq3Inputs({ scores, onChange, result, ageMonths, isFollowUp }) {
  const domains = ['communication', 'grossMotor', 'fineMotor', 'problemSolving', 'personalSocial'];
  const domainScores = scores.domains || {};

  return (
    <div className="space-y-4">
      {isFollowUp && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm text-blue-800 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p><strong>Follow-Up:</strong> Communication domain required. Add other domains only if flagged at baseline.</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {domains.map(d => {
          const label = ASQ3_DOMAIN_LABELS[d];
          const score = domainScores[d];
          const zone = (score !== undefined && score !== '' && ageMonths)
            ? classifyASQ3Domain(Number(score), d, ageMonths)
            : null;
          const zoneStyle = ASQ3_ZONE_STYLE[zone] || ASQ3_ZONE_STYLE[null];
          const required = d === 'communication' || !isFollowUp;
          return (
            <div key={d}>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {label}{required ? '' : ' (if flagged)'}
              </label>
              <input type="number" min="0" max="60"
                className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-400 outline-none"
                value={score ?? ''}
                onChange={e => onChange('domains', { ...domainScores, [d]: e.target.value })} />
              {zone && (
                <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded ${zoneStyle.bg} ${zoneStyle.text}`}>
                  {zoneStyle.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
    </div>
  );
}

function EpdsInputs({ scores, onChange, result }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Total Score (0–30)</label>
          <input type="number" min="0" max="30" className="w-full p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
            value={scores.total ?? ''} onChange={e => onChange('total', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-red-600 mb-1">Item 10 Score (0–3)</label>
          <input type="number" min="0" max="3" className="w-full p-2 border-2 border-red-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-red-400 outline-none"
            value={scores.item10 ?? ''} onChange={e => onChange('item10', e.target.value)}
            placeholder="0" />
        </div>
      </div>
      <p className="text-xs text-slate-400">Item 10 = self-harm thoughts. Any score &gt; 0 triggers an immediate safety alert. Threshold: ≥ 13 = clinical concern.</p>
      {scores.total !== undefined && scores.total !== '' && (
        <>
          <ResultPanel result={result} classification={result?.classification} />
          {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
        </>
      )}
    </div>
  );
}

function SeInputs({ scores, onChange, result, seToolType }) {
  if (seToolType === 'BITSEA') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Problem Score</label>
            <input type="number" min="0" className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-400 outline-none"
              value={scores.problemScore ?? ''} onChange={e => onChange('problemScore', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Competence Score</label>
            <input type="number" min="0" className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-400 outline-none"
              value={scores.competenceScore ?? ''} onChange={e => onChange('competenceScore', e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-slate-400">Percentile &lt; 14th = severe deficit. Adjust age for prematurity using estimated due date.</p>
        {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
      </div>
    );
  }
  if (seToolType === 'PKBS-2') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Social Skills Total</label>
            <input type="number" min="0" className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-400 outline-none"
              value={scores.socialTotal ?? ''} onChange={e => onChange('socialTotal', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Problem Behaviors Total</label>
            <input type="number" min="0" className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-400 outline-none"
              value={scores.problemTotal ?? ''} onChange={e => onChange('problemTotal', e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-slate-400">Convert raw → standard scores (mean 100, SD 15) using PKBS-2 manual appendices. Higher problem = more behavioral concerns.</p>
        {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
      </div>
    );
  }
  // Default: ASQ:SE-2
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Scoring: Z = 0, V = 5, X = 10. Sum all item weights.</p>
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Total Score</label>
          <input type="number" min="0" className="w-24 p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
            value={scores.total ?? ''} onChange={e => onChange('total', e.target.value)} />
        </div>
        <div className="text-xs text-slate-400">
          <p className="text-emerald-600">&lt; 30 = No Concern</p>
          <p className="text-amber-600">30–44 = Monitor</p>
          <p className="text-red-600">≥ 45 = Referral</p>
        </div>
      </div>
      {scores.total !== undefined && scores.total !== '' && (
        <>
          <ResultPanel result={result} classification={result?.classification} />
          {result?.alerts?.map((a, i) => <AlertBox key={i} alert={a} />)}
        </>
      )}
    </div>
  );
}

function SimpleCountInputs({ scores, onChange, label, description }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{description}</p>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
        <input type="number" min="0" className="w-24 p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
          value={scores.total ?? ''} onChange={e => onChange('total', e.target.value)} />
      </div>
      {scores.total !== undefined && scores.total !== '' && Number(scores.total) > 1 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <strong>{Number(scores.total)} events recorded</strong> — multiple exposures indicate complex trauma.
        </div>
      )}
    </div>
  );
}

function HopeInputs({ scores, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Sum all endorsed items. Each endorsed item contributes to caregiver stress and informs care coordination goals.</p>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Total Endorsed Items</label>
        <input type="number" min="0" className="w-24 p-2 border border-slate-300 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-blue-400 outline-none"
          value={scores.total ?? ''} onChange={e => onChange('total', e.target.value)} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssessmentEntryModal({
  isOpen, onClose, onSave, assessmentKey, client, assessmentDef,
}) {
  const existingData = getAssessment(client, assessmentKey);
  const existingDate = getAssessmentDate(existingData) || new Date().toISOString().split('T')[0];
  const existingScores = typeof existingData === 'object' && existingData?.scores
    ? { ...existingData.scores }
    : {};
  // Don't show the stored result object in inputs
  const { result: _storedResult, ...cleanScores } = existingScores;

  const [completedDate, setCompletedDate] = useState(existingDate);
  const [scores, setScores] = useState(cleanScores);

  useEffect(() => {
    if (isOpen) {
      const fresh = getAssessment(client, assessmentKey);
      const freshDate = getAssessmentDate(fresh) || new Date().toISOString().split('T')[0];
      const freshScores = typeof fresh === 'object' && fresh?.scores ? { ...fresh.scores } : {};
      const { result: _r, ...cleanFresh } = freshScores;
      setCompletedDate(freshDate);
      setScores(cleanFresh);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, assessmentKey]);

  const type = detectType(assessmentKey);
  const isFollowUp = assessmentKey?.startsWith('6mo_') || assessmentKey?.startsWith('dc_');

  // Determine SE tool type from assessmentDef or client age
  const seToolType = assessmentDef?.seToolType || (() => {
    if (!client) return 'ASQ:SE-2';
    const admitDate = client.admitDate || client.intake_date;
    const dob = client.dob || client.child_dob;
    if (!dob) return 'ASQ:SE-2';
    const birth = new Date(dob);
    const ref = admitDate ? new Date(admitDate) : new Date();
    let months = (ref.getFullYear() - birth.getFullYear()) * 12 - birth.getMonth() + ref.getMonth();
    if (ref.getDate() < birth.getDate()) months--;
    months = Math.max(0, months);
    if (months < 12) return 'ASQ:SE-2';
    if (months < 36) return 'BITSEA';
    return 'PKBS-2';
  })();

  const ageMonths = useMemo(() => {
    if (!client) return null;
    const birth = new Date(client.dob || client.child_dob);
    const ref = new Date();
    let m = (ref.getFullYear() - birth.getFullYear()) * 12 - birth.getMonth() + ref.getMonth();
    if (ref.getDate() < birth.getDate()) m--;
    return Math.max(0, m);
  }, [client]);

  const observationCount = client?.ccis_observation_count || 0;

  // Compute result in real-time from current scores
  const result = useMemo(() => {
    try {
      switch (type) {
        case 'cesdr':
          if (scores.total === undefined || scores.total === '') return null;
          return interpretCESDR(Number(scores.total), scores.item14 ?? null, scores.item15 ?? null);
        case 'psi':
          if (scores.percentile === undefined || scores.percentile === '') return null;
          return interpretPSI(Number(scores.percentile));
        case 'pcl5':
          if (scores.total === undefined || scores.total === '') return null;
          return interpretPCL5(Number(scores.total), scores.clusters || {});
        case 'ccis':
          if (scores.total === undefined || scores.total === '') return null;
          return interpretCCIS(Number(scores.total), scores.maxItem ?? null, observationCount);
        case 'mchat':
          if (scores.total === undefined || scores.total === '') return null;
          return interpretMCHAT(Number(scores.total));
        case 'epds':
          if (scores.total === undefined || scores.total === '') return null;
          return interpretEPDS(Number(scores.total), scores.item10 ?? null);
        case 'asq3': {
          if (!scores.domains || Object.values(scores.domains).every(v => v === '' || v == null)) return null;
          const age = ageMonths || 12;
          return interpretASQ3(scores.domains, age);
        }
        case 'se':
          if (seToolType === 'BITSEA') {
            if (scores.problemScore === undefined || scores.problemScore === '') return null;
            return interpretBITSEA(Number(scores.problemScore), Number(scores.competenceScore || 0));
          }
          if (seToolType === 'PKBS-2') {
            if (scores.socialTotal === undefined || scores.socialTotal === '') return null;
            return interpretPKBS2(Number(scores.socialTotal), Number(scores.problemTotal || 0));
          }
          if (scores.total === undefined || scores.total === '') return null;
          return interpretASQSE2(Number(scores.total));
        default:
          return null;
      }
    } catch {
      return null;
    }
  }, [scores, type, seToolType, ageMonths, observationCount]);

  // Safety alerts from real-time result
  const safetyAlerts = result?.alerts?.filter(a => a.isSafetyAlert) || [];

  const handleScoreChange = (field, value) => {
    setScores(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!completedDate) {
      alert('Please enter a completion date.');
      return;
    }

    const payload = {
      completed: completedDate,
      uploaded: typeof existingData === 'object' && existingData?.uploaded
        ? existingData.uploaded
        : completedDate,
      scores:
        Object.keys(scores).length > 0
          ? { ...scores, result: result || undefined }
          : undefined,
    };

    onSave(assessmentKey, payload);
    onClose();
  };

  const handleClear = () => {
    onSave(assessmentKey, null);
    onClose();
  };

  if (!isOpen) return null;

  const assessmentName = assessmentDef?.name || assessmentKey?.replace(/^(base_|6mo_|dc_|q\d_)/, '').toUpperCase() || 'Assessment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Safety banner — always at top */}
        {safetyAlerts.map((a, i) => (
          <div key={i} className="px-5 py-3 bg-red-600 text-white flex items-start gap-2 animate-pulse">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-bold">{a.message}</p>
          </div>
        ))}

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Record Assessment</h2>
            <p className="text-sm text-slate-500 mt-0.5">{assessmentName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="space-y-5">
            {/* Date input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Date Completed
              </label>
              <input
                type="date"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={completedDate}
                onChange={e => setCompletedDate(e.target.value)}
              />
            </div>

            {/* Score inputs */}
            {type !== 'standard' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Score Entry</label>
                {type === 'cesdr' && <CesdRInputs scores={scores} onChange={handleScoreChange} result={result} />}
                {type === 'psi' && <PsiInputs scores={scores} onChange={handleScoreChange} result={result} />}
                {type === 'pcl5' && <Pcl5Inputs scores={scores} onChange={handleScoreChange} result={result} />}
                {type === 'ccis' && <CcisInputs scores={scores} onChange={handleScoreChange} result={result} observationCount={observationCount} />}
                {type === 'mchat' && <MChatInputs scores={scores} onChange={handleScoreChange} result={result} />}
                {type === 'asq3' && <Asq3Inputs scores={scores} onChange={handleScoreChange} result={result} ageMonths={ageMonths} isFollowUp={isFollowUp} />}
                {type === 'epds' && <EpdsInputs scores={scores} onChange={handleScoreChange} result={result} />}
                {type === 'se' && <SeInputs scores={scores} onChange={handleScoreChange} result={result} seToolType={seToolType} />}
                {type === 'lscr' && <SimpleCountInputs scores={scores} onChange={handleScoreChange} label="Number of Endorsed Stressors" description="Count the total number of endorsed life stressors. Multiple events indicate complex trauma exposure." />}
                {type === 'tesi' && <SimpleCountInputs scores={scores} onChange={handleScoreChange} label="Number of Endorsed Traumatic Events" description="Count total endorsed traumatic events. Any endorsement meets Criteria A for PTSD in the child." />}
                {type === 'hope' && <HopeInputs scores={scores} onChange={handleScoreChange} />}
                {type === 'pq' && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                    <p className="font-medium mb-1">PQ Scoring Reminder</p>
                    <p className="text-xs text-slate-500">Record total risk score below. Positive screen: ≥ 3 risk factors OR any auto-positive item (B, D, H, J, L).</p>
                    <div className="mt-2 flex items-end gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Total Risk Score</label>
                        <input type="number" min="0" className="w-20 p-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-400 outline-none"
                          value={scores.total ?? ''} onChange={e => handleScoreChange('total', e.target.value)} />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="w-4 h-4 text-red-500 rounded"
                          checked={!!scores.autoPositive} onChange={e => handleScoreChange('autoPositive', e.target.checked)} />
                        Auto-positive item(s) triggered
                      </label>
                    </div>
                    {(scores.total !== undefined && scores.total !== '') && (
                      <div className={`mt-2 p-2 rounded font-bold text-sm ${
                        (Number(scores.total) >= 3 || scores.autoPositive) ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {(Number(scores.total) >= 3 || scores.autoPositive) ? 'POSITIVE SCREEN — initiate SNIFF referrals' : 'Negative screen'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          {getAssessmentDate(getAssessment(client, assessmentKey)) ? (
            <button onClick={handleClear} className="flex-1 py-3 bg-red-50 text-red-600 font-semibold hover:bg-red-100 rounded-xl transition-colors">
              Clear Data
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors">
              Cancel
            </button>
          )}
          <button onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
