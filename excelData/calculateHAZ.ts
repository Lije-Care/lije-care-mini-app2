import boys0To13Weeks from "@/excelData/Height-for-age/boys_0_to_13_weeks.json";
import boys4mTo5y from "@/excelData/Height-for-age/boys_4m_to_5y.json";
import girls0To13Weeks from "@/excelData/Height-for-age/girls_0_to_13_weeks.json";
import girls4mTo5y from "@/excelData/Height-for-age/girls_4m_to_5y.json";

interface GrowthRow {
  age: number; // week or month
  median: number | string;
  plus1SD: number | string;
}

type Gender = "boy" | "girl";

/**
 * Calculates HAZ (Height-for-Age Z-score) based on WHO reference.
 *
 * @param heightCm - Observed height of the child
 * @param ageInWeeks - Age in weeks (for age <= 13)
 * @param ageInMonths - Age in months (for age >= 4 months)
 * @param gender - "boy" or "girl"
 */
export const calculateHAZ = (
  heightCm: number,
  ageInWeeks: number,
  ageInMonths: number,
  gender: Gender
): { haz: number; classification: string } => {
  if (isNaN(heightCm) || heightCm <= 0 || !gender) {
    return { haz: 0, classification: "Invalid input" };
  }

  let data: GrowthRow[] = [];

  if (ageInWeeks <= 13) {
    const raw = gender === "boy" ? boys0To13Weeks : girls0To13Weeks;
    data = raw.map((row: any) => ({
      age: parseInt(row.Weeks),
      median: row["SD(M)"],
      plus1SD: row["1 SD"],
    }));
  } else if (ageInMonths >= 4 && ageInMonths <= 60) {
    const raw = gender === "boy" ? boys4mTo5y : girls4mTo5y;

    data = raw.map((row: any) => ({
      age: parseInt(row.Month),
      median: row["SD(M)"],
      plus1SD: row["1 SD"],
    }));
  } else {
    return { haz: 0, classification: "Age out of supported range" };
  }

  const ageKey = ageInWeeks <= 13 ? ageInWeeks : ageInMonths;

  const row = data.reduce((prev, curr) => {
    return Math.abs(curr.age - ageKey) < Math.abs(prev.age - ageKey)
      ? curr
      : prev;
  });

  const median = parseFloat(row.median as string);
  const plus1SD = parseFloat(row.plus1SD as string);
  const SD = plus1SD - median;

  if (isNaN(median) || isNaN(plus1SD) || Math.abs(SD) < 0.0001) {
    return { haz: 0, classification: "Invalid reference values" };
  }

  const hazRaw = (heightCm - median) / SD;
  const haz = parseFloat(hazRaw.toFixed(2));
  const classification = classifyHAZ(haz);

  return { haz, classification };
};

const classifyHAZ = (z: number): string => {
  if (z < -3) return "Severe stunting";
  if (z >= -3 && z < -2) return "Moderate stunting";
  if (z >= -2 && z <= 2) return "Normal height for age";
  if (z > 2 && z <= 3) return "Tall for age";
  return "Very tall for age";
};
