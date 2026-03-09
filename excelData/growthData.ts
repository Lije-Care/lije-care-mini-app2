import boys0To13Weeks from "@/excelData/Height-for-age/boys_0_to_13_weeks.json";
import boys4mTo5y from "@/excelData/Height-for-age/boys_4m_to_5y.json";
import girls0To13Weeks from "@/excelData/Height-for-age/girls_0_to_13_weeks.json";
import girls4mTo5y from "@/excelData/Height-for-age/girls_4m_to_5y.json";

export interface GrowthEntry {
  week?: number;
  month?: number;
  median: number;
  plus1SD: number;
  minus1SD?: number;
}

type Gender = "boy" | "girl";
type AgeType = "week" | "month";

const mapToGrowthEntry = (data: any[], ageType: AgeType): GrowthEntry[] => {
  return data.map((entry) => ({
    week: ageType === "week" ? Number(entry.Week) : undefined,
    month: ageType === "month" ? Number(entry.Month) : undefined,
    median: Number(entry["SD(M)"]),
    plus1SD: Number(entry["1 SD"]),
    minus1SD: entry["-1 SD"] !== undefined ? Number(entry["-1 SD"]) : undefined,
  }));
};

const growthDataMap: Record<Gender, Record<AgeType, GrowthEntry[]>> = {
  boy: {
    week: mapToGrowthEntry(boys0To13Weeks, "week"),
    month: mapToGrowthEntry(boys4mTo5y, "month"),
  },
  girl: {
    week: mapToGrowthEntry(girls0To13Weeks, "week"),
    month: mapToGrowthEntry(girls4mTo5y, "month"),
  },
};

export const getGrowthData = (
  gender: Gender,
  ageType: AgeType
): GrowthEntry[] => {
  const data = growthDataMap[gender]?.[ageType];
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn(`No growth data available for gender: ${gender}, ageType: ${ageType}`);
    return [];
  }
  return data;
};
