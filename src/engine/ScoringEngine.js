/**
 * ScoringEngine.js
 * 
 * Centralized business logic for scoring clinical assessments.
 * Implements strict missing data thresholds and calculates risk metrics.
 */

export class ScoringEngine {
  
  // ==========================================
  // DEVELOPMENTAL SCREENING
  // ==========================================
  
  /**
   * ASQ-3 Scoring Logic
   * Yes = 10, Sometimes = 5, Not Yet = 0
   * Invalidates domain if >= 2 missing. Applies mean substitution if 1 missing.
   */
  static scoreASQ3(domainData) {
    let score = 0;
    let missingCount = 0;
    let validItemCount = 0;
    
    // ASQ-3 typically has 6 items per domain
    const totalItems = 6;
    
    // Expects domainData as array of item responses e.g. [10, 5, null, 10, 0, 5]
    for (const val of domainData) {
      if (val === null || val === undefined) {
        missingCount++;
      } else {
        score += val;
        validItemCount++;
      }
    }
    
    if (missingCount >= 2) {
      return { isValid: false, score: null, reason: '>= 2 missing items' };
    }
    
    if (missingCount === 1) {
      const mean = score / validItemCount;
      score += mean;
    }
    
    return { isValid: true, score: score };
  }

  /**
   * M-CHAT-R/F Scoring Logic
   * No = 1 (Risk), Yes = 0. Reverse scored for 2, 5, 12.
   * Invalid if >= 3 missing.
   */
  static scoreMCHAT(payload) {
    // payload should be an array of booleans/strings for 20 items
    // Assuming format: array of 20 items where true='Yes', false='No', null='Missing'
    let missingCount = 0;
    let score = 0;
    
    const reverseItems = [1, 4, 11]; // 0-indexed for items 2, 5, 12

    for (let i = 0; i < 20; i++) {
      const val = payload[i];
      if (val === null || val === undefined) {
        missingCount++;
        continue;
      }
      
      const isYes = val === true || val === 'Yes';
      const isReverse = reverseItems.includes(i);
      
      if (isReverse) {
        if (isYes) score += 1;
      } else {
        if (!isYes) score += 1;
      }
    }
    
    if (missingCount >= 3) {
      return { isValid: false, score: null, risk: null, reason: '>= 3 missing items' };
    }
    
    let risk = 'LOW RISK';
    if (score >= 3 && score <= 7) risk = 'MEDIUM RISK';
    if (score >= 8) risk = 'HIGH RISK';
    
    return { isValid: true, score, risk };
  }

  // ==========================================
  // SOCIAL-EMOTIONAL & BEHAVIORAL
  // ==========================================
  
  /**
   * BITSEA Scoring Logic
   * 0=Not True, 1=Somewhat, 2=Very Often. N=No Opportunity.
   * Strip N entirely from calculation.
   */
  static scoreBITSEA(payload) {
    let missingCount = 0;
    let totalScorable = 0;
    let problemScore = 0;
    let competenceScore = 0;
    // Assuming payload is array of objects { type: 'problem'|'competence', value: 0|1|2|'N'|null }
    
    for (const item of payload) {
      if (item.value === 'N') continue; // Strip N
      totalScorable++;
      
      if (item.value === null || item.value === undefined) {
        missingCount++;
      } else {
        if (item.type === 'problem') problemScore += item.value;
        if (item.type === 'competence') competenceScore += item.value;
      }
    }
    
    const missingPercent = (missingCount / totalScorable) * 100;
    if (missingPercent >= 20) {
      return { isValid: false, problemScore: null, competenceScore: null, reason: '>= 20% missing (excluding N)' };
    }
    
    return { isValid: true, problemScore, competenceScore };
  }

  /**
   * ASQ:SE-2 Scoring Logic
   * Z=0, V=5, X=10
   */
  static scoreASQSE2(payload) {
    let score = 0;
    let missingCount = 0;
    
    for (const val of payload) {
      if (val === null || val === undefined) {
        missingCount++;
      } else if (val === 'Z') score += 0;
      else if (val === 'V') score += 5;
      else if (val === 'X') score += 10;
    }
    
    const missingPercent = (missingCount / payload.length) * 100;
    if (missingPercent >= 20) {
      return { isValid: false, score: null, reason: '>= 20% missing' };
    }
    
    let status = 'No Concern';
    if (score >= 30 && score < 45) status = 'Monitor/Possible Delay';
    if (score >= 45) status = 'Specialist Referral';
    
    return { isValid: true, score, status };
  }

  // ==========================================
  // RELATIONAL & ENVIRONMENTAL
  // ==========================================

  /**
   * CCIS
   * Total sum. Flag if >= 35 OR any single item >= 3.
   */
  static scoreCCIS(payload) {
    let score = 0;
    let flag = false;
    
    for (const val of payload) {
      if (val !== null && val !== undefined) {
        score += val;
        if (val >= 3) flag = true;
      }
    }
    
    if (score >= 35) flag = true;
    return { score, flag };
  }

