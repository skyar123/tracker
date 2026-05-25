const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Import
const importStr = "import BaselineChecklistModal from './components/BaselineChecklistModal.jsx';";
if (!content.includes("BaselineChecklistModal")) {
  content = content.replace(
    "import SniffManager from './components/SniffManager.jsx';",
    `import SniffManager from './components/SniffManager.jsx';\n${importStr}`
  );
}

// 2. State
const stateStr = "const [showBaselineChecklist, setShowBaselineChecklist] = useState(false);";
if (!content.includes("showBaselineChecklist")) {
  content = content.replace(
    "const [showFormulation, setShowFormulation] = useState(false);",
    `const [showFormulation, setShowFormulation] = useState(false);\n  ${stateStr}`
  );
}

// 3. Button
const buttonTarget = `                  <h3 className="font-bold text-slate-800">Baseline Status</h3>
                  <div className="flex items-center gap-2">`;
const buttonInject = `                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-800">Baseline Status</h3>
                    <button onClick={() => setShowBaselineChecklist(true)} className="px-3 py-1 bg-white text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm hidden sm:flex">
                      <CheckSquare className="w-3.5 h-3.5" /> Focused Baseline Mode
                    </button>
                  </div>
                  <div className="flex items-center gap-2">`;

if (!content.includes("Focused Baseline Mode")) {
  content = content.replace(buttonTarget, buttonInject);
}

// 4. Modal
const modalTarget = `      {showSniffManager && (`;
const modalInject = `      {showBaselineChecklist && (
        <BaselineChecklistModal
          client={client}
          onSave={updateClient}
          onClose={() => setShowBaselineChecklist(false)}
        />
      )}

      {showSniffManager && (`;

if (!content.includes("<BaselineChecklistModal")) {
  content = content.replace(modalTarget, modalInject);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx modified with BaselineChecklistModal successfully.');
