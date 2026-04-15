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
  _gender: string,
  date_of_birth: string,
  activity_level: "Active" | "Moderate" | "Sedentary" = "Moderate"
): any | null => {
  const months = calculateAgeInMonths(date_of_birth);
  if (months < 0 || !weight || !height) return null;

  const bmi = weight / (height / 100) ** 2;
  const roundedBMI = parseFloat(bmi.toFixed(2));

  let status = "Normal";
  if (bmi < 14) status = "Underweight";
  else if (bmi > 17) status = "Overweight";

  let value1: number;
  if (months <= 6) {
    value1 = weight * 108;
  } else if (months <= 36) {
    value1 = weight * 102;
  } else {
    value1 = weight * 90;
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
  let water: number;
  let zinc: number;
  if (months <= 6) {
    calcium = 200;
    vitaminA = 400;
    water = 700;
    zinc = 2;
  } else if (months <= 12) {
    calcium = 260;
    vitaminA = 500;
    water = 900;
    zinc = 3;
  } else if (months <= 36) {
    calcium = 700;
    vitaminA = 300;
    water = 1300;
    zinc = 3;
  } else {
    calcium = 1000;
    vitaminA = 400;
    water = 1600;
    zinc = 5;
  }
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
    vitaminA,
    vitamina: vitaminA,
    water,
    zinc,
    status,
  };
};
