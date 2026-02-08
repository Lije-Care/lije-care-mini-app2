import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/api/axios";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  mealTimes: string[];
  mealType: string;
  ageGroup: string;
  allergen: boolean;
  intolerance: boolean;
  choking: boolean;
  allergenDescription: string;
  intoleranceDescription: string;
  drugInteraction: string;
  totalVolume: number;
  direction: string;
  modificationNote: string;
  howToStore: string | null;
  videoUrl: string;
  imageUrl: string | null;
  prepTime: string | null;
  cost: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Ingredient {
  id: string;
  name: string;
  foodGroup: string;
  portionSize: number;
  density: number;
  suitableAgeRange: { minMonths: number; maxMonths: number };
  allergen: boolean;
  intolerance: boolean;
  choking: boolean;
  allergenDescription: string;
  intoleranceDescription: string;
  drugInteraction: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MealState {
  meals: Meal[];
  ingredients: Ingredient[];
  mealsLoading: boolean;
  ingredientsLoading: boolean;
  error: string | null;
}

const initialState: MealState = {
  meals: [],
  ingredients: [],
  mealsLoading: false,
  ingredientsLoading: false,
  error: null,
};

export const fetchMeals = createAsyncThunk<
  Meal[],
  void,
  { rejectValue: string }
>("meals/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/meal/find-all");
    return response.data.data || response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to fetch meals"
    );
  }
});

export const fetchIngredients = createAsyncThunk<
  Ingredient[],
  void,
  { rejectValue: string }
>("meals/fetchIngredients", async (_, thunkAPI) => {
  try {
    const response = await api.get("/ingredient/find-all");
    return response.data.data || response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to fetch ingredients"
    );
  }
});

const mealSlice = createSlice({
  name: "meals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Meals
      .addCase(fetchMeals.pending, (state) => {
        state.mealsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMeals.fulfilled,
        (state, action: PayloadAction<Meal[]>) => {
          state.mealsLoading = false;
          state.meals = action.payload;
        }
      )
      .addCase(fetchMeals.rejected, (state, action) => {
        state.mealsLoading = false;
        state.error = action.payload || "Something went wrong";
      })
      // Ingredients
      .addCase(fetchIngredients.pending, (state) => {
        state.ingredientsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchIngredients.fulfilled,
        (state, action: PayloadAction<Ingredient[]>) => {
          state.ingredientsLoading = false;
          state.ingredients = action.payload;
        }
      )
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.ingredientsLoading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default mealSlice.reducer;
