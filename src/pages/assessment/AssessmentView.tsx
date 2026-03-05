import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { updateChild } from '@/redux/slices/childSlice';
import {
  fetchDevelopmentalAssessments,
  saveDevelopmentalAssessmentsBulk,
} from '@/redux/slices/developmentalAssessmentSlice';
import { PlusIcon, BellIcon, InfoIcon } from '@/design-system/icons';
import { BottomSheet } from '@/components/ui';
import type { DetailedAssessment, DevAnswer } from '@/design-system/types';
import {
  DEVELOPMENTAL_SUBCATEGORY_LABELS,
  DEVELOPMENTAL_SUBCATEGORY_ORDER,
  getAgeInMonthsFromDob,
  getDevelopmentalAssessmentsForAge,
} from '@/data/developmentalMilestones';

interface MeasurementField {
  label: string;
  key: string;
  help: string;
}

type AnthropometricAssessmentId = 'a1' | 'a1-2' | 'a1-3';

const MEASUREMENT_GUIDES: Record<string, { title: string; items: string[]; tip: string }> = {
  a1: {
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
      "Find the midpoint of the child's left upper arm (between shoulder and elbow)",
      'Wrap the MUAC tape around the midpoint snugly but not tight',
      'Read the measurement where the tape meets the window/arrow',
      'Green (>=13.5 cm) = well nourished',
      'Yellow (12.5-13.4 cm) = moderate malnutrition risk',
      'Red (<12.5 cm) = severe malnutrition - seek care immediately',
    ],
    tip: 'The MUAC tape is most reliable for children aged 6 months to 5 years.',
  },
};

const MEASUREMENT_FIELDS: Record<string, MeasurementField[]> = {
  a1: [
    {
      label: 'Weight (kg)',
      key: 'weight',
      help: 'Use a calibrated scale. Remove shoes and heavy clothing.',
    },
    {
      label: 'Height (cm)',
      key: 'height',
      help: 'Use a stadiometer or wall chart. Stand upright.',
    },
  ],
  'a1-2': [
    {
      label: 'Height (cm)',
      key: 'height',
      help: 'Use a stadiometer or wall chart. Stand with heels against wall.',
    },
  ],
  'a1-3': [
    {
      label: 'MUAC (cm)',
      key: 'muac',
      help: 'Measure at midpoint of left upper arm. Tape should be snug but not tight.',
    },
  ],
};

const ANTHROPOMETRIC_ASSESSMENTS: DetailedAssessment[] = [
  { id: 'a1', title: 'Weight for Height', category: 'Anthropometric', type: 'measurement' },
  { id: 'a1-2', title: 'Height for Age', category: 'Anthropometric', type: 'measurement' },
  { id: 'a1-3', title: 'MUAC Tape Test', category: 'Anthropometric', type: 'measurement' },
];

const formatRelativeTime = (isoDate?: string) => {
  if (!isoDate) return 'Never updated';

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Updated today';
  if (diffDays === 1) return 'Updated 1 day ago';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `Updated ${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `Updated ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
};

const getAnswerColor = (answer?: DevAnswer) => {
  switch (answer) {
    case 'yes':
      return 'bg-emerald-100 border-emerald-300 text-emerald-700';
    case 'no':
      return 'bg-rose-100 border-rose-300 text-rose-700';
    case 'addressed':
      return 'bg-sky-100 border-sky-300 text-sky-700';
    default:
      return 'bg-white border-slate-200 text-slate-400';
  }
};

