import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchMeals, fetchIngredients } from '@/redux/slices/mealSlice';
import { fetchChildrenByParentId } from '@/redux/slices/childSlice';
import { PlusIcon, SearchIcon, FilterIcon, ChevronDownIcon } from '@/design-system/icons';
import { Button } from '@/components/ui';
import type { Meal } from '@/design-system/types';
import api from '@/api/axios';
import { useLocation, useNavigate } from 'react-router-dom';

type BackendMealPlan = {
  id: string;
  meal_description?: string;
  calories?: number;
  createdAt?: string;
  meal_date?: string;
  source?: 'parent' | 'nutritionist';
  expertId?: string | null;
  mealTimes?: Record<string, string[]>;
  child?: {
    id?: string;
    name?: string;
    allergies?: string | null;
    dietary_restrictions?: string | null;
  };
  meals?: Array<{
    id: string;
    name?: string;
    imageUrl?: string | null;
    totalVolume?: number;
  }>;
  expert?: {
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
};

type BackendPlanMeal = NonNullable<BackendMealPlan['meals']>[number];

const SPECIALIST_ROLES = new Set([
  'NUTRITIONIST',
  'PEDIATRICIAN',
  'CULINARIAN',
]);

type LibrarySubTab = 'mealLib' | 'foodLib';
type SortBy = 'recent' | 'alpha';

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  Milk: ['milk', 'dairy', 'cheese', 'butter', 'yogurt', 'cream', 'ወተት', 'የወተት', 'አይብ', 'እርጎ'],
  Eggs: ['egg', 'eggs', 'ዕንቁላል', 'እንቁላል'],
  Peanuts: ['peanut', 'peanuts', 'groundnut', 'ለውዝ', 'ኦቾሎኒ'],
  'Tree Nuts': ['tree nut', 'tree nuts', 'almond', 'cashew', 'walnut', 'hazelnut', 'ፍሬ ለውዝ', 'አልሞንድ', 'ካሽው'],
  Fish: ['fish', 'tuna', 'salmon', 'ዓሣ', 'አሳ'],
  Shellfish: ['shellfish', 'shrimp', 'prawn', 'crab', 'lobster', 'ሽሪምፕ', 'ክራብ'],
  Soy: ['soy', 'soya', 'soybean', 'ሶያ'],
  Wheat: ['wheat', 'gluten', 'bread', 'flour', 'ስንዴ', 'ዱቄት', 'ግሉተን', 'ዳቦ'],
};

const INGREDIENT_TYPE_KEYWORDS: Record<string, string[]> = {
  vegetable: ['vegetable', 'vegetables', 'veggie', 'vegitable', 'vegeteble', 'አትክልት'],
  fruit: ['fruit', 'fruits', 'ፍራፍሬ'],
  grain: ['grain', 'grains', 'cereal', 'teff', 'wheat', 'ሰብል', 'እህል', 'ጥራጥሬ', 'ተፍ', 'ስንዴ'],
  protein: ['protein', 'meat', 'egg', 'fish', 'bean', 'legume', 'ፕሮቲን', 'ስጋ', 'እንቁላል', 'ዓሣ', 'ባቄላ', 'ጥራጥሬ'],
  dairy: ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'የወተት', 'ወተት', 'አይብ', 'እርጎ'],
  water: ['water', 'liquid', 'fluids', 'ውሃ', 'ፈሳሽ'],
};

const NON_VEGAN_KEYWORDS = [
  'milk',
  'dairy',
  'cheese',
  'butter',
  'yogurt',
  'cream',
  'egg',
  'eggs',
  'meat',
  'beef',
  'chicken',
  'fish',
  'tuna',
  'salmon',
  'shrimp',
  'prawn',
  'crab',
  'lobster',
  'honey',
  'ወተት',
  'የወተት',
  'አይብ',
  'እርጎ',
  'እንቁላል',
  'ዕንቁላል',
  'ስጋ',
  'ዓሣ',
  'አሳ',
  'ማር',
];

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function getAllergenKeywords(label: string) {
  const normalized = normalizeText(label);
  const matchedEntry = Object.entries(ALLERGEN_KEYWORDS).find(
    ([canonical, keywords]) =>
      normalizeText(canonical) === normalized ||
      keywords.some((keyword) => normalizeText(keyword) === normalized)
  );

  if (!matchedEntry) {
    return [normalized];
  }

  const [canonical, keywords] = matchedEntry;
  return Array.from(
    new Set([normalizeText(canonical), ...keywords.map((keyword) => normalizeText(keyword))])
  );
}

function getIngredientTypeKeywords(label: string) {
  const normalized = normalizeText(label);
  const matchedEntry = Object.entries(INGREDIENT_TYPE_KEYWORDS).find(
    ([canonical, keywords]) =>
      normalizeText(canonical) === normalized ||
      keywords.some((keyword) => normalizeText(keyword) === normalized)
  );

  if (!matchedEntry) {
    return [normalized];
  }

  const [canonical, keywords] = matchedEntry;
  return Array.from(
    new Set([normalizeText(canonical), ...keywords.map((keyword) => normalizeText(keyword))])
  );
}

function getCanonicalIngredientType(...values: Array<string | null | undefined>) {
  const haystack = values
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedEntry = Object.entries(INGREDIENT_TYPE_KEYWORDS).find(([_canonical, keywords]) =>
    keywords.some((keyword) => haystack.includes(normalizeText(keyword)))
  );

  return matchedEntry?.[0] || normalizeText(values.find(Boolean) || 'other');
}

function getEmbeddableVideoUrl(videoUrl?: string | null) {
  if (!videoUrl) {
    return '';
  }

  try {
    const normalizedInput = videoUrl.trim();
    if (!normalizedInput) {
      return '';
    }

    const withScheme = /^https?:\/\//i.test(normalizedInput)
      ? normalizedInput
      : `https://${normalizedInput}`;
    const url = new URL(withScheme);
    const hostname = url.hostname.replace(/^www\./, '');
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const videoId =
      hostname === 'youtu.be'
        ? pathSegments[0] || ''
        : hostname.endsWith('youtube.com')
          ? url.searchParams.get('v') ||
            url.searchParams.get('vi') ||
            url.pathname.match(/\/embed\/([^/?]+)/)?.[1] ||
            url.pathname.match(/\/shorts\/([^/?]+)/)?.[1] ||
            url.pathname.match(/\/live\/([^/?]+)/)?.[1] ||
            ''
          : '';

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    return withScheme;
  } catch {
    return '';
  }
}

function deriveDietTypeFromText(...values: Array<string | null | undefined>) {
  const haystack = values
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return NON_VEGAN_KEYWORDS.some((keyword) => haystack.includes(keyword))
    ? 'non-vegan'
    : 'vegan';
}

type FilterOverlayProps = {
  onClose: () => void;
  sortBy: SortBy;
  setSortBy: (val: SortBy) => void;
  ageFilter: string;
  setAgeFilter: (val: string) => void;
  subTab: LibrarySubTab;
  mealTypeFilter: string;
  setMealTypeFilter: (val: string) => void;
  ingredientTypeFilter: string;
  setIngredientTypeFilter: (val: string) => void;
  excludedAllergens: string[];
  setExcludedAllergens: React.Dispatch<React.SetStateAction<string[]>>;
  dietTypeFilter: string;
  setDietTypeFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  commonAllergens: string[];
};

type DetailedMeal = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  ageGroup?: string;
  mealType?: string;
  mealTimes?: string[];
  prepTime?: string | null;
  totalVolume?: number;
  allergen?: boolean;
  allergenDescription?: string | null;
  intolerance?: boolean;
  intoleranceDescription?: string | null;
  choking?: boolean;
  modificationNote?: string | null;
  drugInteraction?: string | null;
  howToStore?: string | null;
  direction?: string | null;
  videoUrl?: string | null;
  mealIngredients?: Array<{
    id: string;
    quantity?: number | null;
    ingredient?: {
      id: string;
      name?: string;
      portionUnit?: {
        abbreviation?: string | null;
      } | null;
      nutrientAmounts?: Array<{
        id: string;
        amount?: number | null;
        nutrient?: {
          id: string;
          name?: string;
          unit?: string | null;
        } | null;
      }>;
    } | null;
  }>;
};

