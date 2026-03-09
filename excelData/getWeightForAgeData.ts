import boys0To13Weeks from "@/excelData/Weight-for-age/boys_0_to_13_weeks.json";
import boys4mTo10y from "@/excelData/Weight-for-age/boys_4m_to_10y.json";
import girls0To13Weeks from "@/excelData/Weight-for-age/girls_0_to_13_weeks.json";
import girls4mTo10y from "@/excelData/Weight-for-age/girls_4m_to_10y.json";

export interface WeightForAgeEntry {
  Weeks?: string;
  Months?: string;
  SD: string;
  "1 SD": string;
}

export const getWeightForAgeData = (
  gender: "boy" | "girl",
  ageValue: number,
  ageType: "week" | "month"
): WeightForAgeEntry[] => {
  if (gender === "boy" && ageType === "week") {
    return boys0To13Weeks.map((entry: any) => ({
      Weeks: entry.weeks,
      Months: undefined,
      SD: entry["SD(M)"],
      "1 SD": entry["1 SD"],
    }));
  }
  console.log(ageValue);
  if (gender === "boy" && ageType === "month") {
    return boys4mTo10y.map((entry: any) => ({
      Months: entry.Month,
      SD: entry["SD(M)"],
      "1 SD": entry["1 SD"],
      Weeks: undefined,
    }));
  }
  if (gender === "girl" && ageType === "week") return girls0To13Weeks;
  if (gender === "girl" && ageType === "month") {
    return girls4mTo10y.map((entry: any) => ({
      Months: entry.Month,
      SD: entry["SD(M)"],
      "1 SD": entry["1 SD"],
      Weeks: undefined,
    }));
  }
  return [];
};
