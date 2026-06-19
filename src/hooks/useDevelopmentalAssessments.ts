import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { getDevelopmentalAssessmentsForAge } from '@/data/developmentalMilestones';
import type { DetailedAssessment, DevAnswer } from '@/design-system/types';
import {
  fetchDevelopmentalAssessments,
  saveDevelopmentalAssessmentsBulk,
} from '@/redux/slices/developmentalAssessmentSlice';
import type { AppDispatch, RootState } from '@/redux/store';

interface UseDevelopmentalAssessmentsOptions {
  ageInMonths: number;
  childId?: string | null;
  onNoAnswer?: (assessment: DetailedAssessment) => void;
}

export const useDevelopmentalAssessments = ({
  ageInMonths,
  childId,
  onNoAnswer,
}: UseDevelopmentalAssessmentsOptions) => {
  const dispatch = useDispatch<AppDispatch>();
  const { i18n } = useTranslation();
  const developmentalState = useSelector(
    (state: RootState) => state.developmentalAssessments
  );

  const baseDevelopmentalAssessments = useMemo(
    () => getDevelopmentalAssessmentsForAge(ageInMonths),
    [ageInMonths, i18n.language]
  );

  const [developmentalAssessments, setDevelopmentalAssessments] = useState<DetailedAssessment[]>(
    baseDevelopmentalAssessments
  );

  useEffect(() => {
    if (childId) {
      dispatch(fetchDevelopmentalAssessments(childId));
    }
  }, [childId, dispatch]);

  useEffect(() => {
    setDevelopmentalAssessments(
      baseDevelopmentalAssessments.map((item) => ({
        ...item,
        answer: developmentalState.byQuestionId[item.id] ?? 'unanswered',
      }))
    );
  }, [baseDevelopmentalAssessments, developmentalState.byQuestionId]);

  const persistDevelopmentalAnswers = async (nextAssessments: DetailedAssessment[]) => {
    if (!childId) return;

    await dispatch(
      saveDevelopmentalAssessmentsBulk({
        childId,
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
      onNoAnswer?.(matched);
    }
  };

  const markAsAddressed = (id: string) => {
    const nextAssessments: DetailedAssessment[] = developmentalAssessments.map((assessment) =>
      assessment.id === id ? { ...assessment, answer: 'addressed' as DevAnswer } : assessment
    );

    setDevelopmentalAssessments(nextAssessments);
    void persistDevelopmentalAnswers(nextAssessments);
  };

  return {
    developmentalAssessments,
    developmentalState,
    markAsAddressed,
    toggleAnswer,
  };
};
