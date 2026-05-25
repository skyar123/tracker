import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Insert getDynamicSniffDueDate before return statement of CFAssessmentManager
sniff_func = """
  const getDynamicSniffDueDate = (client, q) => {
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

"""

# Find the start of the return statement
return_idx = content.find("  return (")
content = content[:return_idx] + sniff_func + content[return_idx:]

# Replace the Quarterly block rendering
old_quarterly = """              {[
                { q: 1, qDay: 90, prefix: 'q1_', sniffOnly: false },
                { q: 2, qDay: 180, prefix: 'q2_', sniffOnly: true },
                { q: 3, qDay: 270, prefix: 'q3_', sniffOnly: false },
              ].map(({ q, qDay, prefix, sniffOnly }) => {
                const sniffDone = isAssessmentComplete(getAssessment(client, `${prefix}sniff`));
                const txDone = isAssessmentComplete(getAssessment(client, `${prefix}tx`));
                const isDue = days >= qDay - 14;
                const isComplete = sniffOnly ? sniffDone : sniffDone && txDone;

                return (
                  <div key={q} className={`bg-white border rounded-2xl p-4 shadow-sm ${isDue && !isComplete ? 'border-teal-200' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">Day {qDay} {sniffOnly ? '(SNIFF every 90 days)' : `(Q${q})`}</h4>
                        <p className="text-xs text-slate-500">Due {getDueDate(client.admitDate, qDay)}</p>
                      </div>"""

new_quarterly = """              {[
                { q: 1, qDay: 90, prefix: 'q1_', sniffOnly: false },
                { q: 2, qDay: 180, prefix: 'q2_', sniffOnly: true },
                { q: 3, qDay: 270, prefix: 'q3_', sniffOnly: false },
              ].map(({ q, qDay, prefix, sniffOnly }) => {
                const sniffDone = isAssessmentComplete(getAssessment(client, `${prefix}sniff`));
                const txDone = isAssessmentComplete(getAssessment(client, `${prefix}tx`));
                
                // Dynamic SNIFF calculation
                const dynamicSniffDueStr = getDynamicSniffDueDate(client, q);
                const dynamicSniffDue = new Date(dynamicSniffDueStr);
                const today = new Date();
                const sniffDueDiffDays = (dynamicSniffDue - today) / (1000 * 60 * 60 * 24);
                const isSniffDue = sniffDueDiffDays <= 14;
                
                // TX is still fixed milestones (90, 270)
                const isTxDue = days >= qDay - 14;
                
                const isDue = sniffOnly ? isSniffDue : (isSniffDue || isTxDue);
                const isComplete = sniffOnly ? sniffDone : sniffDone && txDone;

                return (
                  <div key={q} className={`bg-white border rounded-2xl p-4 shadow-sm ${isDue && !isComplete ? 'border-teal-200' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {sniffOnly ? `SNIFF Update #${q}` : `Quarter ${q}`}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {sniffOnly 
                            ? `Due ${dynamicSniffDueStr}` 
                            : `TX Due: ${getDueDate(client.admitDate, qDay)} | SNIFF Due: ${dynamicSniffDueStr}`}
                        </p>
                      </div>"""

content = content.replace(old_quarterly, new_quarterly)

with open('src/App.jsx', 'w') as f:
    f.write(content)
