import {
  getWeightForHeightData,
  WeightForHeightEntry,
} from "./dataselectorWHZ";

export const calculateWHZ = (
  weightKg: number,
  heightCm: number,
  gender: "boy" | "girl",
  ageGroup: "0_2" | "2_5"
): { zScore: number; classification: string } => {
  if (!weightKg || !heightCm || isNaN(weightKg) || isNaN(heightCm)) {
    return { zScore: 0, classification: "Invalid input values" };
  }

  const data: WeightForHeightEntry[] = getWeightForHeightData(gender, ageGroup);

  if (!data || data.length === 0) {
    return { zScore: 0, classification: "Unknown (no reference data)" };
  }

  // Find closest height in cm (assuming height is stored as string in cm)
  const closest = data.reduce((prev, curr) => {
    const prevDiff = Math.abs(parseFloat(prev.cm) - heightCm);
    const currDiff = Math.abs(parseFloat(curr.cm) - heightCm);
    return currDiff < prevDiff ? curr : prev;
  });

  // Parse and validate values
  const medianStr = closest["SD(M)"];
  const plus1SDStr = closest["1SD"];

  if (!medianStr || !plus1SDStr) {
    return { zScore: 0, classification: "Missing reference values" };
  }

  const median = parseFloat(medianStr);
  const plus1SD = parseFloat(plus1SDStr);
  const SD = plus1SD - median;

  if (isNaN(median) || isNaN(plus1SD) || isNaN(SD) || Math.abs(SD) < 0.0001) {
    return { zScore: 0, classification: "Invalid reference data" };
  }

  const zRaw = (weightKg - median) / SD; // (13-13.2)/14.5-13.2
  // 13-13.6/14.7-13.6
  const zScore = parseFloat(zRaw.toFixed(2));
  const classification = classifyWHZ(zScore);

  return { zScore, classification };
};

const classifyWHZ = (z: number): string => {
  if (z < -3) return "Severe wasting";
  if (z >= -3 && z < -2) return "Moderate wasting";
  if (z >= -2 && z <= 1) return "Normal";
  if (z > 1 && z <= 2) return "Risk of overweight";
  if (z > 2 && z <= 3) return "Overweight";
  return "Obese";
};
