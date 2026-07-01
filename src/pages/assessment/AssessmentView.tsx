import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import api from '@/api/axios';
import {
  getAssessmentInterpretationColumns,
  getAssessmentInterpretationTable,
} from '@/data/assessmentInterpretation';
import { BottomSheet } from '@/components/ui';
import {
  DEVELOPMENTAL_SUBCATEGORY_LABELS,
  DEVELOPMENTAL_SUBCATEGORY_ORDER,
  getAgeInMonthsFromDob,
} from '@/data/developmentalMilestones';
import AnthropometricAssessmentSection, {
  STATUS_STYLES,
  StatusIcon,
  toOutdatedText,
} from '@/components/assessment/AnthropometricAssessmentSection';
import { BellIcon, InfoIcon, PlusIcon } from '@/design-system/icons';
import type { DetailedAssessment, DevAnswer } from '@/design-system/types';
import { useDevelopmentalAssessments } from '@/hooks/useDevelopmentalAssessments';
import { fetchChildrenByParentId, updateChild } from '@/redux/slices/childSlice';
import type { AppDispatch, RootState } from '@/redux/store';
import {
  type AnthropometricAssessmentId,
} from '@/utils/anthropometric';
import {
  ANTHROPOMETRIC_ASSESSMENTS,
  buildAnthropometricCards,
  type AnthropometricCard,
} from '@/utils/anthropometricCards';
import i18n from '@/i18n/i18n';

interface MeasurementField {
  label: string;
  key: string;
  help: string;
}

interface GrowthHistoryPoint {
  label: string;
  value: number;
}

interface VaccineScheduleItem {
  id: string;
  name: string;
  description: string;
  daysFromBirth: number;
  dueDate: string;
  status: 'PENDING' | 'GIVEN' | 'MISSED';
  isGiven: boolean;
  isMissed: boolean;
  isUpcomingReminder: boolean;
  canCheck: boolean;
  isLocked: boolean;
}

interface VaccineCard extends Omit<VaccineScheduleItem, 'dueDate'> {
  dueDate: Date;
}

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

const formatHistoryValue = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

