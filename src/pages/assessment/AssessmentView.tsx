import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import api from '@/api/axios';
import { BottomSheet } from '@/components/ui';
import {
  DEVELOPMENTAL_SUBCATEGORY_LABELS,
  DEVELOPMENTAL_SUBCATEGORY_ORDER,
  getAgeInMonthsFromDob,
  getDevelopmentalAssessmentsForAge,
} from '@/data/developmentalMilestones';
import { BellIcon, InfoIcon, PlusIcon } from '@/design-system/icons';
import type { DetailedAssessment, DevAnswer } from '@/design-system/types';
import { updateChild } from '@/redux/slices/childSlice';
import {
  fetchDevelopmentalAssessments,
  saveDevelopmentalAssessmentsBulk,
} from '@/redux/slices/developmentalAssessmentSlice';
import type { AppDispatch, RootState } from '@/redux/store';
import {
  getAnthropometricStatus,
  type AnthropometricAssessmentId,
  type AnthropometricTone,
} from '@/utils/anthropometric';

interface MeasurementField {
  label: string;
  key: string;
  help: string;
}

interface CardMetric {
  label: string;
  value: string;
}

interface GrowthHistoryPoint {
  label: string;
  value: number;
}

interface VaccineDecisionMap {
  [vaccineId: string]: 'yes' | 'no';
}

interface VaccineScheduleItem {
  id: string;
  name: string;
  description: string;
  dueAgeWeeks: number;
}

interface VaccineCard extends VaccineScheduleItem {
  dueDate: Date;
  response?: 'yes' | 'no';
  isVaccinated: boolean;
  isOverdue: boolean;
  isUpcomingReminder: boolean;
  needsResponse: boolean;
  canCheck: boolean;
}

interface AnthropometricCard {
  id: AnthropometricAssessmentId;
  title: string;
  category: 'Anthropometric';
  type: 'measurement';
  metrics: CardMetric[];
  isRecorded: boolean;
  isStale: boolean;
  hasResult: boolean;
  lastUpdatedText: string;
  displayStatus: string;
  detailText: string;
  interpretation: string;
  suggestedAction: string | null;
  whoClassification: string | null;
  zScore: number | null;
  tone: AnthropometricTone;
  growthHistory: GrowthHistoryPoint[];
  growthUnit: string;
}

const STATUS_STYLES: Record<
  AnthropometricTone,
  {
    icon: string;
    pill: string;
  }
