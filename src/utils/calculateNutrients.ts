import {
  GENERAL_CHILD_PROFILE,
  type GeneralChildProfileEntry,
} from "@/data/generalChildProfile";

export const calculateAgeInMonths = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return years * 12 + months;
};

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const getGeneralChildProfileForAge = (
  ageInMonths: number
): GeneralChildProfileEntry | null =>
  GENERAL_CHILD_PROFILE.find(
    (entry) => ageInMonths >= entry.minAgeMonths && ageInMonths <= entry.maxAgeMonths
  ) ?? null;

const dailyWaterIntake = (weightKg: number): number => {
  if (weightKg <= 10) {
    return weightKg * 100;
  }

  if (weightKg <= 20) {
    return 1000 + (weightKg - 10) * 50;
  }

  return 1500 + (weightKg - 20) * 20;
};

const getAgeBasedWaterRequirement = (ageInMonths: number): number => {
  if (ageInMonths < 6) {
    return 700;
  }

  if (ageInMonths <= 11) {
    return 800;
  }

  if (ageInMonths <= 47) {
    return 1300;
  }

  if (ageInMonths <= 107) {
    return 1700;
  }

  if (ageInMonths <= 143) {
    return 2100;
  }

  if (ageInMonths <= 167) {
    return 2300;
  }

  return 2500;
};

export const resolveNutrientMeasurements = (
  weight: number | null | undefined,
  height: number | null | undefined,
  date_of_birth: string
) => {
  const ageInMonths = calculateAgeInMonths(date_of_birth);
  if (ageInMonths < 0) return null;

  const fallbackProfile = getGeneralChildProfileForAge(ageInMonths);
  const resolvedWeight = isPositiveNumber(weight)
    ? weight
    : fallbackProfile?.medianWeight;
  const resolvedHeight = isPositiveNumber(height)
    ? height
    : fallbackProfile?.medianHeight;

  if (!isPositiveNumber(resolvedWeight) || !isPositiveNumber(resolvedHeight)) {
    return null;
  }

  return {
    ageInMonths,
    weight: resolvedWeight,
    height: resolvedHeight,
    fallbackProfile,
    usedFallback:
      !isPositiveNumber(weight) ||
      !isPositiveNumber(height),
  };
};

export const calculateNutrients = (
  weight: number | null | undefined,
  height: number | null | undefined,
  _gender: string,
  date_of_birth: string,
  activity_level: "Active" | "Moderate" | "Sedentary" = "Moderate"
): any | null => {
  const resolvedMeasurements = resolveNutrientMeasurements(
    weight,
    height,
    date_of_birth
  );
  if (!resolvedMeasurements) return null;

  const { ageInMonths: months, weight: resolvedWeight, height: resolvedHeight } =
    resolvedMeasurements;

  const bmi = resolvedWeight / (resolvedHeight / 100) ** 2;
  const roundedBMI = parseFloat(bmi.toFixed(2));

  let status = "Normal";
  if (bmi < 14) status = "Underweight";
  else if (bmi > 17) status = "Overweight";

  let value1: number;
  if (months <= 6) {
    value1 = resolvedWeight * 108;
  } else if (months <= 36) {
    value1 = resolvedWeight * 102;
  } else {
    value1 = resolvedWeight * 90;
  }

  let value2: number;
  if (activity_level === "Moderate") {
    value2 = 1.13;
  } else if (activity_level === "Active") {
    value2 = 1.26;
  } else {
    value2 = 1;
  }

  // Health condition multiplier
  let value3: number;
  if (status === "Overweight") {
    value3 = 0.9;
  } else if (status === "Underweight") {
    value3 = 1.15;
  } else {
    value3 = 1;
  }

  const calories = value1 * value2 * value3;

  const protein = parseFloat(((calories * 0.12) / 4).toFixed(2));
  const fat = parseFloat(((calories * 0.35) / 9).toFixed(2));
  const carbs = parseFloat(((calories * 0.5) / 4).toFixed(2));

  let iron: number;
  if (months <= 6) {
    iron = 0.27;
  } else if (months <= 12) {
    iron = 11;
  } else if (months <= 36) {
    iron = 7;
  } else {
    iron = 10;
  }
  if (status === "Underweight") {
    iron = iron * 1.15;
  }

  let calcium: number;
  let vitaminA: number;
  let zinc: number;
  if (months <= 6) {
    calcium = 200;
    vitaminA = 400;
    zinc = 2;
  } else if (months <= 12) {
    calcium = 260;
    vitaminA = 500;
    zinc = 3;
  } else if (months <= 36) {
    calcium = 700;
    vitaminA = 300;
    zinc = 3;
  } else {
    calcium = 1000;
    vitaminA = 400;
    zinc = 5;
  }
  if (status === "Underweight") {
    calcium = calcium * 1.15;
  }

  const water = isPositiveNumber(weight)
    ? Math.round(dailyWaterIntake(weight))
    : getAgeBasedWaterRequirement(months);

  return {
    bmi: roundedBMI.toString(),
    calories: parseInt(calories.toFixed(2)),
    protein,
    fat,
    carbs,
    iron: parseFloat(iron.toFixed(2)),
    calcium,
    vitaminA,
    vitamina: vitaminA,
    water,
    zinc,
    status,
  };
};
