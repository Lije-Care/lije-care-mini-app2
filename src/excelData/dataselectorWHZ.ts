// data selector
import boys0To2Years from "@/excelData/Weight-for-height/boys_0_2_years.json";
import boys2To5Years from "@/excelData/Weight-for-height/boys_2_5_years.json";
import girls0To2Years from "@/excelData/Weight-for-height/girls_0_2_years.json";
import girls2To5Years from "@/excelData/Weight-for-height/girls_2_5_years.json";

export interface WeightForHeightEntry {
  cm: string;
  "-3 SD": string;
  "-2SD": string;
  "-1 SD": string;
  "SD(M)": string;
  "1SD": string;
  "2SD": string;
  "3SD": string;
}

export const getWeightForHeightData = (
  gender: "boy" | "girl",
  ageGroup: "0_2" | "2_5"
): WeightForHeightEntry[] => {
  if (gender === "boy" && ageGroup === "0_2") return boys0To2Years;
  if (gender === "boy" && ageGroup === "2_5") return boys2To5Years;

  if (gender === "girl" && ageGroup === "0_2") return girls0To2Years;
  if (gender === "girl" && ageGroup === "2_5") return girls2To5Years;
  return [];
};
