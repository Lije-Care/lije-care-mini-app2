import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { updateChild } from '@/redux/slices/childSlice';
import { PlusIcon, BellIcon, InfoIcon } from '@/design-system/icons';
import { BottomSheet } from '@/components/ui';
import type { AssessmentStatus, DetailedAssessment, DevAnswer, AssessmentHistoryPoint } from '@/design-system/types';

interface MeasurementField {
  label: string;
  key: string;
  help: string;
}

const MEASUREMENT_GUIDES: Record<string, { title: string; items: string[]; tip: string }> = {
  'a1': {
    title: 'How to Measure Weight for Height',
    items: [
      'Use a calibrated scale on a flat, hard surface',
      'Remove shoes and heavy clothing',
      'Stand the child upright with arms at their sides',
      'Record weight to the nearest 0.1 kg',
      'Measure height using a stadiometer or wall chart',
      'Compare using a WHO growth chart for age and sex',
    ],
    tip: 'Measure at the same time of day for consistency.',
  },
  'a1-2': {
    title: 'How to Measure Height for Age',
    items: [
      'Use a stadiometer or flat measuring tape on a wall',
      'Remove shoes, hair accessories, and hats',
      'Stand the child with heels, back, and head against the wall',
      'Keep eyes level (Frankfurt plane) and press a flat object on top of the head',
      'Record height to the nearest 0.1 cm',
      'Plot on a WHO height-for-age growth chart',
    ],
    tip: 'For children under 2, measure length lying down instead.',
  },
  'a1-3': {
    title: 'How to Use the MUAC Tape',
    items: [
      'Find the midpoint of the child\'s left upper arm (between shoulder and elbow)',
      'Wrap the MUAC tape around the midpoint snugly but not tight',
      'Read the measurement where the tape meets the window/arrow',
      'Green (\u226513.5 cm) = well nourished',
      'Yellow (12.5\u201313.4 cm) = moderate malnutrition risk',
      'Red (<12.5 cm) = severe malnutrition \u2014 seek care immediately',
    ],
    tip: 'The MUAC tape is most reliable for children aged 6 months to 5 years.',
  },
};

const MEASUREMENT_FIELDS: Record<string, MeasurementField[]> = {
  'a1': [
    { label: 'Weight (kg)', key: 'weight', help: 'Use a calibrated scale. Remove shoes and heavy clothing.' },
    { label: 'Height (cm)', key: 'height', help: 'Use a stadiometer or wall chart. Stand upright.' },
  ],
  'a1-2': [
    { label: 'Height (cm)', key: 'height', help: 'Use a stadiometer or wall chart. Stand with heels against wall.' },
  ],
  'a1-3': [
    { label: 'MUAC (cm)', key: 'muac', help: 'Measure at midpoint of left upper arm. Tape should be snug but not tight.' },
  ],
};

const INITIAL_ASSESSMENTS: DetailedAssessment[] = [
  // Anthropometric
  {
    id: 'a1', title: 'Weight for Height', category: 'Anthropometric', type: 'measurement',
    result: { status: 'under', category: 'Underweight', interpretation: 'Slightly under recommended weight.', action: 'Consult nutritionist.', score: 65 },
    history: [{ date: 'Jan', score: 55 }, { date: 'Feb', score: 60 }, { date: 'Mar', score: 65 }],
    isExpired: true, lastUpdated: '3 months ago'
  },
  {
    id: 'a1-2', title: 'Height for Age', category: 'Anthropometric', type: 'measurement',
    result: { status: 'normal', category: 'On Track', interpretation: 'Height is consistent.', action: 'Keep up healthy diet.', score: 88 },
    history: [{ date: 'Jan', score: 82 }, { date: 'Feb', score: 85 }, { date: 'Mar', score: 88 }],
    isExpired: false, lastUpdated: '1 week ago'
  },
  {
    id: 'a1-3', title: 'MUAC Tape Test', category: 'Anthropometric', type: 'measurement',
    isExpired: true, lastUpdated: '2 months ago'
  },

  // Developmental - Language
  { id: 'dev-l1', title: 'Responds to name', category: 'Developmental', subCategory: 'Language', type: 'subjective', answer: 'unanswered' },
  { id: 'dev-l2', title: 'Uses 5-10 words', category: 'Developmental', subCategory: 'Language', type: 'subjective', answer: 'no' },
  { id: 'dev-l3', title: 'Points to objects', category: 'Developmental', subCategory: 'Language', type: 'subjective', answer: 'addressed' },
  { id: 'dev-l4', title: 'Follows simple commands', category: 'Developmental', subCategory: 'Language', type: 'subjective', answer: 'yes' },

  // Developmental - Cognitive
  { id: 'dev-c1', title: 'Finds hidden objects', category: 'Developmental', subCategory: 'Cognitive', type: 'subjective', answer: 'yes' },
  { id: 'dev-c2', title: 'Sorts by color/shape', category: 'Developmental', subCategory: 'Cognitive', type: 'subjective', answer: 'no' },
  { id: 'dev-c3', title: 'Pretend play', category: 'Developmental', subCategory: 'Cognitive', type: 'subjective', answer: 'unanswered' },

  // Developmental - Social
  { id: 'dev-s1', title: 'Plays near other kids', category: 'Developmental', subCategory: 'Social', type: 'subjective', answer: 'yes' },
  { id: 'dev-s2', title: 'Shows affection', category: 'Developmental', subCategory: 'Social', type: 'subjective', answer: 'unanswered' },
  { id: 'dev-s3', title: 'Separation anxiety', category: 'Developmental', subCategory: 'Social', type: 'subjective', answer: 'no' },

  // Developmental - Physical
  { id: 'dev-p1', title: 'Runs easily', category: 'Developmental', subCategory: 'Physical', type: 'subjective', answer: 'yes' },
  { id: 'dev-p2', title: 'Climbs furniture', category: 'Developmental', subCategory: 'Physical', type: 'subjective', answer: 'no' },
  { id: 'dev-p3', title: 'Stacks 4 blocks', category: 'Developmental', subCategory: 'Physical', type: 'subjective', answer: 'addressed' },
];