  /**
   * PQ (Parent Questionnaire)
   * Nested logic + Auto-positives
   */
  static scorePQ(payload) {
    // payload mapping: { A: boolean, B: boolean, C: { c6: bool, c7: bool, c8: bool }, D: boolean ... }
    let riskCount = 0;
    let hasAutoPositive = false;
    
    const autoPositives = ['B', 'D', 'H', 'J', 'L'];
    
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'C' && typeof value === 'object') {
        if (!value.c6 && !value.c7 && !value.c8) {
          riskCount++; // Positive if all are NO
        }
      } else if (value === true) {
        riskCount++;
        if (autoPositives.includes(key)) hasAutoPositive = true;
      }
    }
    
    const isPositiveScreen = riskCount >= 3 || hasAutoPositive;
    return { riskCount, hasAutoPositive, isPositiveScreen };
  }

  // ==========================================
  // CAREGIVER PSYCHOPATHOLOGY & TRAUMA
  // ==========================================

  static scorePSI(payload, subscales) {
    // subscales = { PD: [0..11], PCDI: [12..23], DC: [24..35] }
    let totalMissing = 0;
    const scores = { PD: 0, PCDI: 0, DC: 0, Total: 0 };
    let isValid = true;
    let manualInterpolationRequired = false;

    for (const [subscale, indices] of Object.entries(subscales)) {
      let subscaleMissing = 0;
      for (const idx of indices) {
        const val = payload[idx];
        if (val === null || val === undefined) {
          subscaleMissing++;
          totalMissing++;
        } else {
          scores[subscale] += val;
        }
      }
      if (subscaleMissing >= 2) isValid = false;
      if (subscaleMissing === 1) manualInterpolationRequired = true;
    }

    if (totalMissing >= 8) isValid = false;

    scores.Total = scores.PD + scores.PCDI + scores.DC;
    return { isValid, scores, manualInterpolationRequired };
  }

  static scoreCESDR(payload) {
    let score = 0;
    let immediateSafetyAlert = false;
    
    for (let i = 0; i < payload.length; i++) {
      const val = payload[i]; // 0,1,2,3
      if (val !== null && val !== undefined) {
        score += val;
        if ((i === 13 || i === 14) && val > 0) { // 0-indexed items 14 & 15
          immediateSafetyAlert = true;
        }
      }
    }
    
    let status = 'Normal';
    if (score > 10) status = 'Further Exploration';
    if (score >= 16) status = 'Clinical Threshold for Depression';
    
    return { score, status, immediateSafetyAlert };
  }

  static scorePCL5(payload) {
    let totalSeverity = 0;
    let clusterB = 0, clusterC = 0, clusterD = 0, clusterE = 0;
    
    for (let i = 0; i < payload.length; i++) {
      const val = payload[i]; // 0..4
      if (val === null || val === undefined) continue;
      
      totalSeverity += val;
      const isSymptomatic = val >= 2;
      
      if (isSymptomatic) {
        if (i >= 0 && i <= 4) clusterB++;
        if (i >= 5 && i <= 6) clusterC++;
        if (i >= 7 && i <= 13) clusterD++;
        if (i >= 14 && i <= 19) clusterE++;
      }
    }
    
    const provisionalPTSD = (clusterB >= 1 && clusterC >= 1 && clusterD >= 2 && clusterE >= 2);
    
    return { totalSeverity, provisionalPTSD };
  }

  // ==========================================
  // BENCHMARK 3.1 & 3.2 CALCULATIONS
  // ==========================================
  
  /**
   * Calculates Benchmark 3.1 and 3.2 based on array of SNIFF needs
   * Need Object: { status: 'Met'|'Not Met', reason: string }
   */
  static calculateBenchmarks(activeNeeds) {
    let totalValidDenominator = 0;
    let num31 = 0;
    let num32 = 0;
    
    for (const need of activeNeeds) {
      // Exclude systemic unavailability from denominator
      if (need.status === 'Not Met' && 
         (need.reason === 'Service not available in community' || need.reason === 'Service not available in required language')) {
        continue;
      }
      
      totalValidDenominator++;
      
      if (need.status === 'Met') {
        num31++;
        num32++;
      } else if (need.status === 'Not Met') {
        if (need.reason === 'Referral(s) made and family is still waiting') {
          num31++;
          num32++;
        }
        if (need.reason === 'Caregiver did not access available service' || need.reason === 'Client referred, not eligible for service') {
          num32++;
        }
      }
    }
    
    const benchmark31 = totalValidDenominator === 0 ? 0 : (num31 / totalValidDenominator) * 100;
    const benchmark32 = totalValidDenominator === 0 ? 0 : (num32 / totalValidDenominator) * 100;
    
    return { benchmark31, benchmark32 };
  }

}
