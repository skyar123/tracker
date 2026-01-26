// Utility functions for working with assessments in both old and new formats

/**
 * Check if an assessment value is in the new format (object with completed/uploaded)
 * @param {any} assessment - The assessment value to check
 * @returns {boolean}
 */
export function isNewFormat(assessment) {
  return assessment && typeof assessment === 'object' && !Array.isArray(assessment) && 'completed' in assessment;
}

/**
 * Get the completion date from an assessment (works with both formats)
 * @param {any} assessment - The assessment value (string date or object)
 * @returns {string|null} - The completion date or null
 */
export function getAssessmentDate(assessment) {
  if (!assessment) return null;
  if (isNewFormat(assessment)) {
    return assessment.completed || null;
  }
  // Old format: just a date string
  return assessment || null;
}

/**
 * Check if an assessment is completed (works with both formats)
 * @param {any} assessment - The assessment value
 * @returns {boolean}
 */
export function isAssessmentComplete(assessment) {
  return !!getAssessmentDate(assessment);
}

/**
 * Check if an assessment is uploaded (works with both formats)
 * @param {any} assessment - The assessment value
 * @returns {boolean}
 */
export function isAssessmentUploaded(assessment) {
  if (!assessment) return false;
  if (isNewFormat(assessment)) {
    return assessment.uploaded === 'yes' || !!assessment.uploaded;
  }
  // Old format: assume uploaded if completed (backward compatibility)
  return !!assessment;
}

/**
 * Convert old format assessment to new format
 * @param {string|null} oldAssessment - Old format date string
 * @param {string|null} uploadedDate - Optional upload date
 * @returns {object|null} - New format assessment object
 */
export function convertToNewFormat(oldAssessment, uploadedDate = null) {
  if (!oldAssessment) return null;
  return {
    completed: oldAssessment,
    uploaded: uploadedDate || oldAssessment || null
  };
}

/**
 * Convert new format assessment to old format (for backward compatibility)
 * @param {object|null} newAssessment - New format assessment object
 * @returns {string|null} - Old format date string
 */
export function convertToOldFormat(newAssessment) {
  if (!newAssessment) return null;
  if (isNewFormat(newAssessment)) {
    return newAssessment.completed || null;
  }
  return newAssessment;
}

/**
 * Get assessment from client using old format key (e.g., 'base_sniff')
 * Works with both old and new data structures
 * @param {object} client - The client object
 * @param {string} key - The old format key (e.g., 'base_sniff', '6mo_asq3')
 * @returns {any} - The assessment value (string or object)
 */
export function getAssessment(client, key) {
  // Try old format first (assessments object with prefixed keys)
  if (client.assessments && client.assessments[key]) {
    return client.assessments[key];
  }
  
  // Try new format (baseline_assessments or six_month_assessments)
  if (key.startsWith('base_')) {
    const assessmentName = mapOldKeyToNewName(key);
    if (client.baseline_assessments && client.baseline_assessments[assessmentName]) {
      return client.baseline_assessments[assessmentName];
    }
  } else if (key.startsWith('6mo_')) {
    const assessmentName = mapOldKeyToNewName(key);
    if (client.six_month_assessments && client.six_month_assessments[assessmentName]) {
      return client.six_month_assessments[assessmentName];
    }
  }
  
  return null;
}

/**
 * Set assessment on client (works with both formats)
 * @param {object} client - The client object
 * @param {string} key - The old format key (e.g., 'base_sniff')
 * @param {string|object} value - The assessment value (date string or object)
 */
export function setAssessment(client, key, value) {
  // If client uses old format, use assessments object
  if (client.assessments) {
    client.assessments[key] = value;
    return;
  }
  
  // If client uses new format, use baseline_assessments or six_month_assessments
  if (key.startsWith('base_')) {
    const assessmentName = mapOldKeyToNewName(key);
    if (!client.baseline_assessments) {
      client.baseline_assessments = {};
    }
    // Convert to new format if needed
    if (typeof value === 'string') {
      client.baseline_assessments[assessmentName] = { completed: value, uploaded: value };
    } else {
      client.baseline_assessments[assessmentName] = value;
    }
  } else if (key.startsWith('6mo_')) {
    const assessmentName = mapOldKeyToNewName(key);
    if (!client.six_month_assessments) {
      client.six_month_assessments = {};
    }
    // Convert to new format if needed
    if (typeof value === 'string') {
      client.six_month_assessments[assessmentName] = { completed: value, uploaded: value };
    } else {
      client.six_month_assessments[assessmentName] = value;
    }
  }
}

/**
 * Map old format key to new format assessment name
 * @param {string} oldKey - Old format key (e.g., 'base_sniff')
 * @returns {string} - New format name (e.g., 'SNIFF')
 */
export function mapOldKeyToNewName(oldKey) {
  const mapping = {
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
    'base_intake': 'SNIFF', // Note: intake is part of CCA, but we'll map it
    '6mo_asq3': 'ASQ',
    '6mo_se': 'ASQ-SE',
    '6mo_bitsea': 'BITSEA',
    '6mo_pkbs': 'PKBS',
    '6mo_ccis': 'CCIS',
    '6mo_psi': 'PSI-4',
    '6mo_cesdr': 'CESD-R',
    '6mo_pcl5': 'PCL-5',
    '6mo_yssf': 'YSSF',
    '6mo_sniff': 'SNIFF',
    '6mo_ycpc': 'YCPC',
  };
  
  return mapping[oldKey] || oldKey.replace(/^(base_|6mo_|dc_)/, '').toUpperCase();
}

