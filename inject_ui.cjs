const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Import dependencies
if (!content.includes("import SniffManager")) {
  content = content.replace(
    "import RulesLibrary from './RulesLibrary.jsx';",
    "import RulesLibrary from './RulesLibrary.jsx';\nimport SniffManager from './components/SniffManager.jsx';\nimport { TimeEngine } from './engine/TimeEngine.js';\nimport { ScoringEngine } from './engine/ScoringEngine.js';"
  );
}

// 2. Add state for SniffManager and BoC
if (!content.includes("const [showSniffManager, setShowSniffManager]")) {
  content = content.replace(
    "const [showCalendar, setShowCalendar] = useState(false);",
    "const [showCalendar, setShowCalendar] = useState(false);\n  const [showSniffManager, setShowSniffManager] = useState(false);\n  const [showFormulation, setShowFormulation] = useState(false);"
  );
}

// 3. Inject "Log Birth Event" and "Open SNIFF" buttons in the Client Detail header
const headerTarget = `              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    {activeClient.name} {activeClient.nickname && <span className="text-slate-400 font-normal">"{activeClient.nickname}"</span>}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-500">`;

const headerInject = `              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    {activeClient.name} {activeClient.nickname && <span className="text-slate-400 font-normal">"{activeClient.nickname}"</span>}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-500">
                    <button onClick={() => setShowSniffManager(true)} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors">
                      Open CRM Tracker (SNIFF)
                    </button>
                    {activeClient.type === 'pregnant' && !activeClient.birthOfChildDate && (
                      <button onClick={() => {
                        const date = prompt("Enter Date of Birth (YYYY-MM-DD):");
                        if(date) updateClient({ ...activeClient, birthOfChildDate: date });
                      }} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors">
                        Log Birth Event
                      </button>
                    )}
                    <button onClick={() => setShowFormulation(true)} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-200 transition-colors">
                      Formulation Dashboard
                    </button>`;

if (!content.includes("Open CRM Tracker (SNIFF)")) {
  content = content.replace(headerTarget, headerInject);
}

// 4. Inject SniffManager component at the end
const endTarget = `      <ActivityLogModal 
        isOpen={showActivityLog} `;
const endInject = `      {showSniffManager && (
        <SniffManager 
          client={activeClient} 
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
  content = content.replace(endTarget, endInject);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx modified successfully for UI integrations.');
