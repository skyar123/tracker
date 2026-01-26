// Type definitions for Child First caseload tracker

export interface Assessment {
  completed?: string;
  uploaded?: string | 'yes';
}

export interface BaselineAssessments {
  SNIFF?: Assessment;
  ASQ?: Assessment;
  'ASQ-SE'?: Assessment;
  MCHAT?: Assessment;
  Sensory?: Assessment;
  BITSEA?: Assessment;
  PKBS?: Assessment;
  TESI?: Assessment;
  CCIS?: Assessment;
  PQ?: Assessment;
  'PSI-4'?: Assessment;
  'CESD-R'?: Assessment;
  'LSC-R'?: Assessment;
  'PCL-5'?: Assessment;
  HOPE?: Assessment;
  'Caregiver A'?: Assessment;
  YCPC?: Assessment;
  WMCI?: Assessment;
  Angels?: Assessment;
  'S&D'?: Assessment;
  Vanderbilt?: Assessment;
}

export interface SixMonthAssessments {
  month?: string;
  ASQ?: Assessment;
  'ASQ-SE'?: Assessment;
  BITSEA?: Assessment;
  PKBS?: Assessment;
  CCIS?: Assessment;
  'PSI-4'?: Assessment;
  'CESD-R'?: Assessment;
  'PCL-5'?: Assessment;
  YSSF?: Assessment;
  SNIFF?: Assessment;
  YCPC?: Assessment;
}

export interface Client {
  id: number | string;
  child_name: string;
  child_dob: string;
  caregiver_name: string;
  caregiver_dob: string | null;
  intake_date: string;
  diagnosis_code: string | null;
  diagnosis: string | null;
  initial_cca_date: string;
  sixty_day_cca_date: string;
  initial_tx_plan: string;
  sixty_day_tx_plan: string;
  ninety_day_tx_plan: string;
  next_tx_plan: string;
  insurance_submitted: string | null;
  insurance_accepted: string | null;
  auth_submitted: string | null;
  auth_accepted: string | null;
  auth_expires: string | null;
  insurance_type?: string;
  asd_caregiver_id?: string;
  asd_client_id?: string;
  caregiver_b_id?: string;
  baseline_assessments: BaselineAssessments;
  six_month_assessments?: SixMonthAssessments;
  six_month_assessments_month?: string;
  discharge_assessments_month?: string;
  has_crisis_plan?: boolean;
  
  // App-specific fields (for backward compatibility)
  nickname?: string;
  type?: 'child' | 'pregnant';
  status?: 'ACTIVE' | 'ON_HOLD' | 'DISCHARGED' | 'CLOSED';
  notes?: string;
  customFields?: Record<string, string>;
  linkedId?: string;
  updatedAt?: string;
}

export interface CaseloadData {
  clients: Client[];
}

// Helper function to parse dates safely
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch {
    return null;
  }
}

// Helper function to check if assessment is complete
export function isAssessmentComplete(assessment: Assessment | undefined): boolean {
  return !!assessment?.completed;
}

// Helper function to check if assessment is uploaded
export function isAssessmentUploaded(assessment: Assessment | undefined): boolean {
  return assessment?.uploaded === 'yes' || !!assessment?.uploaded;
}

// Get all clients with upcoming deadlines (within next N days)
export function getUpcomingDeadlines(clients: Client[], daysAhead: number = 14): Array<{
  client: Client;
  deadline: Date;
  type: string;
}> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const deadlines: Array<{ client: Client; deadline: Date; type: string }> = [];

  clients.forEach((client) => {
    // Check CCA dates
    const sixtyCCA = parseDate(client.sixty_day_cca_date);
    if (sixtyCCA && sixtyCCA >= now && sixtyCCA <= cutoff) {
      deadlines.push({ client, deadline: sixtyCCA, type: '60-Day CCA' });
    }

    // Check treatment plan dates
    const nextTxPlan = parseDate(client.next_tx_plan);
    if (nextTxPlan && nextTxPlan >= now && nextTxPlan <= cutoff) {
      deadlines.push({ client, deadline: nextTxPlan, type: 'Treatment Plan' });
    }

    // Check auth expiration
    const authExpires = parseDate(client.auth_expires);
    if (authExpires && authExpires >= now && authExpires <= cutoff) {
      deadlines.push({ client, deadline: authExpires, type: 'Authorization Expiration' });
    }
  });

  return deadlines.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
}

