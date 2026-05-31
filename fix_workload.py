import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Extract getDynamicSniffDueDate
sniff_func_match = re.search(r"  const getDynamicSniffDueDate = \(client, q\) => \{[\s\S]*?  \};\n\n", content)
sniff_func_text = sniff_func_match.group(0)

# Remove it from its current place
content = content.replace(sniff_func_text, "")

# Move it above calculateWorkload
new_sniff_func = sniff_func_text.replace("  const getDynamicSniffDueDate", "export const getDynamicSniffDueDate")

calc_workload_idx = content.find("const calculateWorkload = (client) => {")
content = content[:calc_workload_idx] + new_sniff_func + content[calc_workload_idx:]

# 2. Modify calculateWorkload to check SNIFF dynamically
old_calc_workload = """const calculateWorkload = (client) => {
  const days = getDaysInService(client.admitDate || client.intake_date);
  const phase = getPhaseInfo(client, days);
  const age = getAgeInMonths(client.dob || client.child_dob);
  const ageAtAdmit = getAgeInMonths(client.dob || client.child_dob, client.admitDate || client.intake_date);
  
  let clinicianLeft = 0;
  let frpLeft = 0;
  let sharedLeft = 0;
  
  const countItem = (item, prefix) => {
    const key = `${prefix}_${item.id}`;
    if (!isAssessmentComplete(getAssessment(client, key))) {
      if (item.role === 'CLINICIAN') clinicianLeft++;
      else if (item.role === 'FRP') frpLeft++;
      else if (item.role === 'SHARED') sharedLeft++;
    }
  };

  if (phase.id === 'baseline') {
    BASELINE_PROTOCOL.forEach(week => week.items.forEach(item => countItem(item, 'base')));
    // SE tool
    if (!isAssessmentComplete(getAssessment(client, 'base_se'))) frpLeft++;
    // M-CHAT
    if (isMCHATRequired(ageAtAdmit) && !isAssessmentComplete(getAssessment(client, 'base_mchat'))) frpLeft++;
  } else if (phase.id === 'sixMonth') {
    FOLLOWUP_PROTOCOL.forEach(item => countItem(item, '6mo'));
    if (!isAssessmentComplete(getAssessment(client, '6mo_se'))) frpLeft++;
    // SNIFF every 90 days: q2_sniff due at day 180
    if (!isAssessmentComplete(getAssessment(client, 'q2_sniff'))) frpLeft++;
  } else if (phase.id === 'q1' || phase.id === 'q3') {
    const prefix = phase.id;
    QUARTERLY_PROTOCOL.forEach(item => countItem(item, prefix));
    // In Q3, q2_sniff (day 180) is also due if not done
    if (phase.id === 'q3' && !isAssessmentComplete(getAssessment(client, 'q2_sniff'))) frpLeft++;
  } else if (phase.id === 'annual') {
    DISCHARGE_ONLY.forEach(item => countItem(item, 'dc'));
    FOLLOWUP_PROTOCOL.forEach(item => countItem(item, 'dc'));
  }

  const total = clinicianLeft + frpLeft + sharedLeft;
  
  return { clinicianLeft, frpLeft, sharedLeft, total, phase, days };
};"""

new_calc_workload = """const calculateWorkload = (client) => {
  const days = getDaysInService(client.admitDate || client.intake_date);
  const phase = getPhaseInfo(client, days);
  const age = getAgeInMonths(client.dob || client.child_dob);
  const ageAtAdmit = getAgeInMonths(client.dob || client.child_dob, client.admitDate || client.intake_date);
  
  let clinicianLeft = 0;
  let frpLeft = 0;
  let sharedLeft = 0;
  
  const countItem = (item, prefix) => {
    const key = `${prefix}_${item.id}`;
    if (!isAssessmentComplete(getAssessment(client, key))) {
      if (item.role === 'CLINICIAN') clinicianLeft++;
      else if (item.role === 'FRP') frpLeft++;
      else if (item.role === 'SHARED') sharedLeft++;
    }
  };

  if (phase.id === 'baseline') {
    BASELINE_PROTOCOL.forEach(week => week.items.forEach(item => countItem(item, 'base')));
    if (!isAssessmentComplete(getAssessment(client, 'base_se'))) frpLeft++;
    if (isMCHATRequired(ageAtAdmit) && !isAssessmentComplete(getAssessment(client, 'base_mchat'))) frpLeft++;
  } else if (phase.id === 'sixMonth') {
    FOLLOWUP_PROTOCOL.forEach(item => countItem(item, '6mo'));
    if (!isAssessmentComplete(getAssessment(client, '6mo_se'))) frpLeft++;
  } else if (phase.id === 'q1' || phase.id === 'q3') {
    const prefix = phase.id;
    QUARTERLY_PROTOCOL.forEach(item => countItem(item, prefix));
  } else if (phase.id === 'annual') {
    DISCHARGE_ONLY.forEach(item => countItem(item, 'dc'));
    FOLLOWUP_PROTOCOL.forEach(item => countItem(item, 'dc'));
  }

  // Dynamic SNIFF Due Check across all phases
  const today = new Date();
  let anySniffDue = false;
  // We check q1, q2, q3 sniffs to see if any are due today
  for (let q = 1; q <= 3; q++) {
    const prefix = `q${q}_sniff`;
    if (!isAssessmentComplete(getAssessment(client, prefix))) {
      const dynamicSniffDueStr = getDynamicSniffDueDate(client, q);
      if (dynamicSniffDueStr) {
        const sniffDueDiffDays = (new Date(dynamicSniffDueStr) - today) / (1000 * 60 * 60 * 24);
        if (sniffDueDiffDays <= 14) {
          anySniffDue = true;
          break;
        }
      }
    }
  }
  
  if (anySniffDue) frpLeft++;

  const total = clinicianLeft + frpLeft + sharedLeft;
  
  return { clinicianLeft, frpLeft, sharedLeft, total, phase, days };
};"""

content = content.replace(old_calc_workload, new_calc_workload)

with open('src/App.jsx', 'w') as f:
    f.write(content)
