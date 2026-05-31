import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Users, Clock, AlertCircle, CheckCircle, Calendar, ChevronDown, ChevronRight, ChevronLeft,
  ArrowLeft, Activity, AlertTriangle, Plus, Trash2, Calculator, Printer,
  FileText, Baby, Heart, Home, BookOpen, ExternalLink, Info, FolderOpen,
  ClipboardList, Flag, Sparkles, X, Stethoscope, UserPlus, Save, Link,
  Filter, Search, Edit2, MoreHorizontal, MessageSquare, Eye, EyeOff,
  TrendingUp, Zap, Archive, RefreshCw, Target, Download, Upload, Database, CheckCircle2,
  Bell, BellOff, Calendar as CalendarIcon, BarChart3, History, Undo2,
  Settings, Layers, CheckSquare, FileSpreadsheet, ShieldAlert
} from 'lucide-react';
import AssessmentEntryModal from './AssessmentEntryModal.jsx';
import MagicImportModal from './MagicImportModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import SniffCrmModal from './SniffCrmModal.jsx';
import { api } from './api.js';
import {
  getAssessment,
  setAssessment,
  isAssessmentComplete,
  isAssessmentUploaded,
  getAssessmentDate,
  migrateClientToNewFormat
} from './assessmentUtils.js';
import TutorialModal from './TutorialModal.jsx';
import RulesLibrary from './RulesLibrary.jsx';
import { collectClientSafetyAlerts, hasSafetyAlert } from './scoringEngine.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

// App Version - Update this when making significant changes
const APP_VERSION = '1.1.0';

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

// SNIFF must be redone every 90 days (different from other assessments which follow phase milestones).
const SNIFF_INTERVAL_DAYS = 90;

const BASELINE_PROTOCOL = [
  { 
    week: 1, 
    title: 'Engagement & History',
    items: [
      { id: 'intake', name: 'Intake / CCA', full: 'Guide to Clinical History - comprehensive family assessment', role: 'CLINICIAN', entry: 'CFCR' },
      { id: 'sniff', name: 'SNIFF', full: 'Service Needs Inventory for Families - concrete needs assessment. Redo every 90 days.', role: 'FRP', entry: 'CFCR' },
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
  { id: 'sniff_final', name: 'SNIFF (Final)', full: 'Service Needs - closing update (SNIFF is redone every 90 days)', role: 'FRP', entry: 'CFCR' },
];

const QUARTERLY_PROTOCOL = [
  { id: 'sniff', name: 'SNIFF Update', full: 'Update service needs and concrete supports — required every 90 days', role: 'FRP', entry: 'CFCR' },
  { id: 'tx', name: 'Treatment Plan Review', full: 'Review goals with caregiver signatures (Q1 & Q3 only)', role: 'CLINICIAN', entry: 'CFCR' },
];

// Client Status Configuration
const CLIENT_STATUSES = {
  ACTIVE: { 
    label: 'Active', 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Activity
  },
  ON_HOLD: { 
    label: 'On Hold', 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock
  },
  DISCHARGED: { 
    label: 'Discharged', 
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: Archive
  },
  CLOSED: { 
    label: 'Closed', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: X
  }
};

// Activity Log Types
const ACTIVITY_TYPES = {
  CLIENT_ADDED: 'client_added',
  CLIENT_UPDATED: 'client_updated',
  CLIENT_DELETED: 'client_deleted',
  CLIENT_STATUS_CHANGED: 'client_status_changed',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  ASSESSMENT_UNCOMPLETED: 'assessment_uncompleted',
  BULK_OPERATION: 'bulk_operation',
};

// Real client data
const DATA_VERSION = 'caseload-v2';

const INITIAL_CLIENTS = [];

// ============================================================================
// UTILITIES
// ============================================================================

const getAgeInMonths = (dob, refDate = new Date()) => {
  if (!dob) return 0;
  const ref = refDate ? new Date(refDate) : new Date();
  if (Number.isNaN(ref.getTime())) return 0;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
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
  if (!admitDate) return null;
  const dueDate = new Date(addDays(admitDate, dueDays));
  if (Number.isNaN(dueDate.getTime())) return null;
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
  if (!client.admitDate && !client.intake_date) {
    return {
      id: 'notAdmitted',
      label: 'Not Admitted',
      color: 'bg-amber-100 text-amber-700',
      accent: 'amber',
      dueDays: 0,
      dueDate: 'N/A',
      daysUntil: null,
      isOverdue: false
    };
  }

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
  const age = getAgeInMonths(client.dob || client.child_dob, client.admitDate || client.intake_date);
  if (isMCHATRequired(age)) required.push('mchat');
  
  return required.every(id => isAssessmentComplete(getAssessment(client, `base_${id}`)));
};

const is6MonthComplete = (client) => {
  const required = ['asq3', 'ccis', 'psi', 'cesdr', 'pcl5', 'se'];
  return required.every(id => isAssessmentComplete(getAssessment(client, `6mo_${id}`)));
};

export const getDynamicSniffDueDate = (client, q) => {
    let baseDateStr = getAssessmentDate(getAssessment(client, 'base_sniff')) || client.admitDate;
    if (!baseDateStr) return null;
    let currentDate = new Date(baseDateStr);
    
    for (let i = 1; i <= q; i++) {
      let prevKey = i === 1 ? 'base_sniff' : `q${i-1}_sniff`;
      let prevDateStr = getAssessmentDate(getAssessment(client, prevKey));
      if (prevDateStr) {
         currentDate = new Date(prevDateStr);
      }
      currentDate = new Date(currentDate.getTime() + 90 * 24*60*60*1000);
    }
    return currentDate.toISOString().split('T')[0];
  };