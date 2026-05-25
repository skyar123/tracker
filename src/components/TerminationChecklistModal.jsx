import React, { useState } from 'react';
import { X, Save, Printer, FileText } from 'lucide-react';

export default function TerminationChecklistModal({ client, onSave, onClose }) {
  const [formData, setFormData] = useState(client.terminationChecklist || {});

  const handleCheckboxChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: { ...prev[key], planned: value }
    }));
  };

  const handleDateChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: { ...prev[key], dateCompleted: value }
    }));
  };

  const handleSave = () => {
    const updatedClient = {
      ...client,
      terminationChecklist: formData
    };
    onSave(updatedClient);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const renderRow = (title, key, whereToFind, whereToEnter) => {
    const isPlanned = formData[key]?.planned || false;
    const dateCompleted = formData[key]?.dateCompleted || '';

    return (
      <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors group">
        <td className="p-3 text-sm text-slate-800 flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          {title}
        </td>
        <td className="p-3 text-sm text-slate-600 text-center whitespace-nowrap">
          {whereToFind}
        </td>
        <td className="p-3 text-center">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer print:appearance-none print:w-4 print:h-4 print:border print:border-black print:rounded-sm print:checked:bg-black"
            checked={isPlanned}
            onChange={(e) => handleCheckboxChange(key, e.target.checked)}
          />
        </td>
        <td className="p-3">
          <input
            type="date"
            className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 print:hidden"
            value={dateCompleted}
            onChange={(e) => handleDateChange(key, e.target.value)}
          />
          <div className="hidden print:block text-sm border-b border-black h-6 w-full">{dateCompleted}</div>
        </td>
        <td className="p-3 text-sm text-slate-600 font-medium whitespace-nowrap">
          {whereToEnter} ______________
        </td>
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-none print:rounded-none">
        
        {/* Header - Hidden on Print */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Termination Assessment Checklist</h2>
              <p className="text-xs text-slate-500">Track termination/discharge documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto print:overflow-visible print:p-4 print:pt-0">
          
          {/* Print Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              {/* Logo placeholder */}
              <div className="w-32 h-16 bg-slate-100 flex items-center justify-center rounded-lg border border-slate-200 print:border-gray-400">
                <span className="text-blue-800 font-bold text-xl italic tracking-tighter">child first</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide mt-4">Child First Termination Assessment Checklist</h1>
              <div className="w-32"></div> {/* Spacer for centering */}
            </div>

            {/* Demographics Matrix */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-2">
              <div className="flex items-end gap-2">
                <span className="font-semibold text-slate-700 whitespace-nowrap">Clinician:</span>
                <span className="border-b border-slate-400 flex-1 h-5">{client.clinicianName || ''}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold text-slate-700 whitespace-nowrap">Care Coordinator Role:</span>
                <span className="border-b border-slate-400 flex-1 h-5">{client.careCoordinator || ''}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold text-slate-700 whitespace-nowrap">Client Name:</span>
                <span className="border-b border-slate-400 flex-1 h-5">{client.name || ''}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold text-slate-700 whitespace-nowrap">Child First Site:</span>
                <span className="border-b border-slate-400 flex-1 h-5"></span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold text-slate-700 whitespace-nowrap">Month/Year:</span>
                <span className="border-b border-slate-400 flex-1 h-5">
                  {new Date().toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold text-slate-700 whitespace-nowrap">Completed by:</span>
                <span className="border-b border-slate-400 flex-1 h-5">Clinical Team</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden print:border-black print:rounded-none">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 print:bg-gray-100 print:border-black">
                  <th className="p-3 font-bold text-xs uppercase text-slate-700 text-center w-1/2">Assessment</th>
                  <th className="p-3 font-bold text-xs uppercase text-slate-700 text-center border-l border-slate-300 print:border-black">Where to<br/>Find</th>
                  <th className="p-3 font-bold text-xs uppercase text-slate-700 text-center border-l border-slate-300 print:border-black">Planned</th>
                  <th className="p-3 font-bold text-xs uppercase text-slate-700 text-center border-l border-slate-300 print:border-black">Date<br/>Completed</th>
                  <th className="p-3 font-bold text-xs uppercase text-slate-700 text-center border-l border-slate-300 print:border-black">Where & Date<br/>Entered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black">
                
                {/* Child Development Assessment */}
                <tr className="bg-slate-100/50 print:bg-gray-100">
                  <td colSpan="5" className="p-2 px-3 font-bold text-sm text-slate-800 border-b border-slate-300 print:border-black text-center">
                    Child Development Assessment:
                  </td>
                </tr>
                {renderRow('Ages and Stages Questionnaire (ASQ-3)', 'asq3', 'Copy from Kit', 'ASD:')}

                {/* Child Social-Emotional and Behavioral Concerns */}
                <tr className="bg-slate-100/50 print:bg-gray-100">
                  <td colSpan="5" className="p-2 px-3 font-bold text-sm text-slate-800 border-b border-slate-300 border-t print:border-black text-center">
                    Child Social-Emotional and Behavioral Concerns Assessments:
                  </td>
                </tr>
                {renderRow('Ages and Stages Questionnaire-Social-Emotional, 2nd Edition (ASQ:SE-2)', 'asqse2', 'Copy from Kit', 'ASD:')}
                {renderRow('Brief Infant-Toddler Social and Emotional Assessment (BITSEA)', 'bitsea', 'Absorb', 'ASD:')}
                {renderRow('Preschool-Kindergarten Behavioral Scale-2 (PKBS-2)', 'pkbs2', 'Copyrighted', 'ASD:')}

                {/* Attachment and Relationships Assessment */}
                <tr className="bg-slate-100/50 print:bg-gray-100">
                  <td colSpan="5" className="p-2 px-3 font-bold text-sm text-slate-800 border-b border-slate-300 border-t print:border-black text-center">
                    Attachment and Relationships Assessment:
                  </td>
                </tr>
                {renderRow('Caregiver-Child Interaction Scale (CCIS)', 'ccis', 'Absorb', 'CFCR:')}

                {/* Parent Strengths and Challenges Assessments */}
                <tr className="bg-slate-100/50 print:bg-gray-100">
                  <td colSpan="5" className="p-2 px-3 font-bold text-sm text-slate-800 border-b border-slate-300 border-t print:border-black text-center">
                    Parent Strengths and Challenges Assessments:
                  </td>
                </tr>
                {renderRow('Abidin Parenting Stress Index, 4th Edition, Short Form (PSI-4-SF)', 'psi4sf', 'Copyrighted', 'ASD:')}
                {renderRow('Center for Epidemiology Scale-Depression - Revised (CESD-R)', 'cesdr', 'Absorb', 'CFCR:')}
                {renderRow('PTSD Checklist (PCL-5)', 'pcl5', 'Absorb', 'CFCR:')}

                {/* Child and Family Health Assessments */}
                <tr className="bg-slate-100/50 print:bg-gray-100">
                  <td colSpan="5" className="p-2 px-3 font-bold text-sm text-slate-800 border-b border-slate-300 border-t print:border-black text-center">
                    Child and Family Health Assessments:
                  </td>
                </tr>
                {renderRow('Termination Data - Health', 'termHealth', 'Absorb', 'CFCR:')}

                {/* Parent Satisfaction */}
                <tr className="bg-slate-100/50 print:bg-gray-100">
                  <td colSpan="5" className="p-2 px-3 font-bold text-sm text-slate-800 border-b border-slate-300 border-t print:border-black text-center">
                    Parent Satisfaction:
                  </td>
                </tr>
                {renderRow('Youth Service Satisfaction for Families (YSSF)', 'yssf', 'Absorb', 'CFCR')}

              </tbody>
            </table>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>©Child First v.2.2.23</span>
            <span>Child First Termination Assessment Checklist</span>
            <span>p. 1 of 1</span>
          </div>

        </div>

        {/* Footer - Hidden on Print */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Checklist
          </button>
        </div>

      </div>
    </div>
  );
}
