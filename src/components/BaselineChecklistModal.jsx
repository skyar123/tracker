import React, { useState } from 'react';
import { Printer, Save, X, CheckSquare, Square, Calendar } from 'lucide-react';

export default function BaselineChecklistModal({ client, onSave, onClose }) {
  const [formData, setFormData] = useState(client.customFields?.baselineChecklist || {
    clinician: '',
    careCoordinatorRole: '',
    clientName: client.nickname || client.name || '',
    childFirstSite: '',
    monthYear: '',
    completedBy: 'Clinical Team',
    items: {
      // Guides to Formulation and Treatment
      intake1: { planned: false, completedDate: '', enteredDate: '' },
      intake2: { planned: false, completedDate: '', enteredDate: '' },
      // Child Development Assessment
      asq3: { planned: false, completedDate: '', enteredDate: '' },
      mchat: { planned: false, completedDate: '', enteredDate: '' },
      sensory: { planned: false, completedDate: '', enteredDate: '' },
      // Child Social-Emotional
      asqse2: { planned: false, completedDate: '', enteredDate: '' },
      bitsea: { planned: false, completedDate: '', enteredDate: '' },
      pkbs2: { planned: false, completedDate: '', enteredDate: '' },
      tesi: { planned: false, completedDate: '', enteredDate: '' },
      // Relationship
      ccis: { planned: false, completedDate: '', enteredDate: '' },
      // Parent Strengths
      pq: { planned: false, completedDate: '', enteredDate: '' },
      psi: { planned: false, completedDate: '', enteredDate: '' },
      cesdr: { planned: false, completedDate: '', enteredDate: '' },
      lscr: { planned: false, completedDate: '', enteredDate: '' },
      pcl5: { planned: false, completedDate: '', enteredDate: '' },
      epds: { planned: false, completedDate: '', enteredDate: '' },
      // Health
      healthHistory: { planned: false, completedDate: '', enteredDate: '' },
      hope: { planned: false, completedDate: '', enteredDate: '' }
    }
  });

  const handleInputChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleItemChange = (itemId, field, val) => {
    setFormData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          ...prev.items[itemId],
          [field]: val
        }
      }
    }));
  };

  const handleSave = () => {
    const updatedClient = {
      ...client,
      customFields: {
        ...client.customFields,
        baselineChecklist: formData
      }
    };
    onSave(updatedClient);
    alert('Baseline Checklist saved successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const CATEGORIES = [
    {
      name: "Guides to Formulation and Treatment",
      rows: [
        { id: 'intake1', name: 'Intake Part 1: Guide to Child and Family Clinical History', find: 'Absorb', enter: 'CFCR:' },
        { id: 'intake2', name: 'Intake Part 2: Service Needs Inventory for Families (SNIFF)', find: 'Absorb', enter: 'CFCR:' }
      ]
    },
    {
      name: "Child Development Assessment",
      rows: [
        { id: 'asq3', name: 'Ages and Stages Questionnaire (ASQ-3)', find: 'Copy from Kit', enter: 'ASD:' },
        { id: 'mchat', name: 'Modified Checklist for Autism in Toddlers – Revised, with Follow-Up Interview (MCHAT-R/F)', find: 'Absorb', enter: 'ASD:' },
        { id: 'sensory', name: 'Dunn Short Sensory Profile 2 or Infant/Toddler Sensory Profile 2 (optional)', find: 'Copyrighted', enter: 'N/A' }
      ]
    },
    {
      name: "Child Social-Emotional and Behavioral Concerns Assessments",
      rows: [
        { id: 'asqse2', name: 'Ages and Stages Questionnaire-Social-Emotional, 2nd Edition (ASQ:SE-2)', find: 'Copy from Kit', enter: 'ASD:' },
        { id: 'bitsea', name: 'Brief Infant-Toddler Social and Emotional Assessment (BITSEA)', find: 'Absorb', enter: 'ASD:' },
        { id: 'pkbs2', name: 'Preschool-Kindergarten Behavioral Scale-2 (PKBS-2)', find: 'Copyrighted', enter: 'ASD:' },
        { id: 'tesi', name: 'Traumatic Events Screening Inventory – Parent Report Revised (TESI-PRR)', find: 'Absorb', enter: 'CFCR:' }
      ]
    },
    {
      name: "Attachment and Relationships Assessment",
      rows: [
        { id: 'ccis', name: 'Caregiver-Child Interaction Scale', find: 'Absorb', enter: 'CFCR:' }
      ]
    },
    {
      name: "Parent Strengths and Challenges Assessments",
      rows: [
        { id: 'pq', name: 'Parent Questionnaire (PQ)', find: 'Absorb', enter: 'CFCR:' },
        { id: 'psi', name: 'Abidin Parenting Stress Index, 4th Edition, Short Form (PSI-4-SF)', find: 'Copyrighted', enter: 'ASD:' },
        { id: 'cesdr', name: 'Center for Epidemiology Scale-Depression - Revised (CESD-R)', find: 'Absorb', enter: 'CFCR:' },
        { id: 'lscr', name: 'Life Stressor Checklist-Revised (LSC-R)', find: 'Absorb', enter: 'CFCR:' },
        { id: 'pcl5', name: 'PTSD Checklist (PCL-5)', find: 'Absorb', enter: 'CFCR:' },
        { id: 'epds', name: 'Edinburgh Postnatal Depression Scale (EPDS) (optional)', find: 'Absorb', enter: '' }
      ]
    },
    {
      name: "Child and Family Health Assessments",
      rows: [
        { id: 'healthHistory', name: 'See: Guide to Child and Family Clinical History – Health Assessment', find: 'Absorb', enter: 'CFCR:' },
        { id: 'hope', name: 'Home Observation of the Physical Environment (HOPE)', find: 'Absorb', enter: 'CFCR:' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-sm p-4 md:p-6 overflow-y-auto justify-center items-start print:static print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 flex flex-col overflow-hidden print:shadow-none print:my-0 print:rounded-none">
        
        {/* Actions Bar */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <span className="font-bold">Child First Baseline Checklist Mode</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-all">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all">
              <Save className="w-4 h-4" /> Save Checklist
            </button>
            <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Form Sheet */}
        <div className="p-8 md:p-12 bg-white flex-1 print:p-4 text-slate-800 font-sans">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b pb-6">
            <div>
              <div className="text-blue-700 font-black text-2xl tracking-tight uppercase">child first</div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mt-1 uppercase">Child First Baseline Assessment Checklist</h1>
            </div>
            <div className="text-right text-xs text-slate-400">
              © Child First v.2.3.23 | Page 1 of 1
            </div>
          </div>

          {/* Demographic Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Clinician</label>
              <input 
                type="text" 
                value={formData.clinician || ''} 
                onChange={e => handleInputChange('clinician', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-all print:border-b print:border-slate-400 print:bg-transparent print:p-0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Care Coordinator Role</label>
              <input 
                type="text" 
                value={formData.careCoordinatorRole || ''} 
                onChange={e => handleInputChange('careCoordinatorRole', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-all print:border-b print:border-slate-400 print:bg-transparent print:p-0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Client Name</label>
              <input 
                type="text" 
                value={formData.clientName || ''} 
                onChange={e => handleInputChange('clientName', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-all print:border-b print:border-slate-400 print:bg-transparent print:p-0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Child First Site</label>
              <input 
                type="text" 
                value={formData.childFirstSite || ''} 
                onChange={e => handleInputChange('childFirstSite', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-all print:border-b print:border-slate-400 print:bg-transparent print:p-0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Month / Year</label>
              <input 
                type="text" 
                value={formData.monthYear || ''} 
                onChange={e => handleInputChange('monthYear', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-all print:border-b print:border-slate-400 print:bg-transparent print:p-0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Completed By</label>
              <input 
                type="text" 
                value={formData.completedBy || ''} 
                onChange={e => handleInputChange('completedBy', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-all print:border-b print:border-slate-400 print:bg-transparent print:p-0"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl print:border-slate-300">
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider print:bg-slate-50">
                  <th className="p-3 w-[45%]">Assessment</th>
                  <th className="p-3 text-center w-[15%]">Where to Find</th>
                  <th className="p-3 text-center w-[10%]">Planned</th>
                  <th className="p-3 text-center w-[15%]">Date Completed</th>
                  <th className="p-3 w-[15%]">Where & Date Entered</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(category => (
                  <React.Fragment key={category.name}>
                    {/* Category Title Row */}
                    <tr className="bg-blue-50 border-y border-slate-200 font-bold text-blue-800 print:bg-slate-100">
                      <td colSpan="5" className="p-2.5 uppercase tracking-wide">{category.name}</td>
                    </tr>
                    
                    {category.rows.map(row => {
                      const itemState = formData.items?.[row.id] || { planned: false, completedDate: '', enteredDate: '' };
                      return (
                        <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                          {/* Name */}
                          <td className="p-3 font-medium text-slate-700 flex items-start gap-1.5">
                            <span className="text-slate-400 mt-0.5">•</span>
                            <span>{row.name}</span>
                          </td>
                          {/* Where to find */}
                          <td className="p-3 text-center text-slate-500 font-medium">{row.find}</td>
                          {/* Planned Checkbox */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleItemChange(row.id, 'planned', !itemState.planned)}
                              className="mx-auto flex items-center justify-center p-1 rounded hover:bg-slate-100 transition-colors print:pointer-events-none"
                            >
                              {itemState.planned ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </button>
                          </td>
                          {/* Date Completed */}
                          <td className="p-3">
                            <input 
                              type="text" 
                              placeholder="MM/DD/YYYY"
                              value={itemState.completedDate || ''}
                              onChange={e => handleItemChange(row.id, 'completedDate', e.target.value)}
                              className="w-full text-center p-1.5 border border-slate-200 rounded focus:bg-white text-xs bg-slate-50 print:border-none print:bg-transparent"
                            />
                          </td>
                          {/* Where & Date Entered */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {row.enter && <span className="text-slate-400 font-medium shrink-0">{row.enter}</span>}
                              <input 
                                type="text" 
                                placeholder="Date"
                                value={itemState.enteredDate || ''}
                                onChange={e => handleItemChange(row.id, 'enteredDate', e.target.value)}
                                className="w-full p-1.5 border border-slate-200 rounded focus:bg-white text-xs bg-slate-50 print:border-none print:bg-transparent"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
