import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Users, Clock, AlertCircle, CheckCircle, Calendar, ChevronDown, ChevronRight,
  ArrowLeft, Activity, AlertTriangle, Plus, Trash2, Calculator, Printer,
  FileText, Baby, Heart, Home, BookOpen, ExternalLink, Info, FolderOpen,
  ClipboardList, Flag, Sparkles, X, Stethoscope, UserPlus, Save, Link,
  Filter, Search, Edit2, MoreHorizontal, MessageSquare, Eye, EyeOff,
  TrendingUp, Zap, Archive, RefreshCw, Target, Download, Upload, Database
} from 'lucide-react';
import { api } from './api.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ROLES = {
  CLINICIAN: { 
    label: 'Clinician', 
    short: 'CL',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    accent: 'sky',
    icon: Stethoscope 
  },
  FRP: { 
    label: 'FRP', 
    short: 'FRP',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    accent: 'emerald',
    icon: UserPlus 
  },
  SHARED: { 
    label: 'Together', 
    short: 'Both',
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    accent: 'violet',
    icon: Users 
  }
};

const CUTOFFS = {
  ccis: { score: '≥35', action: 'Relational concern', detail: 'Single item ≥3 = concern; ≥4-5 = significant. Score after 4+ dyadic observations.', critical: false },
  cesdr: { score: '>16', action: 'Clinical depression', detail: 'Items 14/15 indicate suicidal ideation → immediate safety assessment required.', critical: true },
  pcl5: { score: '>33', action: 'PTSD indicated', detail: 'Any item scored ≥2 is symptomatic. Consider trauma-focused treatment.', critical: false },
  psi: { score: '≥85th%', action: 'High parenting stress', detail: '≥90th percentile = clinical range. <16th percentile may indicate defensive responding.', critical: false },
  pq: { score: '≥3 or auto+', action: 'Positive screen', detail: 'Auto-positive items: B (hitting), D (scared), H (drinking/drugs), J (housing), L (safety).', critical: false },
  mchat: { score: '3-7 Med / 8+ High', action: 'Autism screening', detail: 'Medium Risk: Follow-Up Interview required. High Risk: Follow-Up + immediate referral. Items 2, 5, 12 are reverse-scored.', critical: false },
  epds: { score: '≥13', action: 'Postpartum depression', detail: 'Item 10 (self-harm thoughts) requires immediate follow-up regardless of total score.', critical: true }
};

const BASELINE_PROTOCOL = [
  { 
    week: 1, 
    title: 'Engagement & History',
    items: [
      { id: 'intake', name: 'Intake / CCA', full: 'Guide to Clinical History - comprehensive family assessment', role: 'CLINICIAN', entry: 'CFCR' },
      { id: 'sniff', name: 'SNIFF', full: 'Service Needs Inventory for Families - concrete needs assessment', role: 'FRP', entry: 'CFCR' },
      { id: 'pq', name: 'PQ', full: 'Parent Questionnaire - risk/protective factors', role: 'CLINICIAN', entry: 'CFCR', cutoff: 'pq' },
    ]
  },
  { 
    week: 2, 
    title: 'Development & Screening',
    items: [
      { id: 'asq3', name: 'ASQ-3', full: 'Ages & Stages - 5 developmental domains', role: 'FRP', entry: 'ASD', note: '2+ missing items per domain = cannot score that domain' },
      { id: 'psi', name: 'PSI-4-SF', full: 'Parenting Stress Index Short Form', role: 'FRP', entry: 'ASD', cutoff: 'psi', note: '1+ missing per subscale = cannot score' },
      { id: 'cesdr', name: 'CESD-R', full: 'Center for Epidemiologic Studies Depression Scale', role: 'CLINICIAN', entry: 'CFCR', cutoff: 'cesdr', critical: true },
      { id: 'hope', name: 'HOPE', full: 'Home Observation - complete over 3+ weeks of visits', role: 'FRP', entry: 'CFCR' },
    ]
  },
  { 
    week: 3, 
    title: 'Trauma Assessment',
    items: [
      { id: 'tesi', name: 'TESI-PRR', full: 'Traumatic Events Screening Inventory - child trauma history', role: 'CLINICIAN', entry: 'CFCR', baselineOnly: true },
      { id: 'lscr', name: 'LSC-R', full: 'Life Stressor Checklist - caregiver trauma history', role: 'CLINICIAN', entry: 'CFCR', baselineOnly: true },
      { id: 'pcl5', name: 'PCL-5', full: 'PTSD Checklist for DSM-5', role: 'CLINICIAN', entry: 'CFCR', cutoff: 'pcl5' },
    ]
  },
  { 
    week: 4, 
    title: 'Interaction & Synthesis',
    items: [
      { id: 'ccis', name: 'CCIS', full: 'Caregiver-Child Interaction Scale - team consensus required', role: 'SHARED', entry: 'CFCR', cutoff: 'ccis', note: 'Score collaboratively after 4+ dyadic observations' },
    ]
  }
];

const FOLLOWUP_PROTOCOL = [
  { id: 'asq3', name: 'ASQ-3', full: 'Communication domain + any baseline concern areas ONLY', role: 'FRP', entry: 'ASD', partial: true },
  { id: 'ccis', name: 'CCIS', full: 'Caregiver-Child Interaction Scale', role: 'SHARED', entry: 'CFCR', cutoff: 'ccis' },
  { id: 'psi', name: 'PSI-4-SF', full: 'Parenting Stress Index', role: 'FRP', entry: 'ASD', cutoff: 'psi' },
  { id: 'cesdr', name: 'CESD-R', full: 'Depression Scale', role: 'CLINICIAN', entry: 'CFCR', cutoff: 'cesdr', critical: true },
  { id: 'pcl5', name: 'PCL-5', full: 'PTSD Checklist', role: 'CLINICIAN', entry: 'CFCR', cutoff: 'pcl5' },
];

const DISCHARGE_ONLY = [
  { id: 'yssf', name: 'YSSF', full: 'Youth Service Satisfaction for Families', role: 'SHARED', entry: 'CFCR' },
  { id: 'sniff_final', name: 'SNIFF (Final)', full: 'Service Needs - closing update', role: 'FRP', entry: 'CFCR' },
];

const QUARTERLY_PROTOCOL = [
  { id: 'sniff', name: 'SNIFF Update', full: 'Update service needs and concrete supports', role: 'FRP', entry: 'CFCR' },
  { id: 'tx', name: 'Treatment Plan Review', full: 'Review goals with caregiver signatures', role: 'CLINICIAN', entry: 'CFCR' },
];

