/**
 * TimeEngine.js
 * 
 * Pseudo-scheduler that runs on app boot to evaluate temporal milestones.
 * Identifies unlocked assessments, upcoming deadlines, and overdue tasks.
 */

export class TimeEngine {

  /**
   * Evaluates the current state of a client and returns an array of
   * unlocked tasks, upcoming tasks, and overdue tasks based on timestamps.
   */
  static evaluateClient(client, currentDate = new Date()) {
    const admissionType = client.admissionType || 'Child'; // 'Child' or 'Pregnant'
    const admitDate = client.admitDate ? new Date(client.admitDate) : null;
    
    if (!admitDate) return { activeTasks: [], status: 'NO_ADMISSION_DATE' };

    const daysSinceAdmission = Math.floor((currentDate - admitDate) / (1000 * 60 * 60 * 24));
    
    if (admissionType === 'Child') {
      return this._evaluateChildTimeline(client, admitDate, daysSinceAdmission, currentDate);
    } else {
      return this._evaluatePregnantTimeline(client, admitDate, daysSinceAdmission, currentDate);
    }
  }

  static _evaluateChildTimeline(client, admitDate, daysSinceAdmission, currentDate) {
    const activeTasks = [];
    const childAgeInMonths = this._calculateAgeInMonths(client.dob, admitDate);

    // Baseline Phase (First 60 Days)
    if (daysSinceAdmission <= 60) {
      // Week 1
      if (daysSinceAdmission >= 0) {
        activeTasks.push({ id: 'intake', name: 'Intake / CCA', week: 1, required: true });
        activeTasks.push({ id: 'sniff_base', name: 'SNIFF', week: 1, required: true });
        activeTasks.push({ id: 'pq', name: 'PQ', week: 1, required: true });
        
        // Age-adjusted Social Emotional Screener
        if (childAgeInMonths < 12) {
          activeTasks.push({ id: 'asq_se2', name: 'ASQ:SE-2', week: 1, required: true });
        } else if (childAgeInMonths >= 12 && childAgeInMonths < 36) {
          activeTasks.push({ id: 'bitsea', name: 'BITSEA', week: 1, required: true });
        } else if (childAgeInMonths >= 36 && childAgeInMonths <= 72) {
          activeTasks.push({ id: 'pkbs2', name: 'PKBS-2', week: 1, required: true });
        }
      }

      // Week 2
      if (daysSinceAdmission >= 7) {
        activeTasks.push({ id: 'asq3', name: 'ASQ-3', week: 2, required: true });
        activeTasks.push({ id: 'psi', name: 'PSI-4-SF', week: 2, required: true });
        activeTasks.push({ id: 'cesdr', name: 'CESD-R', week: 2, required: true });
        activeTasks.push({ id: 'hope', name: 'HOPE', week: 2, required: true });
      }

      // Week 3
      if (daysSinceAdmission >= 14) {
        activeTasks.push({ id: 'tesi', name: 'TESI-PRR', week: 3, required: true });
        activeTasks.push({ id: 'lscr', name: 'LSC-R', week: 3, required: true });
        activeTasks.push({ id: 'pcl5', name: 'PCL-5', week: 3, required: true });
      }

      // Week 4
      if (daysSinceAdmission >= 21) {
        if (childAgeInMonths >= 16 && childAgeInMonths <= 30) {
          activeTasks.push({ id: 'mchat', name: 'M-CHAT-R/F', week: 4, required: true });
        }
        
        const dyadicVisits = client.customFields?.dyadicObservations || 0;
        if (dyadicVisits >= 4) {
          activeTasks.push({ id: 'ccis', name: 'CCIS', week: 4, required: true, status: 'ACTION_REQUIRED' });
        } else {
          activeTasks.push({ id: 'ccis', name: 'CCIS', week: 4, required: false, status: `LOCKED (${dyadicVisits}/4 visits)` });
        }
      }
    }

    // 6-Month Phase
    const sixMonthMark = new Date(admitDate);
    sixMonthMark.setMonth(sixMonthMark.getMonth() + 6);
    
    if (currentDate >= sixMonthMark) {
      // Auto-generate 6 month queue
      activeTasks.push({ id: '6mo_asq3', name: 'ASQ-3 (Follow-up)', required: true });
      activeTasks.push({ id: '6mo_ccis', name: 'CCIS', required: true });
      activeTasks.push({ id: '6mo_psi', name: 'PSI-4-SF', required: true });
      activeTasks.push({ id: '6mo_cesdr', name: 'CESD-R', required: true });
      activeTasks.push({ id: '6mo_pcl5', name: 'PCL-5', required: true });
      
      // Determine social emotional tool based on current age
      const currentAgeInMonths = this._calculateAgeInMonths(client.dob, currentDate);
      if (currentAgeInMonths < 12) {
        activeTasks.push({ id: '6mo_asq_se2', name: 'ASQ:SE-2', required: true });
      } else if (currentAgeInMonths >= 12 && currentAgeInMonths < 36) {
        activeTasks.push({ id: '6mo_bitsea', name: 'BITSEA', required: true });
      } else if (currentAgeInMonths >= 36 && currentAgeInMonths <= 72) {
        activeTasks.push({ id: '6mo_pkbs2', name: 'PKBS-2', required: true });
      }
    }

    return { activeTasks, isBaselineExpired: daysSinceAdmission > 60 };
  }