type DetailedIngredient = {
  id: string;
  name: string;
  foodGroup?: string | null;
  portionSize?: number | null;
  density?: number | null;
  suitableAgeRange?:
    | {
        minMonths?: number | null;
        maxMonths?: number | null;
      }
    | string
    | null;
  allergen?: boolean;
  allergenDescription?: string | null;
  intolerance?: boolean;
  intoleranceDescription?: string | null;
  choking?: boolean;
  drugInteraction?: string | null;
  imageUrl?: string | null;
  portionUnit?: {
    name?: string | null;
    abbreviation?: string | null;
  } | null;
  nutrientAmounts?: Array<{
    id: string;
    amount?: number | null;
    nutrient?: {
      id: string;
      name?: string | null;
      unit?: string | null;
    } | null;
  }>;
};

function getIngredientAgeRangeLabel(
  suitableAgeRange?: DetailedIngredient['suitableAgeRange']
) {
  if (!suitableAgeRange) {
    return 'N/A';
  }

  const parsedRange =
    typeof suitableAgeRange === 'string'
      ? (() => {
          try {
            return JSON.parse(suitableAgeRange);
          } catch {
            return null;
          }
        })()
      : suitableAgeRange;

  if (!parsedRange || parsedRange.minMonths == null) {
    return 'N/A';
  }

  if (!parsedRange.maxMonths) {
    return `${parsedRange.minMonths}+ months`;
  }

  return `${parsedRange.minMonths} - ${parsedRange.maxMonths} months`;
}

function getIngredientDescription(
  ingredient?: DetailedIngredient | null,
  ageRangeLabel?: string
) {
  if (!ingredient) {
    return '';
  }

  const foodGroup = ingredient.foodGroup?.toLowerCase() || 'food';
  const ageText = ageRangeLabel && ageRangeLabel !== 'N/A'
    ? ` It is suitable for ${ageRangeLabel}.`
    : '';

  return `${ingredient.name} is a ${foodGroup} ingredient used in balanced meals.${ageText}`;
}

function looksLikeId(value?: string | null) {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{6,12}$/i.test(
    value.trim()
  );
}

function getDisplayLabel(value?: string | null, fallback = 'Nutrient') {
  if (!value || looksLikeId(value)) {
    return fallback;
  }

  return value;
}