// Real client data
const INITIAL_CLIENTS = [
  {
    id: "ezra-guernsey",
    name: "Ezra Guernsey",
    nickname: "Bubbles",
    dob: "2023-01-24",
    admitDate: "2025-04-02",
    type: "child",
    caregiver: "Emily Guernsey",
    notes: "",
    assessments: {
      base_intake: "2025-04-10",
      base_sniff: "2025-04-27",
      base_asq3: "2025-04-24",
      base_mchat: "2025-05-06",
      base_se: "2025-03-17",
      base_tesi: "2025-05-06",
      base_ccis: "2025-06-03",
      base_pq: "2025-04-22",
      base_psi: "2025-05-12",
      base_cesdr: "2025-05-06",
      base_lscr: "2025-05-06",
      base_pcl5: "2025-05-06",
      base_hope: "2025-05-22",
      "6mo_asq3": "2025-09-30",
      "6mo_se": "2025-09-30",
      "6mo_ccis": "2025-09-22",
      "6mo_psi": "2025-10-02",
      "6mo_cesdr": "2025-09-30",
      "6mo_pcl5": "2025-09-30"
    }
  },
  {
    id: "kaizen-reyes",
    name: "Kaizen Reyes",
    nickname: "Birdie",
    dob: "2021-06-05",
    admitDate: "2025-07-17",
    type: "child",
    caregiver: "Gracie Griffin",
    notes: "Sensory concerns - completed SSP2",
    assessments: {
      base_intake: "2025-07-24",
      base_sniff: "2025-08-06",
      base_asq3: "2025-10-06",
      base_sensory: "2025-08-21",
      base_se: "2025-08-21",
      base_tesi: "2025-08-28",
      base_ccis: "2025-09-22",
      base_pq: "2025-07-17",
      base_psi: "2025-08-21",
      base_cesdr: "2025-08-28",
      base_lscr: "2025-08-28",
      base_pcl5: "2025-08-28",
      base_hope: "2025-09-06"
    }
  },
  {
    id: "harlie-yoder",
    name: "Harlie Yoder",
    nickname: "Mermaid",
    dob: "2023-04-06",
    admitDate: "2025-04-17",
    type: "child",
    caregiver: "Sabrina Crain",
    notes: "",
    assessments: {
      base_intake: "2025-05-02",
      base_sniff: "2025-05-28",
      base_asq3: "2025-06-12",
      base_mchat: "2025-06-05",
      base_se: "2025-06-05",
      base_tesi: "2025-05-29",
      base_ccis: "2025-07-21",
      base_pq: "2025-04-18",
      base_psi: "2025-05-29",
      base_cesdr: "2025-05-29",
      base_lscr: "2025-05-29",
      base_pcl5: "2025-05-29",
      base_hope: "2025-07-15",
      "6mo_asq3": "2025-11-04",
      "6mo_se": "2025-11-04",
      "6mo_psi": "2025-11-04"
    }
  },
  {
    id: "skylar-parker",
    name: "Skylar Parker",
    nickname: "Firecracker",
    dob: "2021-05-06",
    admitDate: "2025-09-03",
    type: "child",
    caregiver: "Amanda Haney",
    notes: "Working on sensory regulation strategies",
    assessments: {
      base_intake: "2025-09-15",
      base_sniff: "2025-09-11",
      base_asq3: "2025-09-25",
      base_sensory: "2025-09-25",
      base_se: "2025-09-29",
      base_tesi: "2025-10-06",
      base_ccis: "2025-09-29",
      base_pq: "2025-09-03",
      base_psi: "2025-09-24",
      base_cesdr: "2025-10-06",
      base_lscr: "2025-10-06",
      base_pcl5: "2025-10-06",
      base_hope: "2025-10-13"
    }
  },
  {
    id: "gracie-proffitt",
    name: "Gracie Proffitt",
    nickname: "Puppy",
    dob: "2023-02-13",
    admitDate: "2025-12-15",
    type: "child",
    caregiver: "Rhonda Proffitt",
    linkedId: "kayden-proffitt",
    notes: "Twin - sibling case with Kayden",
    assessments: {
      base_intake: "2025-12-29",
      base_pq: "2025-12-15"
    }
  },
  {
    id: "kayden-proffitt",
    name: "Kayden Proffitt",
    nickname: "Peanut",
    dob: "2023-02-13",
    admitDate: "2025-12-15",
    type: "child",
    caregiver: "Rhonda Proffitt",
    linkedId: "gracie-proffitt",
    notes: "Twin - sibling case with Gracie",
    assessments: {
      base_intake: "2025-12-29",
      base_asq3: "2026-01-05",
      base_mchat: "2026-01-05",
      base_pq: "2025-12-15",
      base_hope: "2026-01-05"
    }
  },
  {
    id: "nylah-harper",
    name: "Nylah Harper",
    nickname: "Fairy",
    dob: "2020-12-17",
    admitDate: "2025-12-01",
    type: "child",
    caregiver: "Nikiria Harper",
    notes: "New intake - building rapport",
    assessments: {
      base_intake: "2025-12-01"
    }
  },
  {
    id: "royce-molina",
    name: "Royce Molina",
    nickname: "Turtle",
    dob: "2022-03-12",
    admitDate: "2025-12-16",
    type: "child",
    caregiver: "Hillary Ridenhour",
    notes: "",
    assessments: {
      base_intake: "2025-12-31",
      base_sniff: "2025-12-29",
      base_pq: "2025-12-16"
    }
  },
  {
    id: "paxton-cody",
    name: "Paxton Cody",
    nickname: "Milkshake",
    dob: "2021-11-09",
    admitDate: "2025-12-16",
    type: "child",
    caregiver: "Alyssa Brickett",
    notes: "Early engagement phase",
    assessments: {
      base_pq: "2025-12-16"
    }
  }
];

// ============================================================================
// UTILITIES
// ============================================================================

