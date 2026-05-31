// ============================================================================
// CLINICAL ASSESSMENT SCORING ENGINE
// Child First Assessment Tracker
// Pure functions only — no UI, no side effects.
// ============================================================================

// ============================================================================
// CESD-R — Center for Epidemiology Scale-Depression, Revised
// 20 items; scale: 0-3. Items 14 & 15 = suicidal ideation safety items.
// Thresholds: >10 = explore further, >=16 = clinical depression
// ============================================================================

/**
 * @param {number} total - CESD-R total score (0–60)
 * @param {number|null} item14 - Item 14 score (0-3); null = not recorded
 * @param {number|null} item15 - Item 15 score (0-3); null = not recorded
 */
export function interpretCESDR(total, item14, item15) {
  const alerts = [];

  // Safety check FIRST — suicidal ideation items
  const i14 = item14 !== null && item14 !== undefined ? Number(item14) : null;
  const i15 = item15 !== null && item15 !== undefined ? Number(item15) : null;
  if ((i14 !== null && i14 > 0) || (i15 !== null && i15 > 0)) {
    alerts.push({
      level: 'safety',
      isSafetyAlert: true,
      message:
        'IMMEDIATE ACTION REQUIRED: CESD-R Item 14 or 15 endorsed. ' +
        'Suicidal ideation indicated — notify clinical supervisor and initiate safety planning NOW.',
    });
  }

  let classification, action;
  const score = Number(total);
  if (score <= 10) {
    classification = 'NO_CONCERN';
    action = 'Score within normal range.';
  } else if (score < 16) {
    classification = 'EXPLORE_FURTHER';
    action = 'Further exploration of depressive symptoms warranted.';
    alerts.push({ level: 'warning', message: `CESD-R ${score} > 10 — further exploration of depressive symptoms required` });
  } else {
    classification = 'CLINICAL_THRESHOLD';
    action = 'Meets clinical threshold for depression — refer for mental health evaluation.';
    alerts.push({ level: 'critical', message: `CESD-R ${score} ≥ 16 — clinical threshold for depression met` });
  }

  return { classification, action, totalScore: score, item14: i14, item15: i15, alerts };
}

// ============================================================================
// PCL-5 — PTSD Checklist for DSM-5
// 20 items; scale: 0–4. Total > 33 = symptomatic.
// DSM-5 clusters: B(1-5 ≥1), C(6-7 ≥1), D(8-14 ≥2), E(15-20 ≥2)
// ============================================================================

/**
 * @param {number} total - PCL-5 total score (0–80)
 * @param {Object} clusters - { criteriaB, criteriaC, criteriaD, criteriaE } — each boolean
 */
export function interpretPCL5(total, clusters = {}) {
  const alerts = [];
  const score = Number(total);
  const { criteriaB, criteriaC, criteriaD, criteriaE } = clusters;
  const provisionalPTSD =
    criteriaB === true &&
    criteriaC === true &&
    criteriaD === true &&
    criteriaE === true;

  if (provisionalPTSD) {
    alerts.push({
      level: 'critical',
      message:
        `PCL-5 ${score}: Provisional PTSD Diagnosis — all DSM-5 cluster criteria met. ` +
        'Specialized trauma treatment indicated.',
    });
  } else if (score > 33) {
    alerts.push({
      level: 'warning',
      message: `PCL-5 ${score} > 33 — significant trauma symptoms present. Consider trauma-focused treatment.`,
    });
  }

  const clustersProvided = Object.values(clusters).some(v => v !== null && v !== undefined);
  return { totalScore: score, provisionalPTSD, clusters, clustersProvided, alerts };
}

// ============================================================================
// PSI-4-SF — Parenting Stress Index, 4th Edition, Short Form
// Thresholds: <16th%ile = possible defensive; 16-84 = normative;
//             85-89 = high; >=90 = clinical
// ============================================================================

/**
 * @param {number} percentile - PSI composite percentile (1–99)
 */
