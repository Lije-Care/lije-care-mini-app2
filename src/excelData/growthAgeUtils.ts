import { differenceInWeeks } from 'date-fns';

const DAY_MS = 1000 * 60 * 60 * 24;

const differenceInDays = (end: Date, start: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS);
};

const differenceInMonthsApprox = (end: Date, start: Date): number => {
  return Math.floor(differenceInDays(end, start) / 30);
};

const differenceInWeeksApprox = (end: Date, start: Date): number => {
  return Math.floor(differenceInDays(end, start) / 7);
};

export const getAgeValue = (
  dob: string | Date,
  ageType: 'week' | 'month'
): number => {
  const birthDate = new Date(dob);
  const now = new Date();

  if (ageType === 'week') return differenceInWeeksApprox(now, birthDate);
  return differenceInMonthsApprox(now, birthDate);
};

export const getAgeDetails = (
  dob: string
): { age: number; type: 'week' | 'month' } => {
  const birthDate = new Date(dob);
  const now = new Date();
  const diffInDays = Math.floor((+now - +birthDate) / DAY_MS);
  const ageInWeeks = Math.floor(diffInDays / 7);

  return ageInWeeks <= 13
    ? { age: ageInWeeks, type: 'week' }
    : { age: Math.floor(diffInDays / 30), type: 'month' };
};

export const getWHZRange = (dob: string): '0_2' | '2_5' => {
  const birthDate = new Date(dob);
  const now = new Date();
  const ageInMonths = Math.floor((+now - +birthDate) / (DAY_MS * 30.44));

  return ageInMonths < 24 ? '0_2' : '2_5';
};

export const getAnthropometricAgeContext = (dateOfBirth?: string) => {
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

export const normalizeGrowthGender = (gender?: string | null): 'boy' | 'girl' => {
  const normalized = gender?.toLowerCase();
  return normalized === 'female' || normalized === 'girl' ? 'girl' : 'boy';
};
