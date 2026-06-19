import i18n from '@/i18n/i18n';
import type { AnthropometricAssessmentId } from '@/utils/anthropometric';

export interface AssessmentInterpretationRow {
  indicator: string;
  zScoreRange: string;
  classification: string;
  meaning: string;
  recommendedAction: string;
}

export interface AssessmentInterpretationTable {
  title: string;
  description: string;
  rows: AssessmentInterpretationRow[];
}

export interface AssessmentInterpretationColumns {
  indicator: string;
  zScoreRange: string;
  classification: string;
  meaning: string;
  recommendedAction: string;
}

const getTablePath = (assessmentId: AnthropometricAssessmentId) =>
  `assessmentInterpretation.tables.${assessmentId}`;

export const getAssessmentInterpretationColumns = (): AssessmentInterpretationColumns =>
  i18n.t('assessmentInterpretation.columns', {
    returnObjects: true,
  }) as AssessmentInterpretationColumns;

export const getAssessmentInterpretationTable = (
  assessmentId: AnthropometricAssessmentId
): AssessmentInterpretationTable =>
  i18n.t(getTablePath(assessmentId), {
    returnObjects: true,
  }) as AssessmentInterpretationTable;
