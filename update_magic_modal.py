with open('src/MagicImportModal.jsx', 'r') as f:
    content = f.read()

# 1. Add state for parsedClients
content = content.replace(
    "const [error, setError] = useState('');",
    "const [error, setError] = useState('');\n  const [parsedClients, setParsedClients] = useState(null);"
)

# 2. Update prompt
old_prompt = """Extract the following information from the provided content and return it as a pure JSON object.
Use empty strings "" if a field is not found or you are unsure. Do not guess information.
Ensure dates are in YYYY-MM-DD format if possible.

Required JSON keys:
- child_name (string, e.g. "John Doe")
- child_dob (string, YYYY-MM-DD format)
- caregiver_name (string, full name)
- caregiver_dob (string, YYYY-MM-DD format)
- intake_date (string, YYYY-MM-DD format)
- diagnosis (string, e.g. "F90.0 ADHD")
- insurance_type (string, "Medicaid" or "Commercial")"""
new_prompt = """Extract the following information from the provided content for ALL clients/patients found, and return it as a pure JSON array of objects `[{}, {}]`.
Even if there is only one client, return an array with one object.
Use empty strings "" if a field is not found or you are unsure. Do not guess information.
Ensure dates are in YYYY-MM-DD format if possible.

Required JSON keys per object:
- child_name (string, e.g. "John Doe")
- child_dob (string, YYYY-MM-DD format)
- caregiver_name (string, full name)
- caregiver_dob (string, YYYY-MM-DD format)
- intake_date (string, YYYY-MM-DD format)
- diagnosis (string, e.g. "F90.0 ADHD")
- insurance_type (string, "Medicaid" or "Commercial")"""
content = content.replace(old_prompt, new_prompt)

# 3. Handle extraction setting state instead of closing
old_extract_end = """      onDataExtracted(parsedData);
      onClose();"""
new_extract_end = """      if (Array.isArray(parsedData)) {
        setParsedClients(parsedData);
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        // Fallback if AI returns single object instead of array
        setParsedClients([parsedData]);
      } else {
        throw new Error('Invalid data format returned by AI.');
      }"""
content = content.replace(old_extract_end, new_extract_end)

# 4. Return UI replacement
old_return = """  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">"""

new_return = """  const handleConfirm = () => {
    onDataExtracted(parsedClients);
    setParsedClients(null);
    onClose();
  };

  const handleClose = () => {
    setParsedClients(null);
    onClose();
  };

  if (parsedClients) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-indigo-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-indigo-900">Review Imported Data</h2>
              <p className="text-sm text-indigo-600 mt-1">Found {parsedClients.length} client(s). Please review before importing.</p>
            </div>
          </div>
          <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-4">
            {parsedClients.map((client, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800">{client.child_name || 'Unknown Name'}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                    DOB: {client.child_dob || 'N/A'}
                  </span>
                </div>
                <div className="text-sm text-slate-600 grid grid-cols-2 gap-y-1 mt-2">
                  <p><strong>Caregiver:</strong> {client.caregiver_name || 'N/A'}</p>
                  <p><strong>Intake:</strong> {client.intake_date || 'N/A'}</p>
                  <p><strong>Diagnosis:</strong> {client.diagnosis || 'N/A'}</p>
                  <p><strong>Insurance:</strong> {client.insurance_type || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
            <button onClick={() => setParsedClients(null)} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors">
              Go Back
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Import {parsedClients.length} Client{parsedClients.length !== 1 && 's'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">"""
content = content.replace(old_return, new_return)

# Also fix the onClose handler in the header
content = content.replace("onClick={onClose}", "onClick={handleClose}")

with open('src/MagicImportModal.jsx', 'w') as f:
    f.write(content)
