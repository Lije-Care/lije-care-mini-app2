import { differenceInWeeks } from 'date-fns';

import { calculateHAZ } from '@/excelData/calculateHAZ';
import { calculateMUACZ } from '@/excelData/calculateMUACZ';
import { calculateWHZ } from '@/excelData/calculateWHZ';
import { getWHZRange } from '@/utils/growthUtils';

export type AnthropometricAssessmentId = 'a1' | 'a1-2' | 'a1-3';
export type AnthropometricTone = 'danger' | 'success' | 'warning' | 'neutral';

export interface AnthropometricInput {
  date_of_birth?: string;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  muac?: number | null;
}

export interface AnthropometricStatus {
  isRecorded: boolean;
  hasResult: boolean;
  tone: AnthropometricTone;
  displayLabel: string;
  detail: string;
  whoClassification: string | null;
  zScore: number | null;
  score: number | null;
  progress: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const normalizeGender = (gender?: string | null): 'boy' | 'girl' => {
  const normalized = gender?.toLowerCase();
  return normalized === 'female' || normalized === 'girl' ? 'girl' : 'boy';
};

const getAgeContext = (dateOfBirth?: string) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  const diffInDays = Math.max(0, Math.floor((today.getTime() - birthDate.getTime()) / DAY_MS));

  return {
    ageInWeeks: differenceInWeeks(today, birthDate),
    ageInMonths: Math.round(diffInDays / 30),
    weightForHeightRange: getWHZRange(dateOfBirth),
  };
};

const toPresentationScore = (zScore: number) => {
  const score = Math.round(90 - Math.abs(zScore) * 15);
  return Math.max(36, Math.min(96, score));
};

const unavailableResult = (isRecorded: boolean, detail: string): AnthropometricStatus => ({
  isRecorded,
  hasResult: false,
  tone: 'neutral',
  displayLabel: isRecorded ? 'Unavailable' : 'No Data',
  detail,
  whoClassification: null,
  zScore: null,
  score: null,
  progress: 0,
});

const buildResult = (
  isRecorded: boolean,
  zScore: number,
  whoClassification: string,
  displayLabel: string,
  detail: string,
  tone: AnthropometricTone
): AnthropometricStatus => {
  const score = toPresentationScore(zScore);

  return {
    isRecorded,
    hasResult: true,
    tone,
    displayLabel,
    detail,
    whoClassification,
    zScore,
    score,
    progress: score,
  };
};

const isInvalidClassification = (classification: string) =>
  /invalid|unknown|missing|out of supported range|no matching/i.test(classification);

const mapWeightForHeight = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(isRecorded, 'Weight and height are recorded, but no WHO result is available yet.');
  }

  if (classification.includes('wasting')) {
    return buildResult(
      isRecorded,
      zScore,
      classification,
      'Underweight',
      classification,
      'danger'
    );
  }

  if (classification === 'Normal') {
    return buildResult(isRecorded, zScore, classification, 'On Track', classification, 'success');
  }

  return buildResult(isRecorded, zScore, classification, 'Above Range', classification, 'warning');
};

const mapHeightForAge = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(isRecorded, 'Height is recorded, but no WHO result is available yet.');
  }

  if (classification.includes('stunting')) {
    return buildResult(
      isRecorded,
      zScore,
      classification,
      'Below Range',
      classification,
      'danger'
    );
  }

  return buildResult(isRecorded, zScore, classification, 'On Track', classification, 'success');
};

const mapMuac = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(
      isRecorded,
      'MUAC is recorded, but this child is outside the supported MUAC-for-age reference range.'
    );
  }

  if (classification.includes('Severe Acute Malnutrition')) {
    return buildResult(isRecorded, zScore, classification, 'At Risk', classification, 'danger');
  }

  if (classification.includes('Moderate Acute Malnutrition')) {
    return buildResult(isRecorded, zScore, classification, 'At Risk', classification, 'warning');
  }

  if (classification.includes('Normal Nutrition Status')) {
    return buildResult(isRecorded, zScore, classification, 'On Track', classification, 'success');
  }

  return buildResult(isRecorded, zScore, classification, 'Above Range', classification, 'warning');
};

export const getAnthropometricStatus = (
  assessmentId: AnthropometricAssessmentId,
  child?: AnthropometricInput | null
): AnthropometricStatus => {
  if (!child) {
    return unavailableResult(false, 'Add measurements to calculate this growth status.');
  }

  const ageContext = getAgeContext(child.date_of_birth);
  if (!ageContext) {
    return unavailableResult(false, 'Add a valid date of birth to calculate this growth status.');
  }

  const gender = normalizeGender(child.gender);

  if (assessmentId === 'a1') {
    const isRecorded = isPositiveNumber(child.weight) && isPositiveNumber(child.height);
    if (!isRecorded) {
      return unavailableResult(false, 'Add both weight and height to calculate weight for height.');
    }

    const weight = child.weight as number;
    const height = child.height as number;
    const result = calculateWHZ(weight, height, gender, ageContext.weightForHeightRange);

    return mapWeightForHeight(result.zScore, result.classification, true);
  }

  if (assessmentId === 'a1-2') {
    const isRecorded = isPositiveNumber(child.height);
    if (!isRecorded) {
      return unavailableResult(false, 'Add height to calculate height for age.');
    }

    const height = child.height as number;
    const result = calculateHAZ(height, ageContext.ageInWeeks, ageContext.ageInMonths, gender);

    return mapHeightForAge(result.haz, result.classification, true);
  }

  const isRecorded = isPositiveNumber(child.muac);
  if (!isRecorded) {
    return unavailableResult(false, 'Add MUAC to calculate the arm-circumference status.');
  }

  const muac = child.muac as number;
  const result = calculateMUACZ(muac, ageContext.ageInMonths, gender);
  return mapMuac(result.zScore, result.classification, true);
};
