import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import {
  Title,
  Text,
  Divider,
  Placeholder,
  Spinner,
  Caption,
} from "@telegram-apps/telegram-ui";

const fallbackImg = "https://via.placeholder.com/400x250?text=Meal+Image";

const MealDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMealId, setOpenMealId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const res = await api.get(`/meal-plans/find-one/${id}`);
        setData(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlan();
  }, [id]);

  if (loading) {
    return (
      <Placeholder header="Loading Meal Plan...">
        <Spinner size="l" />
        <Caption>Please wait while we fetch the meal details</Caption>
      </Placeholder>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-8 text-red-400">
        <Title>Error</Title>
        <Text>{error}</Text>
      </div>
    );
  }

  const meals = data?.meals || [];
  console.log({ meals });

  if (!meals.length) {
    return (
      <Text className="text-center mt-8">
        No meals found in this meal plan.
      </Text>
    );
  }

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

  return (
    <>
      <div className=" bg-gray-800 ">
        <div className="bg-[#013222] pb-5 pl-2 ">
          <Title className=" mx-auto pt-6 pb-4 text-2xl font-bold text-emerald-400 bg-[#013222] ">
            🍽️ Meal Plan Overview
          </Title>
          <button
            onClick={() => {
              navigate(-1);
            }}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium pb-2  flex justify-start items-start"
          >
            ← Back
          </button>
        </div>
      </div>
      <div className=" min-h-screen max-w-3xl mx-auto px-4 py-6 -mt-3 text-white space-y-8 bg-gray-800">
        {meals.map((meal: any) => {
          const isOpen = openMealId === meal.id;
          const yieldVolume = calculateYieldVolume(meal);

          return (
            <div
              key={meal.id}
              className="bg-[#0B8FAC] border border-gray-700 rounded-xl p-4 shadow-md transition-all duration-300"
            >
              {/* Collapsed Header */}
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setOpenMealId(isOpen ? null : meal.id)}
              >
                <img
                  src={meal.imageUrl ? `${meal.imageUrl}` : fallbackImg}
                  alt={meal.name}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImg;
                  }}
                  className="w-24 h-24 rounded-lg object-cover border border-gray-700"
                />
                <div className="flex-1">
                  <Title className="text-lg">{meal.name}</Title>
                  <Text className="text-xs text-white gap-2">
                    Age: <span className=" ml-2">{meal.ageGroup}m+,</span>{" "}
                    <br />
                    Meal Type: <span className="ml-2"> {meal.mealType} </span>
                    <br />
                    Meal Time:
                    <span className="ml-2">
                      {" "}
                      {meal.mealTimes.join(", ").toLowerCase()}
                    </span>
                  </Text>
                  {meal.description && (
                    <Text className="text-sm text-white mt-1 line-clamp-2">
                      {meal.description}
                    </Text>
                  )}
                </div>
                <span className="text-sm text-emerald-400">
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded Content */}
              {isOpen && (
                <div className="pt-4 space-y-5 text-sm text-gray-300">
                  <Divider />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Age Group:</strong> {meal.ageGroup}m+
                    </div>

                    <div>
                      <strong>Vom:</strong> {yieldVolume.toFixed(2)} ml
                    </div>
                  </div>

                  {/* Nutrients */}
                  {Array.isArray(meal.totalNutrients) &&
                    meal.totalNutrients.length > 0 && (
                      <div>
                        <Title className="text-md mt-4">🔬 Nutrients</Title>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {meal.totalNutrients.map((n: any) => (
                            <li key={n.id}>
                              {n.name} ({n.amount} {n.unit})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Ingredients */}
                  {Array.isArray(meal.mealIngredients) &&
                    meal.mealIngredients.length > 0 && (
                      <div>
                        <Title className="text-md mt-4">🥬 Ingredients</Title>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {meal.mealIngredients.map((mi: any) => (
                            <li key={mi.id}>
                              {mi.quantity}{" "}
                              {mi.ingredient?.portionUnit?.abbreviation || ""}{" "}
                              of {mi.ingredient?.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Sections */}
                  {meal.direction && (
                    <Section title="📋 Direction" content={meal.direction} />
                  )}
                  {meal.modificationNote && (
                    <Section
                      title="🛠️ Modification Note"
                      content={meal.modificationNote}
                    />
                  )}
                  {meal.howToStore && (
                    <Section
                      title="📦 How to Store"
                      content={meal.howToStore}
                    />
                  )}
                  {meal.drugInteraction && (
                    <Section
                      title="💊 Drug Interaction"
                      content={meal.drugInteraction}
                    />
                  )}

                  {/* Sensitivities */}
                  {(meal.allergen || meal.intolerance || meal.choking) && (
                    <div>
                      <Title className="text-md">⚠️ Sensitivities</Title>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {meal.allergen && (
                          <li>Allergen: {meal.allergenDescription}</li>
                        )}
                        {meal.intolerance && (
                          <li>Intolerance: {meal.intoleranceDescription}</li>
                        )}
                        {meal.choking && <li>Choking Hazard</li>}
                      </ul>
                    </div>
                  )}

                  {/* Video */}
                  {meal.videoUrl && (
                    <div>
                      {/* video url */}
                      <Title className="text-md">🎥 Video</Title>
                      <a
                        href={meal.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 underline text-sm"
                      >
                        Watch Video
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div>
    <Title className="text-md mt-4">{title}</Title>
    <Text className="whitespace-pre-wrap text-sm text-gray-300 mt-1">
      {content}
    </Text>
  </div>
);

export default MealDetails;