export function interpretPSI(percentile) {
  const alerts = [];
  const pct = Number(percentile);

  let classification, action;
  if (pct < 16) {
    classification = 'VERY_LOW';
    action = 'Very low score — assess for defensive responding or lack of investment in caregiving role.';
    alerts.push({
      level: 'info',
      message: `PSI ${pct}th%ile — may indicate defensive responding, being seen as competent, or lack of investment in caregiving role`,
    });
  } else if (pct <= 84) {
    classification = 'NORMATIVE';
    action = 'Parenting stress within normal range.';
  } else if (pct <= 89) {
    classification = 'HIGH';
    action = 'Elevated parenting stress — explore support needs.';
    alerts.push({ level: 'warning', message: `PSI ${pct}th%ile (85–89) — elevated parenting stress` });
  } else {
    classification = 'CLINICAL';
    action = 'Parenting stress in clinical range — parenting intervention indicated.';
    alerts.push({ level: 'critical', message: `PSI ${pct}th%ile ≥ 90 — clinical range for parenting stress` });
  }

  return { classification, action, percentile: pct, alerts };
}

// ============================================================================
// CCIS — Caregiver-Child Interaction Scale
// 20 items, each 1–5. Total range: 20 (very responsive) to 100 (abusive).
// Flag: total >= 35 OR any single item >= 3 (conservative threshold)
// Requires >= 4 dyadic observations before scoring.
// ============================================================================

/**
 * @param {number} total - CCIS total score (20–100)
 * @param {number|null} maxItem - Highest single item score; null = not recorded
 * @param {number} observationCount - Number of recorded dyadic observations
 */
export function interpretCCIS(total, maxItem = null, observationCount = 0) {
  const alerts = [];
  const score = Number(total);
  const max = maxItem !== null ? Number(maxItem) : null;

  if (observationCount < 4) {
    alerts.push({
      level: 'warning',
      message: `Only ${observationCount} observations recorded. CCIS requires at least 4 dyadic observations before scoring is valid.`,
    });
  }

  if (score >= 35) {
    alerts.push({
      level: 'critical',
      message: `CCIS total ${score} ≥ 35 — significant relational concern flagged. Clinical team review required.`,
    });
  }

  if (max !== null && max >= 3) {
    const alertLevel = max >= 4 ? 'critical' : 'warning';
    alerts.push({
      level: alertLevel,
      message: `CCIS highest item score = ${max} ≥ 3 — specific area of concern in caregiver-child interaction.`,
    });
  }

  let classification;
  if (score < 25) classification = 'RESPONSIVE';
  else if (score < 35) classification = 'ADEQUATE';
  else if (score < 50) classification = 'CONCERN';
  else classification = 'HIGH_CONCERN';

  return { totalScore: score, classification, maxItem: max, observationCount, alerts };
}

// ============================================================================
// M-CHAT-R/F — Modified Checklist for Autism in Toddlers, Revised
// Total score 0–20. Risk levels: 0-2 LOW, 3-7 MEDIUM, 8-20 HIGH.
// Note: Items 2, 5, 12 are reverse-scored (Yes=risk).
// ============================================================================

/**
 * @param {number} total - M-CHAT total risk score (0–20)
 */
export function interpretMCHAT(total) {
  const alerts = [];
  const score = Number(total);

  let riskLevel, action, requiresFollowUp;
  if (score <= 2) {
    riskLevel = 'LOW';
    action = 'Low risk — routine monitoring at next scheduled visit.';
    requiresFollowUp = false;
  } else if (score <= 7) {
    riskLevel = 'MEDIUM';
    action = 'Medium risk — M-CHAT-R Follow-Up Interview required before further action.';
    requiresFollowUp = true;
    alerts.push({ level: 'warning', message: `M-CHAT score ${score} — MEDIUM RISK. Follow-Up Interview module must be administered.` });
  } else {
    riskLevel = 'HIGH';
    action = 'High risk — Follow-Up Interview AND high-priority referral to developmental pediatrician required.';
    requiresFollowUp = true;
    alerts.push({
      level: 'critical',
      message: `M-CHAT score ${score} — HIGH RISK. Immediate referral to developmental pediatrician. Review BITSEA items 13, 35–40 for corroborating ASD characteristics.`,
    });
  }

  return { totalScore: score, riskLevel, action, requiresFollowUp, alerts };
}

// ============================================================================
// ASQ:SE-2 — Ages & Stages Questionnaire: Social-Emotional, 2nd Edition
// Scoring: Z=0, V=5, X=10. Thresholds: <30 = no concern, 30-44 = monitor, >=45 = referral
// ============================================================================

/**
 * @param {number} total - ASQ:SE-2 total score
 */
