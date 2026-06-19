import { calculateHAZ } from '@/excelData/calculateHAZ';
import { calculateBMIZ } from '@/excelData/calculateBMIZ';
import { calculateMUACZ } from '@/excelData/calculateMUACZ';
import { calculateWAZ } from '@/excelData/calculateWAZ';
import { calculateWHZ } from '@/excelData/calculateWHZ';
import i18n from '@/i18n/i18n';
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

const tAssessment = (key: string) => i18n.t(`assessmentStatus.${key}`);

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
  displayLabel: isRecorded ? tAssessment('common.unavailable') : tAssessment('common.noData'),
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
    return unavailableResult(isRecorded, tAssessment('common.weightHeightUnavailable'));
  }

  if (zScore < -3) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.weightForHeight.severeWasting'),
      tAssessment('weightForHeight.severeWasting.displayLabel'),
      tAssessment('weightForHeight.severeWasting.detail'),
      'danger',
      tAssessment('weightForHeight.severeWasting.action')
    );
  }
  if (zScore < -2) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.weightForHeight.moderateWasting'),
      tAssessment('weightForHeight.moderateWasting.displayLabel'),
      tAssessment('weightForHeight.moderateWasting.detail'),
      'warning',
      tAssessment('weightForHeight.moderateWasting.action')
    );
  }
  if (zScore > 3) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.weightForHeight.obese'),
      tAssessment('weightForHeight.obese.displayLabel'),
      tAssessment('weightForHeight.obese.detail'),
      'danger',
      tAssessment('weightForHeight.obese.action')
    );
  }
  if (zScore > 2) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.weightForHeight.overweight'),
      tAssessment('weightForHeight.overweight.displayLabel'),
      tAssessment('weightForHeight.overweight.detail'),
      'warning',
      tAssessment('weightForHeight.overweight.action')
    );
  }
  return buildResult(
    isRecorded,
    zScore,
    zScore > 1 ? tAssessment('who.weightForHeight.riskOfOverweight') : tAssessment('who.weightForHeight.normal'),
    tAssessment('weightForHeight.normal.displayLabel'),
    tAssessment('weightForHeight.normal.detail'),
    'success',
    tAssessment('weightForHeight.normal.action')
  );
};

const mapHeightForAge = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(isRecorded, tAssessment('common.heightUnavailable'));
  }

  if (zScore < -3) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.heightForAge.severeStunting'),
      tAssessment('heightForAge.severeStunting.displayLabel'),
      tAssessment('heightForAge.severeStunting.detail'),
      'danger',
      tAssessment('heightForAge.severeStunting.action')
    );
  }
  if (zScore < -2) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.heightForAge.moderateStunting'),
      tAssessment('heightForAge.moderateStunting.displayLabel'),
      tAssessment('heightForAge.moderateStunting.detail'),
      'warning',
      tAssessment('heightForAge.moderateStunting.action')
    );
  }
  return buildResult(
    isRecorded,
    zScore,
    zScore > 3
      ? tAssessment('who.heightForAge.veryTallForAge')
      : zScore > 2
        ? tAssessment('who.heightForAge.tallForAge')
        : tAssessment('who.heightForAge.normal'),
    tAssessment('heightForAge.normal.displayLabel'),
    tAssessment('heightForAge.normal.detail'),
    'success',
    tAssessment('heightForAge.normal.action')
  );
};

const mapMuac = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(isRecorded, tAssessment('common.muacUnavailable'));
  }

  if (zScore < -3) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.muac.severeAcuteMalnutrition'),
      tAssessment('muac.severeAcuteMalnutrition.displayLabel'),
      tAssessment('muac.severeAcuteMalnutrition.detail'),
      'danger',
      tAssessment('muac.severeAcuteMalnutrition.action')
    );
  }
  if (zScore < -2) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.muac.moderateAcuteMalnutrition'),
      tAssessment('muac.moderateAcuteMalnutrition.displayLabel'),
      tAssessment('muac.moderateAcuteMalnutrition.detail'),
      'warning',
      tAssessment('muac.moderateAcuteMalnutrition.action')
    );
  }
  return buildResult(
    isRecorded,
    zScore,
    tAssessment('who.muac.normal'),
    tAssessment('muac.normal.displayLabel'),
    tAssessment('muac.normal.detail'),
    'success',
    tAssessment('muac.normal.action')
  );
};

