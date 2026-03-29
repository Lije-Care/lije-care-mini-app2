import boysMuacData from "@/excelData/MUAC-for-age/boys_0_to_5y.json";
import girlsMuacData from "@/excelData/MUAC-for-age/girls_0_to_5y.json";

export interface MUACForAgeEntry {
  Months: string;
  Median: string;
  "1 SD": string;
}

export const getMUACForAgeData = (
  gender: "boy" | "girl"
): MUACForAgeEntry[] => {
  if (gender === "boy") {
    return boysMuacData.map((entry: any) => ({
      Months: entry.Month,
      Median: entry["SD(M)"],
      "1 SD": entry["1 SD"],
    }));
  }

  if (gender === "girl") {
    return girlsMuacData.map((entry: any) => ({
      Months: entry.Months,
      Median: entry["SD"],
      "1 SD": entry["1 SD"],
    }));
  }

  return [];
};
