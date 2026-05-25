import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Add import
import_statement = "import AssessmentEntryModal from './AssessmentEntryModal.jsx';\n"
content = content.replace("import { api } from './api.js';", import_statement + "import { api } from './api.js';")

# 2. Replace toggleAssessment implementation
old_toggle_func = """  const toggleAssessment = async (key) => {
    if (!client) return;

    let updatedClient = { ...client };
    const currentAssessment = getAssessment(client, key);
    const isCurrentlyDone = isAssessmentComplete(currentAssessment);
    const today = new Date().toISOString().split('T')[0];

    // M-CHAT special handling
    if (key === 'base_mchat' && !isCurrentlyDone) {
      const isHighRisk = window.confirm(
        "M-CHAT-R/F Score Check:\\n\\n" +
        "Did the child score ≥ 3?\\n\\n" +
        "• 0-2 = Low Risk ✓ (no further action)\\n" +
        "• 3-7 = Medium Risk → Follow-Up Interview required\\n" +
        "• 8-20 = High Risk → Follow-Up + immediate referral\\n\\n" +
        "Click OK if score was 3 or higher."
      );
      
      // Use setAssessment utility to handle both formats
      setAssessment(updatedClient, key, { completed: today, uploaded: null });
      updatedClient.mchatHighRisk = isHighRisk;
    } else {
      // Toggle completion - use new format with upload tracking
      if (isCurrentlyDone) {
        // Uncomplete - remove assessment
        setAssessment(updatedClient, key, null);
      } else {
        // Complete - add with today's date, not uploaded yet
        setAssessment(updatedClient, key, { completed: today, uploaded: null });
      }
    }

    // Ensure assessments object exists for backward compatibility
    if (!updatedClient.assessments) {
      updatedClient.assessments = {};
    }

    // Update local state immediately for responsiveness
    setClients(prev => prev.map(c => c.id === activeId ? updatedClient : c));

    // Save and update local state with the saved version (includes updatedAt)
    const previousClient = client; // Store for undo
    try {
      const savedClient = await api.saveClient(updatedClient);
      setClients(prev => prev.map(c => c.id === activeId ? savedClient : c));
      
      // Log activity with previous state for undo
      if (isCurrentlyDone) {
        addActivity(ACTIVITY_TYPES.ASSESSMENT_UNCOMPLETED, `Uncompleted ${key.replace(/^(base_|6mo_|dc_|q\d_)/, '')} for ${client.nickname || client.name}`, { clientId: client.id, assessment: key }, { client: previousClient });
      } else {
        addActivity(ACTIVITY_TYPES.ASSESSMENT_COMPLETED, `Completed ${key.replace(/^(base_|6mo_|dc_|q\d_)/, '')} for ${client.nickname || client.name}`, { clientId: client.id, assessment: key }, { client: previousClient });
      }
    } catch (error) {
      console.error('Failed to save assessment:', error);
      // Still update local state even if save fails
      setClients(prev => prev.map(c => c.id === activeId ? updatedClient : c));
    }
  };"""

new_toggle_func = """  const [assessmentModal, setAssessmentModal] = useState({ isOpen: false, key: null, def: null });

  const openAssessmentModal = (key, def = null) => {
    if (!client) return;
    const currentAssessment = getAssessment(client, key);
    const isCurrentlyDone = isAssessmentComplete(currentAssessment);
    
    // M-CHAT special check: keep it here before opening modal
    if (key === 'base_mchat' && !isCurrentlyDone) {
      const isHighRisk = window.confirm(
        "M-CHAT-R/F Score Check:\\n\\n" +
        "Did the child score ≥ 3?\\n\\n" +
        "• 0-2 = Low Risk ✓ (no further action)\\n" +
        "• 3-7 = Medium Risk → Follow-Up Interview required\\n" +
        "• 8-20 = High Risk → Follow-Up + immediate referral\\n\\n" +
        "Click OK if score was 3 or higher."
      );
      
      let updatedClient = { ...client };
      setAssessment(updatedClient, key, { completed: new Date().toISOString().split('T')[0], uploaded: null });
      updatedClient.mchatHighRisk = isHighRisk;
      saveClientData(updatedClient, key, isCurrentlyDone);
      return;
    }

    setAssessmentModal({ isOpen: true, key, def });
  };

  const handleSaveAssessment = async (key, payload) => {
    if (!client) return;
    
    let updatedClient = { ...client };
    const currentAssessment = getAssessment(client, key);
    const isCurrentlyDone = isAssessmentComplete(currentAssessment);

    setAssessment(updatedClient, key, payload);
    await saveClientData(updatedClient, key, isCurrentlyDone);
  };

  const saveClientData = async (updatedClient, key, wasCurrentlyDone) => {
    if (!updatedClient.assessments) {
      updatedClient.assessments = {};
    }

    setClients(prev => prev.map(c => c.id === activeId ? updatedClient : c));

    const previousClient = client;
    try {
      const savedClient = await api.saveClient(updatedClient);
      setClients(prev => prev.map(c => c.id === activeId ? savedClient : c));
      
      const payloadObj = getAssessment(savedClient, key);
      const isNowDone = isAssessmentComplete(payloadObj);
      
      if (wasCurrentlyDone && !isNowDone) {
        addActivity(ACTIVITY_TYPES.ASSESSMENT_UNCOMPLETED, `Uncompleted ${key.replace(/^(base_|6mo_|dc_|q\d_)/, '')} for ${client.nickname || client.name}`, { clientId: client.id, assessment: key }, { client: previousClient });
      } else if (!wasCurrentlyDone && isNowDone) {
        addActivity(ACTIVITY_TYPES.ASSESSMENT_COMPLETED, `Completed ${key.replace(/^(base_|6mo_|dc_|q\d_)/, '')} for ${client.nickname || client.name}`, { clientId: client.id, assessment: key }, { client: previousClient });
      }
    } catch (error) {
      console.error('Failed to save assessment:', error);
      setClients(prev => prev.map(c => c.id === activeId ? updatedClient : c));
    }
  };"""

content = content.replace(old_toggle_func, new_toggle_func)

# 3. Replace all 'toggleAssessment(' with 'openAssessmentModal('
content = content.replace("toggleAssessment(", "openAssessmentModal(")

# 4. Inject <AssessmentEntryModal /> near the end of return statement
modal_element = """
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      
      <AssessmentEntryModal 
        isOpen={assessmentModal.isOpen} 
        onClose={() => setAssessmentModal({ isOpen: false, key: null, def: null })} 
        onSave={handleSaveAssessment} 
        assessmentKey={assessmentModal.key} 
        client={client} 
        assessmentDef={assessmentModal.def} 
      />
"""
content = content.replace("<TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />", modal_element)

with open('src/App.jsx', 'w') as f:
    f.write(content)