> = {
  danger: {
    icon: 'border-rose-100 bg-rose-50 text-rose-500',
    pill: 'border-rose-200 bg-rose-50 text-rose-500',
  },
  success: {
    icon: 'border-emerald-100 bg-emerald-50 text-emerald-500',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-500',
  },
  warning: {
    icon: 'border-amber-100 bg-amber-50 text-amber-600',
    pill: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  neutral: {
    icon: 'border-slate-200 bg-slate-100 text-slate-400',
    pill: 'border-slate-200 bg-slate-100 text-slate-500',
  },
};

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
  'a1-4': {
    title: 'How to Measure BMI for Age',
    items: [
      'Measure weight on a calibrated scale with shoes and heavy clothing removed',
      'Measure height or length carefully using a stadiometer or infant board',
      'Record weight in kilograms and height in centimeters',
      'Use the child’s age and sex with the WHO BMI-for-age reference',
      'Recheck both measurements if the result looks unusual',
    ],
    tip: 'BMI for age depends on accurate height, weight, age, and sex.',
  },
  'a1-5': {
    title: 'How to Measure Weight for Age',
    items: [
      'Place the scale on a flat, stable surface',
      'Remove shoes, jackets, and heavy items before weighing',
      'Record weight to the nearest 0.1 kg',
      'Use the child’s exact age and sex with the WHO weight-for-age reference',
      'Repeat the measurement if the child moves during weighing',
    ],
    tip: 'Weight for age is most useful when date of birth is recorded correctly.',
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
  'a1-4': [
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
  'a1-5': [
    {
      label: 'Weight (kg)',
      key: 'weight',
      help: 'Use a calibrated scale. Remove shoes and heavy clothing.',
    },
  ],
};

const ANTHROPOMETRIC_ASSESSMENTS: Array<{
  id: AnthropometricAssessmentId;
  title: string;
  category: 'Anthropometric';
  type: 'measurement';
}> = [
  { id: 'a1', title: 'Weight for Height', category: 'Anthropometric', type: 'measurement' },
  { id: 'a1-2', title: 'Height for Age', category: 'Anthropometric', type: 'measurement' },
  { id: 'a1-3', title: 'MUAC for Age', category: 'Anthropometric', type: 'measurement' },
  { id: 'a1-4', title: 'BMI for Age', category: 'Anthropometric', type: 'measurement' },
  { id: 'a1-5', title: 'Weight for Age', category: 'Anthropometric', type: 'measurement' },
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

const formatMetricValue = (value?: number | null, unit?: string) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return '--';
  return unit ? `${value} ${unit}` : `${value}`;
};

const formatHistoryMonth = (isoDate?: string) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short' });
};

const formatHistoryValue = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

const formatDueDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getGrowthHistoryMeta = (assessmentId: AnthropometricAssessmentId) => {
  switch (assessmentId) {
    case 'a1':
      return { unit: 'kg', getValue: (item: any) => item.weight };
    case 'a1-2':
      return { unit: 'cm', getValue: (item: any) => item.height };
    case 'a1-3':
      return { unit: 'cm', getValue: (item: any) => item.muac };
    case 'a1-4':
      return { unit: 'BMI', getValue: (item: any) => item.bmi };
    case 'a1-5':
    default:
      return { unit: 'kg', getValue: (item: any) => item.weight };
  }
};

const buildGrowthHistory = (
  assessmentId: AnthropometricAssessmentId,
  growthMetrics?: Array<{
    weight?: number | null;
    height?: number | null;
    muac?: number | null;
    bmi?: number | null;
    createdAt: string;
  }>
) => {
  const meta = getGrowthHistoryMeta(assessmentId);
  if (!growthMetrics?.length) return { unit: meta.unit, points: [] as GrowthHistoryPoint[] };

  const points = growthMetrics
    .map((entry) => {
      const rawValue = meta.getValue(entry);
      return {
        label: formatHistoryMonth(entry.createdAt),
        value: typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null,
      };
    })
    .filter((entry): entry is GrowthHistoryPoint => entry.value !== null && entry.label.length > 0)
    .slice(-6);

  return { unit: meta.unit, points };
};

const getInterpretationText = (displayStatus: string, detailText: string, hasResult: boolean) => {
  if (!hasResult) return 'No interpretation yet. Add measurements to calculate this assessment.';
  if (displayStatus === 'On Track') return 'This measurement is within the expected range for this child.';
  if (displayStatus === 'Underweight' || displayStatus === 'Below Range') {
    return `This measurement is below the expected range. ${detailText}`;
  }
  if (displayStatus === 'At Risk') {
    return `This measurement suggests nutritional risk. ${detailText}`;
  }
  return `This measurement is above the expected range. ${detailText}`;
};

const getSuggestedActionText = (
  displayStatus: string,
  hasResult: boolean
) => {
  if (!hasResult || displayStatus === 'On Track') return null;
  return 'Consult nutritionist.';
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

const StatusIcon: React.FC<{
  tone: AnthropometricTone;
  size?: 'sm' | 'md';
}> = ({ tone, size = 'md' }) => {
  const styles = STATUS_STYLES[tone];
  const containerClass = size === 'sm' ? 'h-20 w-20 rounded-[1.5rem]' : 'h-16 w-16 rounded-2xl';
  const iconClass = size === 'sm' ? 'text-4xl' : 'text-3xl';
  const icon =
    tone === 'success' ? '😊' : tone === 'neutral' ? '🙂' : tone === 'warning' ? '😐' : '😟';

  return (
    <div
      className={`flex ${containerClass} items-center justify-center border shadow-inner ${styles.icon}`}
      aria-hidden="true"
    >
      <span className={iconClass}>{icon}</span>
    </div>
  );
};

const GrowthProgressChart: React.FC<{
  points: GrowthHistoryPoint[];
  unit: string;
}> = ({ points, unit }) => {
  if (points.length === 0) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          Growth Progress
        </p>
        <p className="text-sm text-slate-500">
          No growth history yet. Save measurements over time to see progress.
        </p>
      </div>
    );
  }

  const width = 280;
  const height = 140;
  const paddingX = 22;
  const topPadding = 26;
  const bottomY = 100;
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);
  const stepX = points.length === 1 ? 0 : (width - paddingX * 2) / (points.length - 1);

  const coordinates = points.map((point, index) => {
    const x = paddingX + stepX * index;
    const y = topPadding + ((maxValue - point.value) / range) * 42;
    return { ...point, x, y };
  });

  const pathData = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        Growth Progress
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" aria-label="Growth progress chart">
        <line x1={paddingX} y1={bottomY} x2={width - paddingX} y2={bottomY} stroke="#d7dee7" strokeWidth="1.5" />
        <line x1={paddingX} y1={topPadding - 10} x2={paddingX} y2={bottomY} stroke="#d7dee7" strokeWidth="1.5" />
        <path d={pathData} fill="none" stroke="#f6c23e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="5.5" fill="#f6c23e" stroke="#ffffff" strokeWidth="3" />
            <text x={point.x} y={point.y - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">
              {formatHistoryValue(point.value)}
            </text>
            <text x={point.x} y={124} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8">
              {point.label}
            </text>
          </g>
        ))}
        <text x={width - paddingX} y={18} textAnchor="end" fontSize="10" fontWeight="700" fill="#94a3b8">
          {unit}
        </text>
      </svg>
    </div>
  );
};