export function interpretASQSE2(total) {
  const alerts = [];
  const score = Number(total);

  let classification, action;
  if (score < 30) {
    classification = 'NO_CONCERN';
    action = 'Social-emotional development appears typical.';
  } else if (score < 45) {
    classification = 'MONITOR';
    action = 'Monitor; explore whether child has lacked exposure to skill-building activities.';
    alerts.push({ level: 'warning', message: `ASQ:SE-2 ${score} (30–44) — monitoring range. Explore skill-building exposure.` });
  } else {
    classification = 'REFERRAL';
    action = 'Specialist referral indicated for social-emotional development concerns.';
    alerts.push({ level: 'critical', message: `ASQ:SE-2 ${score} ≥ 45 — specialist referral required.` });
  }

  return { totalScore: score, classification, action, alerts };
}

// ============================================================================
// BITSEA — Brief Infant-Toddler Social Emotional Assessment
// Problem score and Competence score; <14th %ile = critical deficit
// ============================================================================

/**
 * @param {number} problemScore - BITSEA Problem subscale score
 * @param {number} competenceScore - BITSEA Competence subscale score
 */
export function interpretBITSEA(problemScore, competenceScore) {
  const alerts = [];

  // Approximate clinical thresholds (vary by age/sex; clinician should verify with manual)
  if (Number(problemScore) >= 11) {
    alerts.push({ level: 'warning', message: `BITSEA Problem score ${problemScore} elevated — review for clinical concern areas.` });
  }
  if (Number(competenceScore) < 10) {
    alerts.push({ level: 'warning', message: `BITSEA Competence score ${competenceScore} below expected range — monitor social-emotional development.` });
  }

  return { problemScore: Number(problemScore), competenceScore: Number(competenceScore), alerts };
}

// ============================================================================
// PKBS-2 — Preschool and Kindergarten Behavior Scales, 2nd Edition
// Social Skills (higher = better); Problem Behaviors (higher = more problems)
// ============================================================================

/**
 * @param {number} socialTotal - Social Skills composite raw score
 * @param {number} problemTotal - Problem Behaviors composite raw score
 */
export function interpretPKBS2(socialTotal, problemTotal) {
  const alerts = [];

  if (Number(problemTotal) > 25) {
    alerts.push({ level: 'warning', message: `PKBS-2 Problem Behaviors score ${problemTotal} elevated — review for behavioral intervention needs.` });
  }
  if (Number(socialTotal) < 30) {
    alerts.push({ level: 'info', message: `PKBS-2 Social Skills score ${socialTotal} — note low social adjustment score.` });
  }

  return {
    socialTotal: Number(socialTotal),
    problemTotal: Number(problemTotal),
    alerts,
    note: 'Convert raw scores to standard scores (mean 100, SD 15) using PKBS-2 manual appendices.',
  };
}

// ============================================================================
// EPDS — Edinburgh Postnatal Depression Scale
// 10 items; threshold: >= 13 = clinical. Item 10 = self-harm — immediate alert.
// ============================================================================

/**
 * @param {number} total - EPDS total score (0–30)
 * @param {number|null} item10 - Item 10 score (0-3); null = not recorded
 */
export function interpretEPDS(total, item10) {
  const alerts = [];
  const score = Number(total);
  const i10 = item10 !== null && item10 !== undefined ? Number(item10) : null;

  if (i10 !== null && i10 > 0) {
    alerts.push({
      level: 'safety',
      isSafetyAlert: true,
      message:
        'IMMEDIATE ACTION REQUIRED: EPDS Item 10 endorsed — self-harm thoughts indicated. ' +
        'Notify clinical supervisor and initiate safety planning NOW.',
    });
  }

  let classification;
  if (score >= 13) {
    classification = 'CLINICAL_THRESHOLD';
    alerts.push({ level: 'critical', message: `EPDS ${score} ≥ 13 — clinical threshold for postpartum depression met.` });
  } else {
    classification = 'NO_CONCERN';
  }

  return { totalScore: score, classification, item10: i10, alerts };
}

// ============================================================================
// ASQ-3 — Ages & Stages Questionnaire, 3rd Edition
// Domain scores (0–60 each). Age-adjusted thresholds.
// Classification: 'black' = delay (referral), 'grey' = monitor, 'white' = typical
// ============================================================================

