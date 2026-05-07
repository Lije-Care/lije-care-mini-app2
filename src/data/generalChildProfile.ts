export interface GeneralChildProfileEntry {
  label: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  medianWeight: number;
  medianHeight: number;
}

export const GENERAL_CHILD_PROFILE: GeneralChildProfileEntry[] = [
  {
    label: "6-8 Months",
    minAgeMonths: 6,
    maxAgeMonths: 8,
    medianWeight: 8.0,
    medianHeight: 68,
  },
  {
    label: "9-11 Months",
    minAgeMonths: 9,
    maxAgeMonths: 11,
    medianWeight: 9.2,
    medianHeight: 72,
  },
  {
    label: "12-17 Months",
    minAgeMonths: 12,
    maxAgeMonths: 17,
    medianWeight: 10.5,
    medianHeight: 78,
  },
  {
    label: "18-23 Months",
    minAgeMonths: 18,
    maxAgeMonths: 23,
    medianWeight: 12.0,
    medianHeight: 85,
  },
  {
    label: "2 Years",
    minAgeMonths: 24,
    maxAgeMonths: 35,
    medianWeight: 12.5,
    medianHeight: 87,
  },
  {
    label: "3 Years",
    minAgeMonths: 36,
    maxAgeMonths: 47,
    medianWeight: 14.2,
    medianHeight: 95,
  },
  {
    label: "4 Years",
    minAgeMonths: 48,
    maxAgeMonths: 59,
    medianWeight: 16.5,
    medianHeight: 103,
  },
  {
    label: "5 Years",
    minAgeMonths: 60,
    maxAgeMonths: 71,
    medianWeight: 18.5,
    medianHeight: 110,
  },
  {
    label: "6 Years",
    minAgeMonths: 72,
    maxAgeMonths: 83,
    medianWeight: 20.8,
    medianHeight: 116,
  },
  {
    label: "7 Years",
    minAgeMonths: 84,
    maxAgeMonths: 95,
    medianWeight: 23.2,
    medianHeight: 122,
  },
  {
    label: "8 Years",
    minAgeMonths: 96,
    maxAgeMonths: 107,
    medianWeight: 26.0,
    medianHeight: 128,
  },
  {
    label: "9 Years",
    minAgeMonths: 108,
    maxAgeMonths: 119,
    medianWeight: 29.5,
    medianHeight: 134,
  },
];
