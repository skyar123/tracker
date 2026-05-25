const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Ensure all new modules are imported (without duplicate imports)
const importsToInject = [
  "import SniffManager from './components/SniffManager.jsx';",
  "import { TimeEngine } from './engine/TimeEngine.js';",
  "import { ScoringEngine } from './engine/ScoringEngine.js';"
];

importsToInject.forEach(imp => {
  if (!content.includes(imp)) {
    content = content.replace(
      "import RulesLibrary from './RulesLibrary.jsx';",
      `import RulesLibrary from './RulesLibrary.jsx';\n${imp}`
    );
  }
});

// 2. Add state variables if missing
const statesToInject = [
  "const [showSniffManager, setShowSniffManager] = useState(false);",
  "const [showFormulation, setShowFormulation] = useState(false);"
];

statesToInject.forEach(state => {
  if (!content.includes(state)) {
    content = content.replace(
      "const [showCalendar, setShowCalendar] = useState(false);",
      `const [showCalendar, setShowCalendar] = useState(false);\n  ${state}`
    );
  }
});

// 3. Inject Magic Import button in main header
const headerButtonTarget = `              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
              >`;

const headerButtonReplacement = `              <button
                onClick={() => setIsMagicOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                title="Magic bulk import"
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="hidden sm:inline">Magic Import</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
              >`;

if (!content.includes("Magic Import")) {
  content = content.replace(headerButtonTarget, headerButtonReplacement);
}

// 4. Inject SNIFF, Log Birth, Formulation buttons in client details header
const detailsHeaderTarget = `              <button 
                onClick={() => setPrintMode(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Print Record"
              >
                <Printer className="w-5 h-5" />
              </button>`;

const detailsHeaderReplacement = `              <div className="flex items-center gap-2">
                <button onClick={() => setShowSniffManager(true)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1 border border-indigo-100">
                  <Activity className="w-3.5 h-3.5" /> CRM Tracker (SNIFF)
                </button>
                {client.type === 'pregnant' && !client.birthOfChildDate && (
                  <button onClick={() => {
                    const date = prompt("Enter Date of Birth (YYYY-MM-DD):");
                    if(date) updateClient({ ...client, birthOfChildDate: date });
                  }} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-100">
                    <Baby className="w-3.5 h-3.5" /> Log Birth
                  </button>
                )}
                <button onClick={() => setShowFormulation(true)} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-bold hover:bg-violet-100 transition-colors flex items-center gap-1 border border-violet-100">
                  <ClipboardList className="w-3.5 h-3.5" /> Formulation
                </button>
                <button 
                  onClick={() => setPrintMode(true)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Print Record"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>`;

if (!content.includes("CRM Tracker (SNIFF)")) {
  content = content.replace(detailsHeaderTarget, detailsHeaderReplacement);
}

// 5. Inject Modals/Dialogs at bottom
const modalTarget = `      <ActivityLogModal 
        isOpen={showActivityLog} `;

const modalReplacement = `      {showSniffManager && (
        <SniffManager 
          client={client} 
          onSave={updateClient} 
          onClose={() => setShowSniffManager(false)} 
        />
      )}
      
      {showFormulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Clinical Formulation Dashboard</h2>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800">DC:0-5 Diagnostic Synthesis</h3>
                <p className="text-sm text-blue-600 mt-2">Aggregated from ASQ-3, BITSEA, and M-CHAT-R/F scores.</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <h3 className="font-bold text-emerald-800">Child First Treatment Themes</h3>
                <p className="text-sm text-emerald-600 mt-2">Based on trauma (PCL-5, LSC-R) and dyadic observations (CCIS).</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowFormulation(false)} className="px-5 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}

      <ActivityLogModal 
        isOpen={showActivityLog} `;

if (!content.includes("showSniffManager && (")) {
  content = content.replace(modalTarget, modalReplacement);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx fixed successfully.');
