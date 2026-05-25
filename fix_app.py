import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Remove all instances of the injected MagicImportModal
magic_injected = """      <MagicImportModal 
        isOpen={isMagicOpen} 
        onClose={() => setIsMagicOpen(false)} 
        onDataExtracted={handleDataExtracted} 
      />"""
content = content.replace(magic_injected + "\n", "")
content = content.replace(magic_injected, "")

# 2. Remove the AI button from AddClientModal header
bad_header = """          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5" /> New Family Intake
            </h2>
            <button 
              onClick={() => setIsMagicOpen(true)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white font-semibold transition-colors flex items-center gap-2"
              title="Magic Import with AI"
            >
              <Sparkles className="w-4 h-4" /> AI Auto-Fill
            </button>
          </div>"""
good_header = """          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" /> New Family Intake
          </h2>"""
content = content.replace(bad_header, good_header)

# 3. Remove isMagicOpen and handleDataExtracted from AddClientModal
bad_add_client_start = """const AddClientModal = ({ isOpen, onClose, onSave }) => {
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  
  const handleDataExtracted = (parsed) => {
    setData(prev => ({
      ...prev,
      name: parsed.child_name || prev.name,
      dob: parsed.child_dob || prev.dob,
      admitDate: parsed.intake_date || prev.admitDate,
      caregiver: parsed.caregiver_name || prev.caregiver,
      customFields: {
        ...prev.customFields,
        caregiverDob: parsed.caregiver_dob || prev.customFields.caregiverDob,
        diagnosis: parsed.diagnosis || prev.customFields.diagnosis,
        insuranceType: parsed.insurance_type || prev.customFields.insuranceType,
      }
    }));
  };"""
good_add_client_start = """const AddClientModal = ({ isOpen, onClose, onSave }) => {"""
content = content.replace(bad_add_client_start, good_add_client_start)

# 4. Inject isMagicOpen and handleDataExtracted into the MAIN APP component
main_app_start = """export default function CFAssessmentManager() {
  const [clients, setClients] = useState([]);"""

main_app_injected = """export default function CFAssessmentManager() {
  const [clients, setClients] = useState([]);
  const [isMagicOpen, setIsMagicOpen] = useState(false);

  const handleMagicImport = async (parsedClients) => {
    if (!parsedClients || !Array.isArray(parsedClients)) return;
    
    for (const parsed of parsedClients) {
      if (!parsed.child_name) continue; // Skip empty entries
      
      const newClient = {
        name: parsed.child_name,
        nickname: '',
        dob: parsed.child_dob || '',
        admitDate: parsed.intake_date || '',
        type: 'child',
        caregiver: parsed.caregiver_name || '',
        notes: '',
        status: 'ACTIVE',
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        assessments: {},
        ageAtAdmission: parsed.child_dob ? getAgeInMonths(parsed.child_dob) : 0,
        customFields: {
          caregiverDob: parsed.caregiver_dob || '',
          diagnosis: parsed.diagnosis || '',
          insuranceType: parsed.insurance_type || ''
        }
      };
      
      // Save each directly
      await api.saveClient(newClient);
      setClients(prev => [...prev, newClient]);
    }
  };"""
content = content.replace(main_app_start, main_app_injected)

# 5. Inject MagicImportModal at the end of the app
app_end = """      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addClient} />"""
app_end_injected = """      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <MagicImportModal isOpen={isMagicOpen} onClose={() => setIsMagicOpen(false)} onDataExtracted={handleMagicImport} />
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addClient} />"""
content = content.replace(app_end, app_end_injected)

# 6. Add Sparkles button to the main header
old_header_btns = """          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all font-semibold"
          >
            <Plus className="w-5 h-5" /> Add Family
          </button>"""
new_header_btns = """          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsMagicOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all font-semibold shadow-sm"
            title="Magic Bulk Import"
          >
            <Sparkles className="w-5 h-5" /> AI Import
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all font-semibold"
          >
            <Plus className="w-5 h-5" /> Add Family
          </button>"""
content = content.replace(old_header_btns, new_header_btns)

with open('src/App.jsx', 'w') as f:
    f.write(content)
