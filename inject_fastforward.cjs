const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add FastForward to lucide-react imports
if (!content.includes("FastForward")) {
  content = content.replace(
    "FileSpreadsheet",
    "FileSpreadsheet, FastForward"
  );
}

// 2. Add handleFastForward function inside App component
const targetHandleFn = "  const handleMagicImport = async (parsedClients) => {";
const injectHandleFn = `  const handleFastForward = (clientToUpdate) => {
    const today = new Date().toISOString().split('T')[0];
    const newAssessments = { ...clientToUpdate.assessments };
    const days = getDaysInService(clientToUpdate.admitDate || clientToUpdate.intake_date);
    
    // We basically just mark everything before their current phase as completed today.
    // For simplicity, we just mark ALL items in BASELINE, Q1, 6MO, Q2, Q3 that are 'overdue' as completed.
    
    const markComplete = (key) => {
      newAssessments[key] = {
        ...newAssessments[key],
        completed: true,
        date: today
      };
    };

    // Baseline (overdue after 60 days)
    if (days > 60) {
      BASELINE_PROTOCOL.forEach(week => {
        week.items.forEach(item => markComplete(\`base_\${item.id}\`));
      });
      markComplete('base_se');
      if (getMchatRequired(clientToUpdate.admitDate || clientToUpdate.intake_date, clientToUpdate.dob)) {
        markComplete('base_mchat');
      }
    }

    // Q1 (overdue after ~104 days)
    if (days > 104) {
      markComplete('q1_tx');
      markComplete('q1_sniff');
    }

    // 6 Month (overdue after ~194 days)
    if (days > 194) {
      FOLLOWUP_PROTOCOL.forEach(item => markComplete(\`6mo_\${item.id}\`));
      markComplete('6mo_se');
      markComplete('q2_sniff');
    }

    // Q3 (overdue after ~284 days)
    if (days > 284) {
      markComplete('q3_tx');
      markComplete('q3_sniff');
    }

    updateClient({ ...clientToUpdate, assessments: newAssessments });
  };

  const handleMagicImport = async (parsedClients) => {`;

if (!content.includes("handleFastForward =")) {
  content = content.replace(targetHandleFn, injectHandleFn);
}

// 3. Inject Button in Client Header
const buttonTarget = `                <button onClick={() => setShowFormulation(true)} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-bold hover:bg-violet-100 transition-colors flex items-center gap-1 border border-violet-100">
                  <ClipboardList className="w-3.5 h-3.5" /> Formulation
                </button>
                <button 
                  onClick={() => setPrintMode(true)}`;

const buttonInject = `                <button onClick={() => setShowFormulation(true)} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-bold hover:bg-violet-100 transition-colors flex items-center gap-1 border border-violet-100">
                  <ClipboardList className="w-3.5 h-3.5" /> Formulation
                </button>
                <button onClick={() => {
                  if(confirm("Are you sure you want to mark all past overdue assessments as completed today? This is useful for quickly backfilling a client that has been in the program for a long time.")) {
                     handleFastForward(client);
                  }
                }} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 border border-amber-100">
                  <FastForward className="w-3.5 h-3.5" /> Catch-Up Mode
                </button>
                <button 
                  onClick={() => setPrintMode(true)}`;

if (!content.includes("Catch-Up Mode")) {
  content = content.replace(buttonTarget, buttonInject);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx modified with Fast Forward functionality successfully.');
