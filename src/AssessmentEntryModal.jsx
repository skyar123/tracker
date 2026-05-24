import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Calendar, Info } from 'lucide-react';
import { getAssessmentDate, getAssessment } from './assessmentUtils.js';

export default function AssessmentEntryModal({ isOpen, onClose, onSave, assessmentKey, client, assessmentDef }) {
  const existingData = getAssessment(client, assessmentKey);
  const existingDate = getAssessmentDate(existingData) || new Date().toISOString().split('T')[0];
  const existingScores = typeof existingData === 'object' && existingData !== null && existingData.scores ? existingData.scores : {};

  const [completedDate, setCompletedDate] = useState(existingDate);
  const [scores, setScores] = useState(existingScores);

  useEffect(() => {
    if (isOpen) {
      setCompletedDate(existingDate);
      setScores(existingScores);
    }
  }, [isOpen, assessmentKey, client]);

  if (!isOpen) return null;

  const handleScoreChange = (field, value) => {
    setScores(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!completedDate) {
      alert("Please enter a completion date.");
      return;
    }
    
    const payload = {
      completed: completedDate,
      uploaded: typeof existingData === 'object' && existingData.uploaded ? existingData.uploaded : completedDate,
      scores: Object.keys(scores).length > 0 ? scores : undefined
    };
    
    onSave(assessmentKey, payload);
    onClose();
  };

  const handleClear = () => {
    onSave(assessmentKey, null);
    onClose();
  };

  const getAssessmentType = () => {
    if (!assessmentKey) return 'standard';
    if (assessmentKey.includes('cesdr')) return 'cesdr';
    if (assessmentKey.includes('psi')) return 'psi';
    if (assessmentKey.includes('pcl5')) return 'pcl5';
    if (assessmentKey.includes('ccis')) return 'ccis';
    if (assessmentKey.includes('asq3')) return 'asq3';
    return 'standard';
  };

  const renderScoreInputs = () => {
    const type = getAssessmentType();
    
    switch (type) {
      case 'cesdr':
        return (
          <div className="space-y-3 mt-4">
            <label className="block text-sm font-bold text-slate-700">CESD-R Total Score</label>
            <div className="flex items-center gap-3">
              <input type="number" className="p-2 border rounded-lg w-24" value={scores.total || ''} onChange={(e) => handleScoreChange('total', e.target.value)} />
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> &gt; 16 indicates clinical depression
              </div>
            </div>
          </div>
        );
      case 'psi':
        return (
          <div className="space-y-3 mt-4">
            <label className="block text-sm font-bold text-slate-700">PSI-4 Percentile Score</label>
            <div className="flex items-center gap-3">
              <input type="number" className="p-2 border rounded-lg w-24" value={scores.percentile || ''} onChange={(e) => handleScoreChange('percentile', e.target.value)} />
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> ≥ 85th% indicates clinical stress
              </div>
            </div>
          </div>
        );
      case 'pcl5':
        return (
          <div className="space-y-3 mt-4">
            <label className="block text-sm font-bold text-slate-700">PCL-5 Total Score</label>
            <div className="flex items-center gap-3">
              <input type="number" className="p-2 border rounded-lg w-24" value={scores.total || ''} onChange={(e) => handleScoreChange('total', e.target.value)} />
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> &gt; 33 indicates symptomatic PTSD
              </div>
            </div>
          </div>
        );
      case 'ccis':
        return (
          <div className="space-y-3 mt-4">
            <label className="block text-sm font-bold text-slate-700">CCIS Total Score</label>
            <div className="flex items-center gap-3">
              <input type="number" className="p-2 border rounded-lg w-24" value={scores.total || ''} onChange={(e) => handleScoreChange('total', e.target.value)} />
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> ≥ 35 indicates relational concern
              </div>
            </div>
          </div>
        );
      case 'asq3':
        const isFollowUp = assessmentKey.startsWith('6mo_') || assessmentKey.startsWith('dis_') || assessmentKey.startsWith('q3_') || assessmentKey.startsWith('q2_') || assessmentKey.startsWith('q1_');
        return (
          <div className="space-y-4 mt-4">
            {isFollowUp ? (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4 text-sm text-blue-800 flex items-start gap-2">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p><strong>Follow-Up ASQ:</strong> You only need to input the <strong>Communication</strong> score for follow-up and discharge ASQ assessments (unless there were other baseline concern areas).</p>
              </div>
            ) : null}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Communication</label>
                <input type="number" className="p-2 border rounded-lg w-full" value={scores.communication || ''} onChange={(e) => handleScoreChange('communication', e.target.value)} />
              </div>
              {!isFollowUp && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Gross Motor</label>
                    <input type="number" className="p-2 border rounded-lg w-full" value={scores.grossMotor || ''} onChange={(e) => handleScoreChange('grossMotor', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Fine Motor</label>
                    <input type="number" className="p-2 border rounded-lg w-full" value={scores.fineMotor || ''} onChange={(e) => handleScoreChange('fineMotor', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Problem Solving</label>
                    <input type="number" className="p-2 border rounded-lg w-full" value={scores.problemSolving || ''} onChange={(e) => handleScoreChange('problemSolving', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Personal-Social</label>
                    <input type="number" className="p-2 border rounded-lg w-full" value={scores.personalSocial || ''} onChange={(e) => handleScoreChange('personalSocial', e.target.value)} />
                  </div>
                </>
              )}
              {isFollowUp && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Other Concern Area (Optional)</label>
                  <input type="text" placeholder="e.g. Fine Motor: 10" className="p-2 border rounded-lg w-full" value={scores.otherConcern || ''} onChange={(e) => handleScoreChange('otherConcern', e.target.value)} />
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Record Assessment</h2>
            <p className="text-sm text-slate-500 mt-1">{assessmentDef?.name || assessmentKey}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Date Completed
              </label>
              <input 
                type="date" 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
              />
            </div>
            {renderScoreInputs()}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          {existingDate ? (
            <button 
              onClick={handleClear}
              className="flex-1 py-3 bg-red-50 text-red-600 font-semibold hover:bg-red-100 rounded-xl transition-colors"
            >
              Clear Data
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> Save Data
          </button>
        </div>
      </div>
    </div>
  );
}
