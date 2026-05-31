import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Imports
if "import MagicImportModal" not in content:
    content = content.replace(
        "import AssessmentEntryModal from './AssessmentEntryModal.jsx';", 
        "import AssessmentEntryModal from './AssessmentEntryModal.jsx';\nimport MagicImportModal from './MagicImportModal.jsx';\nimport SettingsModal from './SettingsModal.jsx';"
    )

# 2. Add State in App component
if "const [isSettingsOpen, setIsSettingsOpen] = useState(false);" not in content:
    state_injection = """  const [isSettingsOpen, setIsSettingsOpen] = useState(false);"""
    content = content.replace("  const [isModalOpen, setIsModalOpen] = useState(false);", "  const [isModalOpen, setIsModalOpen] = useState(false);\n" + state_injection)

# 3. Add Settings button to header
# We look for the main header
old_header_btn = """          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all font-semibold"
          >
            <Plus className="w-5 h-5" /> Add Family
          </button>"""
new_header_btn = """          <button
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
content = content.replace(old_header_btn, new_header_btn)

# 4. Add <SettingsModal /> to bottom
if "<SettingsModal" not in content:
    content = content.replace("      <AddClientModal isOpen={isModalOpen}", "      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />\n      <AddClientModal isOpen={isModalOpen}")

with open('src/App.jsx', 'w') as f:
    f.write(content)
