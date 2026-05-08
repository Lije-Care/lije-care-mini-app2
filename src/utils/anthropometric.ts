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
  recommendedAction: string | null;
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
  recommendedAction: null,
});

const buildResult = (
  isRecorded: boolean,
  zScore: number,
  whoClassification: string,
  displayLabel: string,
  detail: string,
  tone: AnthropometricTone,
  recommendedAction: string
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
    recommendedAction,
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

  if (zScore < -3) {
    return buildResult(isRecorded, zScore, classification, 'Severely Wasted', 'Severe acute malnutrition', 'danger', 'Urgent treatment (OTP/SC)');
  }
  if (zScore < -2) {
    return buildResult(isRecorded, zScore, classification, 'Wasted (Moderate)', 'Acute malnutrition', 'warning', 'Supplementary feeding + follow-up');
  }
  if (zScore > 3) {
    return buildResult(isRecorded, zScore, classification, 'Obese', 'High excess weight for height', 'danger', 'Further assessment + lifestyle intervention');
  }
  if (zScore > 2) {
    return buildResult(isRecorded, zScore, classification, 'Overweight', 'Excess weight for height', 'warning', 'Counsel on diet and activity');
  }
  return buildResult(isRecorded, zScore, classification, 'Normal', 'Appropriate weight for height', 'success', 'Continue routine care');
};

const mapHeightForAge = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(isRecorded, 'Height is recorded, but no WHO result is available yet.');
  }

  if (zScore < -3) {
    return buildResult(isRecorded, zScore, classification, 'Severely Stunted', 'Severe chronic malnutrition', 'danger', 'Comprehensive intervention (nutrition + health + social)');
  }
  if (zScore < -2) {
    return buildResult(isRecorded, zScore, classification, 'Stunted (Moderate)', 'Chronic malnutrition', 'warning', 'Nutrition + long-term support');
  }
  return buildResult(isRecorded, zScore, classification, 'Normal', 'Normal linear growth', 'success', 'Routine monitoring');
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

  if (zScore < -3) {
    return buildResult(isRecorded, zScore, classification, 'Severe Acute Malnutrition (SAM)', 'High risk of mortality', 'danger', 'Urgent referral for therapeutic feeding (OTP/SC)');
  }
  if (zScore < -2) {
    return buildResult(isRecorded, zScore, classification, 'Moderate Acute Malnutrition (MAM)', 'At risk, low muscle/fat', 'warning', 'Supplementary feeding, nutrition counseling, close follow-up');
  }
  return buildResult(isRecorded, zScore, classification, 'Normal', 'Adequate nutritional status', 'success', 'Routine growth monitoring, continue feeding practices');
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

  if (zScore < -3) {
    return buildResult(isRecorded, zScore, classification, 'Severe Thinness', 'Severe undernutrition', 'danger', 'Urgent intervention');
  }
  if (zScore < -2) {
    return buildResult(isRecorded, zScore, classification, 'Thinness', 'Underweight', 'warning', 'Nutrition support');
  }
  if (zScore > 3) {
    return buildResult(isRecorded, zScore, classification, 'Obese', 'High health risk', 'danger', 'Clinical assessment');
  }
  if (zScore > 2) {
    return buildResult(isRecorded, zScore, classification, 'Overweight', 'Excess weight', 'warning', 'Lifestyle intervention');
  }
  if (zScore > 1) {
    return buildResult(isRecorded, zScore, classification, 'Risk of Overweight', 'Early excess weight', 'warning', 'Diet & activity counseling');
  }
  return buildResult(isRecorded, zScore, classification, 'Normal', 'Healthy weight status', 'success', 'Maintain healthy habits');
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

  if (zScore < -3) {
    return buildResult(isRecorded, zScore, classification, 'Severely Underweight', 'High risk', 'danger', 'Urgent evaluation and intervention');
  }
  if (zScore < -2) {
    return buildResult(isRecorded, zScore, classification, 'Underweight (Moderate)', 'Could be acute or chronic issue', 'warning', 'Further assessment (WFH + HFA), nutrition support');
  }
  return buildResult(isRecorded, zScore, classification, 'Normal', 'Appropriate weight for age', 'success', 'Routine care');
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
