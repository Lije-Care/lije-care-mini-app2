import { getMUACForAgeData } from "./getMUACForAgeData";

export const calculateMUACZ = (
  muacCm: number,
  ageInMonths: number,
  gender: "boy" | "girl"
): { muac: number; zScore: number; classification: string } => {
  const data = getMUACForAgeData(gender);

  const row = data.find(
    (entry) => parseInt(entry.Months ?? "") === ageInMonths
  );
  if (!row || !row["Median"] || !row["1 SD"]) {
    return {
      muac: parseFloat(muacCm.toFixed(2)),
      zScore: 0,
      classification: "No matching MUAC-for-age reference found.",
    };
  }

  const median = parseFloat(row["Median"]);
  const plus1SD = parseFloat(row["1 SD"]);
  const SD = plus1SD - median;

  if (isNaN(SD) || SD === 0) {
    return {
      muac: parseFloat(muacCm.toFixed(2)),
      zScore: 0,
      classification: "Invalid SD or median values.",
    };
  }

  const zRaw = (muacCm - median) / SD;
  const zScore = parseFloat(zRaw.toFixed(2));
  const classification = classifyMUACZ(zScore);

  return { muac: parseFloat(muacCm.toFixed(2)), zScore, classification };
};

const classifyMUACZ = (z: number): string => {
  if (z < -3)
    return "Severe Acute Malnutrition (SAM): Urgent intervention required.";
  if (z >= -3 && z < -2)
    return "Moderate Acute Malnutrition (MAM): Supplementary feeding needed.";
  if (z >= -2 && z < 1)
    return "Normal Nutrition Status: Balanced diet recommended.";
  if (z >= 1 && z < 2)
    return "Risk of Overnutrition: Monitor diet and activity.";
  return "Overnutrition (Obesity Risk): Review dietary habits and activity.";
};
