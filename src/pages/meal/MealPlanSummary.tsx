import { useState, useEffect } from "react";
import api from "@/api/axios";
import { Badge, Card, Placeholder } from "@telegram-apps/telegram-ui";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Page } from "@/components/Page";
import { useTranslation } from "react-i18next";

type Meal = {
  id: string;
  title: string;
  meal_type: string;
};

type MealPlan = {
  id: string;
  meal_description: string;
  calories: number;
  createdAt: string;
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
};

const MealPlanSummary = () => {
  const { t } = useTranslation();
  const [mealPlans, setMealPlans] = useState<MealPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data } = useSelector((state: RootState) => state.children);

  // const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  // const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!data || data.length === 0) {
      setMealPlans([]);
      setError(t("No child profile found. Please add a child first."));
      return;
    }

    const childIds = data.map((child) => child.id);

    // Fetch meal plans for all children
    Promise.all(childIds.map((id) => api.get(`/meal-Plans/by-child/${id}`)))
      .then((responses) => {
        const allMealPlans = responses.flatMap((res) => res.data?.data ?? []);
        setMealPlans(allMealPlans);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching meal plans:", err);
        setMealPlans([]);
        setError(
          err?.response?.data?.message ||
            t("Failed to fetch meal plans. Please try again later.")
        );
      });
  }, [data, t]);

  return (
    <Page back={true}>
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold text-center text-emerald-500">
          {t("📋 Your Meal Plans tets")}
        </h2>

        {error && (
          <div className="text-red-500 text-center text-sm">{error}</div>
        )}

        {mealPlans === null ? (
          <Placeholder />
        ) : mealPlans.length > 0 ? (
          mealPlans.map((mealPlan) => (
            <Card
              key={mealPlan.id}
              className="p-4 shadow-sm bg-white rounded-xl w-full border border-gray-200 hover:shadow-md cursor-pointer transition-all"
              onClick={() => navigate(`/mealplansummary/${mealPlan.id}`)}
            >
              {/* Description + Metadata */}
              <div className="space-y-1">
                <p className="text-sm line-clamp-2 font-medium">
                  {mealPlan.meal_description || "No description available."}
                </p>
                <p className="text-xs ">
                  🔥 {mealPlan.calories} kcal · 🕒{" "}
                  {new Date(mealPlan.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Divider */}
              <div className="my-2 border-t border-gray-200" />

              {/* Child Info */}
              <div className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">
                  {t("👶 Child")}:
                </span>{" "}
                {mealPlan.child?.name || t("Unnamed")} <br />
                <span className="font-semibold text-gray-800">
                  {t("Allergies")}:
                </span>{" "}
                {mealPlan.child?.allergies || t("None")} <br />
                <span className="font-semibold text-gray-800">
                  {t("Restrictions")}:
                </span>{" "}
                {mealPlan.child?.dietary_restrictions || t("None")}
              </div>

              {/* Divider */}
              <div className="my-2 border-t border-gray-200" />

              {/* Meals Preview */}
              <div>
                <h4 className="text-sm font-semibold mb-1">🍽️ Meals</h4>
                {Array.isArray(mealPlan.meals) && mealPlan.meals.length > 0 ? (
                  <div className="space-y-1">
                    {mealPlan.meals.slice(0, 3).map((meal) => (
                      <div
                        key={meal.id}
                        className="flex justify-between items-center text-sm "
                      >
                        <span>{meal.title || "Untitled"}</span>
                        <Badge type="dot">{meal.meal_type || "Unknown"}</Badge>
                      </div>
                    ))}
                    {mealPlan.meals.length > 3 && (
                      <p className="text-xs italic mt-1">
                        + {mealPlan.meals.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs">No meals listed.</p>
                )}
              </div>
              <span className=" absolute bottom-2 right-2 text-green-600 ml-2 underline">
                View detail
              </span>
            </Card>
          ))
        ) : (
          !error && (
            <div className="text-center text-gray-500">
              {t("No meal plans found. You can create one below!")}
            </div>
          )
        )}
        {/* Confirm Delete Modal */}
        {/* {showConfirmDelete && selectedChild && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-800 text-white p-6 rounded-lg max-w-md w-full shadow-xl">
              <h2 className="text-lg font-bold mb-3 text-red-500">
                {t("Confirm Delete")}
              </h2>
              <p className="mb-4">
                {t("Are you sure you want to delete")}{" "}
                <strong>{selectedChild.name}</strong>?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setSelectedChild(null);
                  }}
                  disabled={deleting}
                >
                  {t("Cancel")}
                </button>
                <button
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
                  onClick={handleDeleteChild}
                  disabled={deleting}
                >
                  {deleting ? t("Deleting...") : t("Delete")}
                </button>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </Page>
  );
};

export default MealPlanSummary;
