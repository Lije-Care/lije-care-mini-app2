import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api, { getPreferredLanguage } from "@/api/axios";
import type { MealType } from "@/types/meal";

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
  mealsPagination: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  } | null;
  ingredientsPagination: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  } | null;
}

const initialState: MealState = {
  meals: [],
  ingredients: [],
  mealsLoading: false,
  ingredientsLoading: false,
  error: null,
  mealsPagination: null,
  ingredientsPagination: null,
};

export const fetchMeals = createAsyncThunk<
  {
    data: Meal[];
    pagination: MealState["mealsPagination"];
    append: boolean;
  },
  {
    page?: number;
    limit?: number;
    search?: string;
    mealType?: MealType;
    mealSlot?: string;
    maxAgeMonths?: number;
    excludedAllergens?: string[];
    dietType?: string;
    append?: boolean;
  } | void,
  { rejectValue: string }
>("meals/fetchAll", async (params, thunkAPI) => {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const search = params?.search?.trim();
    const response = await api.get("/meal/find-all", {
      params: {
        page,
        limit,
        lang: getPreferredLanguage(),
        ...(search ? { search } : {}),
        ...(params?.mealType ? { mealType: params.mealType } : {}),
        ...(params?.mealSlot ? { mealSlot: params.mealSlot } : {}),
        ...(typeof params?.maxAgeMonths === "number"
          ? { maxAgeMonths: params.maxAgeMonths }
          : {}),
        ...(params?.excludedAllergens?.length
          ? { excludedAllergens: params.excludedAllergens.join(",") }
          : {}),
        ...(params?.dietType ? { dietType: params.dietType } : {}),
      },
    });

    return {
      data: response.data.data || response.data,
      pagination: response.data.meta || null,
      append: params?.append ?? page > 1,
    };
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to fetch meals"
    );
  }
});

export const fetchIngredients = createAsyncThunk<
  {
    data: Ingredient[];
    pagination: MealState["ingredientsPagination"];
    append: boolean;
  },
  {
    page?: number;
    limit?: number;
    search?: string;
    maxAgeMonths?: number;
    ingredientType?: string;
    excludedAllergens?: string[];
    dietType?: string;
    append?: boolean;
  } | void,
  { rejectValue: string }
>("meals/fetchIngredients", async (params, thunkAPI) => {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const search = params?.search?.trim();
    const response = await api.get("/ingredient/find-all", {
      params: {
        page,
        limit,
        lang: getPreferredLanguage(),
        ...(search ? { search } : {}),
        ...(typeof params?.maxAgeMonths === "number"
          ? { maxAgeMonths: params.maxAgeMonths }
          : {}),
        ...(params?.ingredientType ? { ingredientType: params.ingredientType } : {}),
        ...(params?.excludedAllergens?.length
          ? { excludedAllergens: params.excludedAllergens.join(",") }
          : {}),
        ...(params?.dietType ? { dietType: params.dietType } : {}),
      },
    });

    return {
      data: response.data.data || response.data,
      pagination: response.data.meta || null,
      append: params?.append ?? page > 1,
    };
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
        (
          state,
          action: PayloadAction<{
            data: Meal[];
            pagination: MealState["mealsPagination"];
            append: boolean;
          }>
        ) => {
          state.mealsLoading = false;
          state.mealsPagination = action.payload.pagination;

          if (action.payload.append) {
            const existingIds = new Set(state.meals.map((meal) => meal.id));
            const nextMeals = action.payload.data.filter(
              (meal) => !existingIds.has(meal.id)
            );
            state.meals = [...state.meals, ...nextMeals];
            return;
          }

          state.meals = action.payload.data;
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
        (
          state,
          action: PayloadAction<{
            data: Ingredient[];
            pagination: MealState["ingredientsPagination"];
            append: boolean;
          }>
        ) => {
          state.ingredientsLoading = false;
          state.ingredientsPagination = action.payload.pagination;

          if (action.payload.append) {
            const existingIds = new Set(
              state.ingredients.map((ingredient) => ingredient.id)
            );
            const nextIngredients = action.payload.data.filter(
              (ingredient) => !existingIds.has(ingredient.id)
            );
            state.ingredients = [...state.ingredients, ...nextIngredients];
            return;
          }

          state.ingredients = action.payload.data;
        }
      )
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.ingredientsLoading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default mealSlice.reducer;
