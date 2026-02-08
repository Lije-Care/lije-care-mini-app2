import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { PlusIcon } from '@/design-system/icons';
import { BottomSheet } from '@/components/ui';
import type { AssessmentData, AssessmentCategory, AssessmentStatus } from '@/design-system/types';

const CATEGORIES: AssessmentCategory[] = [
  'Anthropometric',
  'Developmental',
  'Feeding Behavior',
  'Cognitive',
  'Motor Skills',
  'Physical Assessment for Malnutrition'
];

const MOCK_ASSESSMENTS: AssessmentData[] = [
  {
    id: 'a1', title: 'Weight for Height', category: 'Anthropometric', type: 'measurement', missingDataField: 'Weight',
    result: { status: 'under', category: 'Underweight', interpretation: 'Child is slightly under recommended weight for height.', action: 'Increase calorie-dense foods.', score: 65 }
  },
  {
    id: 'a2', title: 'Language Milestones', category: 'Developmental', type: 'subjective',
    result: { status: 'normal', category: 'Healthy Progress', interpretation: 'Speech and recognition levels are standard.', action: 'Keep reading together daily.', score: 92 }
  },
  {
    id: 'a3', title: 'MUAC Tape Test', category: 'Physical Assessment for Malnutrition', type: 'measurement', missingDataField: 'MUAC'
  },
  {
    id: 'a4', title: 'Self-Feeding', category: 'Feeding Behavior', type: 'subjective'
  },
  {
    id: 'a5', title: 'Object Permanence', category: 'Cognitive', type: 'subjective'
  },
  {
    id: 'a6', title: 'Crawling / Walking', category: 'Motor Skills', type: 'subjective'
  }
];

const AssessmentView: React.FC = () => {
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentData | null>(null);

  // Get children from Redux (for future use with actual assessment data)
  useSelector((state: RootState) => state.children);

  const getStatusColor = (status?: AssessmentStatus) => {
    switch (status) {
      case 'under': return 'text-rose-500 bg-rose-50 border-rose-200';
      case 'normal': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'risk': return 'text-amber-500 bg-amber-50 border-amber-200';
      default: return 'text-slate-400 bg-slate-50 border-slate-200';
    }
  };

  const getCircleStroke = (status?: AssessmentStatus) => {
    switch (status) {
      case 'under': return '#F43F5E';
      case 'normal': return '#10B981';
      case 'risk': return '#F59E0B';
      default: return '#E2E8F0';
    }
  };

  return (
    <div className="pb-32 pt-4">
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Assessments</h2>
        <p className="text-slate-500 text-sm">Monitor milestones and growth.</p>
      </div>

      <div className="space-y-10">
        {CATEGORIES.map(category => (
          <section key={category}>
            <div className="px-6 flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700 text-sm tracking-wide">{category}</h3>
              <button className="text-[10px] font-black uppercase text-sky-500">History</button>
            </div>

            <div className="flex gap-4 overflow-x-auto hide-scrollbar px-6 snap-x">
              {MOCK_ASSESSMENTS.filter(a => a.category === category).length > 0 ? (
                MOCK_ASSESSMENTS.filter(a => a.category === category).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedAssessment(item)}
                    className="flex-shrink-0 w-64 bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm snap-center text-left transition-all active:scale-95"
                  >
                    <h4 className="font-bold text-slate-800 leading-tight mb-4 min-h-[40px]">{item.title}</h4>

                    {item.result ? (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 relative">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="22" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                            <circle
                              cx="24" cy="24" r="22" fill="none"
                              stroke={getCircleStroke(item.result.status)}
                              strokeWidth="4"
                              strokeDasharray="138"
                              strokeDashoffset={138 - (138 * (item.result.score || 0)) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-600">
                            {item.result.score}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(item.result.status)}`}>
                          {item.result.category}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">Missing Data</p>
                        <button className="w-full py-3 bg-sky-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-100">
                          <PlusIcon className="w-4 h-4" /> Measure {item.missingDataField || 'Now'}
                        </button>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="flex-shrink-0 w-64 bg-slate-50/50 rounded-[2rem] p-8 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                    <PlusIcon className="text-slate-300" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Assessment</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Assessment Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
      >
        {selectedAssessment && (
          <div className="flex flex-col items-center text-center">
            <div className="relative w-44 h-44 mb-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="82" fill="none" stroke="#F8FAFC" strokeWidth="12" />
                <circle
                  cx="88" cy="88" r="82" fill="none"
                  stroke={getCircleStroke(selectedAssessment.result?.status)}
                  strokeWidth="12"
                  strokeDasharray="515"
                  strokeDashoffset={selectedAssessment.result ? 515 - (515 * (selectedAssessment.result.score || 0)) / 100 : 515}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-800">
                  {selectedAssessment.result?.score || '--'}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status Score</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedAssessment.title}</h2>
            <p className="text-slate-400 text-xs mb-8 uppercase font-bold tracking-[0.2em]">{selectedAssessment.category}</p>

            {selectedAssessment.result ? (
              <div className="w-full space-y-6 text-left">
                <div className={`p-6 rounded-[2rem] border ${getStatusColor(selectedAssessment.result.status)} flex items-center gap-4`}>
                  <div className="text-2xl">
                    {selectedAssessment.result.status === 'normal' ? '✅' : '⚠️'}
                  </div>
                  <div>
                    <h5 className="font-black uppercase text-[10px] mb-1">Result Category</h5>
                    <p className="font-bold text-base">{selectedAssessment.result.category}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase mb-3">Interpretation</h5>
                  <p className="text-slate-700 text-sm leading-relaxed font-medium">
                    {selectedAssessment.result.interpretation}
                  </p>
                </div>

                <div className="bg-sky-50 rounded-[2rem] p-6 border border-sky-100">
                  <h5 className="text-[10px] font-black text-sky-400 uppercase mb-3">Suggested Action</h5>
                  <p className="text-slate-700 text-sm leading-relaxed font-bold italic">
                    {selectedAssessment.result.action}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 mb-10">
                  <p className="text-slate-500 italic text-sm">
                    Assessment pending. We need data for "{selectedAssessment.missingDataField || 'this area'}" to calculate results.
                  </p>
                </div>
                <button className="w-full py-5 bg-sky-500 text-white font-black rounded-3xl shadow-2xl shadow-sky-100 active:scale-95 transition-transform">
                  Add {selectedAssessment.missingDataField || 'Measurement'}
                </button>
              </div>
            )}

            <button
              onClick={() => setSelectedAssessment(null)}
              className="mt-10 mb-6 w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Close Assessment
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default AssessmentView;
