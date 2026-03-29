import { getWeightForAgeData } from "./getWeightForAgeData";

export const calculateWAZ = (
  weightKg: number,
  ageValue: number,
  ageType: "week" | "month",
  gender: "boy" | "girl"
): { zScore: number; classification: string } => {
  const data = getWeightForAgeData(gender, ageValue, ageType);
  // console.log("Data fetched for WAZ calculation:", data);
  // console.log(gender, ageValue, ageType)
  // Select matching entry
  const row = data.find((entry) => {
    return ageType === "week"
      ? parseInt(entry.Weeks ?? "") === ageValue
      : parseInt(entry.Months ?? "") === ageValue;
  });

  // console.log("Row found for WAZ calculation:", row);

  if (!row || !row["SD"] || !row["1 SD"]) {
    return { zScore: 0, classification: "No matching growth reference found." };
  }

  const median = parseFloat(row["SD"]);
  const plus1SD = parseFloat(row["1 SD"]);
  const SD = plus1SD - median;
  // console.log("Median:", median, "SD:", SD);
  if (isNaN(SD) || SD === 0) {
    return { zScore: 0, classification: "Invalid SD or median values." };
  }

  const zRaw = (weightKg - median) / SD;
  const zScore = parseFloat(zRaw.toFixed(2));
  const classification = classifyWAZ(zScore);

  return { zScore, classification };
};

const classifyWAZ = (z: number): string => {
  if (z < -3) return "Severe underweight";
  if (z >= -3 && z < -2) return "Moderate underweight";
  if (z >= -2 && z < -1) return "Mild underweight";
  if (z >= -1 && z < 1) return "Normal weight for age";
  if (z >= 1 && z < 2) return "Above average weight";
  if (z >= 2 && z < 3) return "Overweight for age";
  return "Obese for age";
};