/**
 * Map new format name to old format key
 * @param {string} newName - New format name (e.g., 'SNIFF')
 * @param {string} prefix - Prefix for old key ('base_', '6mo_', 'dc_')
 * @returns {string} - Old format key (e.g., 'base_sniff')
 */
export function mapNewNameToOldKey(newName, prefix = 'base_') {
  const reverseMapping = {
    'SNIFF': 'sniff',
    'ASQ': 'asq3',
    'MCHAT': 'mchat',
    'ASQ-SE': 'se',
    'Sensory': 'sensory',
    'BITSEA': 'bitsea',
    'PKBS': 'pkbs',
    'TESI': 'tesi',
    'CCIS': 'ccis',
    'PQ': 'pq',
    'PSI-4': 'psi',
    'CESD-R': 'cesdr',
    'LSC-R': 'lscr',
    'PCL-5': 'pcl5',
    'HOPE': 'hope',
    'Caregiver A': 'caregiver_a',
    'YCPC': 'ycpc',
    'WMCI': 'wmci',
    'Angels': 'angels',
    'S&D': 's_and_d',
    'Vanderbilt': 'vanderbilt',
    'YSSF': 'yssf',
  };
  
  const baseKey = reverseMapping[newName] || newName.toLowerCase().replace(/\s+/g, '_');
  return `${prefix}${baseKey}`;
}

/**
 * Migrate client from old format to new format
 * @param {object} oldClient - Client in old format
 * @returns {object} - Client in new format
 */
export function migrateClientToNewFormat(oldClient) {
  const newClient = {
    ...oldClient,
    // Map old field names to new field names
    child_name: oldClient.name || oldClient.child_name,
    child_dob: oldClient.dob || oldClient.child_dob,
    caregiver_name: oldClient.caregiver || oldClient.caregiver_name,
    intake_date: oldClient.admitDate || oldClient.intake_date,
    caregiver_dob: oldClient.caregiver_dob || oldClient.customFields?.caregiverDob || null,
    diagnosis_code: oldClient.diagnosis_code || oldClient.customFields?.diagnosisCode || null,
    diagnosis: oldClient.diagnosis || oldClient.customFields?.diagnosis || oldClient.notes?.match(/Dx:\s*(.+?)(?:\s*\(|$)/)?.[1] || null,
    // Initialize dates (will need to be set manually or from customFields)
    initial_cca_date: oldClient.initial_cca_date || oldClient.customFields?.initialCcaDate || oldClient.intake_date || oldClient.admitDate || '',
    sixty_day_cca_date: oldClient.sixty_day_cca_date || oldClient.customFields?.sixtyDayCcaDate || '',
    initial_tx_plan: oldClient.initial_tx_plan || oldClient.customFields?.initialTxPlan || '',
    sixty_day_tx_plan: oldClient.sixty_day_tx_plan || oldClient.customFields?.sixtyDayTxPlan || '',
    ninety_day_tx_plan: oldClient.ninety_day_tx_plan || oldClient.customFields?.ninetyDayTxPlan || '',
    next_tx_plan: oldClient.next_tx_plan || oldClient.customFields?.nextTxPlan || '',
    insurance_submitted: oldClient.insurance_submitted || oldClient.customFields?.insuranceSubmitted || null,
    insurance_accepted: oldClient.insurance_accepted || oldClient.customFields?.insuranceAccepted || null,
    auth_submitted: oldClient.auth_submitted || oldClient.customFields?.authSubmitted || null,
    auth_accepted: oldClient.auth_accepted || oldClient.customFields?.authAccepted || null,
    auth_expires: oldClient.auth_expires || oldClient.customFields?.authExpires || null,
    insurance_type: oldClient.insurance_type || oldClient.customFields?.insuranceType || null,
    asd_caregiver_id: oldClient.asd_caregiver_id || oldClient.customFields?.asdCaregiverId || null,
    asd_client_id: oldClient.asd_client_id || oldClient.customFields?.asdClientId || null,
    caregiver_b_id: oldClient.caregiver_b_id || oldClient.customFields?.caregiverBId || null,
    has_crisis_plan: oldClient.has_crisis_plan || oldClient.customFields?.hasCrisisPlan === 'Yes' || false,
  };
  
  // Convert assessments from old format to new format
  if (oldClient.assessments) {
    newClient.baseline_assessments = {};
    newClient.six_month_assessments = {};
    
    Object.entries(oldClient.assessments).forEach(([key, value]) => {
      if (key.startsWith('base_')) {
        const assessmentName = mapOldKeyToNewName(key);
        if (value) {
          newClient.baseline_assessments[assessmentName] = {
            completed: value,
            uploaded: value // Assume uploaded if completed (backward compatibility)
          };
        }
      } else if (key.startsWith('6mo_')) {
        const assessmentName = mapOldKeyToNewName(key);
        if (value) {
          newClient.six_month_assessments[assessmentName] = {
            completed: value,
            uploaded: value
          };
        }
      }
    });
  }
  
  // Keep old format assessments for backward compatibility
  newClient.assessments = oldClient.assessments;
  
  return newClient;
}