// Get incomplete baseline assessments for a client
export function getIncompleteBaselineAssessments(client: Client): string[] {
  const incomplete: string[] = [];
  const requiredAssessments = ['SNIFF', 'ASQ', 'BITSEA', 'PKBS', 'TESI', 'CCIS', 'PQ', 'PSI-4', 'CESD-R', 'LSC-R', 'PCL-5'];
  
  requiredAssessments.forEach((assessmentName) => {
    const assessment = client.baseline_assessments[assessmentName as keyof BaselineAssessments];
    if (!isAssessmentComplete(assessment)) {
      incomplete.push(assessmentName);
    }
  });

  return incomplete;
}

// Get assessments pending upload
export function getAssessmentsPendingUpload(client: Client): string[] {
  const pending: string[] = [];
  
  Object.entries(client.baseline_assessments).forEach(([name, assessment]) => {
    if (isAssessmentComplete(assessment) && !isAssessmentUploaded(assessment)) {
      pending.push(name);
    }
  });

  return pending;
}

// Convert app's old assessment format to new format
export function convertOldAssessmentFormat(oldAssessments: Record<string, string>): BaselineAssessments {
  const newAssessments: BaselineAssessments = {};
  
  // Mapping from old format keys to new format keys
  const mapping: Record<string, keyof BaselineAssessments> = {
    'base_intake': 'SNIFF', // Note: intake maps differently
    'base_sniff': 'SNIFF',
    'base_asq3': 'ASQ',
    'base_mchat': 'MCHAT',
    'base_se': 'ASQ-SE',
    'base_sensory': 'Sensory',
    'base_bitsea': 'BITSEA',
    'base_pkbs': 'PKBS',
    'base_tesi': 'TESI',
    'base_ccis': 'CCIS',
    'base_pq': 'PQ',
    'base_psi': 'PSI-4',
    'base_cesdr': 'CESD-R',
    'base_lscr': 'LSC-R',
    'base_pcl5': 'PCL-5',
    'base_hope': 'HOPE',
    'base_caregiver_a': 'Caregiver A',
    'base_ycpc': 'YCPC',
    'base_wmci': 'WMCI',
    'base_angels': 'Angels',
    'base_s_and_d': 'S&D',
    'base_vanderbilt': 'Vanderbilt',
  };
  
  Object.entries(oldAssessments).forEach(([key, date]) => {
    if (key.startsWith('base_')) {
      const newKey = mapping[key];
      if (newKey && date) {
        newAssessments[newKey] = { completed: date, uploaded: date };
      }
    }
  });
  
  return newAssessments;
}

// Convert new format back to old format (for backward compatibility)
export function convertToOldAssessmentFormat(assessments: BaselineAssessments): Record<string, string> {
  const oldFormat: Record<string, string> = {};
  
  const reverseMapping: Record<string, string> = {
    'SNIFF': 'base_sniff',
    'ASQ': 'base_asq3',
    'MCHAT': 'base_mchat',
    'ASQ-SE': 'base_se',
    'Sensory': 'base_sensory',
    'BITSEA': 'base_bitsea',
    'PKBS': 'base_pkbs',
    'TESI': 'base_tesi',
    'CCIS': 'base_ccis',
    'PQ': 'base_pq',
    'PSI-4': 'base_psi',
    'CESD-R': 'base_cesdr',
    'LSC-R': 'base_lscr',
    'PCL-5': 'base_pcl5',
    'HOPE': 'base_hope',
    'Caregiver A': 'base_caregiver_a',
    'YCPC': 'base_ycpc',
    'WMCI': 'base_wmci',
    'Angels': 'base_angels',
    'S&D': 'base_s_and_d',
    'Vanderbilt': 'base_vanderbilt',
  };
  
  Object.entries(assessments).forEach(([key, assessment]) => {
    const oldKey = reverseMapping[key];
    if (oldKey && assessment?.completed) {
      oldFormat[oldKey] = assessment.completed;
    }
  });
  
  return oldFormat;
}