// Approximate lower cutoffs for grey zone by age interval (months)
// [blackCutoff, greyCutoff] — scores BELOW blackCutoff = delay, BELOW greyCutoff = monitor
const ASQ3_THRESHOLDS = {
  2:  { communication: [20, 33], grossMotor: [20, 33], fineMotor: [10, 23], problemSolving: [20, 33], personalSocial: [30, 40] },
  4:  { communication: [25, 38], grossMotor: [30, 43], fineMotor: [15, 28], problemSolving: [25, 38], personalSocial: [30, 43] },
  6:  { communication: [30, 43], grossMotor: [40, 48], fineMotor: [20, 33], problemSolving: [30, 43], personalSocial: [35, 48] },
  9:  { communication: [30, 43], grossMotor: [40, 53], fineMotor: [25, 38], problemSolving: [30, 43], personalSocial: [35, 48] },
  12: { communication: [35, 48], grossMotor: [45, 53], fineMotor: [25, 38], problemSolving: [35, 48], personalSocial: [40, 53] },
  18: { communication: [25, 38], grossMotor: [45, 53], fineMotor: [30, 43], problemSolving: [35, 48], personalSocial: [35, 48] },
  24: { communication: [30, 43], grossMotor: [50, 58], fineMotor: [30, 43], problemSolving: [35, 48], personalSocial: [35, 48] },
  30: { communication: [30, 43], grossMotor: [50, 58], fineMotor: [35, 48], problemSolving: [40, 53], personalSocial: [40, 53] },
  36: { communication: [35, 48], grossMotor: [50, 58], fineMotor: [35, 48], problemSolving: [40, 53], personalSocial: [40, 53] },
  42: { communication: [40, 53], grossMotor: [50, 58], fineMotor: [40, 53], problemSolving: [40, 53], personalSocial: [40, 53] },
  48: { communication: [40, 53], grossMotor: [50, 58], fineMotor: [40, 53], problemSolving: [40, 53], personalSocial: [40, 53] },
  54: { communication: [40, 53], grossMotor: [50, 58], fineMotor: [40, 53], problemSolving: [45, 53], personalSocial: [40, 53] },
  60: { communication: [40, 53], grossMotor: [50, 58], fineMotor: [40, 53], problemSolving: [45, 53], personalSocial: [40, 53] },
  66: { communication: [40, 53], grossMotor: [50, 58], fineMotor: [40, 53], problemSolving: [45, 53], personalSocial: [40, 53] },
};

function getASQ3Threshold(ageMonths) {
  const ages = Object.keys(ASQ3_THRESHOLDS).map(Number).sort((a, b) => a - b);
  let closest = ages[0];
  for (const a of ages) {
    if (ageMonths >= a) closest = a;
  }
  return ASQ3_THRESHOLDS[closest];
}

/**
 * Classify a single ASQ-3 domain score
 * @param {number} score - Domain score (0–60)
 * @param {string} domain - 'communication'|'grossMotor'|'fineMotor'|'problemSolving'|'personalSocial'
 * @param {number} ageMonths
 * @returns {'black'|'grey'|'white'}
 */
export function classifyASQ3Domain(score, domain, ageMonths) {
  const thresholds = getASQ3Threshold(ageMonths);
  if (!thresholds || !thresholds[domain]) return 'white';
  const [blackCutoff, greyCutoff] = thresholds[domain];
  if (score < blackCutoff) return 'black';
  if (score < greyCutoff) return 'grey';
  return 'white';
}

/**
 * Interpret ASQ-3 domain scores with age-adjusted classifications
 * @param {Object} domainScores - { communication, grossMotor, fineMotor, problemSolving, personalSocial } each 0-60|null
 * @param {number} ageMonths
 */
export function interpretASQ3(domainScores, ageMonths) {
  const domains = ['communication', 'grossMotor', 'fineMotor', 'problemSolving', 'personalSocial'];
  const results = {};
  const alerts = [];
  const flaggedDomains = [];

  for (const domain of domains) {
    const raw = domainScores[domain];
    if (raw === null || raw === undefined || raw === '') {
      results[domain] = { score: null, classification: null };
      continue;
    }
    const score = Number(raw);
    const classification = classifyASQ3Domain(score, domain, ageMonths);
    results[domain] = { score, classification };

    if (classification === 'black') {
      flaggedDomains.push(domain);
      alerts.push({
        level: 'critical',
        message: `ASQ-3 ${domain}: score ${score} in delay range — mandatory referral to specialist/school district required. Re-assess at 6-month and termination.`,
      });
    } else if (classification === 'grey') {
      flaggedDomains.push(domain);
      alerts.push({
        level: 'warning',
        message: `ASQ-3 ${domain}: score ${score} in monitoring zone — schedule re-assessment at 6-month and termination.`,
      });
    }
  }

  return { domains: results, ageMonths, flaggedDomains, alerts };
}

// ============================================================================
// SNIFF — Service Needs Inventory for Families
// Benchmark 3.1 and 3.2 calculations
// ============================================================================

