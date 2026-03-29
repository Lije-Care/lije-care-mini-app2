import { calculateBMIZ } from "@/excelData/calculateBMIZ";
import { differenceInWeeks } from "date-fns";
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

export const calculateNutrients = (
  weight: number,
  height: number,
  gender: string,
  date_of_birth: string,
  activity_level: "Active" | "Moderate" | "Sedentary" = "Moderate"
): any | null => {
  const months = calculateAgeInMonths(date_of_birth);
  // console.log({ months });
  if (months < 0 || !weight || !height) return null;

  const birthDate = new Date(date_of_birth);
  const today = new Date();

  // Calculate age in days
  const diffInMs = today.getTime() - birthDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Convert to months using 30 days per month (rounded normally)
  const ageInMonths = Math.round(diffInDays / 30);

  // Weeks (keep your existing logic)
  const ageInWeeks = differenceInWeeks(today, birthDate);

  const measuredStanding = height > 87;
  const bmiResult = calculateBMIZ(
    weight,
    height,
    ageInWeeks <= 13 ? ageInWeeks : ageInMonths,
    ageInWeeks <= 13 ? "week" : "month",
    gender === "Male" ? "boy" : "girl",
    measuredStanding
  );
  const bmi = bmiResult.zScore;

  const roundedBMI = parseFloat(bmi.toFixed(2));

  let status = "Normal";
  if (bmi <= -2) status = "Underweight";
  else if (bmi >= 2) status = "Overweight";
  console.log({ status });

  // Calculate calories based on age
  let value1: number;
  if (months <= 6) {
    value1 = weight * 108;
  } else if (months <= 12) {
    value1 = weight * 98;
  } else if (months <= 36) {
    value1 = weight * 102;
  } else {
    value1 = weight * 90;
  }
  // console.log({ value1 }); //1620

  // Activity level multiplier
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
  // console.log({ value3 });

  // Calculate total calories
  const calories = value1 * value2 * value3;

  // Calculate macronutrients
  const protein = parseFloat(((calories * 0.12) / 4).toFixed(2));
  const fat = parseFloat(((calories * 0.35) / 9).toFixed(2));
  const carbs = parseFloat(((calories * 0.5) / 4).toFixed(2));

  // Calculate micronutrients
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
  // ✅ Apply condition: if status is "Underweight", increase iron by 1.15
  if (status === "Underweight") {
    iron = iron * 1.15;
  }

  let calcium: number;
  let vitamina: number;
  let water: number;
  let zinc: number;
  if (months <= 6) {
    calcium = 200;
    vitamina = 400;
    water = 700;
    zinc = 2;
  } else if (months <= 12) {
    calcium = 260;
    vitamina = 500;
    water = 900;
    zinc = 3;
  } else if (months <= 36) {
    calcium = 700;
    vitamina = 300;
    water = 1300;
    zinc = 3;
  } else {
    calcium = 1000;
    vitamina = 400;
    water = 1600;
    zinc = 5;
  }
  // ✅ Apply condition: if status is "Underweight", increase iron by 1.15
  if (status === "Underweight") {
    calcium = calcium * 1.15;
  }

  return {
    bmi: roundedBMI.toString(),
    calories: parseInt(calories.toFixed(2)),
    protein,
    fat,
    carbs,
    iron: parseFloat(iron.toFixed(2)),
    calcium,
    vitamina,
    water,
    zinc,
    status,
  };
};
