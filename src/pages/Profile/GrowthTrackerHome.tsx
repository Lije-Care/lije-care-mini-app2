// GrowthTrackerHome.tsx
"use client";
import { useEffect, useState } from "react";
import { calculateHAZ } from "@/excelData/calculateHAZ";
import { calculateWHZ } from "@/excelData/calculateWHZ";
import { calculateWAZ } from "@/excelData/calculateWAZ";
import { calculateBMIZ } from "@/excelData/calculateBMIZ";
import { calculateMUACZ } from "@/excelData/calculateMUACZ";
import { getAgeDetails, getWHZRange } from "@/excelData/growthAgeUtils";
import { classifyZ } from "../../utils/growthUtils";
import { useTranslation } from "react-i18next";
import { differenceInWeeks } from "date-fns";

interface ChildProfile {
  date_of_birth: any;
  name: string;
  ageMonths: number;
  gender: string;
  weight: number;
  height: number;
  muac: number;
}

interface ZScoreResult {
  zScore: number;
  // Add other properties if needed based on calculator outputs
}

interface CalculatedZScores {
  BMI: ZScoreResult;
  MUAC: number;
  HAZ: { haz: number };
  WHZ: { zScore: number };
  WAZ: { zScore: number };
}

interface Indicator {
  key: string;
  label: string;
  value: number;
  type: string;
}

const GrowthTrackerHome = ({ childProfile }: { childProfile: any }) => {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [zScores, setZScores] = useState<CalculatedZScores | null>(null);
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (childProfile) {
      setChild(childProfile);

      const birthDate = new Date(childProfile.date_of_birth);
      const today = new Date();

      // Calculate age in days
      const diffInMs = today.getTime() - birthDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // Convert to months using 30 days per month (rounded normally)
      const ageInMonths = Math.round(diffInDays / 30);

      // Weeks (using date-fns for precision)
      const ageInWeeks = differenceInWeeks(today, birthDate);

      const measuredStanding = childProfile.height > 87;
      const gender =
        childProfile.gender.toLowerCase() === "female" ? "girl" : "boy";

      const bmiResult = calculateBMIZ(
        childProfile.weight,
        childProfile.height,
        ageInWeeks <= 13 ? ageInWeeks : ageInMonths,
        ageInWeeks <= 13 ? "week" : "month",
        gender,
        measuredStanding
      );

      const calculatedZScores: CalculatedZScores = {
        BMI: bmiResult,
        MUAC: calculateMUACZ(childProfile.muac, ageInMonths, gender).zScore,
        HAZ: calculateHAZ(childProfile.height, ageInWeeks, ageInMonths, gender),
        WHZ: calculateWHZ(
          childProfile.weight,
          childProfile.height,
          gender,
          getWHZRange(childProfile.date_of_birth)
        ),
        WAZ: calculateWAZ(
          childProfile.weight,
          getAgeDetails(childProfile.date_of_birth).age,
          getAgeDetails(childProfile.date_of_birth).type,
          gender
        ),
      };

      setZScores(calculatedZScores);
    }
  }, [childProfile]);

  if (!child || !zScores) {
    return <div className="text-center text-gray-400 mt-10">Loading...</div>;
  }

  const indicators: Indicator[] = [
    {
      key: "HAZ",
      label: "Height for Age",
      value: zScores.HAZ.haz,
      type: "Height",
    },
    {
      key: "WHZ",
      label: "Weight for Height",
      value: zScores.WHZ.zScore,
      type: "Height",
    },
    {
      key: "WAZ",
      label: "Weight for Age",
      value: zScores.WAZ.zScore,
      type: "BMI",
    },
    {
      key: "BMI",
      label: "BMI for Age",
      value: zScores.BMI.zScore,
      type: "BMI",
    },
    {
      key: "MUAC",
      label: "MUAC for Age",
      value: zScores.MUAC,
      type: "MUAC",
    },
  ];

  const visibleIndicators = expanded ? indicators : indicators.slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto font-sans text-white space-y-4 p-4">
      <div className="text-center font-extrabold italic py-1 text-lime-600">
        Child: <span className="underline">{child.name}</span>{" "}
        {t("Anthropometric")}
      </div>
      <div className="flex flex-row overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent md:grid md:grid-cols-3 md:overflow-x-visible">
        {visibleIndicators.map(({ key, label, value, type }) => {
          const result = classifyZ(value, type);
          const normalizedProgress = Math.max(0, Math.min(1, (value + 3) / 6));
          const dashOffset = 100 * (1 - normalizedProgress);
          return (
            <div
              key={key}
              className="flex-shrink-0 w-64 md:w-auto rounded-xl bg-[#0B8FAC] border border-gray-700 p-4 shadow-sm flex flex-col justify-center items-center"
            >
              <div className="relative size-40 flex flex-col justify-center items-center">
                <svg
                  className="size-full rotate-[-90deg]"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="text-gray-600"
                    strokeWidth="2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className={`stroke-current ${result.color}`}
                    strokeWidth="4"
                    strokeDasharray="100 100"
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute top-1/2 start-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className={`text-4xl font-bold ${result.color}`}>
                    {value}
                  </span>
                  <span className={`${result.color} block`}>Z Score</span>
                </div>
              </div>
              <div className="mt-1 text-sm flex flex-col justify-center items-center">
                <h3 className="text-gray-100 font-bold text-xl">{label}</h3>
                <p className={`font-medium ${result.color}`}>{result.label}</p>
                <p className="text-gray-200 text-xs">{result.note}</p>
              </div>
            </div>
          );
        })}
      </div>
      {indicators.length > 3 && (
        <div className="text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-teal-400 underline text-sm"
          >
            {expanded ? "View Less" : "View More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default GrowthTrackerHome;
