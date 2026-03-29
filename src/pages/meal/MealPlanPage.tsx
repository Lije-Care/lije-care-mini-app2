import { Page } from '@/components/Page';
import { Button } from '@telegram-apps/telegram-ui';
import React, { useState } from 'react';

interface MealDescription {
  id: number;
  childId: number;
  mealDescription: string;
  calories: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ageGroup: string;
  dietaryRestrictions?: string[];
  timeOfDay: string;
}

// Dummy data simulating backend response
const dummyMealDescriptions: MealDescription[] = [
  {
    id: 1,
    childId: 1,
    mealType: 'breakfast',
    mealDescription: "Oatmeal with mashed banana and milk",
    calories: 200,
    ageGroup: "6-12 months",
    timeOfDay: "8:00 AM",
    dietaryRestrictions: ["dairy-free"]
  },
  {
    id: 2,
    childId: 1,
    mealType: 'lunch',
    mealDescription: "Pureed vegetables with soft rice",
    calories: 250,
    ageGroup: "6-12 months",
    timeOfDay: "12:00 PM"
  },
  {
    id: 3,
    childId: 1,
    mealType: 'snack',
    mealDescription: "Mashed avocado with breast milk",
    calories: 150,
    ageGroup: "6-12 months",
    timeOfDay: "3:00 PM"
  },
  {
    id: 4,
    childId: 1,
    mealType: 'dinner',
    mealDescription: "Soft cooked lentils with sweet potato",
    calories: 220,
    ageGroup: "6-12 months",
    timeOfDay: "6:00 PM"
  }
];

const MealPlanPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow' | 'week'>('today');
  const [selectedMealType, setSelectedMealType] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');

  const filteredMeals = dummyMealDescriptions.filter(meal => 
    selectedMealType === 'all' || meal.mealType === selectedMealType
  );

  return (
     <Page back={true}>
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Child&apos;s Meal Plan</h1>
      <div className="flex justify-between items-center mb-6">
        
        <div className="flex gap-2">
          <Button 
          stretched
            onClick={() => setSelectedDay('today')}
            className={`px-4 py-2 rounded-lg ${
              selectedDay === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Today
          </Button>
          <Button 
          stretched
            onClick={() => setSelectedDay('tomorrow')}
            className={`px-4 py-2 rounded-lg ${
              selectedDay === 'tomorrow' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Tomorrow
          </Button>
          <Button 
          stretched
            onClick={() => setSelectedDay('week')}
            className={`px-4 py-2 rounded-lg ${
              selectedDay === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Week
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <Button 
         stretched
          onClick={() => setSelectedMealType('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedMealType === 'all' ? 'bg-green-500 text-white' : 'bg-gray-200'
          }`}
        >
          All Meals
        </Button>
        <Button 
        stretched
          onClick={() => setSelectedMealType('breakfast')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedMealType === 'breakfast' ? 'bg-green-500 text-white' : 'bg-gray-200'
          }`}
        >
          Breakfast
        </Button>
       
       
      </div>

      <div className="space-y-4">
        {filteredMeals.map((meal) => (
          <div key={meal.id} className=" rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold capitalize">{meal.mealType}</h3>
                <p className="text-sm text-gray-500">{meal.timeOfDay}</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {meal.calories} calories
              </span>
            </div>
            <p className="text-gray-700 mb-2">{meal.mealDescription}</p>
            <div className="flex gap-2">
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {meal.ageGroup}
              </span>
              {meal.dietaryRestrictions?.map((restriction, index) => (
                <span 
                  key={index}
                  className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded"
                >
                  {restriction}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </Page>
  );
};

export default MealPlanPage; 