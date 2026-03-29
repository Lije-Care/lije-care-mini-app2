import { calculateHAZ } from '@/excelData/calculateHAZ';
import { calculateBMIZ } from '@/excelData/calculateBMIZ';
import { calculateMUACZ } from '@/excelData/calculateMUACZ';
import { calculateWAZ } from '@/excelData/calculateWAZ';
import { calculateWHZ } from '@/excelData/calculateWHZ';
import {
  getAnthropometricAgeContext,
  getAgeDetails,
  normalizeGrowthGender,
} from '@/excelData/growthAgeUtils';

export type AnthropometricAssessmentId = 'a1' | 'a1-2' | 'a1-3' | 'a1-4' | 'a1-5';
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

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

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

const mapBmiForAge = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(
      isRecorded,
      'Weight and height are recorded, but no BMI-for-age result is available yet.'
    );
  }

  if (/underweight/i.test(classification)) {
    return buildResult(
      isRecorded,
      zScore,
      classification,
      'Underweight',
      classification,
      'danger'
    );
  }

  if (/normal weight/i.test(classification)) {
    return buildResult(isRecorded, zScore, classification, 'On Track', classification, 'success');
  }

  return buildResult(isRecorded, zScore, classification, 'Above Range', classification, 'warning');
};

const mapWeightForAge = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(
      isRecorded,
      'Weight is recorded, but no weight-for-age result is available yet.'
    );
  }

  if (/underweight/i.test(classification)) {
    return buildResult(
      isRecorded,
      zScore,
      classification,
      'Underweight',
      classification,
      classification.includes('Mild') ? 'warning' : 'danger'
    );
  }

  if (/normal weight for age/i.test(classification)) {
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

  const ageContext = getAnthropometricAgeContext(child.date_of_birth);
  if (!ageContext) {
    return unavailableResult(false, 'Add a valid date of birth to calculate this growth status.');
  }

  const gender = normalizeGrowthGender(child.gender);
  const ageDetails = child.date_of_birth ? getAgeDetails(child.date_of_birth) : null;

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

  if (assessmentId === 'a1-4') {
    const isRecorded = isPositiveNumber(child.weight) && isPositiveNumber(child.height);
    if (!isRecorded) {
      return unavailableResult(false, 'Add both weight and height to calculate BMI for age.');
    }

    if (!ageDetails) {
      return unavailableResult(true, 'Add a valid date of birth to calculate BMI for age.');
    }

    const weight = child.weight as number;
    const height = child.height as number;
    const measuredStanding = height > 87;
    const result = calculateBMIZ(
      weight,
      height,
      ageDetails.age,
      ageDetails.type,
      gender,
      measuredStanding
    );

    return mapBmiForAge(result.zScore, result.classification, true);
  }

  if (assessmentId === 'a1-5') {
    const isRecorded = isPositiveNumber(child.weight);
    if (!isRecorded) {
      return unavailableResult(false, 'Add weight to calculate weight for age.');
    }

    if (!ageDetails) {
      return unavailableResult(true, 'Add a valid date of birth to calculate weight for age.');
    }

    const weight = child.weight as number;
    const result = calculateWAZ(weight, ageDetails.age, ageDetails.type, gender);

    return mapWeightForAge(result.zScore, result.classification, true);
  }

  const isRecorded = isPositiveNumber(child.muac);
  if (!isRecorded) {
    return unavailableResult(false, 'Add MUAC to calculate the arm-circumference status.');
  }

  const muac = child.muac as number;
  const result = calculateMUACZ(muac, ageContext.ageInMonths, gender);
  return mapMuac(result.zScore, result.classification, true);
};
