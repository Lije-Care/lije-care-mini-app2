import React, { useEffect, useState } from "react";
import api from '@/api/axios';
import { useParams, useNavigate } from "react-router-dom";
import { Input, Button, Card, Badge } from "@telegram-apps/telegram-ui";

type Meal = {
  id: string;
  title: string;
  meal_type: string;
};

// type MealPlan = {
//   id: string;
//   meal_description: string;
//   calories: number;
//   meals: Meal[];
// };

const EditMealPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // const [ setMealPlan] = useState<MealPlan | null>(null);
  const [mealOptions] = useState<Meal[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    meal_description: "",
    calories: 0,
  });

  useEffect(() => {
    // Fetch existing meal plan
    api.get(`meal-plans/find-one/${id}`)
      .then((response) => {
        // setMealPlan(response.data);
        setFormData({
          meal_description: response.data.meal_description,
          calories: response.data.calories,
        });
        setSelectedMeals(response.data.meals.map((meal: Meal) => meal.id));
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching meal plan:", error));
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMealSelection = (mealId: string) => {
    setSelectedMeals((prev) =>
      prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId]
    );
  };

  const handleSubmit = () => {
    api.put(`meal-plans/update/${id}`, {
      ...formData,
      meals: selectedMeals,
    })
      .then(() => {
        navigate("/mealplansummary"); // Redirect after successful update
      })
      .catch((error) => console.error("Error updating meal plan:", error));
  };

  if (loading) return <p>Loading meal plan...</p>;

  return (
    <div className=" p-4 space-y-4">
      <h2 className="text-xl font-bold text-center">✏️ Edit Meal Plan</h2>

      <Card className="p-4 w-full " >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Meal Description</label>
          <Input
            type="text"
            name="meal_description"
            value={formData.meal_description}
            onChange={handleInputChange}
          />

          <label className="block text-sm font-medium text-gray-700">Calories</label>
          <Input
            type="number"
            name="calories"
            value={formData.calories}
            onChange={handleInputChange}
          />

          <label className="block text-sm font-medium text-gray-700">Select Meals</label>
          <div className="grid grid-cols-2 gap-2">
            {mealOptions.map((meal) => (
              <Button
                key={meal.id}
                onClick={() => handleMealSelection(meal.id)}
                className={`p-2 text-sm ${
                  selectedMeals.includes(meal.id) ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                {meal.title} <Badge type="dot">{meal.meal_type}</Badge>
              </Button>
            ))}
          </div>

          <Button className="mt-4 w-full bg-green-500 text-white" onClick={handleSubmit}>
            Save Changes
          </Button>
          <Button className="mt-2 w-full bg-gray-500 text-white" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default EditMealPlan;