export const SNIFF_STATUS = {
  PAST: '1',
  CURRENT: '2',
  WANT_NEW: '3',
  NOT_WANT: '4',
  TEAM_RECOMMENDS: '5',
  UNKNOWN: '6',
};

export const RESOLUTION_STATUS = {
  MET: 'met',
  STILL_WAITING: 'still_waiting',
  DID_NOT_ACCESS: 'did_not_access',
  NOT_ELIGIBLE: 'not_eligible',
  NOT_AVAILABLE_COMMUNITY: 'not_available_community',
  NOT_AVAILABLE_LANGUAGE: 'not_available_language',
  PENDING: 'pending',
};

export const RESOLUTION_LABELS = {
  met: 'Met',
  still_waiting: 'Referral made — family still waiting',
  did_not_access: 'Caregiver did not access available service',
  not_eligible: 'Client referred — not eligible',
  not_available_community: 'Service not available in community',
  not_available_language: 'Service not available in required language',
  pending: 'In Progress / Pending',
};

const SYSTEMIC_EXCLUSIONS = [
  RESOLUTION_STATUS.NOT_AVAILABLE_COMMUNITY,
  RESOLUTION_STATUS.NOT_AVAILABLE_LANGUAGE,
];

/**
 * Benchmark 3.1: (Met + Still Waiting) / (Active needs excluding systemic unavailability)
 */
export function calculateBenchmark31(activeNeeds) {
  const denominator = activeNeeds.filter(n => !SYSTEMIC_EXCLUSIONS.includes(n.resolutionStatus)).length;
  const numerator = activeNeeds.filter(
    n =>
      n.resolutionStatus === RESOLUTION_STATUS.MET ||
      n.resolutionStatus === RESOLUTION_STATUS.STILL_WAITING,
  ).length;

  return {
    numerator,
    denominator,
    percentage: denominator > 0 ? Math.round((numerator / denominator) * 100) : null,
    label: 'Benchmark 3.1',
    description: 'Met + Still Waiting / Actionable Needs',
  };
}

/**
 * Benchmark 3.2: (Met + Still Waiting + Did Not Access + Not Eligible) / same denominator
 */
export function calculateBenchmark32(activeNeeds) {
  const denominator = activeNeeds.filter(n => !SYSTEMIC_EXCLUSIONS.includes(n.resolutionStatus)).length;
  const numerator = activeNeeds.filter(n =>
    [
      RESOLUTION_STATUS.MET,
      RESOLUTION_STATUS.STILL_WAITING,
      RESOLUTION_STATUS.DID_NOT_ACCESS,
      RESOLUTION_STATUS.NOT_ELIGIBLE,
    ].includes(n.resolutionStatus),
  ).length;

  return {
    numerator,
    denominator,
    percentage: denominator > 0 ? Math.round((numerator / denominator) * 100) : null,
    label: 'Benchmark 3.2',
    description: 'All Addressable Needs / Actionable Needs',
  };
}

// ============================================================================
// ALERT LEVEL HELPERS
// ============================================================================

/** Returns the highest severity alert level from a result object */
export function getHighestAlertLevel(result) {
  if (!result?.alerts?.length) return null;
  if (result.alerts.some(a => a.level === 'safety')) return 'safety';
  if (result.alerts.some(a => a.level === 'critical')) return 'critical';
  if (result.alerts.some(a => a.level === 'warning')) return 'warning';
  if (result.alerts.some(a => a.level === 'info')) return 'info';
  return null;
}

/** Check if an assessment's stored scores contain a safety alert */
export function hasSafetyAlert(assessmentData) {
  if (!assessmentData?.scores?.result?.alerts) return false;
  return assessmentData.scores.result.alerts.some(a => a.isSafetyAlert === true);
}

/** Collect all safety alerts from a client's assessments */
export function collectClientSafetyAlerts(client) {
  const alerts = [];
  if (!client) return alerts;

  const allAssessments = {
    ...(client.assessments || {}),
    ...(client.baseline_assessments || {}),
    ...(client.six_month_assessments || {}),
  };

  Object.entries(allAssessments).forEach(([key, val]) => {
    if (val?.scores?.result?.alerts) {
      val.scores.result.alerts
        .filter(a => a.isSafetyAlert)
        .forEach(a =>
          alerts.push({ key, message: a.message, assessmentName: key.replace(/^(base_|6mo_|dc_|q\d_)/, '').toUpperCase() }),
        );
    }
  });

  return alerts;
}