const AssessmentView: React.FC = () => {
  const [developmentalAssessments, setDevelopmentalAssessments] = useState<DetailedAssessment[]>(
    []
  );
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'anthropometric' | 'developmental' | null>(null);
  const [recommendationModal, setRecommendationModal] = useState<DetailedAssessment | null>(null);
  const [helpAssessment, setHelpAssessment] = useState<string | null>(null);
  const [isAddingData, setIsAddingData] = useState<string | null>(null);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  const [saveMeasurementError, setSaveMeasurementError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const childrenState = useSelector((state: RootState) => state.children);
  const developmentalState = useSelector(
    (state: RootState) => state.developmentalAssessments
  );

  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const activeChild =
    childrenState.data.find((child) => child.id === favoriteChildId) || childrenState.data[0];

  const childAgeInMonths = useMemo(
    () => getAgeInMonthsFromDob(activeChild?.date_of_birth),
    [activeChild?.date_of_birth]
  );

  const baseDevelopmentalAssessments = useMemo(
    () => getDevelopmentalAssessmentsForAge(childAgeInMonths),
    [childAgeInMonths]
  );

  useEffect(() => {
    if (activeChild?.id) {
      dispatch(fetchDevelopmentalAssessments(activeChild.id));
    }
  }, [dispatch, activeChild?.id]);

  useEffect(() => {
    setDevelopmentalAssessments(
      baseDevelopmentalAssessments.map((item) => ({
        ...item,
        answer: developmentalState.byQuestionId[item.id] ?? 'unanswered',
      }))
    );
  }, [baseDevelopmentalAssessments, developmentalState.byQuestionId]);

  const anthropometricCards = useMemo(() => {
    const childUpdatedAt = activeChild?.updatedAt;
    const staleCutoffDays = 30;
    const diffDays = childUpdatedAt
      ? Math.floor((Date.now() - new Date(childUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
      : Number.POSITIVE_INFINITY;

    const isStale = !Number.isFinite(diffDays) || diffDays > staleCutoffDays;

    return ANTHROPOMETRIC_ASSESSMENTS.map((assessment) => {
      const id = assessment.id as AnthropometricAssessmentId;

      if (id === 'a1') {
        const isRecorded = Boolean(activeChild?.weight && activeChild?.height);
        return {
          ...assessment,
          isRecorded,
          isStale,
          lastUpdatedText: formatRelativeTime(childUpdatedAt),
          metrics: [
            { label: 'Weight', value: activeChild?.weight ? `${activeChild.weight} kg` : '--' },
            { label: 'Height', value: activeChild?.height ? `${activeChild.height} cm` : '--' },
          ],
        };
      }

      if (id === 'a1-2') {
        const isRecorded = Boolean(activeChild?.height);
        return {
          ...assessment,
          isRecorded,
          isStale,
          lastUpdatedText: formatRelativeTime(childUpdatedAt),
          metrics: [{ label: 'Height', value: activeChild?.height ? `${activeChild.height} cm` : '--' }],
        };
      }

      const isRecorded = Boolean(activeChild?.muac);
      return {
        ...assessment,
        isRecorded,
        isStale,
        lastUpdatedText: formatRelativeTime(childUpdatedAt),
        metrics: [{ label: 'MUAC', value: activeChild?.muac ? `${activeChild.muac} cm` : '--' }],
      };
    });
  }, [activeChild?.height, activeChild?.muac, activeChild?.updatedAt, activeChild?.weight]);

  const expiredAnthro = anthropometricCards.filter((item) => !item.isRecorded || item.isStale);
  const unaddressedDev = developmentalAssessments.filter((item) => item.answer === 'no');

  const selectedAssessment =
    selectedAssessmentId &&
    anthropometricCards.find((assessment) => assessment.id === selectedAssessmentId);

  const handleOpenMeasurementEntry = (assessmentId: string) => {
    const fields = MEASUREMENT_FIELDS[assessmentId];
    if (!fields) return;

    const initialValues: Record<string, string> = {};
    fields.forEach((field) => {
      initialValues[field.key] = '';
    });

    setMeasurementValues(initialValues);
    setIsAddingData(assessmentId);
    setSaveMeasurementError(null);
  };

  const handleSaveMeasurement = async () => {
    if (!activeChild || !isAddingData) return;

    const fields = MEASUREMENT_FIELDS[isAddingData];
    if (!fields) return;

    const updateData: Record<string, number> = {};
    for (const field of fields) {
      const val = parseFloat(measurementValues[field.key]);
      if (!Number.isNaN(val) && val > 0) {
        updateData[field.key] = val;
      }
    }

    if (Object.keys(updateData).length === 0) {
      setSaveMeasurementError('Enter at least one valid measurement value.');
      return;
    }

    setIsSavingMeasurement(true);
    setSaveMeasurementError(null);

    try {
      await dispatch(updateChild({ id: activeChild.id, ...updateData })).unwrap();
      setIsAddingData(null);
      setMeasurementValues({});
    } catch (error: any) {
      setSaveMeasurementError(
        typeof error === 'string' ? error : 'Failed to save measurement'
      );
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const persistDevelopmentalAnswers = async (nextAssessments: DetailedAssessment[]) => {
    if (!activeChild?.id) return;

    await dispatch(
      saveDevelopmentalAssessmentsBulk({
        childId: activeChild.id,
        items: nextAssessments.map((item) => ({
          questionId: item.id,
          subCategory: item.subCategory || 'General',
          answer: (item.answer || 'unanswered') as DevAnswer,
        })),
      })
    );
  };

  const toggleAnswer = (id: string, newAnswer: DevAnswer) => {
    const nextAssessments: DetailedAssessment[] = developmentalAssessments.map((assessment) =>
      assessment.id === id ? { ...assessment, answer: newAnswer } : assessment
    );

    setDevelopmentalAssessments(nextAssessments);
    void persistDevelopmentalAnswers(nextAssessments);

    const matched = nextAssessments.find((assessment) => assessment.id === id);
    if (newAnswer === 'no' && matched) {
      setRecommendationModal(matched);
    }
  };

  const markAsAddressed = (id: string) => {
    const nextAssessments: DetailedAssessment[] = developmentalAssessments.map((assessment) =>
      assessment.id === id
        ? { ...assessment, answer: 'addressed' as DevAnswer }
        : assessment
    );

    setDevelopmentalAssessments(nextAssessments);
    void persistDevelopmentalAnswers(nextAssessments);
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
        <section>
          <div className="px-6 flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">
              Anthropometric
            </h3>
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
            {anthropometricCards.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedAssessmentId(item.id)}
                className="flex-shrink-0 w-64 bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm snap-center text-left transition-all active:scale-95 relative"
              >
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    setHelpAssessment(item.id);
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
                >
                  <InfoIcon size={16} />
                </div>

                <h4 className="font-bold text-slate-800 leading-tight mb-4 min-h-[40px] pr-8">
                  {item.title}
                </h4>

                <div className="space-y-2 mb-4">
                  {item.metrics.map((metric) => (
                    <div key={metric.label} className="flex justify-between text-xs">
                      <span className="font-bold uppercase text-slate-400">{metric.label}</span>
                      <span className="font-bold text-slate-700">{metric.value}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-black uppercase mb-4 text-slate-400">
                  {item.lastUpdatedText}
                </div>

                <div className="mt-4">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenMeasurementEntry(item.id);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                      item.isRecorded
                        ? 'bg-slate-100 text-slate-600 shadow-slate-100'
                        : 'bg-sky-500 text-white shadow-sky-100'
                    }`}
                  >
                    <PlusIcon className="w-4 h-4" /> {item.isRecorded ? 'Update Data' : 'Add Data'}
                  </button>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="px-6 flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">
              Developmental
            </h3>
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

          {DEVELOPMENTAL_SUBCATEGORY_ORDER.map((subCategory) => {
            const categoryQuestions = developmentalAssessments.filter(
              (item) => item.subCategory === subCategory
            );

            if (categoryQuestions.length === 0) {
              return null;
            }

            return (
              <div key={subCategory} className="mb-10">
                <h4 className="px-6 text-xs font-bold text-slate-400 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                  {DEVELOPMENTAL_SUBCATEGORY_LABELS[subCategory]}
                </h4>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar px-6 snap-x">
                  {categoryQuestions.map((question) => (
                    <div
                      key={question.id}
                      onClick={() => {
                        if (question.answer === 'no') {
                          setRecommendationModal(question);
                        }
                      }}
                      className={`flex-shrink-0 w-64 rounded-[2rem] p-6 border-2 transition-all snap-center flex flex-col justify-between min-h-[180px] ${getAnswerColor(question.answer)}`}
                    >
                      <div>
                        <h5 className="font-bold leading-tight mb-4">{question.title}</h5>
                        <p className="text-[10px] font-black uppercase opacity-60">
                          Status:{' '}
                          {question.answer === 'addressed'
                            ? 'Addressed with Doctor'
                            : question.answer === 'unanswered'
                              ? 'Not Assessed'
                              : question.answer}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleAnswer(question.id, 'yes');
                          }}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            question.answer === 'yes'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white/50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleAnswer(question.id, 'no');
                          }}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            question.answer === 'no'
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-white/50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {developmentalState.error && (
            <div className="px-6 mt-2">
              <p className="text-xs text-rose-600">{developmentalState.error}</p>
            </div>
          )}
          {developmentalState.saving && (
            <div className="px-6 mt-2">
              <p className="text-xs text-slate-500">Saving developmental answers...</p>
            </div>
          )}
        </section>
      </div>

      {recommendationModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 text-3xl mx-auto shadow-inner">
              <span role="img" aria-label="doctor">
                👨‍⚕️
              </span>
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-3">Notice Something?</h4>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              If you are unsure or ticked <strong>"No"</strong> for "{recommendationModal.title}",
              we recommend consulting with your pediatrician for a professional evaluation.
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

      {notificationType && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-md flex items-end">
          <div className="w-full bg-white rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                {notificationType === 'anthropometric'
                  ? 'Expired Measurements'
                  : 'Unaddressed Concerns'}
              </h3>
              <button
                onClick={() => setNotificationType(null)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <PlusIcon className="rotate-45 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {notificationType === 'anthropometric' ? (
                expiredAnthro.length > 0 ? (
                  expiredAnthro.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex justify-between items-center"
                    >
                      <div>
                        <h5 className="font-bold text-slate-800">{assessment.title}</h5>
                        <p className="text-[10px] text-amber-600 font-black uppercase">
                          {assessment.lastUpdatedText}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          handleOpenMeasurementEntry(assessment.id);
                          setNotificationType(null);
                        }}
                        className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-amber-600 border border-amber-200"
                      >
                        Update
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-10 font-bold">
                    All measurements are up to date!
                  </p>
                )
              ) : unaddressedDev.length > 0 ? (
                unaddressedDev.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="p-5 bg-rose-50 rounded-3xl border border-rose-100 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-slate-800">{assessment.title}</h5>
                        <p className="text-[10px] text-rose-600 font-black uppercase">
                          {assessment.subCategory}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-100 rounded-md text-[8px] font-black text-rose-500 uppercase">
                        Action Needed
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => markAsAddressed(assessment.id)}
                        className="flex-1 py-2 bg-white rounded-xl text-[10px] font-black text-sky-500 border border-sky-100 shadow-sm"
                      >
                        Addressed with Doctor
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-10 font-bold">
                  No unaddressed concerns. Great job!
                </p>
              )}
            </div>
            <button
              onClick={() => setNotificationType(null)}
              className="w-full py-4 text-slate-400 font-black mt-8 uppercase text-xs tracking-widest"
            >
              Close Notifications
            </button>
          </div>
        </div>
      )}

      <BottomSheet
        isOpen={!!helpAssessment}
        onClose={() => setHelpAssessment(null)}
        title={helpAssessment ? MEASUREMENT_GUIDES[helpAssessment]?.title : undefined}
      >
        {helpAssessment && MEASUREMENT_GUIDES[helpAssessment] && (
          <div className="px-2">
            <ol className="space-y-3 mb-6">
              {MEASUREMENT_GUIDES[helpAssessment].items.map((step, index) => (
                <li key={index} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sky-100 text-sky-600 text-xs font-black flex items-center justify-center">
                    {index + 1}
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

      <BottomSheet
        isOpen={!!isAddingData}
        onClose={() => {
          setIsAddingData(null);
          setMeasurementValues({});
          setSaveMeasurementError(null);
        }}
        title={
          isAddingData
            ? `${
                ANTHROPOMETRIC_ASSESSMENTS.find((assessment) => assessment.id === isAddingData)
                  ?.title || 'Measurement'
              } Entry`
            : undefined
        }
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
                    onChange={(event) =>
                      setMeasurementValues({
                        ...measurementValues,
                        [field.key]: event.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            {saveMeasurementError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-xs text-rose-600 font-medium">{saveMeasurementError}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setIsAddingData(null);
                  setMeasurementValues({});
                  setSaveMeasurementError(null);
                }}
                disabled={isSavingMeasurement}
                className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMeasurement}
                disabled={isSavingMeasurement}
                className="flex-1 py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSavingMeasurement ? 'Saving...' : 'Save Measurement'}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet isOpen={!!selectedAssessment} onClose={() => setSelectedAssessmentId(null)}>
        {selectedAssessment && (
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedAssessment.title}</h2>
            <p className="text-slate-400 text-xs mb-8 uppercase font-bold tracking-[0.2em]">
              {selectedAssessment.category}
            </p>

            <div className="w-full space-y-4 text-left mb-8">
              {selectedAssessment.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center"
                >
                  <span className="text-xs font-black uppercase text-slate-400">{metric.label}</span>
                  <span className="text-sm font-bold text-slate-800">{metric.value}</span>
                </div>
              ))}

              <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                <p className="text-xs font-black uppercase text-sky-500 mb-1">Last Updated</p>
                <p className="text-sm text-slate-700 font-medium">{selectedAssessment.lastUpdatedText}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedAssessmentId(null);
                handleOpenMeasurementEntry(selectedAssessment.id);
              }}
              className="w-full py-5 bg-sky-500 text-white font-black rounded-3xl shadow-2xl shadow-sky-100 active:scale-95 transition-transform"
            >
              {selectedAssessment.isRecorded ? 'Update Measurements' : 'Add Measurements'}
            </button>

            <button
              onClick={() => setSelectedAssessmentId(null)}
              className="mt-6 mb-4 w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
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
