import boys0To13Weeks from "@/excelData/BMI-for-age/boys_0_to_13_weeks.json";
import boys4mTo10y from "@/excelData/BMI-for-age/boys_4m_to_19y.json";
import girls0To13Weeks from "@/excelData/BMI-for-age/girls_0_to_13_weeks.json";
import girls4mTo10y from "@/excelData/BMI-for-age/girls_4m_to_19y.json";

export interface BMIForAgeEntry {
  Weeks?: string;
  Months?: string;
  SD: string;
  "1 SD": string;
}

export const getBMIForAgeData = (
  gender: "boy" | "girl",
  // ageValue: number,
  ageType: "week" | "month"
): BMIForAgeEntry[] => {
  // console.log("Fetching BMI data for:", ageValue);

  if (gender === "boy" && ageType === "week") {
    return boys0To13Weeks.map((entry: any) => ({
      Weeks: entry.weeks,
      Months: undefined,
      SD: entry["SD(M)"],
      "1 SD": entry["1 SD"],
    }));
  }
  if (gender === "boy" && ageType === "month") {
    return boys4mTo10y.map((entry: any) => ({
      Months: entry.Month,
      Weeks: undefined,
      SD: entry["SD(M)"],
      "1 SD": entry["1 SD"],
    }));
  }
  if (gender === "girl" && ageType === "week") {
    return girls0To13Weeks.map((entry: any) => ({
      Weeks: entry.weeks,
      Months: undefined,
      SD: entry["SD(M)"],
      "1 SD": entry["1 SD"],
    }));
  }
  if (gender === "girl" && ageType === "month") {
    return girls4mTo10y.map((entry: any) => ({
      Months: entry.Month,
      Weeks: undefined,
      SD: entry["SD(M)"],
      "1 SD": entry["1 SD"],
    }));
  }

  return [];
};
