import { useEffect, useState, useMemo } from "react";
import api, { getPreferredLanguage } from "@/api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import fallback from "@/assets/meal.png";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { calculateNutrients } from "@/utils/calculateNutrients";

type SelectedMeal = {
  meal: any;
  multiplier: number;
  selectedMealTime: string;
};

const MEAL_TIME_OPTIONS = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"] as const;

const mealMatchesTime = (mealTimes: string[] | undefined, activeTab: string) => {
  if (!Array.isArray(mealTimes) || mealTimes.length === 0) {
    return MEAL_TIME_OPTIONS.includes(activeTab as (typeof MEAL_TIME_OPTIONS)[number]);
  }

  return mealTimes.includes(activeTab);
};

const MealLibraryComponent = () => {
  const { t, i18n } = useTranslation();
  const [meals, setMeals] = useState<any[]>([]);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);
  const [mealDescription, setMealDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [dateSelected, setDateSelected] = useState(false);
  const [allMealPlans, setAllMealPlans] = useState<any[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const currentUserId = useMemo(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return null;
      const parsed = JSON.parse(rawUser);
      return parsed?.id ? String(parsed.id) : null;
    } catch {
      return null;
    }
  }, []);
  const { data: children } = useSelector((state: RootState) => state.children);
  const { id: paramId } = useParams<{ id: string }>();
  const child = useMemo(
    () => children.find((c: any) => c.id === paramId),
    [children, paramId]
  );
  const dailyResult = useMemo<any | null>(() => {
    if (!child || !child.gender || !child.date_of_birth)
      return null;
    return calculateNutrients(
      child.weight,
      child.height,
      child.gender,
      child.date_of_birth,
      child.activity_level || "Moderate"
    );
  }, [child]);
  const calculateYieldVolume = (meal: any) => {
    return (
      meal?.mealIngredients?.reduce((acc: number, item: any) => {
        const ing = item.ingredient;
        const type = ing?.portionUnit?.type?.toLowerCase();
        const quantity = item.quantity ?? 0;
        const conversion = ing?.portionUnit?.conversionToBase ?? 1;
        let volume = 0;
        if (type === "mass") {
          const mass = quantity * conversion;
          if (ing?.density && ing.density > 0) {
            volume = mass / ing.density;
          }
        } else if (type === "volume") {
          volume = quantity * conversion;
        }
        return acc + volume;
      }, 0) ?? 0
    );
  };

  const calculateMealNutrients = (meal: any) => {
    const nutrientsByType: Record<string, { amount: number; unit?: string }> =
      {};
    meal?.mealIngredients?.forEach((item: any) => {
      const ing = item.ingredient;
      // const conversionToBase = ing?.portionUnit?.conversionToBase ?? 1;
      const portionSize = ing?.portionSize ?? 1;
      const quantity = item.quantity ?? 1;
      ing?.nutrientAmounts?.forEach((na: any) => {
        const nutrientType = (na?.nutrient?.name || "other").toLowerCase();
        const normalizedNutrientType =
          nutrientType === "energy" ? "calories" : nutrientType;
        const unit = na?.nutrient?.unit || "";
        const adjustedAmount = na.amount * (quantity / portionSize);
        if (!nutrientsByType[normalizedNutrientType])
          nutrientsByType[normalizedNutrientType] = { amount: 0, unit };
        nutrientsByType[normalizedNutrientType].amount += adjustedAmount;
      });
    });
    return nutrientsByType;
  };
  const computeNutrients = (selected: SelectedMeal[]) => {
    const totals: Record<string, { amount: number; unit?: string }> = {};
    let totalVolume = 0;
    selected.forEach(({ meal, multiplier }) => {
      const effectiveMultiplier = multiplier; // * 1 for selected time
      const mealYieldVolume = calculateYieldVolume(meal);
      totalVolume += mealYieldVolume * effectiveMultiplier;
      const mealNutrients = calculateMealNutrients(meal);
      for (const [name, { amount, unit }] of Object.entries(mealNutrients)) {
        if (!totals[name]) totals[name] = { amount: 0, unit };
        totals[name].amount += amount * effectiveMultiplier;
      }
    });
    return { totalVolume, nutrients: totals };
  };
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await api.get(
          `meal/find-all?skip=0&limit=1000&lang=${i18n.language || getPreferredLanguage()}`
        );
        const responseData = Array.isArray(res.data)
          ? res.data
          : res.data?.data;
        setMeals(responseData || []);
      } catch (err) {
        console.error("Error fetching meals:", err);
        setError(t("Could not load meals. Please try again."));
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, [t, i18n.language]);
  useEffect(() => {
    if (!paramId) return;
    const fetchAllMealPlans = async () => {
      try {
        const response = await api.get(
          `/meal-plans/by-child/${paramId}?lang=${i18n.language || getPreferredLanguage()}`
        );
        const basicPlans = response.data?.data ?? [];
        const detailedPlans = await Promise.all(
          basicPlans.map(async (plan: any) => {
            try {
              const res = await api.get(
                `/meal-plans/find-one/${plan.id}?lang=${i18n.language || getPreferredLanguage()}`
              );
              return res.data;
            } catch (err) {
              console.error(`Error fetching detail for plan ${plan.id}:`, err);
              return plan;
            }
          })
        );
        const normalizedPlans = detailedPlans.map((plan) => ({
          ...plan,
          meals: plan.meals?.map((meal: any) => ({
            ...meal,
            mealTimes: Array.isArray(meal.mealTimes)
              ? meal.mealTimes
              : meal.mealTimes
              ? [meal.mealTimes]
              : [],
          })),
        }));
        setAllMealPlans(normalizedPlans);
      } catch (err) {
        console.error("Error fetching meal plans:", err);
        setAllMealPlans([]);
      }
    };
    fetchAllMealPlans();
  }, [paramId, i18n.language]);
  useEffect(() => {
    if (meals.length > 0 && !activeTab) {
      setActiveTab(MEAL_TIME_OPTIONS[0]);
    }
  }, [meals, activeTab]);
  const getDateKey = (dateStr: string) =>
    new Date(dateStr).toISOString().split("T")[0];
  const toggleMealExpand = (mealId: string) => {
    setExpandedMealId((prev) => (prev === mealId ? null : mealId));
  };
  const toggleMeal = (meal: any, mealTime: string) => {
    setSelectedMeals((prev) => {
      const exists = prev.find(
        (m) => m.meal.id === meal.id && m.selectedMealTime === mealTime
      );
      return exists
        ? prev.filter(
            (m) => !(m.meal.id === meal.id && m.selectedMealTime === mealTime)
          )
        : [...prev, { meal, multiplier: 1, selectedMealTime: mealTime }];
    });
  };
  const handleMultiplierChange = (
    mealId: string,
    mealTime: string,
    value: number
  ) => {
    setSelectedMeals((prev) =>
      prev.map((m) =>
        m.meal.id === mealId && m.selectedMealTime === mealTime
          ? { ...m, multiplier: Math.max(1, value) }
          : m
      )
    );
  };
  const allMealTimess = [...MEAL_TIME_OPTIONS];
  const filteredMeals = activeTab
    ? meals.filter((meal) => mealMatchesTime(meal.mealTimes, activeTab))
    : meals;
  const nutrientTotals = useMemo(
    () => computeNutrients(selectedMeals),
    [selectedMeals]
  );
  const existingMealsForDate = useMemo(() => {
    if (!selectedDateTime || !allMealPlans.length) return [];
    const dateKey = selectedDateTime;
    return allMealPlans
      .filter((p) => getDateKey(p.meal_date) === dateKey)
      .flatMap((p) =>
        (p.meals || []).map((m: any) => ({
          meal: m,
          multiplier: m.multiplier || 1,
        }))
      );
  }, [allMealPlans, selectedDateTime]);
  const existingSummary = useMemo(() => {
    // For existing, need to adapt to SelectedMeal type, but since computeNutrients now takes SelectedMeal[], adapt
    const adaptedExisting: SelectedMeal[] = existingMealsForDate.map(
      ({ meal, multiplier }) => ({
        meal,
        multiplier,
        selectedMealTime: "", // not used for existing
      })
    );
    return computeNutrients(adaptedExisting);
  }, [existingMealsForDate]);
  const getTotal = (nutrient: string) => {
    // if (nutrient === "water") {
    //   return existingSummary.totalVolume + nutrientTotals.totalVolume;
    // }
    return (
      (existingSummary.nutrients[nutrient]?.amount || 0) +
      (nutrientTotals.nutrients[nutrient]?.amount || 0)
    );
  };
  const getPercentage = (nutrient: string) => {
    if (!dailyResult || typeof dailyResult[nutrient as keyof any] !== "number")
      return 0;
    const daily = dailyResult[nutrient as keyof any] as number;
    const total = getTotal(nutrient);
    return Math.min(100, (total / daily) * 100);
  };
  const displayNutrients = useMemo(() => {
    if (!dailyResult) return [];
    return Object.keys(dailyResult).filter(
      (key) =>
        typeof (dailyResult as any)[key] === "number" &&
        !["bmi", "status"].includes(key)
    ) as (keyof any)[];
  }, [dailyResult]);
  const getLabel = (key: string) => {
    const labels: Record<string, string> = {
      calories: "Calories (kcal)",
      protein: "Protein (g)",
      fat: "Fat (g)",
      carbs: "Carbohydrates (g)",
      iron: "Iron (mg)",
      calcium: "Calcium (mg)",
      vitamina: "Vitamin A (mcg)",
      water: "Water (ml)",
      zinc: "Zinc (mg)",
    };
    return (
      labels[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1)
    );
  };
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };
  const handleConfirmMealPlan = async () => {
    if (!children.length) return navigate("/children");
    if (!paramId || !mealDescription.trim() || !selectedDateTime) {
      setSubmitError(t("Please add a description and meal date before saving."));
      return;
    }
    // Group by meal.id, sum multipliers, collect unique mealTimes for each meal
    const mealMap = selectedMeals.reduce(
      (map, { meal, multiplier, selectedMealTime }) => {
        if (!map.has(meal.id)) {
          map.set(meal.id, { multiplier: 0, mealTimes: new Set<string>() });
        }
        const entry = map.get(meal.id)!;
        entry.multiplier += multiplier;
        entry.mealTimes.add(selectedMealTime);
        return map;
      },
      new Map<string, { multiplier: number; mealTimes: Set<string> }>()
    );

    const mealTimesObj = Object.fromEntries(
      Array.from(mealMap.entries()).map(([id, { mealTimes }]) => [
        id,
        Array.from(mealTimes),
      ])
    );

    const mealsPayload = Array.from(mealMap.entries()).map(
      ([id, { multiplier }]) => ({
        id,
        multiplier,
      })
    );

    const payload = {
      expertId: currentUserId ?? paramId,
      childId: paramId,
      source: "parent",
      meal_description: mealDescription.trim(),
      meal_date: selectedDateTime,
      calories: Math.round(getTotal("calories")) || 0,
      mealTimes: mealTimesObj,
      meals: mealsPayload,
    };
    try {
      setSubmitting(true);
      setSubmitError(null);
      await api.post("/meal-plans/create", payload);
      setSelectedMeals([]);
      localStorage.setItem("favorite_child_id", paramId);
      navigate("/meals", {
        state: {
          openPlanning: true,
          planSourceTab: "parent",
          successMessage: "Meal plan saved to My Plans.",
        },
      });
    } catch (error) {
      console.error("Submit failed:", error);
      setSubmitError(
        t("Could not save meal plan. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (!dateSelected) {
    return (
      <div className="min-h-screen bg-gray-800">
        <div className="bg-[#013222] px-6 pt-6 pb-12 flex flex-col ">
          <h2 className="text-2xl font-bold text-emerald-400 flex justify-center items-center">
            {t("Select Meal Date & Time")}
          </h2>
          <button
            onClick={() => {
              navigate(-1);
            }}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium pb-2 mt-3 flex justify-start items-start"
          >
            ← Back
          </button>
        </div>
        <div className="p-6 max-w-md bg-[#0B364F] rounded-lg text-white space-y-6 mx-2 pb-12 pt-12 mt-12">
          <label htmlFor="date" className="py-2 text-emerald-400 font-serif">
            {t("Select meal date")}
          </label>
          <input
            type="date"
            id="date"
            className="w-full p-2 rounded bg-[#0d778f] text-white"
            placeholder="Select meal date"
            value={selectedDateTime}
            onChange={(e) => setSelectedDateTime(e.target.value)}
            min={getMinDate()}
          />
          <label htmlFor="date" className="py-2 text-emerald-400 font-serif">
            {t("Enter Description")}
          </label>
          <textarea
            className=" mt-2 w-full p-1 bg-gray-200 text-black rounded"
            rows={2}
            value={mealDescription}
            onChange={(e) => {
              setMealDescription(e.target.value);
            }}
            placeholder={t(" Please enter describe of meal plan...")}
          />
          <button
            disabled={!selectedDateTime}
            onClick={() => setDateSelected(true)}
            className={`w-full py-2 rounded text-white font-semibold transition-all ${
              !selectedDateTime
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {t("Continue")}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-800">
      <div className="bg-[#013222] p-4">
        <h1 className="text-2xl font-bold text-emerald-400">
          🍽️ {t("Create Meal Plan")}
        </h1>
        <button
          onClick={() => {
            navigate(-1);
          }}
          className="text-emerald-400 hover:text-emerald-300 text-sm font-medium mt-3 flex justify-start items-start"
        >
          ← Back
        </button>
      </div>
      <div className="">
        <ul className="bg-[#013222] pl-3 pt-3 pb-1.5 flex flex-wrap text-sm font-medium text-center border-b border-gray-200">
          {allMealTimess.map((time) => (
            <li key={time} className="">
              <button
                onClick={() => setActiveTab(time)}
                className={`py-1 px-2 text-[18px] font-normal whitespace-nowrap mx-auto w-full rounded-sm ${
                  activeTab === time
                    ? "bg-[#0B8FAC] text-white"
                    : " text-gray-200 text-xl font-extrabold"
                } rounded-lg`}
              >
                {time}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-4 max-w-3xl mx-auto text-white space-y-6 mt-2">
        {dailyResult && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-300">
              📊 Daily Nutrient Progress
            </h3>
            <button
              onClick={() => setShowProgress(!showProgress)}
              className="bg-[#0B8FAC] hover:bg-[#0ea4c6] px-2 py-1 rounded text-gray-100 "
            >
              {showProgress ? "Hide Progress Bar" : "View Progress Bar"}
            </button>
            <p className=" -mt-3 text-sm text-gray-500 font-sans">
              {" "}
              This bar is used to compare the meal added and the daily
              requirements
            </p>
            {showProgress &&
              displayNutrients.map((key) => {
                const perc = getPercentage(key as any);
                const isOver = perc >= 100;
                const current = getTotal(key as any);
                const daily = dailyResult[key as any] as number;
                const barColor = isOver ? "bg-red-600" : "bg-blue-600";
                const textColor = isOver ? "text-red-100" : "text-blue-100";
                const label = getLabel(key as any);
                return (
                  <div key={key as any} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-gray-300">
                        {current.toFixed(key === "calories" ? 0 : 2)} /{" "}
                        {daily.toFixed(key === "calories" ? 0 : 2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative dark:bg-gray-700">
                      <div
                        className={`h-full ${barColor} rounded-full absolute left-0 top-0 transition-all duration-300 ease-in-out`}
                        style={{ width: `${Math.min(100, perc)}%` }}
                      />
                      <div className="flex justify-between items-center absolute inset-0 px-2 -translate-y-0.5">
                        <span
                          className={`text-xs font-medium ${textColor} z-10 bg-transparent`}
                        >
                          {current.toFixed(key === "calories" ? 0 : 2)}
                        </span>
                        <span
                          className={`text-xs font-medium ${textColor} z-10 bg-transparent`}
                        >
                          {daily.toFixed(key === "calories" ? 0 : 2)}
                        </span>
                      </div>
                    </div>
                    {isOver && (
                      <span className="text-xs text-red-400">
                        ⚠️ Exceeded daily limit!
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        )}
        {selectedMeals.length > 0 && (
          <div className="bg-[#0d778f] p-4 rounded">
            <h2 className="text-lg font-bold text-emerald-300 mb-2">
              📊 {t("Total Nutrients (Current Selection)")}
            </h2>
            <ul className="text-sm space-y-1">
              <li className="text-gray-100">
                <strong>Total Volume:</strong>{" "}
                {nutrientTotals.totalVolume.toFixed(2)} ml
              </li>
              {Object.entries(nutrientTotals.nutrients).length > 0 ? (
                Object.entries(nutrientTotals.nutrients).map(
                  ([name, { amount }]) => (
                    <li key={name} className="text-gray-100">
                      {name}:{" "}
                      <span className="text-emerald-300">
                        {amount.toFixed(2)}
                      </span>
                    </li>
                  )
                )
              ) : (
                <li className="text-gray-400 italic">No nutrients available</li>
              )}
            </ul>
          </div>
        )}
        {loading ? (
          <p className="text-center text-gray-300">Loading meals...</p>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : filteredMeals.length === 0 ? (
          <p className="text-center text-gray-300">
            No meals available for this tab.
          </p>
        ) : (
          filteredMeals.map((meal) => {
            const thisSelected = selectedMeals.find(
              (m) => m.meal.id === meal.id && m.selectedMealTime === activeTab
            );
            const expanded = expandedMealId === meal.id;
            const yieldVolume = calculateYieldVolume(meal);
            const mealTimesDisplay = Array.isArray(meal.mealTimes)
              ? meal.mealTimes.join(", ")
              : meal.mealTimes || "N/A";
            return (
              <div
                key={meal.id}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer border-gray-700 shadow-sm mb-6 ${
                  thisSelected ? "bg-[#0d778f]" : "bg-[#0B8FAC]"
                }`}
                onClick={() => toggleMealExpand(meal.id)}
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={
                      typeof meal.imageUrl === "string" &&
                      meal.imageUrl.startsWith("http")
                        ? meal.imageUrl
                        : `${fallback}`
                    }
                    alt={meal.name}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-700"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = `${fallback}`;
                    }}
                  />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-emerald-300">
                      {meal.name}
                    </h2>
                    <p className="text-xs text-white italic">
                      Age: {meal.ageGroup} m+ · {meal.mealType} ·{" "}
                      {mealTimesDisplay}
                    </p>
                    <div className="flex mt-2 items-center">
                      <Eye className="h-4 w-4 text-gray-300 ml-2" />
                      <span className="text-gray-300 ml-1 text-sm underline font-serif">
                        View
                      </span>
                    </div>
                    <div className="flex gap-2 items-center mt-2">
                      <label className="text-sm text-gray-100">
                        Multiplier:
                      </label>
                      <input
                        type="number"
                        min={1}
                        disabled={!thisSelected}
                        className="w-16 text-black px-2 py-1 bg-gray-300 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                        value={thisSelected?.multiplier ?? 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleMultiplierChange(
                            meal.id,
                            activeTab,
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
                {expanded && (
                  <div className="mt-4 space-y-2 text-sm bg-[#D9D9D94D] p-4 rounded-lg">
                    <p className="text-gray-100">
                      <strong>Description:</strong> {meal.description}
                    </p>
                    <p className="text-gray-100">
                      <strong>Meal Type:</strong> {meal.mealType}
                    </p>
                    <p className="text-gray-100">
                      <strong>Meal Time:</strong> {mealTimesDisplay}
                    </p>
                    <p className="text-gray-100">
                      <strong>Yield Volume:</strong>{" "}
                      {yieldVolume.toFixed(2) ?? "N/A"} ml
                    </p>
                    <p className="text-gray-100">
                      <strong>Allergen Description:</strong>{" "}
                      {meal.allergenDescription}
                    </p>
                    <p className="text-gray-100">
                      <strong>Intolerance Description:</strong>{" "}
                      {meal.intoleranceDescription}
                    </p>
                    <p className="text-gray-100">
                      <strong>Drug Interaction:</strong> {meal.drugInteraction}
                    </p>
                    <p className="text-gray-100">
                      <strong>Direction:</strong> {meal.direction}
                    </p>
                    <p className="text-gray-100">
                      <strong>How to Store:</strong> {meal.howToStore}
                    </p>
                    <p className="text-gray-100">
                      <strong>Direction:</strong>
                      <a
                        href={meal.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-200 px-2 underline text-sm"
                      >
                        Watch Video
                      </a>
                    </p>
                    <p className="text-gray-100">
                      <strong>Ingredients:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      {meal?.mealIngredients?.length ? (
                        meal.mealIngredients.map((mi: any) => (
                          <li key={mi.id}>
                            {mi.quantity}{" "}
                            {mi.ingredient?.portionUnit?.abbreviation ?? ""} of{" "}
                            {mi.ingredient?.name ?? "Unknown"}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400 italic">
                          No ingredients available
                        </li>
                      )}
                    </ul>
                    <p className="text-gray-100">
                      <strong>Nutrients:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      {(() => {
                        const nutrientsByType = calculateMealNutrients(meal);
                        const entries = Object.entries(nutrientsByType);
                        return entries.length ? (
                          entries.map(([name, { amount }]) => (
                            <li key={name}>
                              {name} –{" "}
                              <span className="text-emerald-300">
                                {amount.toFixed(2)}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400 italic">
                            No nutrients available
                          </li>
                        );
                      })()}
                    </ul>
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMeal(meal, activeTab);
                    }}
                    className={`text-xs px-4 py-1.5 rounded font-semibold transition-all ${
                      thisSelected
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-teal-300 text-black hover:bg-blue-600"
                    }`}
                  >
                    {thisSelected ? "Remove" : "Add"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <button
        onClick={handleConfirmMealPlan}
        disabled={submitting || selectedMeals.length === 0}
        className={`fixed bottom-12 left-4 z-50 w-[320px] mx-3 py-2 rounded-lg  text-white text-lg font-semibold transition-all shadow-lg ${
          submitting || selectedMeals.length === 0 || !mealDescription.trim()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {submitting ? t("Submitting...") : `✅ ${t("Confirm Meal Plan")}`}
      </button>
      {submitError && (
        <div className="fixed bottom-28 left-4 right-4 z-50 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-700 shadow-lg">
          {submitError}
        </div>
      )}
    </div>
  );
};
export default MealLibraryComponent;
