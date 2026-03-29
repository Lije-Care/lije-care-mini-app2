import { getBMIForAgeData } from "./getBMIForAgeData";

export const calculateBMIZ = (
  weightKg: number,
  heightCM: number, // <-- Accept height in cm
  ageValue: number,
  ageType: "week" | "month",
  gender: "boy" | "girl",
  measuredStanding: boolean
): { bmi: number; zScore: number; classification: string } => {
  // Convert height from cm to meters
  let heightM = heightCM / 100;

  // Adjust height if needed
  if (ageType === "week" && ageValue <= 13 && measuredStanding) {
    // heightM += 0.007;
  } else if (
    ageType === "month" &&
    ageValue >= 4 &&
    ageValue <= 60 &&
    !measuredStanding
  ) {
    // heightM -= 0.007;
  }

  const bmi = weightKg / (heightM * heightM);
  // console.log("here is the Bmi value",bmi)
  const roundedBMI = Number(bmi.toFixed(2));

  gender.toLowerCase() === "female" ? "girl" : "boy";

  const data = getBMIForAgeData(gender, ageType);

  const row = data.find((entry) =>
    ageType === "week"
      ? Number(entry.Weeks) === ageValue
      : Number(entry.Months) === ageValue
  );

  if (!row || !row["SD"] || !row["1 SD"]) {
    console.warn("No matching reference for:", { gender, ageValue, ageType });
    return {
      bmi: roundedBMI,
      zScore: 0,
      classification: "No matching BMI-for-age reference found.",
    };
  }

  const median = Number(row["SD"]);
  const plus1SD = Number(row["1 SD"]);
  const SD = plus1SD - median;

  if (!isFinite(SD) || SD === 0) {
    return {
      bmi: roundedBMI,
      zScore: 0,
      classification: "Invalid SD or median values.",
    };
  }

  const zScore = Number(((bmi - median) / SD).toFixed(2));
  const classification = classifyBMIZ(zScore);

  return { bmi: roundedBMI, zScore, classification };
};

const classifyBMIZ = (z: number): string => {
  if (z < -3)
    return "Severe underweight – Urgent nutritional intervention needed.";
  if (z >= -3 && z < -2)
    return "Moderate underweight – Child may require monitoring.";
  if (z >= -2 && z < 1) return "Normal weight – Healthy BMI range.";
  if (z >= 1 && z < 2)
    return "Risk of overweight – Lifestyle changes may be needed.";
  if (z >= 2 && z < 3)
    return "Overweight – Higher than normal BMI; potential obesity risk.";
  return "Obese – High risk of obesity-related health issues.";
};