const formatDueDate = (date: Date) =>
  date.toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatVaccineDueAge = (daysFromBirth: number) => {
  if (daysFromBirth <= 0) return i18n.t('Birth');
  if (daysFromBirth % 365 === 0) return i18n.t('{{count}}Y', { count: daysFromBirth / 365 });
  if (daysFromBirth % 30 === 0) return i18n.t('{{count}}M', { count: daysFromBirth / 30 });
  if (daysFromBirth % 7 === 0) return i18n.t('{{count}}W', { count: daysFromBirth / 7 });
  return i18n.t('{{count}}D', { count: daysFromBirth });
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

const GrowthProgressChart: React.FC<{
  points: GrowthHistoryPoint[];
  unit: string;
}> = ({ points, unit }) => {
  if (points.length === 0) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          {i18n.t('Growth Progress')}
        </p>
        <p className="text-sm text-slate-500">
          {i18n.t('No growth history yet. Save measurements over time to see progress.')}
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
        {i18n.t('Growth Progress')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full"
        aria-label={i18n.t('Growth progress chart')}
      >
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
  const { t } = useTranslation();
  const [selectedAssessmentId, setSelectedAssessmentId] =
    useState<AnthropometricAssessmentId | null>(null);
  // 'anthropometric' | 'vaccine' | 'dev-Social' | 'dev-Language' | 'dev-Cognitive' | 'dev-Physical'
  const [notificationType, setNotificationType] = useState<string | null>(null);
  const [recommendationModal, setRecommendationModal] = useState<DetailedAssessment | null>(null);
  const [helpAssessment, setHelpAssessment] = useState<string | null>(null);
  const [isAddingData, setIsAddingData] = useState<string | null>(null);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [vaccineSchedule, setVaccineSchedule] = useState<VaccineScheduleItem[]>([]);
  const [isLoadingVaccineSchedule, setIsLoadingVaccineSchedule] = useState(true);
  const [vaccineScheduleError, setVaccineScheduleError] = useState<string | null>(null);
  const [vaccineScheduleRequestKey, setVaccineScheduleRequestKey] = useState(0);
  const [updatingVaccineId, setUpdatingVaccineId] = useState<string | null>(null);
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  const [saveMeasurementError, setSaveMeasurementError] = useState<string | null>(null);
  const anthropoSectionRef = useRef<HTMLElement | null>(null);
  const vaccineSectionRef = useRef<HTMLElement | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const childrenState = useSelector((state: RootState) => state.children);

  const favoriteChildId =
    typeof window !== 'undefined' ? localStorage.getItem('favorite_child_id') : null;
  const activeChild =
    childrenState.data.find((child) => child.id === favoriteChildId) || childrenState.data[0];

  const childAgeInMonths = useMemo(
    () => getAgeInMonthsFromDob(activeChild?.date_of_birth),
    [activeChild?.date_of_birth]
  );
  const {
    developmentalAssessments,
    developmentalState,
    markAsAddressed,
    toggleAnswer,
  } = useDevelopmentalAssessments({
    ageInMonths: childAgeInMonths,
    childId: activeChild?.id,
    onNoAnswer: (assessment) => setRecommendationModal(assessment),
  });

  useEffect(() => {
    if (childrenState.data.length > 0) return;

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser?.id) {
        dispatch(fetchChildrenByParentId(String(parsedUser.id)));
      }
    } catch {
      // Ignore malformed local storage and leave the page in its current state.
    }
  }, [childrenState.data.length, dispatch]);

  useEffect(() => {
    let isMounted = true;

    const fetchVaccineSchedule = async () => {
      if (!activeChild?.id) {
        if (isMounted) {
          if (childrenState.loading || childrenState.data.length === 0) {
            setIsLoadingVaccineSchedule(true);
          } else {
            setVaccineSchedule([]);
            setVaccineScheduleError(null);
            setIsLoadingVaccineSchedule(false);
          }
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoadingVaccineSchedule(true);
          setVaccineScheduleError(null);
        }
        const response = await api.get<{ data: VaccineScheduleItem[] }>(
          `/immunity/children/${activeChild.id}/schedule`
        );
        if (isMounted) {
          setVaccineSchedule(Array.isArray(response.data?.data) ? response.data.data : []);
        }
      } catch (error: any) {
        if (isMounted) {
          setVaccineScheduleError(
            error?.response?.data?.message || t('Unable to load the vaccination schedule.')
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingVaccineSchedule(false);
        }
      }
    };

    void fetchVaccineSchedule();

    return () => {
      isMounted = false;
    };
  }, [activeChild?.id, childrenState.data.length, childrenState.loading, vaccineScheduleRequestKey]);

  useEffect(() => {
    const nextMeasurementId = (
      location.state as {
        openMeasurementId?: string;
        focusSection?: 'vaccine' | 'anthropometric';
      } | null
    )?.openMeasurementId;
    const focusSection = (
      location.state as {
        openMeasurementId?: string;
        focusSection?: 'vaccine' | 'anthropometric';
      } | null
    )?.focusSection;

    if (nextMeasurementId && MEASUREMENT_FIELDS[nextMeasurementId] && !isAddingData) {
      handleOpenMeasurementEntry(nextMeasurementId);
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (focusSection === 'vaccine') {
      vaccineSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navigate(location.pathname, { replace: true, state: null });
    } else if (focusSection === 'anthropometric') {
      anthropoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [isAddingData, location.pathname, location.state, navigate]);

  const anthropometricCards = useMemo<AnthropometricCard[]>(() => {
    return buildAnthropometricCards(activeChild);
  }, [activeChild]);

  const expiredAnthro = anthropometricCards.filter((item) => !item.isRecorded || item.isStale);
  const vaccineCards = useMemo<VaccineCard[]>(() => {
    return vaccineSchedule
      .map((vaccine) => {
        return {
          ...vaccine,
          dueDate: startOfDay(new Date(vaccine.dueDate)),
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [vaccineSchedule]);
  const vaccineAlerts = useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return vaccineCards.filter((item) => {
      if (item.isGiven) return false;
      // User explicitly said No → always remind regardless of how old the date is
      if (item.isMissed) return true;
      // Pending → only remind if due date falls between today and 7 days from now
      return item.dueDate >= today && item.dueDate <= sevenDaysFromNow;
    });
  }, [vaccineCards]);
  // Per-subcategory grouping of unaddressed developmental items
  const devUnaddressedByCategory = useMemo(
    () =>
      DEVELOPMENTAL_SUBCATEGORY_ORDER.reduce<Record<string, DetailedAssessment[]>>((acc, sub) => {
        acc[sub] = developmentalAssessments.filter(
          (item) => item.subCategory === sub && item.answer === 'no'
        );
        return acc;
      }, {}),
    [developmentalAssessments]
  );
  const selectedAssessment =
    selectedAssessmentId &&
    anthropometricCards.find((assessment) => assessment.id === selectedAssessmentId);
  const interpretationColumns = getAssessmentInterpretationColumns();
  const interpretationTable = selectedAssessment
    ? getAssessmentInterpretationTable(selectedAssessment.id)
    : null;

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
      setSaveMeasurementError(t('Enter at least one valid measurement value.'));
      return;
    }

    setIsSavingMeasurement(true);
    setSaveMeasurementError(null);

    try {
      await dispatch(updateChild({ id: activeChild.id, ...updateData })).unwrap();
      setIsAddingData(null);
      setMeasurementValues({});
    } catch (error: any) {
      setSaveMeasurementError(typeof error === 'string' ? error : t('Failed to save measurement'));
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const toggleVaccination = async (vaccineId: string, response: 'yes' | 'no') => {
    if (!activeChild?.id) return;

    try {
      setUpdatingVaccineId(vaccineId);
      await api.patch(`/immunity/children/${activeChild.id}/schedule/${vaccineId}`, {
        status: response === 'yes' ? 'GIVEN' : 'MISSED',
      });
      setVaccineScheduleRequestKey((current) => current + 1);
    } catch (error: any) {
      setVaccineScheduleError(
        error?.response?.data?.message || t('Unable to update the vaccine status.')
      );
    } finally {
      setUpdatingVaccineId(null);
    }
  };

  const retryVaccineScheduleFetch = () => {
    setVaccineScheduleRequestKey((current) => current + 1);
  };

  return (
    <div className="pb-32 pt-4">
        <div className="mb-8 flex items-end justify-between px-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('Assessments')}</h2>
          <p className="text-sm text-slate-500">{t('Monitor milestones and growth.')}</p>
        </div>
      </div>

      <div className="space-y-12">
        <section ref={anthropoSectionRef}>
          <AnthropometricAssessmentSection
            cards={anthropometricCards}
            title={t('Anthropometric')}
            alertCount={expiredAnthro.length}
            onAlertClick={() => setNotificationType('anthropometric')}
            onCardClick={(item) => setSelectedAssessmentId(item.id)}
            onHelpClick={(item) => setHelpAssessment(item.id)}
            onAddDataClick={(item) => handleOpenMeasurementEntry(item.id)}
          />
        </section>

        <section ref={vaccineSectionRef}>
          <div className="mb-6 flex items-center justify-between px-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
              {t('Vaccination Schedule')}
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

          {isLoadingVaccineSchedule ? (
            <div className="px-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-center">
                <p className="font-bold text-slate-700">{t('Loading vaccination schedule...')}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("We're checking the latest vaccine timeline for this child.")}
                </p>
              </div>
            </div>
          ) : vaccineScheduleError ? (
            <div className="px-6">
              <div className="rounded-[2rem] border border-rose-100 bg-rose-50 px-6 py-8 text-center">
                <p className="font-bold text-rose-700">{t("Couldn't load the vaccine schedule.")}</p>
                <p className="mt-2 text-sm text-rose-600">{vaccineScheduleError}</p>
                <button
                  type="button"
                  onClick={retryVaccineScheduleFetch}
                  className="mt-5 rounded-xl bg-rose-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-md transition-all active:scale-[0.98]"
                >
                  {t('Retry')}
                </button>
              </div>
            </div>
          ) : vaccineCards.length > 0 ? (
            <div className="hide-scrollbar flex gap-4 overflow-x-auto px-6 snap-x">
              {vaccineCards.map((vaccine) => (
                <div
                  key={vaccine.id}
                  className={`flex min-h-[220px] w-64 flex-shrink-0 snap-center flex-col justify-between rounded-[2rem] border-2 p-6 transition-all ${
                    vaccine.isMissed
                      ? 'border-rose-100 bg-rose-50'
                      : vaccine.isGiven
                        ? 'border-emerald-100 bg-[#effaf4]'
                      : vaccine.isUpcomingReminder
                        ? 'border-amber-200 bg-amber-50'
                        : vaccine.canCheck
                          ? 'border-sky-100 bg-sky-50'
                          : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <h4 className="font-bold leading-tight text-slate-800">{vaccine.name}</h4>
                      <span className="rounded-lg border border-slate-100 bg-white/90 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                        {formatVaccineDueAge(vaccine.daysFromBirth)}
                      </span>
                    </div>
                    <p className="mb-4 text-[10px] font-medium text-slate-500">
                      {t('Protects against:')} {vaccine.description}
                    </p>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      {t('Due:')} <span className="text-slate-600">{formatDueDate(vaccine.dueDate)}</span>
                    </p>
                  </div>

                  {vaccine.canCheck || vaccine.isMissed || vaccine.isGiven ? (
                    <div className="flex flex-col gap-2">
                      <p className="mb-1 text-center text-[10px] font-black uppercase text-[#76A13B]">
                        {t('Was this vaccine given?')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleVaccination(vaccine.id, 'yes')}
                          disabled={updatingVaccineId === vaccine.id}
                          className={`flex-1 rounded-xl py-3 text-[10px] font-black uppercase transition-all active:scale-[0.98] ${
                            vaccine.isGiven
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'border border-emerald-200 bg-white text-emerald-600'
                          }`}
                        >
                          {updatingVaccineId === vaccine.id ? t('Saving...') : t('Yes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleVaccination(vaccine.id, 'no')}
                          disabled={updatingVaccineId === vaccine.id}
                          className={`flex-1 rounded-xl py-3 text-[10px] font-black uppercase transition-all active:scale-[0.98] ${
                            vaccine.isMissed
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'border border-rose-200 bg-white text-rose-500'
                          }`}
                        >
                          {t('No')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-white/70 py-4 text-center">
                      <span
                        className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                          vaccine.isUpcomingReminder ? 'text-amber-600' : 'text-slate-300'
                        }`}
                      >
                        {vaccine.isUpcomingReminder
                          ? t('Reminder active')
                          : t('Locked until {{date}}', { date: formatDueDate(vaccine.dueDate) })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6">
              <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 px-6 py-8 text-center">
                <p className="font-bold text-emerald-700">{t('No vaccines are scheduled right now.')}</p>
                <p className="mt-2 text-sm text-emerald-600">
                  {t('There are no vaccine schedule entries to show for this child at the moment.')}
                </p>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 px-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
              {t('Developmental')}
            </h3>
          </div>

          {DEVELOPMENTAL_SUBCATEGORY_ORDER.map((subCategory) => {
            const categoryQuestions = developmentalAssessments.filter(
              (item) => item.subCategory === subCategory
            );

            if (categoryQuestions.length === 0) {
              return null;
            }

            const subAlerts = devUnaddressedByCategory[subCategory] ?? [];

            return (
              <div key={subCategory} className="mb-10">
                <div className="mb-4 flex items-center justify-between px-6">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                    <span className="break-words">{t(DEVELOPMENTAL_SUBCATEGORY_LABELS[subCategory])}</span>
                  </h4>
                  {subAlerts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNotificationType(`dev-${subCategory}`)}
                      className="relative rounded-xl border border-slate-100 bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-sky-500"
                    >
                      <BellIcon className="h-5 w-5" />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[8px] font-black text-white">
                        {subAlerts.length}
                      </span>
                    </button>
                  )}
                </div>
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
                        <h5 className="mb-4 break-words font-bold leading-snug">{question.title}</h5>
                        <p className="text-[10px] font-black uppercase opacity-60">
                          {t('Status:')}{' '}
                          {question.answer === 'addressed'
                            ? t('Addressed with Doctor')
                            : question.answer === 'unanswered'
                              ? t('Not Assessed')
                              : t(question.answer || 'No')}
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
                          {t('Yes')}
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
                          {t('No')}
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
              <p className="text-xs text-slate-500">{t('Saving developmental answers...')}</p>
            </div>
          )}
        </section>
      </div>

      {recommendationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-3xl shadow-inner">
              <span role="img" aria-label={t('Doctor')}>
                👨‍⚕️
              </span>
            </div>
            <h4 className="mb-3 text-xl font-black text-slate-800">{t('Notice Something?')}</h4>
            <p className="mb-8 text-sm leading-relaxed text-slate-600">
              {t(
                'If you are unsure or ticked "No" for "{{title}}", we recommend consulting with your pediatrician for a professional evaluation.',
                { title: recommendationModal.title }
              )}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setRecommendationModal(null);
                  navigate('/consultation', { state: { activeTab: 'Doctor' } });
                }}
                className="w-full rounded-2xl bg-[#76A13B] py-4 font-black text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-[#678d33]"
              >
                {t('Talk to a Doctor')}
              </button>
              <button
                type="button"
                onClick={() => setRecommendationModal(null)}
                className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white"
              >
                {t('I Understand')}
              </button>
              <button
                type="button"
                onClick={() => {
                  markAsAddressed(recommendationModal.id);
                  setRecommendationModal(null);
                }}
                className="w-full py-3 font-bold text-sky-500"
              >
                {t('Already talked to doctor')}
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
                  ? t('Outdated Measurements')
                  : notificationType === 'vaccine'
                    ? t('Vaccination Alerts')
                    : notificationType?.startsWith('dev-')
                      ? t('{{category}} Concerns', {
                          category: t(notificationType.replace('dev-', '')),
                        })
                      : t('Concerns')}
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
                      <div className="pr-4">
                        <h5 className="font-bold text-slate-800">{assessment.title}</h5>
                        <p className="text-[10px] font-black uppercase text-amber-600">
                          {toOutdatedText(assessment.lastUpdatedText, assessment.isRecorded, t)}
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
                        {t('Update')}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center font-bold text-slate-400">
                    {t('All measurements are up to date!')}
                  </p>
                )
              ) : notificationType === 'vaccine' ? (
                vaccineAlerts.length > 0 ? (
                  vaccineAlerts.map((vaccine) => (
                    <div
                      key={vaccine.id}
                      className={`flex items-center justify-between rounded-3xl border p-5 ${
                        vaccine.isMissed
                          ? 'border-rose-100 bg-rose-50'
                          : vaccine.canCheck
                            ? 'border-sky-100 bg-sky-50'
                            : 'border-amber-100 bg-[#fff8ea]'
                      }`}
                    >
                      <div className="pr-4">
                        <h5 className="font-bold text-slate-800">{vaccine.name}</h5>
                        <p
                          className={`text-[10px] font-black uppercase ${
                            vaccine.isMissed
                              ? 'text-rose-600'
                              : vaccine.canCheck
                                ? 'text-sky-600'
                                : 'text-amber-600'
                          }`}
                        >
                          {vaccine.isMissed
                            ? t('Marked No • {{date}}', { date: formatDueDate(vaccine.dueDate) })
                            : vaccine.canCheck
                              ? t('Due today • {{date}}', { date: formatDueDate(vaccine.dueDate) })
                              : t('Due within 7 days • {{date}}', { date: formatDueDate(vaccine.dueDate) })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationType(null);
                          setTimeout(() => {
                            vaccineSectionRef.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                          }, 100);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black text-slate-800 shadow-sm"
                      >
                        {t('View')}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center font-bold text-slate-400">
                    {t('No vaccine alerts right now.')}
                  </p>
                )
              ) : notificationType?.startsWith('dev-') ? (
                (() => {
                  const subCategory = notificationType.replace('dev-', '');
                  const items = devUnaddressedByCategory[subCategory] ?? [];
                  return items.length > 0 ? (
                    items.map((assessment) => (
                      <div
                        key={assessment.id}
                        className="space-y-4 rounded-3xl border border-rose-100 bg-rose-50 p-5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-bold text-slate-800">{assessment.title}</h5>
                            <p className="text-[10px] font-black uppercase text-rose-600">
                              {t(assessment.subCategory || 'Developmental')}
                            </p>
                          </div>
                          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[8px] font-black uppercase text-rose-500">
                            {t('Action Needed')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => markAsAddressed(assessment.id)}
                            className="flex-1 rounded-xl border border-sky-100 bg-white py-2 text-[10px] font-black text-sky-500 shadow-sm"
                          >
                            {t('Addressed with Doctor')}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-10 text-center font-bold text-slate-400">
                      {t('No unaddressed concerns here. Great job!')}
                    </p>
                  );
                })()
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setNotificationType(null)}
              className="mt-8 w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400"
            >
              {t('Close Notifications')}
            </button>
          </div>
        </div>
      )}

      <BottomSheet
        isOpen={!!helpAssessment}
        onClose={() => setHelpAssessment(null)}
        title={helpAssessment ? t(MEASUREMENT_GUIDES[helpAssessment]?.title || '') : undefined}
      >
        {helpAssessment && MEASUREMENT_GUIDES[helpAssessment] && (
          <div className="px-2">
            <ol className="mb-6 space-y-3">
              {MEASUREMENT_GUIDES[helpAssessment].items.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-600">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-relaxed text-slate-700">{t(step)}</span>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm italic text-sky-700">
                <span className="font-bold not-italic">{t('Tip:')} </span>
                {t(MEASUREMENT_GUIDES[helpAssessment].tip)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHelpAssessment(null)}
              className="mb-2 mt-6 w-full py-4 font-bold text-slate-400 transition-colors hover:text-slate-600"
            >
              {t('Close')}
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
                  ?.title || t('Measurement')
              } ${t('Entry')}`
            : undefined
        }
      >
        {isAddingData && MEASUREMENT_FIELDS[isAddingData] && (
          <div className="px-2 pb-6">
            <div className="space-y-5">
              {MEASUREMENT_FIELDS[isAddingData].map((field) => (
                <div key={field.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="ml-1 text-sm font-bold text-slate-600">{t(field.label)}</label>
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
                      <p className="text-xs text-sky-700">{t(field.help)}</p>
                    </div>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={t('Enter {{field}}', { field: t(field.label).toLowerCase() })}
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
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveMeasurement}
                disabled={isSavingMeasurement}
                className="flex-1 rounded-2xl bg-sky-500 py-4 font-bold text-white shadow-lg shadow-sky-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingMeasurement ? t('Saving...') : t('Save Measurement')}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet isOpen={!!selectedAssessment} onClose={() => setSelectedAssessmentId(null)}>
        {selectedAssessment && (
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-800">{t(selectedAssessment.title)}</h2>
            <p className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {t(selectedAssessment.category)}
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
                  {t('Interpretation')}
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  {selectedAssessment.interpretation}
                </p>
              </div>

              <div className="rounded-[2rem] border border-sky-100 bg-sky-50 p-5">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-500">
                  {t('Last Updated')}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {selectedAssessment.lastUpdatedText}
                </p>
                {selectedAssessment.isStale && (
                  <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-600">
                    <p className="text-xs font-black uppercase tracking-[0.12em]">
                      {t('Warning')}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed">
                      {t('Measurements taken before a month. Please update for accuracy.')}
                    </p>
                  </div>
                )}
              </div>

              {selectedAssessment.suggestedAction && (
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-lime-600">
                    {t('Suggested Action')}
                  </p>
                  <p className="text-sm font-semibold italic text-slate-700">
                    {selectedAssessment.suggestedAction}
                  </p>
                </div>
              )}

              {interpretationTable && (
                <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {interpretationTable.title}
                  </p>
                  <p className="mb-4 text-sm leading-relaxed text-slate-600">
                    {interpretationTable.description}
                  </p>
                  <div className="-mx-1 overflow-x-auto">
                    <table className="min-w-[52rem] table-fixed text-left text-xs leading-relaxed text-slate-700">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="w-[16%] px-3 py-2 font-black">{interpretationColumns.indicator}</th>
                          <th className="w-[12%] px-3 py-2 font-black">{interpretationColumns.zScoreRange}</th>
                          <th className="w-[20%] px-3 py-2 font-black">{interpretationColumns.classification}</th>
                          <th className="w-[22%] px-3 py-2 font-black">{interpretationColumns.meaning}</th>
                          <th className="w-[30%] px-3 py-2 font-black">{interpretationColumns.recommendedAction}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interpretationTable.rows.map((row, index) => (
                          <tr key={`${selectedAssessment.id}-${index}`} className="border-b border-slate-100 align-top">
                            <td className="px-3 py-3 font-semibold text-slate-800 break-words">{row.indicator}</td>
                            <td className="px-3 py-3 font-semibold whitespace-normal break-words">{row.zScoreRange}</td>
                            <td className="px-3 py-3 whitespace-normal break-words">{row.classification}</td>
                            <td className="px-3 py-3 whitespace-normal break-words">{row.meaning}</td>
                            <td className="px-3 py-3 whitespace-normal break-words">{row.recommendedAction}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {t('WHO Classification')}
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {(selectedAssessment.whoClassification
                      ? t(selectedAssessment.whoClassification)
                      : null) || t('Waiting for measurements')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {t('Z-Score')}
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
                  <span className="text-xs font-black uppercase text-slate-400">{t(metric.label)}</span>
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
              {selectedAssessment.isRecorded ? t('Update Measurements') : t('Add Measurements')}
            </button>

            <button
              type="button"
              onClick={() => setSelectedAssessmentId(null)}
              className="mb-4 mt-6 w-full py-4 font-bold text-slate-400 transition-colors hover:text-slate-600"
            >
              {t('Close Assessment')}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default AssessmentView;