const getAgeInMonths = (dob, refDate = new Date()) => {
  if (!dob) return 0;
  const ref = new Date(refDate);
  const birth = new Date(dob);
  let months = (ref.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += ref.getMonth();
  if (ref.getDate() < birth.getDate()) months--;
  return Math.max(0, months);
};

const getDaysInService = (admitDate) => {
  if (!admitDate) return 0;
  return Math.ceil((new Date() - new Date(admitDate)) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr, style = 'short') => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (style === 'short') return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  if (style === 'medium') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
};

const addDays = (dateStr, days) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const getDueDate = (admitDate, days, format = 'short') => {
  const due = addDays(admitDate, days);
  return formatDate(due, format);
};

const getDaysUntilDue = (admitDate, dueDays) => {
  const dueDate = new Date(addDays(admitDate, dueDays));
  const today = new Date();
  return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// AGE-SPECIFIC TOOL LOGIC
// ============================================================================

const getSETool = (currentAge, ageAtAdmission, type) => {
  if (type === 'pregnant') return { id: 'asqse2', name: 'ASQ:SE-2', rule: 'Infant', role: 'FRP' };
  if (ageAtAdmission < 12) return { id: 'asqse2', name: 'ASQ:SE-2', rule: 'Continuity (<12mo)', role: 'FRP', continuity: true };
  if (currentAge < 12) return { id: 'asqse2', name: 'ASQ:SE-2', rule: '< 12 mo', role: 'FRP' };
  if (currentAge < 36) return { id: 'bitsea', name: 'BITSEA', rule: '12-35 mo', role: 'FRP' };
  return { id: 'pkbs2', name: 'PKBS-2', rule: '36-72 mo', role: 'FRP' };
};

const getSensoryTool = (ageMonths) => {
  if (ageMonths < 36) return { name: 'ITSP-2', full: 'Infant/Toddler Sensory Profile 2', rule: '< 36 mo' };
  return { name: 'SSP-2', full: 'Short Sensory Profile 2', rule: '≥ 36 mo' };
};

const isMCHATRequired = (ageMonths) => ageMonths >= 16 && ageMonths <= 30;
const isASQ3Applicable = (ageMonths) => ageMonths >= 1 && ageMonths <= 66;

// ============================================================================
// PHASE & PROGRESS CALCULATION
// ============================================================================

const getPhaseInfo = (client, days) => {
  const baseComplete = isBaselineComplete(client);
  
  if (!baseComplete) {
    const isOverdue = days > 60;
    return {
      id: 'baseline',
      label: 'Baseline',
      color: isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700',
      accent: isOverdue ? 'red' : 'blue',
      dueDays: 60,
      dueDate: getDueDate(client.admitDate, 60),
      daysUntil: getDaysUntilDue(client.admitDate, 60),
      isOverdue
    };
  }

  // Q1: Days 61-90
  if (days <= 90) {
    return { id: 'q1', label: 'Q1 Review', color: 'bg-teal-100 text-teal-700', accent: 'teal', dueDays: 90, dueDate: getDueDate(client.admitDate, 90), daysUntil: getDaysUntilDue(client.admitDate, 90), isOverdue: days > 90 };
  }

  // 6-Month: Days 91-180
  if (days <= 180) {
    const complete = is6MonthComplete(client);
    return { id: 'sixMonth', label: '6-Month', color: complete ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700', accent: complete ? 'green' : 'indigo', dueDays: 180, dueDate: getDueDate(client.admitDate, 180), daysUntil: getDaysUntilDue(client.admitDate, 180), isOverdue: days > 180 && !complete };
  }

  // Q3: Days 181-270
  if (days <= 270) {
    return { id: 'q3', label: 'Q3 Review', color: 'bg-teal-100 text-teal-700', accent: 'teal', dueDays: 270, dueDate: getDueDate(client.admitDate, 270), daysUntil: getDaysUntilDue(client.admitDate, 270), isOverdue: days > 270 };
  }

  // 12-Month/Discharge: 271+
  return { id: 'annual', label: 'Annual / DC', color: 'bg-slate-100 text-slate-700', accent: 'slate', dueDays: 365, dueDate: getDueDate(client.admitDate, 365), daysUntil: getDaysUntilDue(client.admitDate, 365), isOverdue: false };
};

const isBaselineComplete = (client) => {
  const required = ['intake', 'sniff', 'pq', 'asq3', 'psi', 'cesdr', 'hope', 'tesi', 'lscr', 'pcl5', 'ccis', 'se'];
  const age = getAgeInMonths(client.dob, client.admitDate);
  if (isMCHATRequired(age)) required.push('mchat');
  
  return required.every(id => client.assessments?.[`base_${id}`]);
};

const is6MonthComplete = (client) => {
  const required = ['asq3', 'ccis', 'psi', 'cesdr', 'pcl5', 'se'];
  return required.every(id => client.assessments?.[`6mo_${id}`]);
};

const calculateWorkload = (client) => {
  const days = getDaysInService(client.admitDate);
  const phase = getPhaseInfo(client, days);
  const age = getAgeInMonths(client.dob);
  const ageAtAdmit = getAgeInMonths(client.dob, client.admitDate);
  
  let clinicianLeft = 0;
  let frpLeft = 0;
  let sharedLeft = 0;
  
  const countItem = (item, prefix) => {
    const key = `${prefix}_${item.id}`;
    if (!client.assessments?.[key]) {
      if (item.role === 'CLINICIAN') clinicianLeft++;
      else if (item.role === 'FRP') frpLeft++;
      else if (item.role === 'SHARED') sharedLeft++;
    }
  };

  if (phase.id === 'baseline') {
    BASELINE_PROTOCOL.forEach(week => week.items.forEach(item => countItem(item, 'base')));
    // SE tool
    if (!client.assessments?.base_se) frpLeft++;
    // M-CHAT
    if (isMCHATRequired(ageAtAdmit) && !client.assessments?.base_mchat) frpLeft++;
  } else if (phase.id === 'sixMonth') {
    FOLLOWUP_PROTOCOL.forEach(item => countItem(item, '6mo'));
    if (!client.assessments?.['6mo_se']) frpLeft++;
  } else if (phase.id === 'q1' || phase.id === 'q3') {
    const prefix = phase.id;
    QUARTERLY_PROTOCOL.forEach(item => countItem(item, prefix));
  } else if (phase.id === 'annual') {
    DISCHARGE_ONLY.forEach(item => countItem(item, 'dc'));
    FOLLOWUP_PROTOCOL.forEach(item => countItem(item, 'dc'));
  }

  const total = clinicianLeft + frpLeft + sharedLeft;
  
  return { clinicianLeft, frpLeft, sharedLeft, total, phase, days };
};

// ============================================================================
// COMPONENTS
// ============================================================================

const RoleBadge = ({ roleKey, size = 'sm' }) => {
  const config = ROLES[roleKey];
  const Icon = config.icon;
  if (size === 'xs') {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded font-bold uppercase ${config.color}`}>
        <Icon className="w-2.5 h-2.5" />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide ${config.color}`}>
      <Icon className="w-3 h-3" /> {config.label}
    </span>
  );
};

const CutoffBadge = ({ cutoffKey, expanded = false }) => {
  const c = CUTOFFS[cutoffKey];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${c.critical ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
      <Activity className="w-3 h-3" /> {c.score}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const configs = {
    overdue: { color: 'bg-red-500 text-white', label: 'Overdue' },
    dueSoon: { color: 'bg-amber-100 text-amber-800 border border-amber-200', label: 'Due Soon' },
    onTrack: { color: 'bg-emerald-100 text-emerald-700', label: 'On Track' },
    complete: { color: 'bg-slate-100 text-slate-600', label: 'Complete' },
  };
  const c = configs[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.color}`}>{c.label}</span>;
};

const UrgencyIndicator = ({ daysUntil, isOverdue }) => {
  if (isOverdue) {
    return <span className="text-xs font-bold text-red-600">{Math.abs(daysUntil)}d overdue</span>;
  }
  if (daysUntil <= 7) {
    return <span className="text-xs font-bold text-amber-600">{daysUntil}d left</span>;
  }
  if (daysUntil <= 14) {
    return <span className="text-xs font-medium text-slate-500">{daysUntil}d left</span>;
  }
  return <span className="text-xs text-slate-400">{daysUntil}d</span>;
};

const ProgressRing = ({ percent, size = 40, strokeWidth = 4, color = 'blue' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  
  const colors = {
    blue: 'stroke-blue-500',
    green: 'stroke-emerald-500',
    red: 'stroke-red-500',
    amber: 'stroke-amber-500',
  };

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-100"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={colors[color] || colors.blue}
      />
    </svg>
  );
};

const AssessmentRow = ({ item, isChecked, onToggle, dateCompleted, isOverdue, showNote, roleFilter }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Filter by role
  if (roleFilter && roleFilter !== 'ALL') {
    if (item.role !== roleFilter && item.role !== 'SHARED') return null;
  }

  return (
    <div className={`border-b border-slate-100 last:border-0 transition-colors ${isOverdue && !isChecked ? 'bg-red-50/40' : ''}`}>
      <div 
        className={`p-3 sm:p-4 flex items-start gap-3 cursor-pointer group transition-all ${isChecked ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
        onClick={onToggle}
      >
        {/* Checkbox */}
        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
          isChecked 
            ? 'bg-emerald-500 border-emerald-500' 
            : isOverdue 
              ? 'border-red-300 bg-white group-hover:border-red-400' 
              : 'border-slate-300 bg-white group-hover:border-blue-400'
        }`}>
          {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`font-semibold text-sm transition-all ${isChecked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {item.name}
            </span>
            <RoleBadge roleKey={item.role} />
            {item.baselineOnly && (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Baseline Only</span>
            )}
            {item.partial && (
              <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold uppercase">Partial</span>
            )}
            {item.critical && (
              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> Critical
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">{item.full}</span>
            {item.cutoff && <CutoffBadge cutoffKey={item.cutoff} />}
          </div>
          {showNote && (
            <p className="text-xs text-blue-600 mt-1 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" /> {showNote}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isChecked && dateCompleted && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {formatDate(dateCompleted)}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">{item.entry}</span>
            {(item.note || item.cutoff) && (
              <button 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-slate-300 hover:text-blue-500 p-0.5"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-12 pb-3 text-xs space-y-1 bg-slate-50 border-t border-slate-100">
          {item.cutoff && (
            <div className="text-amber-700">
              <span className="font-semibold">Cutoff:</span> {CUTOFFS[item.cutoff]?.detail}
            </div>
          )}
          {item.note && (
            <div className="text-slate-600">
              <span className="font-semibold">Note:</span> {item.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, subtitle, color = 'slate', icon: Icon, action }) => {
  const colors = {
    slate: 'bg-slate-50 border-slate-200 text-slate-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    teal: 'bg-teal-50 border-teal-200 text-teal-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    violet: 'bg-violet-50 border-violet-200 text-violet-800',
  };
  
  return (
    <div className={`px-4 py-3 border-y flex items-center justify-between sticky top-0 z-10 ${colors[color]}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 opacity-70" />}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-[10px] opacity-70">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
};

const PhaseTab = ({ phase, isActive, onClick, workload }) => {
  const hasWork = workload?.total > 0;
  
  return (
    <button
      onClick={onClick}
      className={`relative px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
        isActive 
          ? 'bg-white text-slate-800 shadow-sm' 
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {phase.label}
      {hasWork && !isActive && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
      )}
    </button>
  );
};

// Timeline Component
const DeadlineTimeline = ({ clients }) => {
  const today = new Date();
  const timelineData = useMemo(() => {
    // Get all upcoming deadlines
    const deadlines = clients.map(c => {
      const workload = calculateWorkload(c);
      const dueDate = new Date(addDays(c.admitDate, workload.phase.dueDays));
      const daysUntil = workload.phase.daysUntil;
      return {
        client: c,
        phase: workload.phase,
        dueDate,
        daysUntil,
        isOverdue: workload.phase.isOverdue
      };
    }).sort((a, b) => a.dueDate - b.dueDate);

    return deadlines;
  }, [clients]);

  // Timeline range: 14 days back to 30 days forward
  const rangeStart = -14;
  const rangeEnd = 45;
  const totalDays = rangeEnd - rangeStart;

  const getPosition = (daysUntil) => {
    // Position relative to today (which is at day 0)
    const dayPosition = daysUntil - rangeStart;
    return Math.max(0, Math.min(100, (dayPosition / totalDays) * 100));
  };

  const todayPosition = getPosition(0);

  // Group deadlines that are close together
  const groupedDeadlines = useMemo(() => {
    const groups = [];
    let currentGroup = null;

    timelineData.forEach(d => {
      if (d.daysUntil < rangeStart || d.daysUntil > rangeEnd) return;
      
      if (!currentGroup || Math.abs(d.daysUntil - currentGroup.daysUntil) > 2) {
        currentGroup = { daysUntil: d.daysUntil, items: [d] };
        groups.push(currentGroup);
      } else {
        currentGroup.items.push(d);
      }
    });

    return groups;
  }, [timelineData]);

  // Find the next upcoming deadline
  const nextDeadline = timelineData.find(d => d.daysUntil >= 0 && !d.isOverdue);
  const overdueCount = timelineData.filter(d => d.isOverdue).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Deadline Timeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Next 45 days at a glance</p>
        </div>
        {nextDeadline && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">
              Next: <strong>{nextDeadline.client.nickname || nextDeadline.client.name}</strong> in {nextDeadline.daysUntil}d
            </span>
          </div>
        )}
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        {/* Background track */}
        <div className="h-16 bg-gradient-to-r from-red-50 via-slate-50 to-emerald-50 rounded-xl relative overflow-visible border border-slate-100">
          
          {/* Overdue zone indicator */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-red-100/50 rounded-l-xl border-r border-red-200"
            style={{ width: `${todayPosition}%` }}
          />

          {/* Week markers */}
          {[-7, 0, 7, 14, 21, 28, 35, 42].map(day => {
            const pos = getPosition(day);
            if (pos <= 0 || pos >= 100) return null;
            return (
              <div 
                key={day}
                className="absolute top-0 bottom-0 w-px bg-slate-200"
                style={{ left: `${pos}%` }}
              >
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 whitespace-nowrap">
                  {day === 0 ? 'Today' : day < 0 ? `${Math.abs(day)}d ago` : `${day}d`}
                </span>
              </div>
            );
          })}

          {/* TODAY marker - prominent */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20"
            style={{ left: `${todayPosition}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap shadow-sm">
              TODAY
            </div>
          </div>

          {/* Deadline markers */}
          {groupedDeadlines.map((group, gi) => {
            const pos = getPosition(group.daysUntil);
            const isOverdue = group.daysUntil < 0;
            const isDueSoon = group.daysUntil >= 0 && group.daysUntil <= 7;
            const hasMultiple = group.items.length > 1;

            return (
              <div
                key={gi}
                className="absolute top-1/2 -translate-y-1/2 z-10 group"
                style={{ left: `${pos}%` }}
              >
                {/* Marker dot */}
                <div className={`relative w-4 h-4 -ml-2 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125 ${
                  isOverdue ? 'bg-red-500' : isDueSoon ? 'bg-amber-400' : 'bg-emerald-400'
                }`}>
                  {hasMultiple && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-slate-700 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {group.items.length}
                    </span>
                  )}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                  <div className={`px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap ${
                    isOverdue ? 'bg-red-600 text-white' : isDueSoon ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'
                  }`}>
                    {group.items.map((d, i) => (
                      <div key={i} className={i > 0 ? 'mt-1 pt-1 border-t border-white/20' : ''}>
                        <span className="font-bold">{d.client.nickname || d.client.name}</span>
                        <span className="opacity-80 ml-1">• {d.phase.label}</span>
                      </div>
                    ))}
                    <div className="mt-1 opacity-70 text-[10px]">
                      {isOverdue ? `${Math.abs(group.daysUntil)}d overdue` : `Due in ${group.daysUntil}d`}
                    </div>
                  </div>
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                    isOverdue ? 'border-t-red-600' : isDueSoon ? 'border-t-amber-500' : 'border-t-slate-800'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-8 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-600">Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-slate-600">Due within 7d</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-slate-600">On track</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-slate-400">
            <Info className="w-3 h-3" /> Hover markers for details
          </div>
        </div>
      </div>

      {/* Quick list of immediate priorities */}
      {(overdueCount > 0 || (nextDeadline && nextDeadline.daysUntil <= 7)) && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Immediate Priorities</h4>
          <div className="space-y-2">
            {timelineData
              .filter(d => d.isOverdue || (d.daysUntil >= 0 && d.daysUntil <= 7))
              .slice(0, 5)
              .map((d, i) => (
                <div 
                  key={i}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    d.isOverdue ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                      d.isOverdue ? 'bg-red-500' : 'bg-amber-400'
                    }`}>
                      {(d.client.nickname || d.client.name).charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-slate-800">{d.client.nickname || d.client.name}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${d.phase.color}`}>{d.phase.label}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${d.isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                    {d.isOverdue ? `${Math.abs(d.daysUntil)}d overdue` : `${d.daysUntil}d left`}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

const ClientCard = ({ client, onClick, onDelete, onEdit, linkedClient }) => {
  const workload = calculateWorkload(client);
  const { phase, days, clinicianLeft, frpLeft, sharedLeft, total } = workload;
  const age = getAgeInMonths(client.dob);
  
  const getUrgencyStatus = () => {
    if (phase.isOverdue) return 'overdue';
    if (phase.daysUntil <= 7) return 'dueSoon';
    if (total === 0) return 'complete';
    return 'onTrack';
  };
  
  const urgency = getUrgencyStatus();

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition-all group relative overflow-hidden ${
        urgency === 'overdue' ? 'border-red-200 hover:border-red-300' : 
        urgency === 'dueSoon' ? 'border-amber-200 hover:border-amber-300' :
        'border-slate-200 hover:border-blue-300'
      }`}
    >
      {/* Urgency stripe */}
      {urgency === 'overdue' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-500" />
      )}
      {urgency === 'dueSoon' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 to-amber-400" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm ${
              client.type === 'pregnant' ? 'bg-gradient-to-br from-violet-400 to-violet-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }`}>
              {(client.nickname || client.name).charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">{client.nickname || client.name}</h3>
              <p className="text-xs text-slate-400">{client.caregiver}</p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(client); }}
              className="text-slate-300 hover:text-blue-500 transition-all p-1"
              title="Edit client"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
              className="text-slate-300 hover:text-red-500 transition-all p-1"
              title="Delete client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linked sibling indicator */}
        {linkedClient && (
          <div className="mb-3 flex items-center gap-2 text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg border border-violet-100">
            <Link className="w-3 h-3" />
            <span>Sibling: {linkedClient.nickname || linkedClient.name}</span>
          </div>
        )}

        {/* Phase & Due */}
        <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${phase.color}`}>
              {phase.label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Due {phase.dueDate}</span>
              <UrgencyIndicator daysUntil={phase.daysUntil} isOverdue={phase.isOverdue} />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Day {days}</span>
            <span className="flex items-center gap-1"><Baby className="w-3 h-3" /> {age}mo</span>
          </div>
        </div>

        {/* Workload counters */}
        <div className="flex gap-2">
          <div className={`flex-1 px-2 py-2 rounded-lg border text-center transition-colors ${
            clinicianLeft > 0 
              ? 'bg-sky-50 border-sky-100 text-sky-700' 
              : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
            <div className="text-lg font-bold">{clinicianLeft}</div>
            <div className="text-[10px] font-medium uppercase">Clinician</div>
          </div>
          <div className={`flex-1 px-2 py-2 rounded-lg border text-center transition-colors ${
            frpLeft > 0 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
            <div className="text-lg font-bold">{frpLeft}</div>
            <div className="text-[10px] font-medium uppercase">FRP</div>
          </div>
          <div className={`flex-1 px-2 py-2 rounded-lg border text-center transition-colors ${
            sharedLeft > 0 
              ? 'bg-violet-50 border-violet-100 text-violet-700' 
              : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
            <div className="text-lg font-bold">{sharedLeft}</div>
            <div className="text-[10px] font-medium uppercase">Shared</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BackupModal = ({ isOpen, onClose, clients, onRestore }) => {
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const exportData = {
      version: '5.0',
      exportedAt: new Date().toISOString(),
      clientCount: clients.length,
      clients: clients
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cf-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate structure
        if (!data.clients || !Array.isArray(data.clients)) {
          throw new Error('Invalid backup file: missing clients array');
        }

        // Validate each client has required fields
        const requiredFields = ['id', 'name', 'admitDate', 'type', 'assessments'];
        for (const client of data.clients) {
          for (const field of requiredFields) {
            if (!(field in client)) {
              throw new Error(`Invalid client data: missing ${field}`);
            }
          }
        }

        // Ask for confirmation
        const confirmMsg = `This will replace your current ${clients.length} families with ${data.clients.length} families from the backup.\n\nBackup from: ${new Date(data.exportedAt).toLocaleString()}\n\nContinue?`;
        
        if (window.confirm(confirmMsg)) {
          onRestore(data.clients);
          setImportSuccess(true);
          setTimeout(() => {
            onClose();
            setImportSuccess(false);
          }, 1500);
        }
      } catch (err) {
        setImportError(err.message || 'Failed to parse backup file');
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5" /> Backup & Restore
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-800">Export Backup</h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Download a JSON file with all {clients.length} families and their assessment data.
                </p>
                <button
                  onClick={handleExport}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Backup
                </button>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-800">Restore from Backup</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Import a previously exported backup file. This will <strong>replace</strong> all current data.
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Choose Backup File
                </button>

                {importError && (
                  <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {importError}
                  </div>
                )}

                {importSuccess && (
                  <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Backup restored successfully!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Backups are stored locally in your browser. Export regularly to protect against data loss from browser resets or clearing cache.
            </span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const EditClientModal = ({ isOpen, onClose, onSave, client }) => {
  const [data, setData] = useState({ 
    name: '', 
    nickname: '', 
    dob: '', 
    admitDate: '', 
    type: 'child',
    caregiver: '',
    notes: ''
  });

  // Update form data when client changes
  useEffect(() => {
    if (client) {
      setData({
        name: client.name || '',
        nickname: client.nickname || '',
        dob: client.dob || '',
        admitDate: client.admitDate || '',
        type: client.type || 'child',
        caregiver: client.caregiver || '',
        notes: client.notes || ''
      });
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSave = () => {
    if (data.name && data.admitDate) {
      onSave({
        ...client,
        ...data
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5" /> Edit Family Record
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setData({...data, type: 'child'})}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                data.type === 'child' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Baby className="w-4 h-4" /> Child AA
            </button>
            <button 
              onClick={() => setData({...data, type: 'pregnant'})}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                data.type === 'pregnant' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Heart className="w-4 h-4" /> Pregnant AA
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Child/Client Name</label>
              <input 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={data.name} 
                onChange={e => setData({...data, name: e.target.value})}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nickname</label>
              <input 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={data.nickname} 
                onChange={e => setData({...data, nickname: e.target.value})}
                placeholder="Code name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Caregiver</label>
              <input 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={data.caregiver} 
                onChange={e => setData({...data, caregiver: e.target.value})}
                placeholder="Primary caregiver"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DOB</label>
              <input 
                type="date"
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={data.dob} 
                onChange={e => setData({...data, dob: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admit Date</label>
              <input 
                type="date"
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={data.admitDate} 
                onChange={e => setData({...data, admitDate: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
              <textarea 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                rows={2}
                value={data.notes} 
                onChange={e => setData({...data, notes: e.target.value})}
                placeholder="Any notes..."
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-all">
            Update Family
          </button>
        </div>
      </div>
    </div>
  );
};

const AddClientModal = ({ isOpen, onClose, onSave }) => {
  const [data, setData] = useState({ 
    name: '', 
    nickname: '', 
    dob: '', 
    admitDate: '', 
    type: 'child',
    caregiver: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSave = () => {
    if (data.name && data.admitDate) {
      onSave({
        ...data,
        id: Date.now().toString(),
        assessments: {},
        ageAtAdmission: data.dob ? getAgeInMonths(data.dob) : 0
      });
      setData({ name: '', nickname: '', dob: '', admitDate: '', type: 'child', caregiver: '', notes: '' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" /> New Family Intake
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setData({...data, type: 'child'})}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                data.type === 'child' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Baby className="w-4 h-4" /> Child AA
            </button>
            <button 
              onClick={() => setData({...data, type: 'pregnant'})}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                data.type === 'pregnant' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Heart className="w-4 h-4" /> Pregnant AA
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Child/Client Name</label>
              <input 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.name} 
                onChange={e => setData({...data, name: e.target.value})}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nickname</label>
              <input 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.nickname} 
                onChange={e => setData({...data, nickname: e.target.value})}
                placeholder="Code name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Caregiver</label>
              <input 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.caregiver} 
                onChange={e => setData({...data, caregiver: e.target.value})}
                placeholder="Primary caregiver"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DOB</label>
              <input 
                type="date"
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.dob} 
                onChange={e => setData({...data, dob: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admit Date</label>
              <input 
                type="date"
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={data.admitDate} 
                onChange={e => setData({...data, admitDate: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
              <textarea 
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={2}
                value={data.notes} 
                onChange={e => setData({...data, notes: e.target.value})}
                placeholder="Any initial notes..."
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all">
            Add Family
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function CFAssessmentManager() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced'); // synced, syncing, error
  const [view, setView] = useState('list');
  const [activeId, setActiveId] = useState(null);
  const [activePhase, setActivePhase] = useState('baseline');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('urgency'); // urgency, name, days
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  // Load clients from database on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const data = await api.getClients();
        setClients(data);
        // Also save to localStorage as backup
        localStorage.setItem('cf_caseload_v5', JSON.stringify(data));
      } catch (error) {
        console.error('Failed to load clients from database:', error);
        // Fall back to localStorage
        try {
          const saved = localStorage.getItem('cf_caseload_v5');
          if (saved) {
            setClients(JSON.parse(saved));
          } else {
            setClients(INITIAL_CLIENTS);
          }
        } catch {
          setClients(INITIAL_CLIENTS);
        }
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Save to localStorage as backup whenever clients change
  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('cf_caseload_v5', JSON.stringify(clients));
    }
  }, [clients]);

  const client = useMemo(() => clients.find(c => c.id === activeId), [clients, activeId]);
  const linkedClient = useMemo(() => {
    if (!client?.linkedId) return null;
    return clients.find(c => c.id === client.linkedId);
  }, [client, clients]);

  // Actions
  const addClient = async (newClient) => {
    try {
      setSyncStatus('syncing');
      // Save to database
      await api.saveClient(newClient);
      // Update local state
      setClients([...clients, newClient]);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to save client:', error);
      setSyncStatus('error');
      // Still update local state as fallback
      setClients([...clients, newClient]);
      // Show error to user (optional)
      alert('Failed to save to database. Changes saved locally only.');
    }
  };

  const updateClient = async (updatedClient) => {
    try {
      setSyncStatus('syncing');
      // Save to database
      await api.saveClient(updatedClient);
      // Update local state
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      setSyncStatus('synced');
      setIsEditModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Failed to update client:', error);
      setSyncStatus('error');
      // Still update local state as fallback
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      setIsEditModalOpen(false);
      setEditingClient(null);
      alert('Failed to save to database. Changes saved locally only.');
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const restoreFromBackup = async (restoredClients) => {
    try {
      setSyncStatus('syncing');
      // Migrate all clients to database
      await api.migrateData(restoredClients);
      // Update local state
      setClients(restoredClients);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      setSyncStatus('error');
      // Still update local state
      setClients(restoredClients);
      alert('Failed to sync to database. Changes saved locally only.');
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm("Remove this family from caseload?")) {
      try {
        setSyncStatus('syncing');
        // Delete from database
        await api.deleteClient(id);
        // Update local state
        setClients(clients.filter(c => c.id !== id));
        if (activeId === id) {
          setView('list');
          setActiveId(null);
        }
        setSyncStatus('synced');
      } catch (error) {
        console.error('Failed to delete client:', error);
        setSyncStatus('error');
        // Still update local state
        setClients(clients.filter(c => c.id !== id));
        if (activeId === id) {
          setView('list');
          setActiveId(null);
        }
        alert('Failed to delete from database. Removed locally only.');
      }
    }
  };

  const toggleAssessment = async (key) => {
    if (!client) return;

    let updatedClient;

    // M-CHAT special handling
    if (key === 'base_mchat' && !client.assessments?.[key]) {
      const isHighRisk = window.confirm(
        "M-CHAT-R/F Score Check:\n\n" +
        "Did the child score ≥ 3?\n\n" +
        "• 0-2 = Low Risk ✓ (no further action)\n" +
        "• 3-7 = Medium Risk → Follow-Up Interview required\n" +
        "• 8-20 = High Risk → Follow-Up + immediate referral\n\n" +
        "Click OK if score was 3 or higher."
      );
      
      updatedClient = {
        ...client,
        assessments: { ...client.assessments, [key]: new Date().toISOString() },
        mchatHighRisk: isHighRisk
      };
    } else {
      const isDone = !!client.assessments?.[key];
      updatedClient = {
        ...client,
        assessments: { ...client.assessments, [key]: isDone ? null : new Date().toISOString() }
      };
    }

    // Update local state immediately for responsiveness
    setClients(clients.map(c => c.id === activeId ? updatedClient : c));

    // Save to database in background
    try {
      setSyncStatus('syncing');
      await api.saveClient(updatedClient);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to save assessment:', error);
      setSyncStatus('error');
      // Data is already updated locally, just notify user
      setTimeout(() => setSyncStatus('synced'), 2000);
    }
  };

  // Filter and sort clients
  const processedClients = useMemo(() => {
    let result = [...clients];
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.nickname?.toLowerCase().includes(q) ||
        c.caregiver?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const wA = calculateWorkload(a);
      const wB = calculateWorkload(b);
      
      if (sortBy === 'urgency') {
        // Overdue first, then by days until due
        if (wA.phase.isOverdue && !wB.phase.isOverdue) return -1;
        if (!wA.phase.isOverdue && wB.phase.isOverdue) return 1;
        return wA.phase.daysUntil - wB.phase.daysUntil;
      }
      if (sortBy === 'name') {
        return (a.nickname || a.name).localeCompare(b.nickname || b.name);
      }
      if (sortBy === 'days') {
        return wB.days - wA.days;
      }
      return 0;
    });

    return result;
  }, [clients, searchQuery, sortBy]);

  // Dashboard stats
  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let totalClinician = 0;
    let totalFRP = 0;

    clients.forEach(c => {
      const w = calculateWorkload(c);
      if (w.phase.isOverdue) overdue++;
      else if (w.phase.daysUntil <= 7) dueSoon++;
      totalClinician += w.clinicianLeft;
      totalFRP += w.frpLeft;
    });

    return { overdue, dueSoon, totalClinician, totalFRP, total: clients.length };
  }, [clients]);

  // ============================================================================
  // RENDER: LIST VIEW
  // ============================================================================
  const renderList = () => {
    // Show loading state
    if (loading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading your caseload...</p>
          </div>
        </div>
      );
    }

    return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="text-blue-600" /> CF Assessment Tracker
                {syncStatus === 'syncing' && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
                  </span>
                )}
                {syncStatus === 'synced' && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Synced
                  </span>
                )}
                {syncStatus === 'error' && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Sync Error
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">RHA Child First • Child AA & Pregnant AA</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                title="Export or Import your caseload data"
              >
                <Database className="w-4 h-4" /> 
                <span className="hidden sm:inline">Backup</span>
              </button>
              <a 
                href="https://drive.google.com/drive/folders/1G7CMyVWsD7C7xnf0I7__FJojfNIuaO-y" 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-amber-500" /> Forms
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Family</span><span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">{stats.total} families</span>
            </div>
            {stats.overdue > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-600">{stats.overdue} overdue</span>
              </div>
            )}
            {stats.dueSoon > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600">{stats.dueSoon} due this week</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-lg border border-sky-100">
              <Stethoscope className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-medium text-sky-600">{stats.totalClinician} clinician docs</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">{stats.totalFRP} FRP docs</span>
            </div>
          </div>

          {/* Search and sort */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name, nickname, or caregiver..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="urgency">Sort: Urgency</option>
                <option value="name">Sort: Name</option>
                <option value="days">Sort: Days in Service</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Client grid */}
      <div className="max-w-6xl mx-auto p-4 pb-20 space-y-6">
        {/* Deadline Timeline */}
        {clients.length > 0 && <DeadlineTimeline clients={clients} />}

        {/* Client cards */}
        {processedClients.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">{searchQuery ? 'No matching families' : 'No active families'}</p>
            {!searchQuery && (
              <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-medium hover:underline">
                Add your first family
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processedClients.map(c => (
              <ClientCard
                key={c.id}
                client={c}
                onClick={() => { setActiveId(c.id); setView('detail'); setActivePhase('baseline'); }}
                onEdit={handleEditClient}
                onDelete={deleteClient}
                linkedClient={c.linkedId ? clients.find(x => x.id === c.linkedId) : null}
              />
            ))}
          </div>
        )}
      </div>

      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addClient} />
      <EditClientModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingClient(null); }} onSave={updateClient} client={editingClient} />
      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} clients={clients} onRestore={restoreFromBackup} />
    </div>
    );
  };

  // ============================================================================
  // RENDER: DETAIL VIEW
  // ============================================================================
  const renderDetail = () => {
    if (!client) return null;

    const days = getDaysInService(client.admitDate);
    const age = getAgeInMonths(client.dob);
    const ageAtAdmit = getAgeInMonths(client.dob, client.admitDate);
    const workload = calculateWorkload(client);
    const { phase } = workload;

    const seTool = getSETool(age, ageAtAdmit, client.type);
    const sensoryTool = getSensoryTool(ageAtAdmit);
    const mchatRequired = client.type !== 'pregnant' && isMCHATRequired(ageAtAdmit);

    // Print mode
    if (printMode) {
      return (
        <div className="bg-white min-h-screen p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Child First Assessment Record</h1>
                <p className="text-slate-500">{client.nickname || client.name} • {client.type === 'pregnant' ? 'Pregnant AA' : 'Child AA'}</p>
              </div>
              <button onClick={() => setPrintMode(false)} className="no-print px-4 py-2 bg-slate-100 rounded-lg font-medium hover:bg-slate-200">
                ← Back
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <div className="space-y-1">
                <p><strong>Full Name:</strong> {client.name}</p>
                <p><strong>Caregiver:</strong> {client.caregiver || 'Not recorded'}</p>
                <p><strong>DOB:</strong> {client.dob ? formatDate(client.dob, 'long') : 'Not recorded'}</p>
                <p><strong>Admit Date:</strong> {formatDate(client.admitDate, 'long')}</p>
              </div>
              <div className="space-y-1">
                <p><strong>Days in Service:</strong> {days}</p>
                <p><strong>Age at Admission:</strong> {ageAtAdmit} months</p>
                <p><strong>Current Age:</strong> {age} months</p>
                <p><strong>SE Tool:</strong> {seTool.name} ({seTool.rule})</p>
              </div>
            </div>

            {client.notes && (
              <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm"><strong>Notes:</strong> {client.notes}</p>
              </div>
            )}

            <h3 className="font-bold text-lg mb-4 border-b pb-2">Completed Assessments</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Assessment</th>
                  <th className="text-left py-2">Phase</th>
                  <th className="text-left py-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(client.assessments || {})
                  .filter(([k, v]) => v)
                  .sort(([,a], [,b]) => new Date(a) - new Date(b))
                  .map(([key, date]) => (
                    <tr key={key} className="border-b border-dotted">
                      <td className="py-2 font-medium">{key.replace(/^(base_|6mo_|dc_|q\d_)/, '').toUpperCase()}</td>
                      <td className="py-2 text-slate-500">
                        {key.startsWith('base_') ? 'Baseline' : 
                         key.startsWith('6mo_') ? '6-Month' : 
                         key.startsWith('dc_') ? 'Discharge' : 
                         key.startsWith('q1_') ? 'Q1' :
                         key.startsWith('q3_') ? 'Q3' : 'Other'}
                      </td>
                      <td className="py-2">{formatDate(date, 'long')}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            <p className="text-xs text-slate-400 mt-8 pt-4 border-t">Generated {new Date().toLocaleString()}</p>
          </div>
          <style>{`@media print { .no-print { display: none !important; } }`}</style>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <button 
                  onClick={() => { setView('list'); setActiveId(null); }}
                  className="text-slate-400 hover:text-blue-600 text-sm flex items-center gap-1 mb-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Caseload
                </button>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white ${
                    client.type === 'pregnant' ? 'bg-gradient-to-br from-violet-400 to-violet-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>
                    {(client.nickname || client.name).charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800">{client.nickname || client.name}</h1>
                    <p className="text-xs text-slate-500">{client.caregiver} • Day {days} • {age}mo</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setPrintMode(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Print Record"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>

            {/* Phase tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {['baseline', 'quarterly', 'sixMonth', 'discharge'].map(p => {
                const labels = { baseline: 'Baseline', quarterly: 'Quarterly', sixMonth: '6-Month', discharge: 'Discharge' };
                return (
                  <button 
                    key={p}
                    onClick={() => setActivePhase(p)}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                      activePhase === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            {/* Role filter */}
            <div className="flex gap-2 mt-3">
              {['ALL', 'CLINICIAN', 'FRP'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    roleFilter === r 
                      ? r === 'CLINICIAN' ? 'bg-sky-100 text-sky-700' : r === 'FRP' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200'
                  }`}
                >
                  {r === 'ALL' ? 'All Roles' : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">

          {/* ===== BASELINE PHASE ===== */}
          {activePhase === 'baseline' && (
            <>
              {/* Phase status card */}
              <div className={`rounded-2xl p-4 border ${phase.isOverdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800">Baseline Status</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Due {phase.dueDate}</span>
                    <UrgencyIndicator daysUntil={phase.daysUntil} isOverdue={phase.isOverdue} />
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  {isBaselineComplete(client) ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Baseline complete!</span>
                  ) : (
                    <span>Complete all assessments within 60 days of admission</span>
                  )}
                </div>
              </div>

              {/* Age-specific tools card */}
              {client.type !== 'pregnant' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Age-Specific Tools
                    <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Admit age: {ageAtAdmit}mo</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
                      <span className="block text-[10px] text-blue-600 font-bold uppercase mb-1">Social-Emotional</span>
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        {seTool.name}
                        {seTool.continuity && <Sparkles className="w-3 h-3 text-amber-500" title="Continuity Rule" />}
                      </span>
                      <span className="text-[10px] text-slate-500">{seTool.rule}</span>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
                      <span className="block text-[10px] text-blue-600 font-bold uppercase mb-1">M-CHAT-R/F</span>
                      <span className={`font-bold ${mchatRequired ? 'text-red-600' : 'text-slate-400'}`}>
                        {mchatRequired ? 'Required' : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-500">16-30mo only</span>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
                      <span className="block text-[10px] text-blue-600 font-bold uppercase mb-1">Sensory (Optional)</span>
                      <span className="font-bold text-blue-900">{sensoryTool.name}</span>
                      <span className="text-[10px] text-slate-500">{sensoryTool.rule}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly protocol sections */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {BASELINE_PROTOCOL.map((week, wi) => {
                  const weekOverdue = days > (week.week * 7 + 10);
                  return (
                    <div key={week.week}>
                      <SectionHeader 
                        title={`Week ${week.week}: ${week.title}`}
                        color={weekOverdue && !week.items.every(i => client.assessments?.[`base_${i.id}`]) ? 'amber' : 'slate'}
                        icon={week.week === 1 ? BookOpen : week.week === 2 ? Activity : week.week === 3 ? AlertCircle : Users}
                      />
                      {week.items.map(item => (
                        <AssessmentRow
                          key={item.id}
                          item={item}
                          isChecked={!!client.assessments?.[`base_${item.id}`]}
                          dateCompleted={client.assessments?.[`base_${item.id}`]}
                          onToggle={() => toggleAssessment(`base_${item.id}`)}
                          isOverdue={weekOverdue}
                          roleFilter={roleFilter}
                        />
                      ))}
                    </div>
                  );
                })}

                {/* Age-specific section */}
                {client.type !== 'pregnant' && (
                  <>
                    <SectionHeader title="Age-Specific Measures" color="blue" icon={Baby} />
                    <AssessmentRow
                      item={{ id: 'se', name: seTool.name, full: 'Social-Emotional Development', entry: 'ASD', role: 'FRP' }}
                      isChecked={!!client.assessments?.base_se}
                      dateCompleted={client.assessments?.base_se}
                      onToggle={() => toggleAssessment('base_se')}
                      roleFilter={roleFilter}
                      showNote={seTool.continuity ? 'Continuity Rule: Started under 12mo, staying with ASQ:SE-2 throughout service' : null}
                    />
                    {mchatRequired && (
                      <>
                        <AssessmentRow
                          item={{ id: 'mchat', name: 'M-CHAT-R/F', full: 'Autism Screening (16-30 months)', entry: 'ASD', role: 'FRP', cutoff: 'mchat' }}
                          isChecked={!!client.assessments?.base_mchat}
                          dateCompleted={client.assessments?.base_mchat}
                          onToggle={() => toggleAssessment('base_mchat')}
                          roleFilter={roleFilter}
                        />
                        {client.mchatHighRisk && (
                          <AssessmentRow
                            item={{ id: 'mchat_fu', name: 'M-CHAT Follow-Up Interview', full: 'Required for score ≥3 — complete before referral', entry: 'ASD', role: 'FRP', critical: true }}
                            isChecked={!!client.assessments?.base_mchat_fu}
                            dateCompleted={client.assessments?.base_mchat_fu}
                            onToggle={() => toggleAssessment('base_mchat_fu')}
                            roleFilter={roleFilter}
                            showNote="Score ≥8 = High Risk: also complete Sensory Profile and make immediate referral"
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Optional section */}
                <SectionHeader title="Optional / As Indicated" color="slate" icon={MoreHorizontal} />
                <AssessmentRow
                  item={{ id: 'sensory', name: sensoryTool.name, full: sensoryTool.full + ' — if sensory concerns or M-CHAT ≥3', entry: 'ASD', role: 'FRP' }}
                  isChecked={!!client.assessments?.base_sensory}
                  dateCompleted={client.assessments?.base_sensory}
                  onToggle={() => toggleAssessment('base_sensory')}
                  roleFilter={roleFilter}
                />
                <AssessmentRow
                  item={{ id: 'epds', name: 'EPDS', full: 'Edinburgh Postnatal Depression — within 6-12 weeks postpartum', entry: 'CFCR', role: 'CLINICIAN', cutoff: 'epds' }}
                  isChecked={!!client.assessments?.base_epds}
                  dateCompleted={client.assessments?.base_epds}
                  onToggle={() => toggleAssessment('base_epds')}
                  roleFilter={roleFilter}
                />
              </div>
            </>
          )}

          {/* ===== QUARTERLY PHASE ===== */}
          {activePhase === 'quarterly' && (
            <>
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                <h3 className="font-bold text-teal-800 mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Quarterly Requirements
                </h3>
                <p className="text-sm text-teal-700">
                  Every 90 days: Update SNIFF concrete needs and review Treatment Plan with caregiver signatures.
                </p>
              </div>

              {[1, 3].map(q => {
                const qDay = q === 1 ? 90 : 270;
                const prefix = `q${q}_`;
                const sniffDone = !!client.assessments?.[`${prefix}sniff`];
                const txDone = !!client.assessments?.[`${prefix}tx`];
                const isDue = days >= qDay - 14;
                const isComplete = sniffDone && txDone;

                return (
                  <div key={q} className={`bg-white border rounded-2xl p-4 shadow-sm ${isDue && !isComplete ? 'border-teal-200' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">Quarter {q}</h4>
                        <p className="text-xs text-slate-500">Day {qDay} • Due {getDueDate(client.admitDate, qDay)}</p>
                      </div>
                      {isDue && !isComplete && <StatusBadge status="dueSoon" />}
                      {isComplete && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <div className="space-y-2">
                      {QUARTERLY_PROTOCOL.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleAssessment(`${prefix}${item.id}`)}
                          className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                            client.assessments?.[`${prefix}${item.id}`]
                              ? 'bg-teal-50 border-teal-300 text-teal-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                            client.assessments?.[`${prefix}${item.id}`] ? 'bg-teal-500 border-teal-500' : 'border-slate-300'
                          }`}>
                            {client.assessments?.[`${prefix}${item.id}`] && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 text-left">
                            <span className="font-semibold text-sm">{item.name}</span>
                            <span className="text-xs text-slate-500 ml-2">{item.full}</span>
                          </div>
                          <RoleBadge roleKey={item.role} size="xs" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ===== 6-MONTH PHASE ===== */}
          {activePhase === 'sixMonth' && (
            <>
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> 6-Month Follow-Up
                  </h3>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    Due {getDueDate(client.admitDate, 180)}
                  </span>
                </div>
                <p className="text-sm text-indigo-700">
                  Use <strong>current age ({age}mo)</strong> for SE tool selection. ASQ-3 is Communication domain + any baseline concern areas only.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <SectionHeader title="Required Repeat Measures" color="indigo" icon={RefreshCw} />
                
                {FOLLOWUP_PROTOCOL.map(item => (
                  <AssessmentRow
                    key={item.id}
                    item={item}
                    isChecked={!!client.assessments?.[`6mo_${item.id}`]}
                    dateCompleted={client.assessments?.[`6mo_${item.id}`]}
                    onToggle={() => toggleAssessment(`6mo_${item.id}`)}
                    roleFilter={roleFilter}
                  />
                ))}

                <AssessmentRow
                  item={{ id: 'se', name: seTool.name, full: 'Social-Emotional (use current age)', entry: 'ASD', role: 'FRP' }}
                  isChecked={!!client.assessments?.['6mo_se']}
                  dateCompleted={client.assessments?.['6mo_se']}
                  onToggle={() => toggleAssessment('6mo_se')}
                  roleFilter={roleFilter}
                  showNote={`Current age: ${age}mo → ${seTool.name}`}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <strong>Not repeated:</strong> TESI-PRR and LSC-R (baseline only)
                </p>
              </div>
            </>
          )}

          {/* ===== DISCHARGE PHASE ===== */}
          {activePhase === 'discharge' && (
            <>
              <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Archive className="w-5 h-5 text-slate-600" />
                  <h3 className="font-bold text-slate-800">Discharge / Termination Protocol</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Required regardless of length of service. Use <strong>current age ({age}mo)</strong> for tool selection.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <SectionHeader title="Discharge-Only Requirements" color="slate" icon={FileText} />
                {DISCHARGE_ONLY.map(item => (
                  <AssessmentRow
                    key={item.id}
                    item={item}
                    isChecked={!!client.assessments?.[`dc_${item.id}`]}
                    dateCompleted={client.assessments?.[`dc_${item.id}`]}
                    onToggle={() => toggleAssessment(`dc_${item.id}`)}
                    roleFilter={roleFilter}
                  />
                ))}

                <SectionHeader title="Repeat Measures" color="slate" icon={RefreshCw} />
                {FOLLOWUP_PROTOCOL.map(item => (
                  <AssessmentRow
                    key={item.id}
                    item={item}
                    isChecked={!!client.assessments?.[`dc_${item.id}`]}
                    dateCompleted={client.assessments?.[`dc_${item.id}`]}
                    onToggle={() => toggleAssessment(`dc_${item.id}`)}
                    roleFilter={roleFilter}
                  />
                ))}

                <AssessmentRow
                  item={{ id: 'se', name: seTool.name, full: 'Social-Emotional (use current age)', entry: 'ASD', role: 'FRP' }}
                  isChecked={!!client.assessments?.['dc_se']}
                  dateCompleted={client.assessments?.['dc_se']}
                  onToggle={() => toggleAssessment('dc_se')}
                  roleFilter={roleFilter}
                  showNote={`Current age: ${age}mo → ${seTool.name}`}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <strong>Not repeated at discharge:</strong> TESI-PRR and LSC-R (baseline only)
                </p>
              </div>
            </>
          )}

          {/* Notes section */}
          {client.notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Notes
              </h4>
              <p className="text-sm text-slate-600">{client.notes}</p>
            </div>
          )}

          {/* Linked sibling */}
          {linkedClient && (
            <div 
              onClick={() => { setActiveId(linkedClient.id); setActivePhase('baseline'); }}
              className="bg-violet-50 border border-violet-200 rounded-2xl p-4 cursor-pointer hover:bg-violet-100 transition-colors"
            >
              <h4 className="font-bold text-violet-800 mb-2 flex items-center gap-2">
                <Link className="w-4 h-4" /> Linked Sibling Case
              </h4>
              <p className="text-sm text-violet-700">
                {linkedClient.nickname || linkedClient.name} • Day {getDaysInService(linkedClient.admitDate)} • Click to view
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return view === 'list' ? renderList() : renderDetail();
}
