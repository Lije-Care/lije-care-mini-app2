import { useState, useEffect, useMemo } from "react";
import api, { getPreferredLanguage } from "@/api/axios";
import { Placeholder } from "@telegram-apps/telegram-ui";
import { useNavigate, useParams } from "react-router-dom";
import { Page } from "@/components/Page";
import { useTranslation } from "react-i18next";
import { FaTrash } from "react-icons/fa";
import { Eye } from "lucide-react";
import fallback from "@/assets/meal.png";

type Meal = {
  id: string;
  name: string;
  mealType: string;
  mealTimes: string[];
  description?: string;
  yieldVolume?: string;
  directions?: string[];
  direction?: string;
  videoUrl?: string;
  ingredients?: string[];
  mealIngredients?: any[];
  ing?: string[];
  nutrients?: { [key: string]: any };
  ageGroup?: string;
  imageUrl?: string;
};

type MealPlan = {
  id: string;
  meal_description: string;
  calories: number;
  createdAt: string;
  meal_date: string;
  expert: {
    firstName: string;
    lastName: string;
    role: string;
  };
  child: {
    name: string;
    dietary_restrictions: string;
    allergies: string;
  };
  meals?: Meal[];
  mealTimes?: { [key: string]: string[] };
};

const ChildMealPlanSummary = () => {
  const { t, i18n } = useTranslation();
  const [mealPlans, setMealPlans] = useState<any[] | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const { id } = useParams<{ id: string }>();
  const childId = id;
  const navigate = useNavigate();

  const getDateKey = (dateStr: string) =>
    new Date(dateStr).toISOString().split("T")[0];

  const fetchMealDetails = async (mealPlanId: string) => {
    try {
      const res = await api.get(
        `/meal-plans/find-one/${mealPlanId}?lang=${i18n.language || getPreferredLanguage()}`
      );
      return res.data;
    } catch (err) {
      console.error("Error fetching meal detail:", err);
      return null;
    }
  };

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

  useEffect(() => {
    if (!childId) return;
    api
      .get(
        `/meal-plans/by-child/${childId}?lang=${i18n.language || getPreferredLanguage()}`
      )
      .then(async (response) => {
        const basicPlans = response.data?.data ?? [];
        const detailedPlans = await Promise.all(
          basicPlans.map(async (plan: MealPlan) => {
            const detail = await fetchMealDetails(plan.id);
            return detail || plan;
          })
        );
        // normalize mealTimes to array
        const normalizedPlans = detailedPlans.map((plan) => ({
          ...plan,
          mealTimes: plan.mealTimes || {}, // ensure it’s an object
          meals:
            plan.meals?.map((meal: any) => ({
              ...meal,
              // we don’t need to overwrite mealTimes here, it comes from plan
            })) || [],
        }));

        setMealPlans(normalizedPlans);
      })
      .catch((err) => {
        console.error("Error fetching meal plans:", err);
        setMealPlans([]);
      });
  }, [childId, i18n.language]);

  const uniqueDates = useMemo(() => {
    if (!mealPlans) return [];
    return Array.from(
      new Set(mealPlans.map((p) => getDateKey(p.meal_date)))
    ).sort((b, a) => new Date(b).getTime() - new Date(a).getTime());
  }, [mealPlans]);

  const filteredPlans = useMemo(() => {
    if (!activeDate || !mealPlans) return [];
    return mealPlans
      .filter((p) => getDateKey(p.meal_date) === activeDate)
      .sort(
        (a, b) =>
          new Date(b.meal_date).getTime() - new Date(a.meal_date).getTime()
      );
  }, [mealPlans, activeDate]);

  // Concatenated meal descriptions for the selected date
  const concatenatedDescriptions = useMemo(() => {
    if (!filteredPlans) return "";
    return filteredPlans
      .map((p) => p.meal_description)
      .filter(Boolean)
      .join(" , ");
  }, [filteredPlans]);

  // collect all unique meal times for tabs
  const allMealTimess = useMemo(() => {
    if (!filteredPlans) return [];
    const times = filteredPlans.flatMap(
      (plan) => Object.values(plan.mealTimes || {}).flat() // flatten all mealTimes arrays
    );
    return Array.from(new Set(times)); // unique
  }, [filteredPlans]);

  useEffect(() => {
    if (filteredPlans && filteredPlans.length > 0 && activeDate && !activeTab) {
      const allMealTimesSet = Array.from(
        new Set(
          filteredPlans.flatMap((plan) =>
            Object.values(plan.mealTimes || {}).flat()
          )
        )
      );
      if (allMealTimesSet.length > 0) setActiveTab(allMealTimesSet[0] as any);
    }
  }, [filteredPlans, activeDate, activeTab]);

  const handleDeleteMealPlan = async () => {
    if (!selectedMealPlan) return;
    setDeleting(true);
    try {
      await api.delete(`/meal-plans/${selectedMealPlan.id}`);
      setMealPlans((prev) =>
        prev ? prev.filter((plan) => plan.id !== selectedMealPlan.id) : []
      );
      setShowConfirmDelete(false);
      setSelectedMealPlan(null);
    } catch (err) {
      console.error("Error deleting meal plan:", err);
      setError(t("Failed to delete meal plan. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (mealPlan: MealPlan) => {
    setSelectedMealPlan(mealPlan);
    setShowConfirmDelete(true);
  };
  // ✅ Nutrient calculator (per meal)
  const calculateMealNutrients = (meal: any) => {
    const nutrientsByType: Record<string, { amount: number; unit?: string }> =
      {};
    meal?.mealIngredients?.forEach((item: any) => {
      const ing = item.ingredient;
      const portionSize = ing?.portionSize ?? 1;
      const quantity = item.quantity ?? 1;
      ing?.nutrientAmounts?.forEach((na: any) => {
        const nutrientType = (na?.nutrient?.name || "other").toLowerCase();
        const unit = na?.nutrient?.unit || "";
        const adjustedAmount = na.amount * (quantity / portionSize);
        if (!nutrientsByType[nutrientType])
          nutrientsByType[nutrientType] = { amount: 0, unit };
        nutrientsByType[nutrientType].amount += adjustedAmount;
      });
    });
    return nutrientsByType;
  };

  // date card
  const DateCard = ({ dateKey }: { dateKey: string }) => {
    const formattedDate = new Date(dateKey).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className=" flex justify-between p-4 shadow-sm bg-[#0B8FAC] rounded-xl w-full border border-gray-200 hover:shadow-md cursor-pointer transition-all">
        <div
          key={dateKey}
          className=" py-2"
          onClick={() => setActiveDate(dateKey)}
        >
          <h3 className="text-lg font-bold text-emerald-300">
            {formattedDate}
          </h3>
        </div>
        <button
          onClick={() => setActiveDate(dateKey)}
          className=" font-serif text-base"
        >
          View Detail
        </button>
      </div>
    );
  };

  // MealCard Component
  const MealCard = ({ meal, plan }: { meal: Meal; plan?: MealPlan }) => {
    const yieldVolume = calculateYieldVolume(meal);
    const nutrientsByType = calculateMealNutrients(meal); // ✅ calculate here
    const [expanded, setExpanded] = useState(false);
    const toggleMealExpand = () => setExpanded((prev) => !prev);

    const mealTimesDisplay = plan?.mealTimes?.[meal.id]?.join(", ") || "N/A";

    return (
      <div
        className="p-4  rounded-xl border transition-all duration-200 cursor-pointer border-gray-700 shadow-sm bg-[#0B8FAC]"
        onClick={toggleMealExpand}
      >
        <div className="flex justify-end ">
          {plan && (
            <button
              className="text-red-500 hover:text-red-300 transition"
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(plan);
              }}
            >
              <FaTrash className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="flex gap-4 items-center -mt-4">
          <img
            src={
              typeof meal.imageUrl === "string" &&
              meal.imageUrl.startsWith("http")
                ? meal.imageUrl
                : fallback
            }
            alt={meal.name}
            className="w-20 h-20 rounded-lg object-cover border border-gray-700"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src = fallback;
            }}
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-emerald-300">{meal.name}</h2>
            <p className="text-xs text-white italic">
              Age: {meal.ageGroup || "N/A"} m+ · {meal.mealType || "N/A"} ·{" "}
              {mealTimesDisplay}
            </p>
            <div className="flex mt-2 items-center">
              <Eye className="h-4 w-4 text-gray-300 ml-2" />
              <span className="text-gray-300 ml-1 text-sm underline font-serif">
                View
              </span>
            </div>
          </div>
        </div>
        {expanded && (
          <div className="mt-4 space-y-2 text-sm bg-[#D9D9D94D] p-4 rounded-lg">
            <p className="text-gray-100">
              <strong>Description:</strong> {meal.description || "N/A"}
            </p>
            <p className="text-gray-100">
              <strong>Meal Type:</strong> {meal.mealType || "N/A"}
            </p>
            <p className="text-gray-100">
              <strong>Meal Time:</strong> {mealTimesDisplay}
            </p>
            <p className="text-gray-100">
              <strong>Yield Volume:</strong> {yieldVolume.toFixed(2)}
            </p>
            <div className="text-gray-100">
              <strong>Direction:</strong>
              {meal.directions ? (
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  {meal.directions.map((dir, index) => (
                    <li key={index} className="text-gray-100">
                      {dir}
                    </li>
                  ))}
                </ol>
              ) : (
                <span className="ml-1">{meal.direction || "N/A"}</span>
              )}
            </div>
            {meal.videoUrl && (
              <p className="text-gray-100">
                <strong>Video:</strong>
                <a
                  href={meal.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 px-2 underline text-sm"
                >
                  Watch Video
                </a>
              </p>
            )}
            {/* ✅ Ingredients with nutrients */}
            <div className="mt-3 ">
              <p className="text-gray-100 font-semibold underline py-2">
                Ingredients & Nutrients:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-5">
                {meal?.mealIngredients?.length ? (
                  meal.mealIngredients.map((item: any) => {
                    const ing = item.ingredient;
                    return (
                      <li key={item.id}>
                        <span className="font-semibold text-emerald-300 ">
                          {item.quantity} {ing?.portionUnit?.abbreviation ?? ""}{" "}
                          of {ing?.name ?? "Unknown"}
                        </span>
                        <br />
                        {/* Nutrients per ingredient */}
                        <span className="pt-4 underline text-base font-black">
                          Nutrients
                        </span>
                        {ing?.nutrientAmounts?.length > 0 && (
                          <ul className="list-disc ml-5 text-gray-200">
                            {ing.nutrientAmounts.map((na: any) => {
                              const adjustedAmount =
                                na.amount *
                                ((item.quantity ?? 1) / (ing.portionSize ?? 1));
                              return (
                                <li key={na.id}>
                                  <span className="text-emerald-200">
                                    {na.nutrient.name}:
                                  </span>{" "}
                                  ({na.amount} × {item.quantity}/
                                  {ing.portionSize}) ={" "}
                                  <strong>{adjustedAmount.toFixed(2)} </strong>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })
                ) : (
                  <li className="text-gray-200 italic">
                    No ingredients available
                  </li>
                )}
              </ul>
            </div>
            {/* ✅ Per Meal Nutritional Summary */}
            <div className="bg-[#013222] text-white text-sm p-4 mt-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2">
                Total Nutritional Summary
              </h3>
              <ul className="list-disc list-inside">
                {Object.entries(nutrientsByType).map(([name, { amount }]) => (
                  <li key={name}>
                    {name}:{" "}
                    <span className="text-emerald-300">
                      {amount.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const visiblePlans = useMemo(() => {
    return filteredPlans.filter(
      (plan) =>
        Array.isArray(plan.meals) &&
        plan.meals.some((meal: any) =>
          plan.mealTimes[meal.id]?.includes(activeTab)
        )
    );
  }, [filteredPlans, activeTab]);

  return (
    <Page back={true}>
      <div className=" min-h-screen bg-gray-800">
        <h2 className=" pt-4 pb-10 bg-[#013222] text-xl font-bold text-center text-emerald-500">
          {t("📋 Your Meal Plans")}
        </h2>

        {error && (
          <div className="text-red-500 text-center text-sm">{error}</div>
        )}
        {mealPlans === null ? (
          <Placeholder />
        ) : !activeDate ? (
          <div className="space-y-4 mt-4 mx-3">
            {uniqueDates.length > 0 ? (
              uniqueDates.map((date) => <DateCard key={date} dateKey={date} />)
            ) : (
              <div className="text-center text-gray-500">
                {t("No meal plans found. You can create one below!")}
              </div>
            )}
          </div>
        ) : (
          <div className="">
            <div className=" flex justify-between pl-4 mb-2 pb-2 bg-[#013222] -mt-6 pr-2">
              <button
                onClick={() => {
                  setActiveDate(null);
                  setActiveTab("");
                }}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium pb-2"
              >
                ← Back to Dates
              </button>
              <h3 className="text-sm font-base font-serif text-emerald-300 ">
                Plans for{" "}
                {new Date(activeDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
            </div>

            {/* Meal Time Tabs - only show after date selection */}
            {allMealTimess.length > 0 && (
              <ul className="bg-[#013222] px-2 -mt-2 flex flex-wrap text-sm font-medium text-center border-b border-gray-200 mb-4">
                {allMealTimess.map((time) => (
                  <li key={time as any} className="mr-2">
                    <button
                      onClick={() => setActiveTab(time as any)}
                      className={`py-1 px-2 text-[15px] font-normal whitespace-nowrap mx-auto w-full rounded-sm ${
                        activeTab === time
                          ? "bg-[#0B8FAC] text-white" // filled style
                          : " text-gray-200 text-xl font-extrabold" // outline style
                      } rounded-lg`}
                    >
                      {time as any}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Concatenated Descriptions Header */}
            {concatenatedDescriptions && (
              <div className=" rounded-lg bg-gray-700 mx-1 px-2 py-1 mb-4">
                <p className="text-white text-xl mb-1">
                  {" "}
                  Your Meal Descriptions
                </p>
                <p className=" text-base font-sans line-clamp-3">
                  {concatenatedDescriptions}
                </p>
              </div>
            )}
            {visiblePlans.length > 0 ? (
              <div className="px-4 mt-4 text-white space-y-6">
                {visiblePlans.map((plan) => (
                  <div key={plan.id}>
                    <div className="space-y-4">
                      {plan.meals
                        ?.filter((meal: any) =>
                          plan.mealTimes[meal.id]?.includes(activeTab)
                        )
                        .map((meal: any) => (
                          <MealCard key={meal.id} meal={meal} plan={plan} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                {filteredPlans.length > 0
                  ? "No meal plans for this meal time."
                  : "No meal plans for this date."}
              </div>
            )}
          </div>
        )}
        <div className="text-center mt-6 mx-16">
          <button
            className="bg-[#0B8FAC] hover:bg-[#0ea4c6] px-4 py-2 rounded text-gray-100"
            onClick={() => navigate(`/meal/${childId}`)}
          >
            ➕ {t("Create a Meal Plan")}
          </button>
        </div>

        {/* Confirm Delete Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-800 text-white p-6 rounded-lg max-w-md w-full shadow-xl">
              <h2 className="text-lg font-bold mb-3 text-red-500">
                {t("Confirm Delete")}
              </h2>
              <p className="mb-4">
                {t("Are you sure you want to delete this meal plan for")}{" "}
                <strong>{selectedMealPlan?.child.name}</strong>?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setSelectedMealPlan(null);
                  }}
                  disabled={deleting}
                >
                  {t("Cancel")}
                </button>
                <button
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
                  onClick={handleDeleteMealPlan}
                  disabled={deleting}
                >
                  {deleting ? t("Deleting...") : t("Delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};

export default ChildMealPlanSummary;