const mapBmiForAge = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(isRecorded, tAssessment('common.bmiUnavailable'));
  }

  if (zScore < -3) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.bmiForAge.severeThinness'),
      tAssessment('bmiForAge.severeThinness.displayLabel'),
      tAssessment('bmiForAge.severeThinness.detail'),
      'danger',
      tAssessment('bmiForAge.severeThinness.action')
    );
  }
  if (zScore < -2) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.bmiForAge.thinness'),
      tAssessment('bmiForAge.thinness.displayLabel'),
      tAssessment('bmiForAge.thinness.detail'),
      'warning',
      tAssessment('bmiForAge.thinness.action')
    );
  }
  if (zScore > 3) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.bmiForAge.obese'),
      tAssessment('bmiForAge.obese.displayLabel'),
      tAssessment('bmiForAge.obese.detail'),
      'danger',
      tAssessment('bmiForAge.obese.action')
    );
  }
  if (zScore > 2) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.bmiForAge.overweight'),
      tAssessment('bmiForAge.overweight.displayLabel'),
      tAssessment('bmiForAge.overweight.detail'),
      'warning',
      tAssessment('bmiForAge.overweight.action')
    );
  }
  if (zScore > 1) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.bmiForAge.riskOfOverweight'),
      tAssessment('bmiForAge.riskOfOverweight.displayLabel'),
      tAssessment('bmiForAge.riskOfOverweight.detail'),
      'warning',
      tAssessment('bmiForAge.riskOfOverweight.action')
    );
  }
  return buildResult(
    isRecorded,
    zScore,
    tAssessment('who.bmiForAge.normal'),
    tAssessment('bmiForAge.normal.displayLabel'),
    tAssessment('bmiForAge.normal.detail'),
    'success',
    tAssessment('bmiForAge.normal.action')
  );
};

const mapWeightForAge = (
  zScore: number,
  classification: string,
  isRecorded: boolean
): AnthropometricStatus => {
  if (isInvalidClassification(classification)) {
    return unavailableResult(isRecorded, tAssessment('common.weightUnavailable'));
  }

  if (zScore < -3) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.weightForAge.severeUnderweight'),
      tAssessment('weightForAge.severeUnderweight.displayLabel'),
      tAssessment('weightForAge.severeUnderweight.detail'),
      'danger',
      tAssessment('weightForAge.severeUnderweight.action')
    );
  }
  if (zScore < -2) {
    return buildResult(
      isRecorded,
      zScore,
      tAssessment('who.weightForAge.moderateUnderweight'),
      tAssessment('weightForAge.moderateUnderweight.displayLabel'),
      tAssessment('weightForAge.moderateUnderweight.detail'),
      'warning',
      tAssessment('weightForAge.moderateUnderweight.action')
    );
  }
  return buildResult(
    isRecorded,
    zScore,
    zScore >= 3
      ? tAssessment('who.weightForAge.obeseForAge')
      : zScore >= 2
        ? tAssessment('who.weightForAge.overweightForAge')
        : zScore >= 1
          ? tAssessment('who.weightForAge.aboveAverageWeight')
          : zScore >= -1
            ? tAssessment('who.weightForAge.normal')
            : tAssessment('who.weightForAge.mildUnderweight'),
    tAssessment('weightForAge.normal.displayLabel'),
    tAssessment('weightForAge.normal.detail'),
    'success',
    tAssessment('weightForAge.normal.action')
  );
};

export const getAnthropometricStatus = (
  assessmentId: AnthropometricAssessmentId,
  child?: AnthropometricInput | null
): AnthropometricStatus => {
  if (!child) {
    return unavailableResult(false, tAssessment('common.addMeasurementsForGrowthStatus'));
  }

  const ageContext = getAnthropometricAgeContext(child.date_of_birth);
  if (!ageContext) {
    return unavailableResult(false, tAssessment('common.addValidDobForGrowthStatus'));
  }

  const gender = normalizeGrowthGender(child.gender);
  const ageDetails = child.date_of_birth ? getAgeDetails(child.date_of_birth) : null;

  if (assessmentId === 'a1') {
    const isRecorded = isPositiveNumber(child.weight) && isPositiveNumber(child.height);
    if (!isRecorded) {
      return unavailableResult(false, tAssessment('common.addWeightAndHeightForWeightForHeight'));
    }

    const weight = child.weight as number;
    const height = child.height as number;
    const result = calculateWHZ(weight, height, gender, ageContext.weightForHeightRange);

    return mapWeightForHeight(result.zScore, result.classification, true);
  }

  if (assessmentId === 'a1-2') {
    const isRecorded = isPositiveNumber(child.height);
    if (!isRecorded) {
      return unavailableResult(false, tAssessment('common.addHeightForHeightForAge'));
    }

    const height = child.height as number;
    const result = calculateHAZ(height, ageContext.ageInWeeks, ageContext.ageInMonths, gender);

    return mapHeightForAge(result.haz, result.classification, true);
  }

  if (assessmentId === 'a1-4') {
    const isRecorded = isPositiveNumber(child.weight) && isPositiveNumber(child.height);
    if (!isRecorded) {
      return unavailableResult(false, tAssessment('common.addWeightAndHeightForBmiForAge'));
    }

    if (!ageDetails) {
      return unavailableResult(true, tAssessment('common.addValidDobForBmiForAge'));
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
      return unavailableResult(false, tAssessment('common.addWeightForWeightForAge'));
    }

    if (!ageDetails) {
      return unavailableResult(true, tAssessment('common.addValidDobForWeightForAge'));
    }

    const weight = child.weight as number;
    const result = calculateWAZ(weight, ageDetails.age, ageDetails.type, gender);

    return mapWeightForAge(result.zScore, result.classification, true);
  }

  const isRecorded = isPositiveNumber(child.muac);
  if (!isRecorded) {
    return unavailableResult(false, tAssessment('common.addMuacForStatus'));
  }

  const muac = child.muac as number;
  const result = calculateMUACZ(muac, ageContext.ageInMonths, gender);
  return mapMuac(result.zScore, result.classification, true);
};