  static _evaluatePregnantTimeline(client, admitDate, daysSinceAdmission, currentDate) {
    const activeTasks = [];
    const hasBoC = !!client.birthOfChildDate;
    
    // PRENATAL BASELINE
    if (!hasBoC) {
      if (daysSinceAdmission >= 0) {
        activeTasks.push({ id: 'intake', name: 'Intake / CCA', week: 1, required: true });
        activeTasks.push({ id: 'sniff_base', name: 'SNIFF (Family Services Only)', week: 1, required: true });
        activeTasks.push({ id: 'pq', name: 'PQ (Modified)', week: 1, required: true });
        activeTasks.push({ id: 'hope', name: 'HOPE', week: 1, required: true });
        activeTasks.push({ id: 'epds', name: 'EPDS (Prenatal)', week: 1, required: true });
        activeTasks.push({ id: 'lscr', name: 'LSC-R', week: 1, required: true });
        activeTasks.push({ id: 'cesdr', name: 'CESD-R', week: 1, required: true });
        activeTasks.push({ id: 'pcl5', name: 'PCL-5', week: 1, required: true });
      }
      return { activeTasks, status: 'WAITING_FOR_BOC' };
    }
    
    // POSTNATAL (Triggered by BoC)
    const bocDate = new Date(client.birthOfChildDate);
    const daysSinceBoC = Math.floor((currentDate - bocDate) / (1000 * 60 * 60 * 24));
    const childAgeInMonths = this._calculateAgeInMonths(bocDate, currentDate);
    
    // Unlock BoC Assessments when infant is 1-2 months old (approx 30-60 days)
    if (daysSinceBoC >= 30 && daysSinceBoC <= 60) {
      activeTasks.push({ id: 'postnatal_cca', name: 'Postnatal Assessment', required: true });
      activeTasks.push({ id: 'sniff_child', name: 'SNIFF (Child Sections)', required: true });
      activeTasks.push({ id: 'boc_asq3', name: 'ASQ-3', required: true });
      activeTasks.push({ id: 'boc_asq_se2', name: 'ASQ:SE-2', required: true });
      activeTasks.push({ id: 'boc_ccis', name: 'CCIS', required: true });
      activeTasks.push({ id: 'boc_psi', name: 'PSI-4-SF', required: true });
      activeTasks.push({ id: 'boc_tesi', name: 'TESI-PRR', required: true });
      
      if (daysSinceBoC <= 42) { // strict 6-week postpartum window for EPDS
        activeTasks.push({ id: 'epds_post', name: 'EPDS (Postpartum)', required: true });
      }
    }
    
    // Pregnant cohort 6-Month Mark runs from COMPLETION of BoC assessments
    // For pseudo-scheduler, we estimate 6 months from BoC date + 1.5 months
    const sixMonthMark = new Date(bocDate);
    sixMonthMark.setMonth(sixMonthMark.getMonth() + 7); // 1mo (trigger) + 6mo interval
    
    if (currentDate >= sixMonthMark) {
      activeTasks.push({ id: '6mo_asq3', name: 'ASQ-3 (Follow-up)', required: true });
      activeTasks.push({ id: '6mo_ccis', name: 'CCIS', required: true });
      activeTasks.push({ id: '6mo_psi', name: 'PSI-4-SF', required: true });
      activeTasks.push({ id: '6mo_cesdr', name: 'CESD-R', required: true });
      activeTasks.push({ id: '6mo_pcl5', name: 'PCL-5', required: true });
      activeTasks.push({ id: '6mo_asq_se2', name: 'ASQ:SE-2', required: true }); // Always under 12 mo
    }

    return { activeTasks, daysSinceBoC };
  }

  static _calculateAgeInMonths(dobDate, refDate) {
    if (!dobDate) return 0;
    const ref = refDate ? new Date(refDate) : new Date();
    const birth = new Date(dobDate);
    let months = (ref.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += ref.getMonth();
    if (ref.getDate() < birth.getDate()) months--;
    return Math.max(0, months);
  }
}
