import React from 'react';
import { X, CheckCircle, Clock, Info, CheckSquare } from 'lucide-react';

export default function TutorialModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Welcome to Tracker</h2>
              <p className="text-slate-600 mt-1">A quick guide to get you started</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">1. Adding a Case</h3>
                <p className="text-slate-600 text-sm mt-1">
                  Click the <strong>Add Client</strong> button on the top right. Fill in their Name, DOB, and Admit Date. The app will automatically calculate their age and which assessments are due.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">2. Phase Tracking</h3>
                <p className="text-slate-600 text-sm mt-1">
                  Cases move through <strong>Baseline, Q1, 6-Month, Q3, and Annual/Discharge</strong> phases automatically based on days in service. You'll see countdowns indicating when assessments are due.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">3. Rules & Checklists</h3>
                <p className="text-slate-600 text-sm mt-1">
                  Need to check a cutoff score or fidelity rule? Click <strong>Rules & Checklists</strong> at the top to access the built-in reference library for protocols and clinical cutoffs.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              Get Started <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
