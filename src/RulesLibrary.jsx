import React from 'react';
import { X, BookOpen, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function RulesLibrary({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Rules & Checklists Library</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Clinical Reference Guide</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cutoffs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Clinical Cutoffs
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm">
                  <span className="font-bold text-red-800 block">CESD-R {'>'} 16 (Depression)</span>
                  <span className="text-red-600 text-xs mt-1 block">Items 14/15 indicate suicidal ideation → immediate safety assessment required.</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm">
                  <span className="font-bold text-red-800 block">EPDS ≥ 13 (Postpartum)</span>
                  <span className="text-red-600 text-xs mt-1 block">Item 10 (self-harm thoughts) requires immediate follow-up.</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm">
                  <span className="font-bold text-amber-800 block">PCL-5 {'>'} 33 (PTSD)</span>
                  <span className="text-amber-700 text-xs mt-1 block">Any item scored ≥2 is symptomatic.</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm">
                  <span className="font-bold text-amber-800 block">PSI ≥ 85th% (Stress)</span>
                  <span className="text-amber-700 text-xs mt-1 block">≥90th percentile = clinical range.</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm">
                  <span className="font-bold text-amber-800 block">CCIS ≥ 35 (Relational)</span>
                  <span className="text-amber-700 text-xs mt-1 block">Single item ≥3 = concern.</span>
                </div>
              </div>
            </div>

            {/* Assessment Timeline */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Protocol Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Baseline (First 60 Days)</h4>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc marker:text-emerald-400">
                    <li><strong>Week 1:</strong> Intake/CCA, SNIFF, PQ</li>
                    <li><strong>Week 2:</strong> ASQ-3, PSI-4-SF, CESD-R, HOPE</li>
                    <li><strong>Week 3:</strong> TESI-PRR, LSC-R, PCL-5</li>
                    <li><strong>Week 4+:</strong> CCIS (After 4 dyadic observations)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ongoing</h4>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc marker:text-blue-400">
                    <li><strong>Every 90 Days:</strong> SNIFF Update required</li>
                    <li><strong>Quarterly (Q1/Q3):</strong> Treatment Plan Review</li>
                    <li><strong>6-Month / Annual:</strong> ASQ-3 (Concern areas), CCIS, PSI, CESD-R, PCL-5</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Fidelity Guidelines */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-500" /> Fidelity Checklists
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="block text-slate-800 mb-2">Foundational Phase</strong>
                  <ul className="text-slate-600 space-y-1 list-disc ml-4">
                    <li>Assessments completed within 60 days</li>
                    <li>Minimum 4 dyadic observations</li>
                    <li>Reflective supervision weekly</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="block text-slate-800 mb-2">Core Intervention</strong>
                  <ul className="text-slate-600 space-y-1 list-disc ml-4">
                    <li>Joint visits ≥ 2x per month</li>
                    <li>Treatment plan reviewed quarterly</li>
                    <li>Child-Parent Psychotherapy principles applied</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="block text-slate-800 mb-2">Termination</strong>
                  <ul className="text-slate-600 space-y-1 list-disc ml-4">
                    <li>YSSF completed</li>
                    <li>Final SNIFF update</li>
                    <li>Transition plan documented</li>
                  </ul>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
