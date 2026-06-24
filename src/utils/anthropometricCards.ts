import type { Child } from '@/types/child';
import i18n from '@/i18n/i18n';
import {
  getAnthropometricStatus,
  type AnthropometricAssessmentId,
  type AnthropometricTone,
} from '@/utils/anthropometric';

interface CardMetric {
  label: string;
  value: string;
}

interface GrowthHistoryPoint {
  label: string;
  value: number;
}

export interface AnthropometricCard {
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

export const ANTHROPOMETRIC_ASSESSMENTS: Array<{
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
  if (!isoDate) return i18n.t('Never updated');

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return i18n.t('Unknown');

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return i18n.t('Updated today');
  if (diffDays === 1) return i18n.t('Updated 1 day ago');
  if (diffDays < 7) return i18n.t('Updated {{count}} days ago', { count: diffDays });

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return i18n.t(
      diffWeeks > 1 ? 'Updated {{count}} weeks ago' : 'Updated {{count}} week ago',
      { count: diffWeeks }
    );
  }

  const diffMonths = Math.floor(diffDays / 30);
  return i18n.t(
    diffMonths > 1 ? 'Updated {{count}} months ago' : 'Updated {{count}} month ago',
    { count: diffMonths }
  );
};

const formatMetricValue = (value?: number | null, unit?: string) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return '--';
  return unit ? `${value} ${unit}` : `${value}`;
};

const formatHistoryMonth = (isoDate?: string) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(i18n.language === 'am' ? 'am-ET' : 'en-US', { month: 'short' });
};

const getGrowthHistoryMeta = (assessmentId: AnthropometricAssessmentId) => {
  switch (assessmentId) {
    case 'a1':
      return { unit: 'kg', getValue: (item: NonNullable<Child['growthMetrics']>[number]) => item.weight };
    case 'a1-2':
      return { unit: 'cm', getValue: (item: NonNullable<Child['growthMetrics']>[number]) => item.height };
    case 'a1-3':
      return { unit: 'cm', getValue: (item: NonNullable<Child['growthMetrics']>[number]) => item.muac };
    case 'a1-4':
      return { unit: 'BMI', getValue: (item: NonNullable<Child['growthMetrics']>[number]) => item.bmi };
    case 'a1-5':
    default:
      return { unit: 'kg', getValue: (item: NonNullable<Child['growthMetrics']>[number]) => item.weight };
  }
};

const buildGrowthHistory = (
  assessmentId: AnthropometricAssessmentId,
  growthMetrics?: Child['growthMetrics']
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

const getInterpretationText = (detailText: string, hasResult: boolean) => {
  if (!hasResult) {
    return i18n.t('No interpretation yet. Add measurements to calculate this assessment.');
  }
  return detailText;
};

export const hasAnthropometricData = (cards: AnthropometricCard[]) =>
  cards.some((card) => card.isRecorded || card.growthHistory.length > 0);

export const buildAnthropometricCards = (child?: Child | null): AnthropometricCard[] => {
  const childUpdatedAt = child?.updatedAt;
  const staleCutoffDays = 30;
  const diffDays = childUpdatedAt
    ? Math.floor((Date.now() - new Date(childUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : Number.POSITIVE_INFINITY;
  const isStale = !Number.isFinite(diffDays) || diffDays > staleCutoffDays;

  return ANTHROPOMETRIC_ASSESSMENTS.map((assessment) => {
    const status = getAnthropometricStatus(assessment.id, child);
    const growthHistory = buildGrowthHistory(assessment.id, child?.growthMetrics);

    const metrics: CardMetric[] =
      assessment.id === 'a1' || assessment.id === 'a1-4'
        ? [
            { label: 'Weight', value: formatMetricValue(child?.weight, 'kg') },
            { label: 'Height', value: formatMetricValue(child?.height, 'cm') },
          ]
        : assessment.id === 'a1-2'
          ? [{ label: 'Height', value: formatMetricValue(child?.height, 'cm') }]
          : assessment.id === 'a1-5'
            ? [{ label: 'Weight', value: formatMetricValue(child?.weight, 'kg') }]
            : [{ label: 'MUAC', value: formatMetricValue(child?.muac, 'cm') }];

    return {
      ...assessment,
      metrics,
      isRecorded: status.isRecorded,
      isStale,
      hasResult: status.hasResult,
      lastUpdatedText: formatRelativeTime(childUpdatedAt),
      displayStatus: status.displayLabel,
      detailText: status.detail,
      interpretation: getInterpretationText(status.detail, status.hasResult),
      suggestedAction: status.recommendedAction,
      whoClassification: status.whoClassification,
      zScore: status.zScore,
      tone: status.tone,
      growthHistory: growthHistory.points,
      growthUnit: growthHistory.unit,
    };
  });
};