const AssessmentView: React.FC = () => {
  const [developmentalAssessments, setDevelopmentalAssessments] = useState<DetailedAssessment[]>(
    []
  );
  const [selectedAssessmentId, setSelectedAssessmentId] =
    useState<AnthropometricAssessmentId | null>(null);
  const [notificationType, setNotificationType] = useState<
    'anthropometric' | 'developmental' | 'vaccine' | null
  >(null);
  const [recommendationModal, setRecommendationModal] = useState<DetailedAssessment | null>(null);
  const [helpAssessment, setHelpAssessment] = useState<string | null>(null);
  const [isAddingData, setIsAddingData] = useState<string | null>(null);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [vaccineResponses, setVaccineResponses] = useState<VaccineDecisionMap>({});
  const [vaccineSchedule, setVaccineSchedule] = useState<VaccineScheduleItem[]>([]);
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  const [saveMeasurementError, setSaveMeasurementError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const childrenState = useSelector((state: RootState) => state.children);
  const developmentalState = useSelector((state: RootState) => state.developmentalAssessments);

  const favoriteChildId =
    typeof window !== 'undefined' ? localStorage.getItem('favorite_child_id') : null;
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
    let isMounted = true;

    const fetchVaccineSchedule = async () => {
      try {
        const response = await api.get<{ data: VaccineScheduleItem[] }>('/immunity/schedule');
        if (isMounted) {
          setVaccineSchedule(response.data.data || []);
        }
      } catch {
        if (isMounted) {
          setVaccineSchedule([]);
        }
      }
    };

    void fetchVaccineSchedule();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeChild?.id || typeof window === 'undefined') {
      setVaccineResponses({});
      return;
    }

    const stored = localStorage.getItem(`vaccine_responses_${activeChild.id}`);
    if (!stored) {
      setVaccineResponses({});
      return;
    }

    try {
      setVaccineResponses(JSON.parse(stored));
    } catch {
      setVaccineResponses({});
    }
  }, [activeChild?.id]);

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

  useEffect(() => {
    const nextMeasurementId = (
      location.state as { openMeasurementId?: string } | null
    )?.openMeasurementId;

    if (nextMeasurementId && MEASUREMENT_FIELDS[nextMeasurementId] && !isAddingData) {
      handleOpenMeasurementEntry(nextMeasurementId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [isAddingData, location.pathname, location.state, navigate]);

  const anthropometricCards = useMemo<AnthropometricCard[]>(() => {
    const childUpdatedAt = activeChild?.updatedAt;
    const staleCutoffDays = 30;
    const diffDays = childUpdatedAt
      ? Math.floor((Date.now() - new Date(childUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
      : Number.POSITIVE_INFINITY;
    const isStale = !Number.isFinite(diffDays) || diffDays > staleCutoffDays;

    return ANTHROPOMETRIC_ASSESSMENTS.map((assessment) => {
      const status = getAnthropometricStatus(assessment.id, activeChild);
      const growthHistory = buildGrowthHistory(assessment.id, activeChild?.growthMetrics);

      const metrics: CardMetric[] =
        assessment.id === 'a1' || assessment.id === 'a1-4'
          ? [
              { label: 'Weight', value: formatMetricValue(activeChild?.weight, 'kg') },
              { label: 'Height', value: formatMetricValue(activeChild?.height, 'cm') },
            ]
          : assessment.id === 'a1-2'
            ? [{ label: 'Height', value: formatMetricValue(activeChild?.height, 'cm') }]
            : assessment.id === 'a1-5'
              ? [{ label: 'Weight', value: formatMetricValue(activeChild?.weight, 'kg') }]
            : [{ label: 'MUAC', value: formatMetricValue(activeChild?.muac, 'cm') }];

      return {
        ...assessment,
        metrics,
        isRecorded: status.isRecorded,
        isStale,
        hasResult: status.hasResult,
        lastUpdatedText: formatRelativeTime(childUpdatedAt),
        displayStatus: status.displayLabel,
        detailText: status.detail,
        interpretation: getInterpretationText(
          status.displayLabel,
          status.detail,
          status.hasResult
        ),
        suggestedAction: getSuggestedActionText(
          status.displayLabel,
          status.hasResult
        ),
        whoClassification: status.whoClassification,
        zScore: status.zScore,
        tone: status.tone,
        growthHistory: growthHistory.points,
        growthUnit: growthHistory.unit,
      };
    });
  }, [
    activeChild,
    activeChild?.growthMetrics,
    activeChild?.height,
    activeChild?.muac,
    activeChild?.updatedAt,
    activeChild?.weight,
  ]);

  const expiredAnthro = anthropometricCards.filter((item) => !item.isRecorded || item.isStale);
  const vaccineCards = useMemo<VaccineCard[]>(() => {
    if (!activeChild?.date_of_birth) return [];

    const birthDate = new Date(activeChild.date_of_birth);
    if (Number.isNaN(birthDate.getTime())) return [];

    const today = startOfDay(new Date());
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    return vaccineSchedule.map((vaccine) => {
      const dueDate = new Date(birthDate);
      dueDate.setDate(dueDate.getDate() + vaccine.dueAgeWeeks * 7);
      const normalizedDueDate = startOfDay(dueDate);
      const response = vaccineResponses[vaccine.id];
      const diffMs = normalizedDueDate.getTime() - today.getTime();
      const isOverdue = diffMs < 0;
      const isUpcomingReminder = diffMs >= 0 && diffMs <= oneWeekMs;
      const needsResponse = !response && isOverdue;

      return {
        ...vaccine,
        dueDate: normalizedDueDate,
        response,
        isVaccinated: response === 'yes',
        isOverdue,
        isUpcomingReminder,
        needsResponse,
        canCheck: !response && diffMs <= 0,
      };
    });
  }, [activeChild?.date_of_birth, vaccineResponses, vaccineSchedule]);
  const vaccineAlerts = useMemo(
    () => vaccineCards.filter((item) => item.needsResponse || item.isUpcomingReminder),
    [vaccineCards]
  );
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
      setSaveMeasurementError(typeof error === 'string' ? error : 'Failed to save measurement');
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
      assessment.id === id ? { ...assessment, answer: 'addressed' as DevAnswer } : assessment
    );

    setDevelopmentalAssessments(nextAssessments);
    void persistDevelopmentalAnswers(nextAssessments);
  };

  const toggleVaccination = (vaccineId: string, response: 'yes' | 'no') => {
    if (!activeChild?.id || typeof window === 'undefined') return;

    const nextResponses = {
      ...vaccineResponses,
      [vaccineId]: response,
    };
    setVaccineResponses(nextResponses);
    localStorage.setItem(`vaccine_responses_${activeChild.id}`, JSON.stringify(nextResponses));
  };

  return (
    <div className="pb-32 pt-4">
      <div className="mb-8 flex items-end justify-between px-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Assessments</h2>
          <p className="text-sm text-slate-500">Monitor milestones and growth.</p>
        </div>
      </div>

      <div className="space-y-12">
        <section>
          <div className="mb-4 flex items-center justify-between px-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
              Anthropometric
            </h3>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative rounded-xl border border-slate-100 bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-sky-500"
            >
              <BellIcon className="h-5 w-5" />
              {expiredAnthro.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[8px] font-black text-white">
                  {expiredAnthro.length}
                </span>
              )}
            </button>
          </div>

          <div className="hide-scrollbar flex gap-5 overflow-x-auto px-6 snap-x snap-mandatory">
            {anthropometricCards.map((item) => {
              const styles = STATUS_STYLES[item.tone];

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAssessmentId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedAssessmentId(item.id);
                    }
                  }}
                  className="relative w-[19rem] flex-shrink-0 snap-center rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.98]"
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setHelpAssessment(item.id);
                    }}
                    className="absolute right-4 top-4 rounded-full bg-slate-50 p-1.5 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-500"
                    aria-label={`Open help for ${item.title}`}
                  >
                    <InfoIcon size={16} />
                  </button>

                  <h4 className="max-w-[12rem] pr-6 text-[1.95rem] font-black leading-[1.02] tracking-tight text-slate-800">
                    {item.title}
                  </h4>

                  <div className="mt-8 flex items-center gap-5">
                    <StatusIcon tone={item.tone} />

                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-flex rounded-full border px-4 py-2 text-sm font-black uppercase tracking-wide ${styles.pill}`}
                      >
                        {item.displayStatus}
                      </span>
                      <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500">
                        {item.detailText}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {item.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {metric.label}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">{metric.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {item.lastUpdatedText}
                  </p>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenMeasurementEntry(item.id);
                    }}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-[1.45rem] bg-slate-100 py-4 text-sm font-black uppercase tracking-wide text-slate-600 transition-all hover:bg-slate-200 active:scale-[0.98]"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {item.isRecorded ? 'Update Data' : 'Add Data'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between px-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
              Vaccination Schedule
            </h3>
            <button
              type="button"
              onClick={() => setNotificationType('vaccine')}
              className="relative rounded-xl border border-slate-100 bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-emerald-500"
            >
              <BellIcon className="h-5 w-5" />
              {vaccineAlerts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[8px] font-black text-white">
                  {vaccineAlerts.length}
                </span>
              )}
            </button>
          </div>

          <div className="hide-scrollbar flex gap-4 overflow-x-auto px-6 snap-x">
            {vaccineCards.map((vaccine) => (
              <div
                key={vaccine.id}
                className={`flex min-h-[220px] w-64 flex-shrink-0 snap-center flex-col justify-between rounded-[2rem] border-2 p-6 transition-all ${
                  vaccine.response === 'yes'
                    ? 'border-emerald-100 bg-emerald-50'
                    : vaccine.needsResponse
                      ? 'border-rose-100 bg-rose-50'
                      : 'border-emerald-100 bg-[#effaf4]'
                }`}
              >
                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h4 className="font-bold leading-tight text-slate-800">{vaccine.name}</h4>
                    <span className="rounded-lg border border-slate-100 bg-white/90 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                      {vaccine.dueAgeWeeks === 0 ? 'Birth' : `${vaccine.dueAgeWeeks}W`}
                    </span>
                  </div>
                  <p className="mb-4 text-[10px] font-medium text-slate-500">{vaccine.description}</p>
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Due: <span className="text-slate-600">{formatDueDate(vaccine.dueDate)}</span>
                  </p>
                </div>

                {vaccine.canCheck ? (
                  <div className="flex flex-col gap-2">
                    <p className="mb-1 text-center text-[10px] font-black uppercase text-[#76A13B]">
                      Was this vaccine given?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleVaccination(vaccine.id, 'yes')}
                        className="flex-1 rounded-xl bg-emerald-600 py-3 text-[10px] font-black uppercase text-white shadow-md transition-all active:scale-[0.98]"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleVaccination(vaccine.id, 'no')}
                        className="flex-1 rounded-xl border border-rose-200 bg-white py-3 text-[10px] font-black uppercase text-rose-500 transition-all active:scale-[0.98]"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : vaccine.response ? (
                  <div className="rounded-2xl border border-white/70 bg-white/70 py-4 text-center">
                    <span
                      className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                        vaccine.response === 'yes' ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      Marked {vaccine.response}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-white/70 py-4 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                      {vaccine.isUpcomingReminder
                        ? 'Reminder active'
                        : `Locked until ${formatDueDate(vaccine.dueDate)}`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between px-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
              Developmental
            </h3>
            <button
              type="button"
              onClick={() => setNotificationType('developmental')}
              className="relative rounded-xl border border-slate-100 bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-sky-500"
            >
              <BellIcon className="h-5 w-5" />
              {unaddressedDev.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[8px] font-black text-white">
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
                <h4 className="mb-4 flex items-center gap-2 px-6 text-xs font-bold text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                  {DEVELOPMENTAL_SUBCATEGORY_LABELS[subCategory]}
                </h4>
                <div className="hide-scrollbar flex gap-4 overflow-x-auto px-6 snap-x">
                  {categoryQuestions.map((question) => (
                    <div
                      key={question.id}
                      onClick={() => {
                        if (question.answer === 'no') {
                          setRecommendationModal(question);
                        }
                      }}
                      className={`flex min-h-[180px] w-64 flex-shrink-0 snap-center flex-col justify-between rounded-[2rem] border-2 p-6 transition-all ${getAnswerColor(question.answer)}`}
                    >
                      <div>
                        <h5 className="mb-4 font-bold leading-tight">{question.title}</h5>
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
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleAnswer(question.id, 'yes');
                          }}
                          className={`flex-1 rounded-xl py-2 text-[10px] font-black uppercase transition-all ${
                            question.answer === 'yes'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'border border-slate-200 bg-white/50 text-slate-600'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleAnswer(question.id, 'no');
                          }}
                          className={`flex-1 rounded-xl py-2 text-[10px] font-black uppercase transition-all ${
                            question.answer === 'no'
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'border border-slate-200 bg-white/50 text-slate-600'
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
            <div className="mt-2 px-6">
              <p className="text-xs text-rose-600">{developmentalState.error}</p>
            </div>
          )}
          {developmentalState.saving && (
            <div className="mt-2 px-6">
              <p className="text-xs text-slate-500">Saving developmental answers...</p>
            </div>
          )}
        </section>
      </div>

      {recommendationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-3xl shadow-inner">
              <span role="img" aria-label="doctor">
                👨‍⚕️
              </span>
            </div>
            <h4 className="mb-3 text-xl font-black text-slate-800">Notice Something?</h4>
            <p className="mb-8 text-sm leading-relaxed text-slate-600">
              If you are unsure or ticked <strong>"No"</strong> for "{recommendationModal.title}",
              we recommend consulting with your pediatrician for a professional evaluation.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setRecommendationModal(null)}
                className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white"
              >
                I Understand
              </button>
              <button
                type="button"
                onClick={() => {
                  markAsAddressed(recommendationModal.id);
                  setRecommendationModal(null);
                }}
                className="w-full py-3 font-bold text-sky-500"
              >
                Already talked to doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {notificationType && (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-900/60 backdrop-blur-md">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-[3rem] bg-white p-8 animate-in slide-in-from-bottom duration-300">
            <div className="mx-auto mb-10 h-1.5 w-12 rounded-full bg-slate-100" />
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800">
                {notificationType === 'anthropometric'
                  ? 'Expired Measurements'
                  : notificationType === 'vaccine'
                    ? 'Vaccination Alerts'
                  : 'Unaddressed Concerns'}
              </h3>
              <button
                type="button"
                onClick={() => setNotificationType(null)}
                className="rounded-full bg-slate-100 p-2"
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
                      className="flex items-center justify-between rounded-3xl border border-amber-100 bg-amber-50 p-5"
                    >
                      <div>
                        <h5 className="font-bold text-slate-800">{assessment.title}</h5>
                        <p className="text-[10px] font-black uppercase text-amber-600">
                          {assessment.lastUpdatedText}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenMeasurementEntry(assessment.id);
                          setNotificationType(null);
                        }}
                        className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-[10px] font-black text-amber-600"
                      >
                        Update
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center font-bold text-slate-400">
                    All measurements are up to date!
                  </p>
                )
              ) : notificationType === 'vaccine' ? (
                vaccineAlerts.length > 0 ? (
                  vaccineAlerts.map((vaccine) => (
                    <div
                      key={vaccine.id}
                      className={`flex items-center justify-between rounded-3xl border p-5 ${
                        vaccine.needsResponse
                          ? 'border-rose-100 bg-rose-50'
                          : 'border-emerald-100 bg-emerald-50'
                      }`}
                    >
                      <div className="pr-4">
                        <h5 className="font-bold text-slate-800">{vaccine.name}</h5>
                        <p
                          className={`text-[10px] font-black uppercase ${
                            vaccine.needsResponse ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {vaccine.needsResponse
                            ? `Overdue • ${formatDueDate(vaccine.dueDate)}`
                            : `Due within 7 days • ${formatDueDate(vaccine.dueDate)}`}
                        </p>
                      </div>
                      {vaccine.canCheck ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleVaccination(vaccine.id, 'yes')}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase text-white"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleVaccination(vaccine.id, 'no')}
                            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-rose-500"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNotificationType(null)}
                          className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-[10px] font-black text-emerald-600"
                        >
                          View
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center font-bold text-slate-400">
                    No vaccine alerts right now.
                  </p>
                )
              ) : unaddressedDev.length > 0 ? (
                unaddressedDev.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="space-y-4 rounded-3xl border border-rose-100 bg-rose-50 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-slate-800">{assessment.title}</h5>
                        <p className="text-[10px] font-black uppercase text-rose-600">
                          {assessment.subCategory}
                        </p>
                      </div>
                      <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[8px] font-black uppercase text-rose-500">
                        Action Needed
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => markAsAddressed(assessment.id)}
                        className="flex-1 rounded-xl border border-sky-100 bg-white py-2 text-[10px] font-black text-sky-500 shadow-sm"
                      >
                        Addressed with Doctor
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-10 text-center font-bold text-slate-400">
                  No unaddressed concerns. Great job!
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setNotificationType(null)}
              className="mt-8 w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400"
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
            <ol className="mb-6 space-y-3">
              {MEASUREMENT_GUIDES[helpAssessment].items.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-600">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-relaxed text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm italic text-sky-700">
                <span className="font-bold not-italic">Tip: </span>
                {MEASUREMENT_GUIDES[helpAssessment].tip}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHelpAssessment(null)}
              className="mb-2 mt-6 w-full py-4 font-bold text-slate-400 transition-colors hover:text-slate-600"
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
                  <div className="mb-2 flex items-center justify-between">
                    <label className="ml-1 text-sm font-bold text-slate-600">{field.label}</label>
                    <button
                      type="button"
                      onClick={() => setActiveHelp(activeHelp === field.key ? null : field.key)}
                      className="p-1 text-slate-400 transition-colors hover:text-sky-500"
                    >
                      <InfoIcon size={16} />
                    </button>
                  </div>
                  {activeHelp === field.key && (
                    <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50 p-3">
                      <p className="text-xs text-sky-700">{field.help}</p>
                    </div>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-medium text-slate-800 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-medium text-rose-600">{saveMeasurementError}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddingData(null);
                  setMeasurementValues({});
                  setSaveMeasurementError(null);
                }}
                disabled={isSavingMeasurement}
                className="rounded-2xl border-2 border-slate-200 px-6 py-4 font-bold text-slate-600 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMeasurement}
                disabled={isSavingMeasurement}
                className="flex-1 rounded-2xl bg-sky-500 py-4 font-bold text-white shadow-lg shadow-sky-200 transition-all active:scale-95 disabled:opacity-50"
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
            <h2 className="mb-2 text-2xl font-bold text-slate-800">{selectedAssessment.title}</h2>
            <p className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {selectedAssessment.category}
            </p>

            <div className="mb-6 w-full rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4 text-left">
                <StatusIcon tone={selectedAssessment.tone} size="sm" />
                <div>
                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-black uppercase tracking-wide ${
                      STATUS_STYLES[selectedAssessment.tone].pill
                    }`}
                  >
                    {selectedAssessment.displayStatus}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {selectedAssessment.detailText}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8 w-full space-y-4 text-left">
              <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Interpretation
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  {selectedAssessment.interpretation}
                </p>
              </div>

              <div className="rounded-[2rem] border border-sky-100 bg-sky-50 p-5">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-500">
                  Last Updated
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {selectedAssessment.lastUpdatedText}
                </p>
                {selectedAssessment.isStale && (
                  <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-600">
                    <p className="text-xs font-black uppercase tracking-[0.12em]">
                      Warning
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed">
                      ⚠️ Measurements taken before a month. Please update for accuracy.
                    </p>
                  </div>
                )}
              </div>

              {selectedAssessment.suggestedAction && (
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-lime-600">
                    Suggested Action
                  </p>
                  <p className="text-sm font-semibold italic text-slate-700">
                    {selectedAssessment.suggestedAction}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    WHO Classification
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedAssessment.whoClassification || 'Waiting for measurements'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Z-Score
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedAssessment.zScore !== null
                      ? selectedAssessment.zScore.toFixed(2)
                      : '--'}
                  </p>
                </div>
              </div>

              {selectedAssessment.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <span className="text-xs font-black uppercase text-slate-400">{metric.label}</span>
                  <span className="text-sm font-bold text-slate-800">{metric.value}</span>
                </div>
              ))}

              <GrowthProgressChart
                points={selectedAssessment.growthHistory}
                unit={selectedAssessment.growthUnit}
              />

            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedAssessmentId(null);
                handleOpenMeasurementEntry(selectedAssessment.id);
              }}
              className="w-full rounded-3xl bg-sky-500 py-5 font-black text-white shadow-2xl shadow-sky-100 transition-transform active:scale-95"
            >
              {selectedAssessment.isRecorded ? 'Update Measurements' : 'Add Measurements'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedAssessmentId(null)}
              className="mb-4 mt-6 w-full py-4 font-bold text-slate-400 transition-colors hover:text-slate-600"
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
