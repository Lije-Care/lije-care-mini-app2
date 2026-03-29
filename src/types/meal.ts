export type MealTime = "BREAKFAST" | "SNACK" | "LUNCH" | "DINNER";
export type MealType = "SOLID" | "DRINK" | "SEMI_SOLID";

export type Meal = {
  id: string;
  name: string;
  description?: string;
  mealTimes: string[];
  mealType: MealType;
  ageGroup: string;

  prepTime?: string;
  cost?: string;
  allergen: boolean;
  intolerance: boolean;
  choking: boolean;
  allergenDescription: string;
  intoleranceDescription: string;
  drugInteraction: string;
  totalVolume: number;
  direction: string;
  modificationNote: string;
  howToStore?: string;
  videoUrl: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;

  mealIngredients: MealIngredient[];
  totalNutrients: Nutrient[];
};

export type MealIngredient = {
  id: string;
  quantity: number;
  ingredient: Ingredient;
  cookingMethod?: CookingMethod;
};

export type Ingredient = {
  id: string;
  name: string;
  imageUrl?: string;
  portionSize: number;
  portionUnit: {
    name: string;
    abbreviation: string;
  };
  // Add more if needed
};

export type Nutrient = {
  id: string;
  name: string;
  unit: string;
  amount?: number; // in Meal context
  type: "MACRONUTRIENT" | "MICRONUTRIENT" | "VITAMIN" | "MINERAL";
};

export type CookingMethod = {
  id: string;
  name: string;
  description?: string;
};