const AssessmentView: React.FC = () => {
  const [assessments, setAssessments] = useState(INITIAL_ASSESSMENTS);
  const [selectedAssessment, setSelectedAssessment] = useState<DetailedAssessment | null>(null);
  const [notificationType, setNotificationType] = useState<'anthropometric' | 'developmental' | null>(null);
  const [recommendationModal, setRecommendationModal] = useState<DetailedAssessment | null>(null);
  const [helpAssessment, setHelpAssessment] = useState<string | null>(null);
  const [isAddingData, setIsAddingData] = useState<string | null>(null);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const children = useSelector((state: RootState) => state.children);
  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const activeChild = children.data.find(c => c.id === favoriteChildId) || children.data[0];

  const toggleAnswer = (id: string, newAnswer: DevAnswer) => {
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, answer: newAnswer } : a));
    const assessment = assessments.find(a => a.id === id);
    if (newAnswer === 'no' && assessment) {
      setRecommendationModal(assessment);
    }
  };

  const markAsAddressed = (id: string) => {
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, answer: 'addressed' } : a));
  };

  const getAnswerColor = (answer?: DevAnswer) => {
    switch (answer) {
      case 'yes': return 'bg-emerald-100 border-emerald-300 text-emerald-700';
      case 'no': return 'bg-rose-100 border-rose-300 text-rose-700';
      case 'addressed': return 'bg-sky-100 border-sky-300 text-sky-700';
      default: return 'bg-white border-slate-200 text-slate-400';
    }
  };

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

  const handleOpenMeasurementEntry = (assessmentId: string) => {
    const fields = MEASUREMENT_FIELDS[assessmentId];
    if (fields) {
      const initialValues: Record<string, string> = {};
      fields.forEach((f) => { initialValues[f.key] = ''; });
      setMeasurementValues(initialValues);
      setIsAddingData(assessmentId);
    }
  };

  const handleSaveMeasurement = async () => {
    if (!activeChild || !isAddingData) return;

    const fields = MEASUREMENT_FIELDS[isAddingData];
    if (!fields) return;

    const updateData: Record<string, number> = {};
    for (const field of fields) {
      const val = parseFloat(measurementValues[field.key]);
      if (!isNaN(val) && val > 0) {
        updateData[field.key] = val;
      }
    }

    if (Object.keys(updateData).length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await dispatch(updateChild({ id: activeChild.id, ...updateData })).unwrap();
      setIsAddingData(null);
      setMeasurementValues({});
    } catch (err: any) {
      setSaveError(typeof err === 'string' ? err : 'Failed to save measurement');
    } finally {
      setIsSaving(false);
    }
  };

  const expiredAnthro = assessments.filter(a => a.category === 'Anthropometric' && a.isExpired);
  const unaddressedDev = assessments.filter(a => a.category === 'Developmental' && a.answer === 'no');

  const renderChart = (history: AssessmentHistoryPoint[]) => {
    const maxScore = 100;
    const height = 100;
    const width = 240;
    const padding = 20;
    const points = history.map((p, i) => {
      const x = padding + (i * (width - 2 * padding) / (history.length - 1 || 1));
      const y = height - padding - (p.score * (height - 2 * padding) / maxScore);
      return { x, y, score: p.score, date: p.date };
    });
    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    return (
      <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Growth Progress</h5>
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E2E8F0" strokeWidth="1" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#E2E8F0" strokeWidth="1" />
            <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#38BDF8" stroke="white" strokeWidth="2" />
                <text x={p.x} y={height - 2} textAnchor="middle" className="text-[8px] fill-slate-400 font-bold">{p.date}</text>
                <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[8px] fill-slate-800 font-bold">{p.score}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32 pt-4">
      <div className="px-6 mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Assessments</h2>
          <p className="text-slate-500 text-sm">Monitor milestones and growth.</p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Anthropometric Section */}
        <section>
          <div className="px-6 flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Anthropometric</h3>
            <button
              onClick={() => setNotificationType('anthropometric')}
              className="relative p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-sky-500 transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {expiredAnthro.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-white">
                  {expiredAnthro.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar px-6 snap-x">
            {assessments.filter(a => a.category === 'Anthropometric').map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedAssessment(item)}
                className="flex-shrink-0 w-64 bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm snap-center text-left transition-all active:scale-95 relative"
              >
                <div
                  onClick={(e) => { e.stopPropagation(); setHelpAssessment(item.id); }}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
                >
                  <InfoIcon size={16} />
                </div>
                <h4 className="font-bold text-slate-800 leading-tight mb-4 min-h-[40px] pr-8">{item.title}</h4>
                {item.result ? (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 relative">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="22" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                        <circle cx="24" cy="24" r="22" fill="none" stroke={getCircleStroke(item.result.status)} strokeWidth="4" strokeDasharray="138" strokeDashoffset={138 - (138 * (item.result.score || 0)) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-600">{item.result.score}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(item.result.status)}`}>
                      {item.result.category}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-300 font-black uppercase mb-4">Not Assessed</div>
                )}

                <div className="mt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenMeasurementEntry(item.id); }}
                    className={`w-full py-3 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${item.result ? 'bg-slate-100 text-slate-600 shadow-slate-100' : 'bg-sky-500 text-white shadow-sky-100'}`}
                  >
                    <PlusIcon className="w-4 h-4" /> {item.result ? 'Update Data' : 'Add Data'}
                  </button>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Developmental Section */}
        <section>
          <div className="px-6 flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Developmental</h3>
            <button
              onClick={() => setNotificationType('developmental')}
              className="relative p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-sky-500 transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {unaddressedDev.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-white">
                  {unaddressedDev.length}
                </span>
              )}
            </button>
          </div>

          {['Language', 'Cognitive', 'Social', 'Physical'].map(sub => (
            <div key={sub} className="mb-10">
              <h4 className="px-6 text-xs font-bold text-slate-400 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300"></span>
                {sub}
              </h4>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar px-6 snap-x">
                {assessments.filter(a => a.category === 'Developmental' && a.subCategory === sub).map(q => (
                  <div
                    key={q.id}
                    onClick={() => { if (q.answer === 'no') setRecommendationModal(q); }}
                    className={`flex-shrink-0 w-64 rounded-[2rem] p-6 border-2 transition-all snap-center flex flex-col justify-between min-h-[180px] ${getAnswerColor(q.answer)}`}
                  >
                    <div>
                      <h5 className="font-bold leading-tight mb-4">{q.title}</h5>
                      <p className="text-[10px] font-black uppercase opacity-60">
                        Status: {q.answer === 'addressed' ? 'Addressed with Doctor' : q.answer === 'unanswered' ? 'Not Assessed' : q.answer}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAnswer(q.id, 'yes'); }}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${q.answer === 'yes' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/50 text-slate-600 border border-slate-200'}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAnswer(q.id, 'no'); }}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${q.answer === 'no' ? 'bg-rose-600 text-white shadow-md' : 'bg-white/50 text-slate-600 border border-slate-200'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Recommendation Modal */}
      {recommendationModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 text-3xl mx-auto shadow-inner">
              <span role="img" aria-label="doctor">&#x1F468;&#x200D;&#x2695;&#xFE0F;</span>
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-3">Notice Something?</h4>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              If you are unsure or ticked <strong>"No"</strong> for "{recommendationModal.title}", we recommend consulting with your pediatrician for a professional evaluation.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setRecommendationModal(null)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl"
              >
                I Understand
              </button>
              <button
                onClick={() => {
                  markAsAddressed(recommendationModal.id);
                  setRecommendationModal(null);
                }}
                className="w-full py-3 text-sky-500 font-bold"
              >
                Already talked to doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {notificationType && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-md flex items-end">
          <div className="w-full bg-white rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                {notificationType === 'anthropometric' ? 'Expired Measurements' : 'Unaddressed Concerns'}
              </h3>
              <button onClick={() => setNotificationType(null)} className="p-2 bg-slate-100 rounded-full">
                <PlusIcon className="rotate-45 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {notificationType === 'anthropometric' ? (
                expiredAnthro.length > 0 ? expiredAnthro.map(a => (
                  <div key={a.id} className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-slate-800">{a.title}</h5>
                      <p className="text-[10px] text-amber-600 font-black uppercase">Outdated &bull; {a.lastUpdated}</p>
                    </div>
                    <button
                      onClick={() => { handleOpenMeasurementEntry(a.id); setNotificationType(null); }}
                      className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-amber-600 border border-amber-200"
                    >
                      Update
                    </button>
                  </div>
                )) : <p className="text-center text-slate-400 py-10 font-bold">All measurements are up to date!</p>
              ) : (
                unaddressedDev.length > 0 ? unaddressedDev.map(a => (
                  <div key={a.id} className="p-5 bg-rose-50 rounded-3xl border border-rose-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-slate-800">{a.title}</h5>
                        <p className="text-[10px] text-rose-600 font-black uppercase">{a.subCategory}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-100 rounded-md text-[8px] font-black text-rose-500 uppercase">Action Needed</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => markAsAddressed(a.id)}
                        className="flex-1 py-2 bg-white rounded-xl text-[10px] font-black text-sky-500 border border-sky-100 shadow-sm"
                      >
                        Addressed with Doctor
                      </button>
                    </div>
                  </div>
                )) : <p className="text-center text-slate-400 py-10 font-bold">No unaddressed concerns. Great job!</p>
              )}
            </div>
            <button onClick={() => setNotificationType(null)} className="w-full py-4 text-slate-400 font-black mt-8 uppercase text-xs tracking-widest">Close Notifications</button>
          </div>
        </div>
      )}

      {/* Help Guide Bottom Sheet */}
      <BottomSheet
        isOpen={!!helpAssessment}
        onClose={() => setHelpAssessment(null)}
        title={helpAssessment ? MEASUREMENT_GUIDES[helpAssessment]?.title : undefined}
      >
        {helpAssessment && MEASUREMENT_GUIDES[helpAssessment] && (
          <div className="px-2">
            <ol className="space-y-3 mb-6">
              {MEASUREMENT_GUIDES[helpAssessment].items.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sky-100 text-sky-600 text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
              <p className="text-sm text-sky-700 italic">
                <span className="font-bold not-italic">Tip: </span>
                {MEASUREMENT_GUIDES[helpAssessment].tip}
              </p>
            </div>
            <button
              onClick={() => setHelpAssessment(null)}
              className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors mt-6 mb-2"
            >
              Close
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Measurement Entry Bottom Sheet */}
      <BottomSheet
        isOpen={!!isAddingData}
        onClose={() => { setIsAddingData(null); setMeasurementValues({}); }}
        title={isAddingData ? `${assessments.find(a => a.id === isAddingData)?.title || 'Measurement'} Entry` : undefined}
      >
        {isAddingData && MEASUREMENT_FIELDS[isAddingData] && (
          <div className="px-2 pb-6">
            <div className="space-y-5">
              {MEASUREMENT_FIELDS[isAddingData].map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">{field.label}</label>
                    <button
                      onClick={() => setActiveHelp(activeHelp === field.key ? null : field.key)}
                      className="p-1 text-slate-400 hover:text-sky-500 transition-colors"
                    >
                      <InfoIcon size={16} />
                    </button>
                  </div>
                  {activeHelp === field.key && (
                    <div className="mb-3 bg-sky-50 rounded-xl p-3 border border-sky-100">
                      <p className="text-xs text-sky-700">{field.help}</p>
                    </div>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 text-slate-800 font-medium transition-all"
                    value={measurementValues[field.key] || ''}
                    onChange={(e) => setMeasurementValues({ ...measurementValues, [field.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {saveError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-xs text-rose-600 font-medium">{saveError}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setIsAddingData(null); setMeasurementValues({}); setSaveError(null); }}
                disabled={isSaving}
                className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMeasurement}
                disabled={isSaving}
                className="flex-1 py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Measurement'}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

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
                {selectedAssessment.history && renderChart(selectedAssessment.history)}

                <div className={`p-6 rounded-[2rem] border ${getStatusColor(selectedAssessment.result.status)} flex items-center gap-4`}>
                  <div className="text-2xl">
                    {selectedAssessment.result.status === 'normal' ? <span>&#x2705;</span> : <span>&#x26A0;&#xFE0F;</span>}
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
                    No data recorded for "{selectedAssessment.title}".
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedAssessment(null); handleOpenMeasurementEntry(selectedAssessment.id); }}
                  className="w-full py-5 bg-sky-500 text-white font-black rounded-3xl shadow-2xl shadow-sky-100 active:scale-95 transition-transform"
                >
                  Add Measurements
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