const MealLibraryDetailOverlay = ({
  meal,
  loading,
  error,
  onClose,
}: {
  meal: DetailedMeal | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) => {
  if (!meal && !loading && !error) return null;

  const directions = meal?.direction
    ? meal.direction
        .split('.')
        .map((step) => step.trim())
        .filter(Boolean)
    : [];

  const nutrients = meal?.mealIngredients?.flatMap((item) =>
    (item.ingredient?.nutrientAmounts || []).map((entry) => {
      const nutrientName = getDisplayLabel(entry.nutrient?.name, 'Nutrient');
      return {
        key: `${item.id}-${entry.id}`,
        name: nutrientName,
        amount: entry.amount,
        unit: getDisplayLabel(entry.nutrient?.unit, ''),
      };
    })
  ) || [];

  return (
    <div className="fixed inset-0 z-[140] mx-auto max-w-md overflow-y-auto bg-white shadow-2xl">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-50 bg-white/80 px-6 py-4 backdrop-blur-md">
        <button
          onClick={onClose}
          className="cursor-pointer rounded-xl bg-slate-100 p-3 text-slate-600 transition-transform active:scale-90"
        >
          <ChevronDownIcon className="rotate-90" />
        </button>
        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Meal Details</h3>
        <div className="w-10" />
      </div>

      <div className="p-6">
        {loading ? (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-400">Loading meal details...</p>
          </div>
        ) : error ? (
          <div className="rounded-[2.5rem] border border-rose-100 bg-rose-50 p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-rose-500">{error}</p>
          </div>
        ) : meal ? (
          <div className="space-y-8">
            <div className="relative h-64 overflow-hidden rounded-[2.5rem] shadow-xl">
              <img
                src={meal.imageUrl || `https://picsum.photos/seed/${meal.id}/600/400`}
                className="h-full w-full object-cover"
                alt={meal.name}
              />
            </div>

            <div className="rounded-[2.5rem] border border-slate-50 bg-white p-8 shadow-xl shadow-slate-100">
              <h2 className="mb-2 text-2xl font-black text-slate-800">{meal.name}</h2>
              <div className="mb-6 flex items-center gap-2 text-sm">
                <span className="font-black text-[#76A13B]">
                  {Math.round((meal.totalVolume || 0) * 1.3) || 200} kcal
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-400">
                  {meal.totalVolume ? `${meal.totalVolume} ml` : 'Volume N/A'}
                </span>
              </div>

              {meal.description && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Description
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{meal.description}</p>
                </div>
              )}

              <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Age</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Meal</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Time</th>
                      <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Prep</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-4 font-bold text-slate-600">{meal.ageGroup || 'N/A'}</td>
                      <td className="px-4 py-4 font-bold text-slate-600">{meal.mealType || 'N/A'}</td>
                      <td className="px-4 py-4 font-bold text-slate-600">
                        {meal.mealTimes?.join(', ') || 'N/A'}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-600">{meal.prepTime || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-8">
                <div>
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Choking Hazard
                  </label>
                  <span
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-black ${
                      meal.choking
                        ? 'border-rose-100 bg-rose-50 text-rose-500'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-500'
                    }`}
                  >
                    {meal.choking ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Allergen
                  </label>
                  <span
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-black ${
                      meal.allergen
                        ? 'border-rose-100 bg-rose-50 text-rose-500'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-500'
                    }`}
                  >
                    {meal.allergen ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {meal.allergenDescription && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Allergen Detail
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{meal.allergenDescription}</p>
                </div>
              )}

              {meal.intoleranceDescription && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Intolerance
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{meal.intoleranceDescription}</p>
                </div>
              )}

              {meal.modificationNote && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Modification Note
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{meal.modificationNote}</p>
                </div>
              )}

              {meal.drugInteraction && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Drug Interaction
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{meal.drugInteraction}</p>
                </div>
              )}

              {meal.mealIngredients && meal.mealIngredients.length > 0 && (
                <div className="mb-8">
                  <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Ingredients
                  </label>
                  <div className="space-y-3">
                    {meal.mealIngredients.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <span className="font-bold text-slate-700">
                          {item.ingredient?.name || 'Ingredient'}
                        </span>
                        <span className="text-sm font-medium text-slate-400">
                          {item.quantity ?? ''}{' '}
                          {item.ingredient?.portionUnit?.abbreviation || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {directions.length > 0 && (
                <div className="mb-8">
                  <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Directions
                  </label>
                  <div className="space-y-4">
                    {directions.map((step, index) => (
                      <div key={`${index}-${step}`} className="flex gap-4">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F9C846]/10 text-[10px] font-black text-[#76A13B]">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {meal.howToStore && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    How to Store
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{meal.howToStore}</p>
                </div>
              )}

              {getEmbeddableVideoUrl(meal.videoUrl) && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cooking Video
                  </label>
                  <div className="aspect-video overflow-hidden rounded-2xl border border-slate-100">
                    <iframe
                      width="100%"
                      height="100%"
                      src={getEmbeddableVideoUrl(meal.videoUrl)}
                      title="Cooking Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {nutrients.length > 0 && (
                <div className="mt-10 border-t border-slate-100 pt-8">
                  <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nutrients Acquired
                  </label>
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Nutrient</th>
                          <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {nutrients.map((nutrient) => (
                          <tr key={nutrient.key}>
                            <td className="px-4 py-3 font-bold text-slate-600">{nutrient.name}</td>
                            <td className="px-4 py-3 font-bold text-sky-500">
                              {nutrient.amount ?? 'N/A'} {nutrient.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const IngredientLibraryDetailOverlay = ({
  ingredient,
  loading,
  error,
  onClose,
}: {
  ingredient: DetailedIngredient | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) => {
  if (!ingredient && !loading && !error) return null;

  const nutrientTotals = new Map<string, { amount: number; unit: string }>();

  (ingredient?.nutrientAmounts || []).forEach((entry) => {
    const nutrientName = getDisplayLabel(entry.nutrient?.name, 'Nutrient');
    const current = nutrientTotals.get(nutrientName);
    nutrientTotals.set(nutrientName, {
      amount: (current?.amount || 0) + (entry.amount || 0),
      unit: getDisplayLabel(entry.nutrient?.unit || current?.unit || '', ''),
    });
  });

  const nutrients = Array.from(nutrientTotals.entries()).map(([name, value]) => ({
    name,
    amount: value.amount,
    unit: value.unit,
  }));

  const portionUnit = ingredient?.portionUnit?.abbreviation || ingredient?.portionUnit?.name || '';
  const portionLabel =
    ingredient?.portionSize != null
      ? `${ingredient.portionSize}${portionUnit ? ` ${portionUnit}` : ''}`
      : 'N/A';
  const ageRangeLabel = getIngredientAgeRangeLabel(ingredient?.suitableAgeRange);
  const description = getIngredientDescription(ingredient, ageRangeLabel);
  const badgeClassName = (active?: boolean) =>
    active
      ? 'border-rose-100 bg-rose-50 text-rose-500'
      : 'border-emerald-100 bg-emerald-50 text-emerald-500';

  return (
    <div className="fixed inset-0 z-[140] mx-auto max-w-md overflow-y-auto bg-white shadow-2xl">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-50 bg-white/80 px-6 py-4 backdrop-blur-md">
        <button
          onClick={onClose}
          className="cursor-pointer rounded-xl bg-slate-100 p-3 text-slate-600 transition-transform active:scale-90"
        >
          <ChevronDownIcon className="rotate-90" />
        </button>
        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Ingredient Details</h3>
        <div className="w-10" />
      </div>

      <div className="p-6">
        {loading ? (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-400">Loading ingredient details...</p>
          </div>
        ) : error ? (
          <div className="rounded-[2.5rem] border border-rose-100 bg-rose-50 p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-rose-500">{error}</p>
          </div>
        ) : ingredient ? (
          <div className="rounded-[2.5rem] border border-slate-50 bg-white p-8 shadow-xl shadow-slate-100">
              <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50">
                <img
                  src={ingredient.imageUrl || `https://picsum.photos/seed/${ingredient.id}/600/400`}
                  className="h-56 w-full object-cover"
                  alt={ingredient.name}
                />
              </div>
              <h2 className="mb-4 text-2xl font-black text-slate-800">{ingredient.name}</h2>
              <div className="mb-10 text-xl font-black uppercase tracking-[0.22em] text-[#76A13B]">
                {getDisplayLabel(ingredient.foodGroup, 'Food')}
              </div>

              <div className="mb-10">
                <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Description
                </label>
                <p className="max-w-[24rem] text-sm leading-9 text-slate-500">
                  {description}
                </p>
              </div>

              <div className="mb-10 grid grid-cols-2 gap-8">
                <div>
                  <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Choking Hazard
                  </label>
                  <span
                    className={`inline-flex rounded-2xl border px-5 py-2 text-sm font-black ${badgeClassName(ingredient.choking)}`}
                  >
                    {ingredient.choking ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Allergen
                  </label>
                  <span
                    className={`inline-flex rounded-2xl border px-5 py-2 text-sm font-black ${badgeClassName(ingredient.allergen)}`}
                  >
                    {ingredient.allergen ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="mb-10 border-t border-slate-100 pt-10">
                <label className="mb-6 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Ingredient Facts
                </label>
                <div className="grid grid-cols-2 gap-y-5 text-sm text-slate-500">
                  <div className="font-black uppercase tracking-[0.18em] text-slate-400">Age Range</div>
                  <div className="text-right font-medium">{ageRangeLabel}</div>
                  <div className="font-black uppercase tracking-[0.18em] text-slate-400">Portion</div>
                  <div className="text-right font-medium">{portionLabel}</div>
                  <div className="font-black uppercase tracking-[0.18em] text-slate-400">Density</div>
                  <div className="text-right font-medium">{ingredient.density ?? 'N/A'}</div>
                  {!!ingredient.intoleranceDescription && (
                    <>
                      <div className="font-black uppercase tracking-[0.18em] text-slate-400">Intolerance</div>
                      <div className="text-right font-medium">{ingredient.intoleranceDescription}</div>
                    </>
                  )}
                  {!!ingredient.allergenDescription && (
                    <>
                      <div className="font-black uppercase tracking-[0.18em] text-slate-400">Allergen Detail</div>
                      <div className="text-right font-medium">{ingredient.allergenDescription}</div>
                    </>
                  )}
                  {!!ingredient.drugInteraction && (
                    <>
                      <div className="font-black uppercase tracking-[0.18em] text-slate-400">Drug Interaction</div>
                      <div className="text-right font-medium">{ingredient.drugInteraction}</div>
                    </>
                  )}
                </div>
              </div>

              {nutrients.length > 0 && (
                <div className="border-t border-slate-100 pt-10">
                  <label className="mb-6 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Nutrient Profile
                  </label>
                  <div className="overflow-hidden rounded-[2rem] border border-slate-100">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Nutrient</th>
                          <th className="px-6 py-5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {nutrients.map((nutrient) => (
                          <tr key={nutrient.name}>
                            <td className="px-6 py-5 text-base font-bold text-slate-700">{nutrient.name}</td>
                            <td className="px-6 py-5 text-base font-medium text-slate-400">
                              {nutrient.amount.toFixed(2)} {nutrient.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
        ) : null}
      </div>
    </div>
  );
};

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  onClose,
  sortBy,
  setSortBy,
  ageFilter,
  setAgeFilter,
  subTab,
  mealTypeFilter,
  setMealTypeFilter,
  ingredientTypeFilter,
  setIngredientTypeFilter,
  excludedAllergens,
  setExcludedAllergens,
  dietTypeFilter,
  setDietTypeFilter,
  categoryFilter,
  setCategoryFilter,
  commonAllergens,
}) => (
  <div className="fixed inset-0 z-[110] mx-auto max-w-md overflow-y-auto bg-white shadow-2xl">
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-50 bg-white/80 px-6 py-4 backdrop-blur-md">
      <button
        onClick={onClose}
        className="cursor-pointer rounded-xl bg-slate-100 p-3 text-slate-600 transition-transform active:scale-90"
      >
        <ChevronDownIcon className="rotate-90" />
      </button>
      <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Filters</h3>
      <div className="w-10" />
    </div>

    <div className="space-y-8 p-6">
      <section>
        <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
          Sort By
        </label>
        <div className="flex gap-2">
          {[
            { id: 'recent', label: 'Recently Added' },
            { id: 'alpha', label: 'Alphabetical' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id as SortBy)}
              className={`cursor-pointer flex-1 rounded-xl border py-3 text-xs font-bold transition-all ${
                sortBy === option.id
                  ? 'border-[#F9C846] bg-[#F9C846] text-[#0B1A12] shadow-lg shadow-amber-100'
                  : 'border-slate-100 bg-white text-slate-500'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
          Age
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['all', '<12mo', '<18mo', '<24mo', '<3years', '<4years'].map((option) => (
            <button
              key={option}
              onClick={() => setAgeFilter(option)}
              className={`cursor-pointer rounded-xl border py-3 text-xs font-bold transition-all ${
                ageFilter === option
                  ? 'border-[#F9C846] bg-[#F9C846] text-[#0B1A12] shadow-lg shadow-amber-100'
                  : 'border-slate-100 bg-white text-slate-500'
              }`}
            >
              {option === 'all' ? 'All' : option}
            </button>
          ))}
        </div>
      </section>

      {subTab === 'mealLib' ? (
        <section>
          <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Meal Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['all', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map((option) => (
              <button
                key={option}
                onClick={() => setMealTypeFilter(option)}
                className={`cursor-pointer rounded-xl border py-3 text-xs font-bold transition-all ${
                  mealTypeFilter === option
                    ? 'border-[#F9C846] bg-[#F9C846] text-[#0B1A12] shadow-lg shadow-amber-100'
                    : 'border-slate-100 bg-white text-slate-500'
                }`}
              >
                {option === 'all' ? 'All' : option}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Ingredient Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['all', 'vegetable', 'fruit', 'grain', 'protein', 'dairy', 'water'].map((option) => (
              <button
                key={option}
                onClick={() => setIngredientTypeFilter(option)}
                className={`cursor-pointer rounded-xl border py-3 text-xs font-bold transition-all ${
                  ingredientTypeFilter === option
                    ? 'border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-100'
                    : 'border-slate-100 bg-white text-slate-500'
                }`}
              >
                {option === 'all' ? 'All' : option}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
          Exclude Allergens
        </label>
        <div className="grid grid-cols-2 gap-2">
          {commonAllergens.map((allergen) => {
            const selected = excludedAllergens.includes(allergen);
            return (
              <button
                key={allergen}
                onClick={() =>
                  setExcludedAllergens((prev) =>
                    prev.includes(allergen)
                      ? prev.filter((item) => item !== allergen)
                      : [...prev, allergen]
                  )
                }
                className={`cursor-pointer flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold transition-all ${
                  selected
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-100 bg-white text-slate-500'
                }`}
              >
                {allergen}
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    selected
                      ? 'border-rose-500 bg-rose-500 text-white'
                      : 'border-slate-200 text-transparent'
                  }`}
                >
                  ✓
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
          Diet Type
        </label>
        <div className="flex gap-2">
          {['all', 'vegan', 'non-vegan'].map((option) => (
            <button
              key={option}
              onClick={() => setDietTypeFilter(option)}
              className={`cursor-pointer flex-1 rounded-xl border py-3 text-xs font-bold transition-all ${
                dietTypeFilter === option
                  ? 'border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-100'
                  : 'border-slate-100 bg-white text-slate-500'
              }`}
            >
              {option === 'all'
                ? 'All'
                : option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {subTab === 'mealLib' && (
        <section>
          <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Category
          </label>
          <div className="flex gap-2">
            {['all', 'solid', 'drinks only'].map((option) => (
              <button
                key={option}
                onClick={() => setCategoryFilter(option)}
                className={`cursor-pointer flex-1 rounded-xl border py-3 text-xs font-bold transition-all ${
                  categoryFilter === option
                    ? 'border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-100'
                    : 'border-slate-100 bg-white text-slate-500'
                }`}
              >
                {option === 'all'
                  ? 'All'
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </section>
      )}

      <button
        onClick={onClose}
        className="cursor-pointer mt-8 w-full rounded-2xl bg-[#0B1A12] py-5 font-black text-white shadow-xl shadow-emerald-100"
      >
        Apply Filters
      </button>
    </div>
  </div>
);

const MealsView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { meals: backendMeals, ingredients: backendIngredients } = useSelector((state: RootState) => state.meals);
  const { data: children, loading: childrenLoading } = useSelector((state: RootState) => state.children);

  const [subTab, setSubTab] = useState<'mealLib' | 'foodLib' | 'planning'>('planning');
  const [planSourceTab, setPlanSourceTab] = useState<'parent' | 'nutritionist'>('parent');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [planName, setPlanName] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [ageFilter, setAgeFilter] = useState('all');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [ingredientTypeFilter, setIngredientTypeFilter] = useState('all');
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [dietTypeFilter, setDietTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMealsForSlot, setSelectedMealsForSlot] = useState<Meal[]>([]);
  const [selectedLibraryMeal, setSelectedLibraryMeal] = useState<DetailedMeal | null>(null);
  const [mealDetailLoading, setMealDetailLoading] = useState(false);
  const [mealDetailError, setMealDetailError] = useState<string | null>(null);
  const [selectedLibraryIngredient, setSelectedLibraryIngredient] = useState<DetailedIngredient | null>(null);
  const [ingredientDetailLoading, setIngredientDetailLoading] = useState(false);
  const [ingredientDetailError, setIngredientDetailError] = useState<string | null>(null);
  const [mealPlans, setMealPlans] = useState<BackendMealPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [plansSuccess, setPlansSuccess] = useState<string | null>(null);
  const [activeViewPlan, setActiveViewPlan] = useState<BackendMealPlan | null>(null);
  const [activeViewDay, setActiveViewDay] = useState<string | null>(null);
  const [activeViewReadOnly, setActiveViewReadOnly] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanGroupKey, setEditingPlanGroupKey] = useState<string | null>(null);
  const [deletingPlanGroupKey, setDeletingPlanGroupKey] = useState<string | null>(null);
  const [pendingDeletePlan, setPendingDeletePlan] = useState<BackendMealPlan | null>(null);
  const currentUserId = useMemo(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return null;
      const parsed = JSON.parse(rawUser);
      return parsed?.id ? String(parsed.id) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    dispatch(fetchMeals());
    dispatch(fetchIngredients());
  }, [dispatch]);

  useEffect(() => {
    if (children.length > 0) return;

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser?.id) {
        void dispatch(fetchChildrenByParentId(String(parsedUser.id)));
      }
    } catch {
      // Ignore malformed local user payload and allow empty-state rendering.
    }
  }, [children.length, dispatch]);

  useEffect(() => {
    void refreshMealPlans();
  }, [children]);

  useEffect(() => {
    const state = location.state as
      | {
          openPlanning?: boolean;
          planSourceTab?: 'parent' | 'nutritionist';
          successMessage?: string;
        }
      | null;

    if (!state) return;

    if (state.openPlanning) {
      setSubTab('planning');
    }

    if (state.planSourceTab) {
      setPlanSourceTab(state.planSourceTab);
    }

    if (state.successMessage) {
      setPlansSuccess(state.successMessage);
    }

    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

  // Helper to map meal time to valid type
  const getMealType = (mealTime: string | undefined): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' => {
    const time = (mealTime || '').toLowerCase();
    if (time.includes('breakfast')) return 'Breakfast';
    if (time.includes('lunch')) return 'Lunch';
    if (time.includes('dinner')) return 'Dinner';
    return 'Snack';
  };

  // Transform backend meals to match UI format
  const transformedMeals = backendMeals.map(m => ({
    raw: m,
    derivedDietType: deriveDietTypeFromText(
      m.name,
      m.description,
      m.allergenDescription,
      m.intoleranceDescription,
      m.direction,
    ),
    derivedCategory: m.totalVolume >= 200 ? 'drinks only' : 'solid',
    derivedAllergens: m.allergen && m.allergenDescription
      ? m.allergenDescription
          .split(/[;,/]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    id: m.id,
    name: m.name,
    type: getMealType(m.mealTimes?.[0]),
    nutrients: [], // Backend doesn't have this in simple format
    image: m.imageUrl || `https://picsum.photos/seed/${m.id}/400/300`,
    description: m.description || '',
    prepTime: m.prepTime || 'N/A',
    ageGroup: m.ageGroup,
    ingredients: [],
    method: m.direction ? m.direction.split('.').filter(Boolean) : [],
    calories: Math.round(m.totalVolume * 1.3) || 200, // Estimate calories from volume
    volume: `${m.totalVolume}ml`,
    allergens:
      m.allergen && m.allergenDescription ? [m.allergenDescription] : undefined,
  }));

  // Transform backend ingredients to match UI format
  const transformedIngredients = backendIngredients.map(i => ({
    raw: i,
    derivedType: getCanonicalIngredientType(i.foodGroup, i.name),
    derivedDietType: deriveDietTypeFromText(
      i.name,
      i.foodGroup,
      i.allergenDescription,
      i.intoleranceDescription,
      i.drugInteraction,
    ),
    id: i.id,
    name: i.name,
    portion: `${i.portionSize}g`,
    calories: Math.round(i.density * i.portionSize) || 100,
    nutrients: [{ name: i.foodGroup, amount: 'Med' }],
    image: i.imageUrl || `https://picsum.photos/seed/${i.id}/200`,
  }));

  // Use transformed data or fallback to empty arrays
  const MEALS = transformedMeals.length > 0 ? transformedMeals.map(({ raw: _raw, derivedDietType: _derivedDietType, derivedCategory: _derivedCategory, derivedAllergens: _derivedAllergens, ...meal }) => meal) : [];
  const mealsForActiveSlot = useMemo(() => {
    if (!activeSlot) return MEALS;
    return MEALS.filter((meal) => meal.type === activeSlot);
  }, [MEALS, activeSlot]);

  const commonAllergens = useMemo(() => {
    const defaults = ['Milk', 'Eggs', 'Peanuts', 'Tree Nuts', 'Fish', 'Shellfish', 'Soy', 'Wheat'];
    const backendValues = transformedMeals.flatMap((meal) => meal.derivedAllergens);
    return Array.from(new Set([...defaults, ...backendValues])).filter(Boolean);
  }, [transformedMeals]);

  const excludedAllergenKeywords = useMemo(
    () =>
      excludedAllergens.flatMap((allergen) => getAllergenKeywords(allergen)),
    [excludedAllergens]
  );
  const ingredientTypeKeywords = useMemo(
    () =>
      ingredientTypeFilter === 'all'
        ? []
        : getIngredientTypeKeywords(ingredientTypeFilter),
    [ingredientTypeFilter]
  );

  const filteredMeals = useMemo(() => {
    let result = [...transformedMeals];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((meal) =>
        meal.name.toLowerCase().includes(query) ||
        meal.description.toLowerCase().includes(query) ||
        meal.derivedAllergens.some((allergen) => allergen.toLowerCase().includes(query))
      );
    }

    if (ageFilter !== 'all') {
      const normalizedAge = ageFilter.replace('<', '').toLowerCase();
      result = result.filter((meal) => meal.ageGroup.toLowerCase().includes(normalizedAge));
    }

    if (mealTypeFilter !== 'all') {
      result = result.filter((meal) => meal.type === mealTypeFilter);
    }

    if (excludedAllergens.length > 0) {
      result = result.filter(
        (meal) => {
          const haystack = [
            meal.name,
            meal.description,
            ...(meal.derivedAllergens || []),
            meal.raw.allergenDescription || '',
          ]
            .join(' ')
            .toLowerCase();

          return !excludedAllergenKeywords.some((keyword) => haystack.includes(keyword));
        }
      );
    }

    if (dietTypeFilter !== 'all') {
      result = result.filter((meal) => meal.derivedDietType === dietTypeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((meal) => meal.derivedCategory === categoryFilter);
    }

    if (sortBy === 'alpha') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (b.raw.createdAt || '').localeCompare(a.raw.createdAt || ''));
    }

    return result.map(({ raw: _raw, derivedDietType: _derivedDietType, derivedCategory: _derivedCategory, derivedAllergens: _derivedAllergens, ...meal }) => meal);
  }, [
    transformedMeals,
    searchQuery,
    ageFilter,
    mealTypeFilter,
    excludedAllergens,
    excludedAllergenKeywords,
    dietTypeFilter,
    categoryFilter,
    sortBy,
  ]);

  const filteredIngredients = useMemo(() => {
    let result = [...transformedIngredients];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ingredient) => {
          const haystack = [
            ingredient.name,
            ingredient.raw.foodGroup,
            ingredient.raw.allergenDescription || '',
            ingredient.raw.intoleranceDescription || '',
          ]
            .join(' ')
            .toLowerCase();

          const queryKeywords = getIngredientTypeKeywords(query);
          return (
            haystack.includes(query) ||
            queryKeywords.some((keyword) => haystack.includes(keyword))
          );
        }
      );
    }

    if (ageFilter !== 'all') {
      const match = ageFilter.match(/\d+/);
      const maxMonths = match ? Number(match[0]) : null;
      if (maxMonths) {
        result = result.filter((ingredient) => ingredient.raw.suitableAgeRange?.minMonths <= maxMonths);
      }
    }

    if (ingredientTypeFilter !== 'all') {
      result = result.filter((ingredient) => {
        const haystack = [
          ingredient.derivedType,
          ingredient.raw.foodGroup,
          ingredient.name,
        ]
          .join(' ')
          .toLowerCase();

        return ingredientTypeKeywords.some((keyword) => haystack.includes(keyword));
      });
    }

    if (excludedAllergens.length > 0) {
      result = result.filter((ingredient) => {
        const haystack = [
          ingredient.name,
          ingredient.raw.foodGroup,
          ingredient.raw.allergenDescription || '',
          ingredient.raw.intoleranceDescription || '',
          ingredient.raw.drugInteraction || '',
        ]
          .join(' ')
          .toLowerCase();

        return !excludedAllergenKeywords.some((keyword) => haystack.includes(keyword));
      });
    }

    if (dietTypeFilter !== 'all') {
      result = result.filter((ingredient) => ingredient.derivedDietType === dietTypeFilter);
    }

    if (sortBy === 'alpha') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (b.raw.createdAt || '').localeCompare(a.raw.createdAt || ''));
    }

    return result.map(({ raw: _raw, derivedType: _derivedType, derivedDietType: _derivedDietType, ...ingredient }) => ingredient);
  }, [
    transformedIngredients,
    searchQuery,
    ageFilter,
    ingredientTypeFilter,
    ingredientTypeKeywords,
    excludedAllergens,
    excludedAllergenKeywords,
    dietTypeFilter,
    sortBy,
  ]);

  const calorieTarget = 1500;
  const currentCals = selectedMealsForSlot.reduce((sum, m) => sum + m.calories, 0);
  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const selectedChild = useMemo(
    () =>
      children.find((child) => child.id === favoriteChildId) ??
      children[0] ??
      null,
    [children, favoriteChildId]
  );
  const selectedChildId = selectedChild?.id ?? null;

  useEffect(() => {
    if (!selectedChildId) return;

    if (favoriteChildId !== selectedChildId) {
      localStorage.setItem('favorite_child_id', selectedChildId);
    }
  }, [favoriteChildId, selectedChildId]);

  useEffect(() => {
    if (!plansSuccess) return;

    const timeoutId = window.setTimeout(() => {
      setPlansSuccess(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [plansSuccess]);

  const getPlanSource = (plan: BackendMealPlan) => {
    if (plan.source === 'parent' || plan.source === 'nutritionist') {
      return plan.source;
    }

    const expertRole = plan.expert?.role?.toUpperCase();

    if (expertRole && SPECIALIST_ROLES.has(expertRole)) {
      return 'nutritionist';
    }

    return 'parent';
  };

  const getPlanGroupKey = (plan: BackendMealPlan) =>
    [
      plan.child?.id || 'unknown-child',
      getPlanSource(plan),
      (plan.meal_description || 'untitled-plan').trim().toLowerCase(),
    ].join('::');

  const getRelatedPlans = (plan: BackendMealPlan) =>
    mealPlans.filter((candidate) => getPlanGroupKey(candidate) === getPlanGroupKey(plan));

  const groupPlans = (plans: BackendMealPlan[]) =>
    Array.from(
      new Map(
        plans.map((plan) => {
          const key = getPlanGroupKey(plan);
          const existing = plans.find((candidate) => getPlanGroupKey(candidate) === key);
          return [key, existing || plan] as const;
        })
      ).values()
    );

  const parentPlans = useMemo(
    () => groupPlans(mealPlans.filter((plan) => getPlanSource(plan) === 'parent')),
    [mealPlans]
  );
  const nutritionistPlans = useMemo(
    () =>
      groupPlans(
        mealPlans.filter((plan) => getPlanSource(plan) === 'nutritionist')
      ),
    [mealPlans]
  );
  const displayPlans = planSourceTab === 'parent' ? parentPlans : nutritionistPlans;
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
  const mealSlots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

  const resetPlanBuilder = () => {
    setIsCreatingPlan(false);
    setEditingPlanId(null);
    setEditingPlanGroupKey(null);
    setCreationStep(1);
    setPlanName('');
    setSelectedDay('');
    setActiveSlot(null);
    setSelectedMealsForSlot([]);
  };

  const openMealDetail = async (mealId: string) => {
    setMealDetailLoading(true);
    setMealDetailError(null);
    setSelectedLibraryMeal(null);

    try {
      const response = await api.get(`/meal/find-one/${mealId}`);
      setSelectedLibraryMeal(response.data);
    } catch (error: any) {
      setMealDetailError(
        error?.response?.data?.message || 'Failed to load meal details.'
      );
    } finally {
      setMealDetailLoading(false);
    }
  };

  const closeMealDetail = () => {
    setSelectedLibraryMeal(null);
    setMealDetailError(null);
    setMealDetailLoading(false);
  };

  const openIngredientDetail = async (ingredientId: string) => {
    setIngredientDetailLoading(true);
    setIngredientDetailError(null);
    setSelectedLibraryIngredient(null);

    try {
      const response = await api.get(`/ingredient/find-one/${ingredientId}`);
      setSelectedLibraryIngredient(response.data);
    } catch (error: any) {
      setIngredientDetailError(
        error?.response?.data?.message || 'Failed to load ingredient details.'
      );
    } finally {
      setIngredientDetailLoading(false);
    }
  };

  const closeIngredientDetail = () => {
    setSelectedLibraryIngredient(null);
    setIngredientDetailError(null);
    setIngredientDetailLoading(false);
  };

  const getDayKeyFromIsoDate = (date?: string) => {
    if (!date) return 'Mon';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const next = new Date(date);
    return dayNames[next.getDay()] ?? 'Mon';
  };

  const getMealImage = (meal: BackendPlanMeal) =>
    meal?.imageUrl || `https://picsum.photos/seed/${meal?.id}/200/200`;

  const mapBackendMealToSelection = (meal: BackendPlanMeal): Meal => ({
    id: meal.id,
    name: meal.name || 'Meal',
    type: 'Lunch',
    nutrients: [],
    image: getMealImage(meal),
    description: '',
    prepTime: 'N/A',
    ageGroup: '',
    ingredients: [],
    method: [],
    calories: 0,
    volume: `${meal.totalVolume ?? 0}ml`,
  });

  const openEditPlan = (plan: BackendMealPlan) => {
    const selectedSlot =
      Object.values(plan.mealTimes || {}).flat()[0] || 'Lunch';

    setActiveViewPlan(null);
    setIsCreatingPlan(true);
    setEditingPlanId(plan.id);
    setEditingPlanGroupKey(getPlanGroupKey(plan));
    setCreationStep(1);
    setPlanName(plan.meal_description || '');
    setSelectedDay(getDayKeyFromIsoDate(plan.meal_date));
    setActiveSlot(selectedSlot);
    setSelectedMealsForSlot((plan.meals || []).map(mapBackendMealToSelection));
    setPlansError(null);
    setPlansSuccess(null);
  };

  const openViewPlan = (plan: BackendMealPlan) => {
    setActiveViewPlan(plan);
    setActiveViewDay(getDayKeyFromIsoDate(plan.meal_date));
    setActiveViewReadOnly(getPlanSource(plan) === 'nutritionist');
    setPlansError(null);
    setPlansSuccess(null);
  };

  const requestDeletePlan = (plan: BackendMealPlan) => {
    setPendingDeletePlan(plan);
    setPlansError(null);
    setPlansSuccess(null);
  };

  const closeDeletePlanDialog = () => {
    if (deletingPlanGroupKey) {
      return;
    }

    setPendingDeletePlan(null);
  };

  const handleDeletePlan = async () => {
    if (!pendingDeletePlan) {
      return;
    }

    const planGroupKey = getPlanGroupKey(pendingDeletePlan);
    const relatedPlans = getRelatedPlans(pendingDeletePlan);

    if (!relatedPlans.length) {
      setPendingDeletePlan(null);
      return;
    }

    setDeletingPlanGroupKey(planGroupKey);
    setPlansError(null);
    setPlansSuccess(null);

    try {
      await Promise.all(
        relatedPlans.map((plan) => api.delete(`/meal-plans/${plan.id}`))
      );
      setMealPlans((prev) =>
        prev.filter((plan) => getPlanGroupKey(plan) !== planGroupKey)
      );
      if (activeViewPlan && getPlanGroupKey(activeViewPlan) === planGroupKey) {
        setActiveViewPlan(null);
        setActiveViewDay(null);
        setActiveViewReadOnly(false);
      }
      setPendingDeletePlan(null);
      setPlansSuccess('Meal plan deleted.');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      setPlansError(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Failed to delete meal plan.'
      );
      await refreshMealPlans();
    } finally {
      setDeletingPlanGroupKey(null);
    }
  };

  const getNextDateForDay = (day: string) => {
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const now = new Date();
    const targetDay = dayMap[day];

    if (targetDay === undefined) {
      return now.toISOString();
    }

    const result = new Date(now);
    const diff = (targetDay - now.getDay() + 7) % 7;
    result.setDate(now.getDate() + diff);
    result.setHours(12, 0, 0, 0);

    return result.toISOString();
  };

  async function refreshMealPlans() {
    const childIds = Array.from(
      new Set(
        children.map((child) => child.id).filter(Boolean).concat(
          selectedChildId ? [selectedChildId] : []
        )
      )
    );

    if (!childIds.length) {
      setMealPlans([]);
      return;
    }

    setPlansLoading(true);
    setPlansError(null);

    try {
      const responses = await Promise.all(
        childIds.map((childId) => api.get(`/meal-plans/by-child/${childId}`))
      );

      const fetchedPlans = responses.flatMap(
        (response) => response.data?.data ?? []
      ) as BackendMealPlan[];

      const uniquePlans = Array.from(
        new Map(fetchedPlans.map((plan) => [plan.id, plan])).values()
      );

      setMealPlans(uniquePlans);
    } catch (error: any) {
      setMealPlans([]);
      setPlansError(
        error?.response?.data?.message || 'Failed to fetch meal plans.'
      );
    } finally {
      setPlansLoading(false);
    }
  }

  const handleCreatePlan = async () => {
    if (!selectedChildId) {
      setPlansError('No child selected for this meal plan.');
      return;
    }

    if (!planName.trim()) {
      setPlansError('Plan name is required.');
      return;
    }

    if (!selectedDay || !activeSlot || selectedMealsForSlot.length === 0) {
      setPlansError('Select a day, a meal slot, and at least one meal.');
      return;
    }

    setSavingPlan(true);
    setPlansError(null);
    setPlansSuccess(null);

    const mealTimes = Object.fromEntries(
      selectedMealsForSlot.map((meal) => [meal.id, [activeSlot]])
    );

    const payload = {
      expertId: currentUserId ?? selectedChildId,
      childId: selectedChildId,
      source: 'parent',
      meal_description: planName.trim(),
      mealTimes,
      meal_date: getNextDateForDay(selectedDay),
      calories: currentCals,
      meals: selectedMealsForSlot.map((meal) => ({ id: meal.id })),
    };

    const matchingDayPlan =
      editingPlanGroupKey
        ? mealPlans.find(
            (plan) =>
              getPlanGroupKey(plan) === editingPlanGroupKey &&
              getDayKeyFromIsoDate(plan.meal_date) === selectedDay
          )
        : null;

    try {
      const response =
        editingPlanGroupKey && matchingDayPlan
          ? await api.put(`/meal-plans/update/${matchingDayPlan.id}`, payload)
          : editingPlanId && !editingPlanGroupKey
            ? await api.put(`/meal-plans/update/${editingPlanId}`, payload)
            : await api.post('/meal-plans/create', payload);

      setMealPlans((prev) =>
        Array.from(
          new Map([response.data, ...prev].map((plan) => [plan.id, plan])).values()
        )
      );
      await refreshMealPlans();
      setPlanSourceTab('parent');
      setPlansSuccess(
        editingPlanGroupKey
          ? matchingDayPlan
            ? 'Meal plan updated.'
            : 'New day added to your meal plan.'
          : editingPlanId
            ? 'Meal plan updated.'
            : 'Meal plan saved to My Plans.'
      );
      resetPlanBuilder();
    } catch (error: any) {
      console.error('Meal plan save failed', {
        payload,
        response: error?.response?.data,
      });
      const message = error?.response?.data?.message;
      setPlansError(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Failed to save meal plan.'
      );
    } finally {
      setSavingPlan(false);
    }
  };

  const renderPlanDetail = (plan: BackendMealPlan) => {
    const relatedPlans = getRelatedPlans(plan);

    const plansByDay = new Map(
      relatedPlans.map((candidate) => [
        getDayKeyFromIsoDate(candidate.meal_date),
        candidate,
      ])
    );

    const selectedDay = activeViewDay ?? getDayKeyFromIsoDate(plan.meal_date);
    const selectedPlan = plansByDay.get(selectedDay) ?? null;
    const isReadOnlyPlan = activeViewReadOnly || getPlanSource(plan) === 'nutritionist';
    const specialistName = plan.expert
      ? `${plan.expert.firstName || ''} ${plan.expert.lastName || ''}`.trim() ||
        plan.expert.role ||
        'Nutritionist'
      : 'Nutritionist';
    const slotEntries = mealSlots.map((slot) => {
      const mealsForSlot = (selectedPlan?.meals || []).filter((meal) => {
        const times = selectedPlan?.mealTimes?.[meal.id] || [];
        return times.some((time) => time.toLowerCase() === slot.toLowerCase());
      });

      return {
        slot,
        meals: mealsForSlot,
      };
    });

    return (
      <div className="px-6 space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setActiveViewPlan(null);
              setActiveViewDay(null);
              setActiveViewReadOnly(false);
            }}
            className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 text-xl font-black"
          >
            ←
          </button>
          <div className="text-center">
            <h3 className="text-2xl font-black text-slate-800">
              {plan.meal_description || 'Meal Plan'}
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {plan.child?.name || 'Child'}
            </p>
          </div>
          {isReadOnlyPlan ? (
            <div className="min-w-12 rounded-2xl bg-slate-100 px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              View
            </div>
          ) : (
            <button
              onClick={() => openEditPlan(selectedPlan ?? plan)}
              className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 text-xl font-black"
            >
              ✎
            </button>
          )}
        </div>

        {isReadOnlyPlan && (
          <div className="rounded-[1.5rem] border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prepared By</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{specialistName}</p>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {weekDays.map((day) => (
            <button
              key={day}
              onClick={() => setActiveViewDay(day)}
              className={`min-w-16 rounded-2xl px-5 py-3 text-sm font-bold border transition-all ${
                day === selectedDay
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100'
                  : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {slotEntries.map(({ slot, meals }) => (
            <section key={slot} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 rounded-full bg-emerald-500" />
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                    {slot}
                  </h4>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {meals.length} Meals
                </span>
              </div>

              {meals.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-300">
                  No meals planned
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-4"
                    >
                      <img
                        src={getMealImage(meal)}
                        alt={meal.name || 'Meal'}
                        className="w-16 h-16 rounded-2xl object-cover"
                      />
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-800 truncate">
                          {meal.name || 'Meal'}
                        </h5>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {selectedPlan?.calories || 0} kcal • {meal.totalVolume ?? 0}ml
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    );
  };

  const renderPlanning = () => (
    <div className="px-6 space-y-6">
      {activeViewPlan ? (
        renderPlanDetail(activeViewPlan)
      ) : !isCreatingPlan ? (
        <div className="space-y-6">
          <div className="bg-sky-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-sky-100">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2 leading-tight">Smart Child<br/>Meal Planning</h3>
              <p className="text-sky-100 text-xs font-medium mb-8 leading-relaxed">Design balanced nutrition tailored to your little one's growth.</p>
              <button
                onClick={() => setIsCreatingPlan(true)}
                className="bg-white text-sky-500 px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-transform"
              >
              Create New Plan
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-sky-400 rounded-full -mb-20 -mr-20"></div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setPlanSourceTab('parent')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${planSourceTab === 'parent' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400'}`}
            >
              My Plans
            </button>
            <button
              onClick={() => setPlanSourceTab('nutritionist')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${planSourceTab === 'nutritionist' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400'}`}
            >
              Nutritionist Plans
            </button>
          </div>

          <div className="flex justify-between items-center px-2">
            <h4 className="font-bold text-slate-800">
              {planSourceTab === 'parent' ? 'Your Saved Plans' : 'Expert Recommendations'}
            </h4>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              {displayPlans.length} Plans
            </span>
          </div>

          {plansSuccess && (
            <div className="bg-emerald-50 rounded-[2rem] p-4 border border-emerald-100 text-center">
              <p className="text-emerald-700 text-sm font-bold">{plansSuccess}</p>
            </div>
          )}

          {plansLoading || childrenLoading ? (
            <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-4">⏳</div>
              <p className="text-slate-400 text-sm font-bold">Loading meal plans...</p>
            </div>
          ) : plansError ? (
            <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mb-4">!</div>
              <p className="text-rose-500 text-sm font-bold">{plansError}</p>
            </div>
          ) : displayPlans.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-4">🍽️</div>
              <p className="text-slate-400 text-sm font-bold">No plans found here.</p>
              {planSourceTab === 'parent' && (
                <button onClick={() => setIsCreatingPlan(true)} className="mt-4 text-sky-500 text-xs font-black uppercase">Start First Plan</button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayPlans.map(plan => {
                const relatedPlans = getRelatedPlans(plan);
                const mealCount = relatedPlans.reduce(
                  (total, candidate) => total + (Array.isArray(candidate.meals) ? candidate.meals.length : 0),
                  0
                );
                const dayCount = relatedPlans.length;
                const planGroupKey = getPlanGroupKey(plan);
                const planDate = plan.meal_date
                  ? new Date(plan.meal_date).toLocaleDateString()
                  : plan.createdAt
                  ? new Date(plan.createdAt).toLocaleDateString()
                  : 'No date';
                const subtitle = planSourceTab === 'nutritionist' && plan.expert
                  ? `${plan.expert.firstName || ''} ${plan.expert.lastName || ''}`.trim() || plan.expert.role || 'Nutritionist'
                  : plan.child?.name || 'Meal plan';

                return (
                  <div key={plan.id} className="bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-2xl">
                      {planSourceTab === 'nutritionist' ? '🥗' : '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-800 truncate">
                        {plan.meal_description || 'Meal Plan'}
                      </h5>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                        {subtitle} • {dayCount} Days • {mealCount} Meals • {planDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openViewPlan(plan)}
                        className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase"
                      >
                        View
                      </button>
                      {planSourceTab === 'parent' && (
                        <>
                          <button
                            onClick={() => openEditPlan(plan)}
                            className="px-3 py-2 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => requestDeletePlan(plan)}
                            disabled={deletingPlanGroupKey === planGroupKey}
                            className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase disabled:opacity-50"
                          >
                            {deletingPlanGroupKey === planGroupKey ? '...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {/* Step Navigation Header */}
          <div className="flex items-center gap-4">
            <button onClick={resetPlanBuilder} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <PlusIcon className="rotate-45 text-slate-500" />
            </button>
            <div className="flex-1">
              <h3 className="font-black text-slate-800">Step {creationStep}: {creationStep === 1 ? 'Name' : creationStep === 2 ? 'Day' : creationStep === 3 ? 'Time' : 'Meals'}</h3>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1 rounded-full flex-1 transition-all ${s <= creationStep ? 'bg-sky-500' : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 px-5 py-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Child</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {selectedChild?.name || 'No child selected'}
            </p>
          </div>

          {plansError && (
            <div className="bg-rose-50 rounded-[2rem] border border-rose-100 px-5 py-4 shadow-sm">
              <p className="text-sm font-bold text-rose-600">{plansError}</p>
            </div>
          )}

          {creationStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 ml-2">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g., Growth Week 1"
                  className="w-full bg-white border border-slate-100 p-5 rounded-2xl font-bold text-slate-800 outline-none focus:border-sky-400 shadow-sm"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                />
              </div>
              <Button
                disabled={!planName}
                onClick={() => setCreationStep(2)}
                color="sky"
                fullWidth
                size="lg"
              >
                Next Step
              </Button>
            </div>
          )}

          {creationStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Select Day</label>
              <div className="grid grid-cols-4 gap-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`py-4 rounded-2xl font-bold text-sm border transition-all ${selectedDay === day ? 'bg-sky-500 border-sky-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setCreationStep(1)} className="flex-1 py-4 text-slate-400 font-bold">Back</button>
                <Button disabled={!selectedDay} onClick={() => setCreationStep(3)} color="sky" className="flex-[2]" size="lg">Next Step</Button>
              </div>
            </div>
          )}

          {creationStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Meal Time Slot</label>
              <div className="space-y-3">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(slot => (
                  <button
                    key={slot}
                    onClick={() => setActiveSlot(slot)}
                    className={`w-full p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between ${activeSlot === slot ? 'border-sky-500 bg-sky-50/50' : 'border-slate-100 bg-white'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">
                        {slot === 'Breakfast' ? '🥣' : slot === 'Lunch' ? '🍛' : slot === 'Dinner' ? '🍲' : '🍎'}
                      </div>
                      <span className="font-bold text-slate-800">{slot}</span>
                    </div>
                    {activeSlot === slot && <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setCreationStep(2)} className="flex-1 py-4 text-slate-400 font-bold">Back</button>
                <Button disabled={!activeSlot} onClick={() => setCreationStep(4)} color="sky" className="flex-[2]" size="lg">Next Step</Button>
              </div>
            </div>
          )}

          {creationStep === 4 && (
            <div className="space-y-8 animate-in slide-in-from-bottom">
              {/* Nutrition Gauge */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Nutrient Gauge</h4>
                    <p className="text-2xl font-black">{currentCals} <span className="text-xs font-medium text-slate-500">/ {calorieTarget} kcal</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-sky-400">{Math.round((currentCals/calorieTarget)*100)}% Reached</p>
                  </div>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((currentCals / calorieTarget) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-6 px-2">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Vol</p>
                    <p className="text-sm font-bold">{selectedMealsForSlot.reduce((sum, m) => sum + parseInt(m.volume) || 0, 0)}ml</p>
                  </div>
                  <div className="text-center border-x border-slate-800 px-8">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Prot</p>
                    <p className="text-sm font-bold">{Math.round(currentCals * 0.04)}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Iron</p>
                    <p className="text-sm font-bold">{currentCals > 0 ? 'High' : '--'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h5 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Select Meals for {activeSlot}</h5>
                  <span className="text-[10px] font-bold text-slate-400">{selectedMealsForSlot.length} Added</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {mealsForActiveSlot.map(meal => (
                    <button
                      key={meal.id}
                      onClick={() => {
                        if(selectedMealsForSlot.find(m => m.id === meal.id)) {
                          setSelectedMealsForSlot(selectedMealsForSlot.filter(m => m.id !== meal.id));
                        } else {
                          setSelectedMealsForSlot([...selectedMealsForSlot, meal]);
                        }
                      }}
                      className={`p-4 rounded-[2rem] border-2 text-left flex gap-4 transition-all ${selectedMealsForSlot.find(m => m.id === meal.id) ? 'border-sky-500 bg-sky-50' : 'border-slate-50 bg-white'}`}
                    >
                      <img src={meal.image} className="w-16 h-16 rounded-2xl object-cover" alt={meal.name} />
                      <div className="flex-1 flex flex-col justify-center">
                        <h6 className="font-bold text-slate-800">{meal.name}</h6>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{meal.calories} kcal • {meal.volume}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center self-center transition-all ${selectedMealsForSlot.find(m => m.id === meal.id) ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-100 text-transparent'}`}>
                        ✓
                      </div>
                    </button>
                  ))}
                  {activeSlot && mealsForActiveSlot.length === 0 && (
                    <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">
                        No {activeSlot.toLowerCase()} meals available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setCreationStep(3)} className="flex-1 py-4 text-slate-400 font-bold">Back</button>
                <button
                  onClick={() => void handleCreatePlan()}
                  disabled={savingPlan || selectedMealsForSlot.length === 0}
                  className="flex-[2] py-4 bg-emerald-500 text-white font-black rounded-3xl shadow-xl shadow-emerald-100"
                >
                  {savingPlan ? 'Saving...' : editingPlanId ? 'Save Changes' : 'Finish Plan'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLibraries = () => (
    <div className="px-6 space-y-8 pb-32">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setSubTab('mealLib')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'mealLib' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400'}`}
        >
          Meal Library
        </button>
        <button
          onClick={() => setSubTab('foodLib')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'foodLib' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400'}`}
        >
          Food Library
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Search by name, allergy..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-sky-300 text-sm font-medium"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="cursor-pointer w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#76A13B] hover:border-[#76A13B] transition-all"
        >
          <FilterIcon />
        </button>
      </div>

        <div className="grid grid-cols-1 gap-5">
          {subTab === 'mealLib' ? (
          filteredMeals.map(meal => (
            <button
              key={meal.id}
              type="button"
              onClick={() => void openMealDetail(meal.id)}
              className="cursor-pointer bg-white rounded-[2.5rem] p-5 flex gap-5 border border-slate-50 shadow-sm transition-transform active:scale-95 text-left"
            >
              <img src={meal.image} className="w-24 h-24 rounded-3xl object-cover flex-shrink-0" alt={meal.name} />
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-bold text-slate-800 text-base">{meal.name}</h5>
                  <span className="text-[9px] font-black bg-sky-50 text-sky-500 px-2 py-0.5 rounded uppercase">{meal.ageGroup}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{meal.description}</p>
                <div className="flex flex-wrap gap-1">
                  {meal.nutrients.map(n => (
                    <span key={n} className="text-[8px] font-black uppercase bg-slate-50 text-slate-400 px-2 py-1 rounded-md border border-slate-100">{n}</span>
                  ))}
                </div>
              </div>
            </button>
          ))
        ) : (
          filteredIngredients.map(food => (
            <button
              key={food.id}
              type="button"
              onClick={() => void openIngredientDetail(food.id)}
              className="cursor-pointer bg-white rounded-[2.5rem] p-4 flex gap-5 border border-slate-50 shadow-sm text-left transition-transform active:scale-95"
            >
              <img src={food.image} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" alt={food.name} />
              <div className="flex-1 flex flex-col justify-center">
                <h5 className="font-bold text-slate-800">{food.name}</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Per {food.portion} • {food.calories} kcal</p>
                <div className="flex gap-1">
                  {food.nutrients.map(n => (
                    <span key={n.name} className="text-[9px] font-black bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded uppercase tracking-wider">{n.name}: {n.amount}</span>
                  ))}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-32 pt-4">
      {(selectedLibraryMeal || mealDetailLoading || mealDetailError) && (
        <MealLibraryDetailOverlay
          meal={selectedLibraryMeal}
          loading={mealDetailLoading}
          error={mealDetailError}
          onClose={closeMealDetail}
        />
      )}
      {(selectedLibraryIngredient || ingredientDetailLoading || ingredientDetailError) && (
        <IngredientLibraryDetailOverlay
          ingredient={selectedLibraryIngredient}
          loading={ingredientDetailLoading}
          error={ingredientDetailError}
          onClose={closeIngredientDetail}
        />
      )}
      {pendingDeletePlan && (() => {
        const relatedPlans = getRelatedPlans(pendingDeletePlan);
        const dayCount = relatedPlans.length;
        const childName = pendingDeletePlan.child?.name || 'this child';
        const planTitle = pendingDeletePlan.meal_description || 'this meal plan';

        return (
          <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-900/40 px-4 pb-6 pt-12">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl">
                !
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-800">Delete whole plan?</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                  This will delete <span className="font-bold text-slate-700">{planTitle}</span> for{' '}
                  <span className="font-bold text-slate-700">{childName}</span>, including all{' '}
                  <span className="font-bold text-slate-700">{dayCount}</span> saved day{dayCount === 1 ? '' : 's'} in that plan.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeDeletePlanDialog}
                  disabled={Boolean(deletingPlanGroupKey)}
                  className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeletePlan()}
                  disabled={Boolean(deletingPlanGroupKey)}
                  className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {deletingPlanGroupKey ? 'Deleting...' : 'Delete Plan'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {showFilters && subTab !== 'planning' && (
        <FilterOverlay
          onClose={() => setShowFilters(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
          ageFilter={ageFilter}
          setAgeFilter={setAgeFilter}
          subTab={subTab as LibrarySubTab}
          mealTypeFilter={mealTypeFilter}
          setMealTypeFilter={setMealTypeFilter}
          ingredientTypeFilter={ingredientTypeFilter}
          setIngredientTypeFilter={setIngredientTypeFilter}
          excludedAllergens={excludedAllergens}
          setExcludedAllergens={setExcludedAllergens}
          dietTypeFilter={dietTypeFilter}
          setDietTypeFilter={setDietTypeFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          commonAllergens={commonAllergens}
        />
      )}
      <div className="px-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Nutri-Meal</h2>
        <p className="text-slate-500 text-sm">Balanced food for bright futures.</p>
      </div>

      <div className="px-6 mb-8">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex">
          <button
            onClick={() => setSubTab('planning')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'planning' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-500'}`}
          >
            Planning
          </button>
          <button
            onClick={() => setSubTab('mealLib')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab !== 'planning' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-500'}`}
          >
            Libraries
          </button>
        </div>
      </div>

      {subTab === 'planning' ? renderPlanning() : renderLibraries()}
    </div>
  );
};

export default MealsView;
