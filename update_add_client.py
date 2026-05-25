import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

old_add_client_def = "const AddClientModal = ({ isOpen, onClose, onSave }) => {"
new_add_client_def = """const AddClientModal = ({ isOpen, onClose, onSave }) => {
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
  };
"""
content = content.replace(old_add_client_def, new_add_client_def)

old_add_client_header = """          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" /> New Family Intake
          </h2>"""
new_add_client_header = """          <div className="flex items-center gap-3">
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
content = content.replace(old_add_client_header, new_add_client_header)

# Ensure MagicImportModal is rendered inside AddClientModal
old_add_client_return_end = """        </div>
      </div>
    </div>
  );
};"""
new_add_client_return_end = """        </div>
      </div>
      <MagicImportModal 
        isOpen={isMagicOpen} 
        onClose={() => setIsMagicOpen(false)} 
        onDataExtracted={handleDataExtracted} 
      />
    </div>
  );
};"""
content = content.replace(old_add_client_return_end, new_add_client_return_end)

with open('src/App.jsx', 'w') as f:
    f.write(content)
