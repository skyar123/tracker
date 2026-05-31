const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Imports
const importStr1 = "import SixMonthChecklistModal from './components/SixMonthChecklistModal.jsx';";
const importStr2 = "import TerminationChecklistModal from './components/TerminationChecklistModal.jsx';";
if (!content.includes("SixMonthChecklistModal")) {
  content = content.replace(
    "import BaselineChecklistModal from './components/BaselineChecklistModal.jsx';",
    `import BaselineChecklistModal from './components/BaselineChecklistModal.jsx';\n${importStr1}\n${importStr2}`
  );
}

// 2. State
const stateStr = `  const [showSixMonthChecklist, setShowSixMonthChecklist] = useState(false);
  const [showTerminationChecklist, setShowTerminationChecklist] = useState(false);`;
if (!content.includes("showSixMonthChecklist")) {
  content = content.replace(
    "const [showBaselineChecklist, setShowBaselineChecklist] = useState(false);",
    `const [showBaselineChecklist, setShowBaselineChecklist] = useState(false);\n${stateStr}`
  );
}

// 3. 6-Month Button
const sixMonthTarget = `                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> 6-Month Follow-Up
                  </h3>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">`;
const sixMonthInject = `                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> 6-Month Follow-Up
                    </h3>
                    <button onClick={() => setShowSixMonthChecklist(true)} className="px-3 py-1 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm hidden sm:flex">
                      <CheckSquare className="w-3.5 h-3.5" /> Focused 6-Month Mode
                    </button>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">`;

if (!content.includes("Focused 6-Month Mode")) {
  content = content.replace(sixMonthTarget, sixMonthInject);
}

// 4. Termination Button
const termTarget = `                <div className="flex items-center gap-3 mb-2">
                  <Archive className="w-5 h-5 text-slate-600" />
                  <h3 className="font-bold text-slate-800">Discharge / Termination Protocol</h3>
                </div>`;
const termInject = `                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Archive className="w-5 h-5 text-slate-600" />
                    <h3 className="font-bold text-slate-800">Discharge / Termination Protocol</h3>
                  </div>
                  <button onClick={() => setShowTerminationChecklist(true)} className="px-3 py-1 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm hidden sm:flex">
                    <CheckSquare className="w-3.5 h-3.5" /> Focused Termination Mode
                  </button>
                </div>`;

if (!content.includes("Focused Termination Mode")) {
  content = content.replace(termTarget, termInject);
}

// 5. Render Modals
const modalTarget = `      {showBaselineChecklist && (`;
const modalInject = `      {showSixMonthChecklist && (
        <SixMonthChecklistModal
          client={client}
          onSave={updateClient}
          onClose={() => setShowSixMonthChecklist(false)}
        />
      )}

      {showTerminationChecklist && (
        <TerminationChecklistModal
          client={client}
          onSave={updateClient}
          onClose={() => setShowTerminationChecklist(false)}
        />
      )}

      {showBaselineChecklist && (`;

if (!content.includes("<SixMonthChecklistModal")) {
  content = content.replace(modalTarget, modalInject);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx modified with remaining modals successfully.');
