export const calculateZScore = (observed: number, median: number, sd: number) => {
    return ((observed - median) / sd);
  };

  // const interpretZScore = (zScore: number) => {
  //   if (zScore < -3) return { label: "Severe Stunting", color: "bg-red-600" };
  //   if (zScore < -2) return { label: "Moderate Stunting", color: "bg-orange-500" };
  //   if (zScore < -1) return { label: "Mild Stunting", color: "bg-yellow-500" };
  //   if (zScore < 1) return { label: "Normal Height", color: "bg-green-500" };
  //   if (zScore < 2) return { label: "Above Average Height", color: "bg-blue-400" };
  //   if (zScore < 3) return { label: "Tall for Age", color: "bg-indigo-500" };
  //   return { label: "Exceptionally Tall", color: "bg-purple-600" };
  // };

  type GrowthData = {
    week: number;
    sdMinus3: number;
    sdMinus2: number;
    sdMinus1: number;
    sd0: number;
    sd1: number;
    sd2: number;
    sd3: number;
  };
  
  const growthMetrics: GrowthData[] = [
    { week: 0, sdMinus3: 10.1, sdMinus2: 11.1, sdMinus1: 12.2, sd0: 13.3, sd1: 14.6, sd2: 16.1, sd3: 17.7 },
    { week: 1, sdMinus3: 9.5, sdMinus2: 10.7, sdMinus1: 11.9, sd0: 13.2, sd1: 14.5, sd2: 15.9, sd3: 17.3 },
    { week: 2, sdMinus3: 9.8, sdMinus2: 11, sdMinus1: 12.2, sd0: 13.5, sd1: 14.8, sd2: 16.2, sd3: 17.7 },
    { week: 3, sdMinus3: 10.2, sdMinus2: 11.4, sdMinus1: 12.6, sd0: 14, sd1: 15.3, sd2: 16.8, sd3: 18.3 },
    { week: 4, sdMinus3: 10.6, sdMinus2: 11.8, sdMinus1: 13.1, sd0: 14.4, sd1: 15.8, sd2: 17.4, sd3: 19 },
    { week: 5, sdMinus3: 11, sdMinus2: 12.2, sdMinus1: 13.5, sd0: 14.8, sd1: 16.3, sd2: 17.8, sd3: 19.5 },
  ];
  
  export const getBMICategory = (week: number, bmi: number) => {
    const data = growthMetrics.find((entry) => entry.week === week);
    if (!data) return { label: "Invalid Week", color: "bg-gray-400" };
  
    if (bmi < data.sdMinus3) return { label: "Severe Malnutrition", color: "bg-red-600" };
    if (bmi < data.sdMinus2) return { label: "Moderate Malnutrition", color: "bg-orange-500" };
    if (bmi < data.sdMinus1) return { label: "Mild Malnutrition", color: "bg-yellow-500" };
    if (bmi < data.sd1) return { label: "Normal", color: "bg-green-500" };
    if (bmi < data.sd2) return { label: "Overweight", color: "bg-blue-500" };
    if (bmi < data.sd3) return { label: "Obese", color: "bg-purple-500" };
  
    return { label: "Severe Obesity", color: "bg-pink-600" };
  };
  
