import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchMeals, fetchIngredients } from '@/redux/slices/mealSlice';
import { fetchChildrenByParentId } from '@/redux/slices/childSlice';
import { PlusIcon, SearchIcon, FilterIcon, ChevronDownIcon, AssessmentIcon, TrashIcon } from '@/design-system/icons';
import type { Meal } from '@/design-system/types';
import api, { getPreferredLanguage } from '@/api/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { calculateNutrients } from '@/utils/calculateNutrients';
import { useTranslation } from 'react-i18next';
import { registerBackHandler } from '@/navigation/backStore';

type UnitLookupRecord = {
  id: string;
  name?: string | null;
  abbreviation?: string | null;
  symbol?: string | null;
  shortName?: string | null;
  type?: string | null;
  conversionToBase?: number | null;
};

type UnitLookupResponse = {
  data?: UnitLookupRecord[];
};

const SYNTHETIC_UNIT_RECORDS: UnitLookupRecord[] = [
  { id: 'synthetic-mass-g', name: 'gram', abbreviation: 'g', type: 'mass', conversionToBase: 1 },
  { id: 'synthetic-mass-kg', name: 'kilogram', abbreviation: 'kg', type: 'mass', conversionToBase: 1000 },
  { id: 'synthetic-mass-cup', name: 'cup', abbreviation: 'cup', type: 'mass', conversionToBase: 240 },
  { id: 'synthetic-mass-tbsp', name: 'tablespoon', abbreviation: 'tbsp', type: 'mass', conversionToBase: 15 },
  { id: 'synthetic-mass-tsp', name: 'teaspoon', abbreviation: 'tsp', type: 'mass', conversionToBase: 5 },
  { id: 'synthetic-volume-ml', name: 'milliliter', abbreviation: 'ml', type: 'volume', conversionToBase: 1 },
  { id: 'synthetic-volume-l', name: 'liter', abbreviation: 'L', type: 'volume', conversionToBase: 1000 },
  { id: 'synthetic-volume-cup', name: 'cup', abbreviation: 'cup', type: 'volume', conversionToBase: 240 },
  { id: 'synthetic-volume-tbsp', name: 'tablespoon', abbreviation: 'tbsp', type: 'volume', conversionToBase: 15 },
  { id: 'synthetic-volume-tsp', name: 'teaspoon', abbreviation: 'tsp', type: 'volume', conversionToBase: 5 },
];

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
    multiplier?: number;
  }>;
  expert?: {
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
};

type BackendPlanMeal = NonNullable<BackendMealPlan['meals']>[number];

const MEALS_VIEW_STATE_KEY = 'lije-care:meals-view-state';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

type DayKey = typeof WEEK_DAYS[number];
type MealSlot = typeof MEAL_SLOTS[number];
type PlannedMealSelection = {
  meal: Meal;
  multiplier: number;
};
type MealsByDay = Partial<
  Record<DayKey, Partial<Record<MealSlot, PlannedMealSelection[]>>>
>;

type PersistedMealsViewState = {
  subTab: 'mealLib' | 'foodLib' | 'planning';
  planSourceTab: 'parent' | 'nutritionist';
  isCreatingPlan: boolean;
  creationStep: 1 | 2;
  planName: string;
  selectedDay: DayKey;
  activeSlot: MealSlot;
  selectedMealsByDay: MealsByDay;
  focusedChildId: string | null;
  activeViewPlanId: string | null;
  activeViewDay: string | null;
  activeViewReadOnly: boolean;
};

const SPECIALIST_ROLES = new Set([
  'SUPER_ADMIN',
  'NUTRITIONIST',
  'PEDIATRICIAN',
  'CULINARIAN',
]);

function normalizeMealSlot(value?: string | null): MealSlot | null {
  const normalized = value?.trim().toUpperCase();

  switch (normalized) {
    case 'BREAKFAST':
      return 'Breakfast';
    case 'LUNCH':
      return 'Lunch';
    case 'DINNER':
      return 'Dinner';
    case 'SNACK':
    case 'SNACKS':
      return 'Snack';
    default:
      return null;
  }
}

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
  skillLevel?: string | null;
  category?: string | null;
  dietType?: string | null;
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
      portionSize?: number | null;
      density?: number | null;
      portionUnit?: {
        id?: string | null;
        name?: string | null;
        abbreviation?: string | null;
        type?: string | null;
        conversionToBase?: number | null;
      } | null;
      nutrientAmounts?: Array<{
        id: string;
        amount?: number | null;
        nutrient?: {
          id: string;
          name?: string;
          unit?:
            | string
            | {
                id?: string | null;
                name?: string | null;
                abbreviation?: string | null;
                symbol?: string | null;
                shortName?: string | null;
              }
            | null;
          abbreviation?: string | null;
          symbol?: string | null;
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
      unit?:
        | string
        | {
            id?: string | null;
            name?: string | null;
            abbreviation?: string | null;
            symbol?: string | null;
            shortName?: string | null;
          }
        | null;
      abbreviation?: string | null;
      symbol?: string | null;
    } | null;
  }>;
};

function getNutrientUnitLabel(
  nutrient?: {
    unit?:
      | string
      | {
          name?: string | null;
          abbreviation?: string | null;
          symbol?: string | null;
          shortName?: string | null;
        }
      | null;
    abbreviation?: string | null;
    symbol?: string | null;
  } | null,
  unitLabelsById?: Record<string, string>
) {
  if (!nutrient) {
    return '';
  }

  const sanitizeUnitLabel = (value?: string | null) => {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();
    return looksLikeId(trimmed) ? '' : trimmed;
  };

  if (typeof nutrient.unit === 'string') {
    const directLabel = sanitizeUnitLabel(nutrient.unit);
    if (directLabel) {
      return directLabel;
    }

    return unitLabelsById?.[nutrient.unit.trim()] || '';
  }

  return (
    sanitizeUnitLabel(nutrient.unit?.abbreviation) ||
    sanitizeUnitLabel(nutrient.unit?.symbol) ||
    sanitizeUnitLabel(nutrient.unit?.shortName) ||
    sanitizeUnitLabel(nutrient.unit?.name) ||
    sanitizeUnitLabel(nutrient.abbreviation) ||
    sanitizeUnitLabel(nutrient.symbol) ||
    ''
  );
}

function getUnitDisplayLabel(unit?: {
  name?: string | null;
  abbreviation?: string | null;
  symbol?: string | null;
  shortName?: string | null;
} | null) {
  return (
    unit?.abbreviation?.trim() ||
    unit?.symbol?.trim() ||
    unit?.shortName?.trim() ||
    unit?.name?.trim() ||
    ''
  );
}

function getNutrientUnitId(
  nutrient?: {
    unit?:
      | string
      | {
          id?: string | null;
        }
      | null;
  } | null
) {
  if (!nutrient?.unit) {
    return null;
  }

  if (typeof nutrient.unit === 'string') {
    const trimmed = nutrient.unit.trim();
    return looksLikeId(trimmed) ? trimmed : null;
  }

  return nutrient.unit.id?.trim() || null;
}

function getUnitRecordIdByLabel(
  label: string | null | undefined,
  unitRecordsById: Record<string, UnitLookupRecord>,
  preferredType?: string | null
) {
  if (!label) {
    return null;
  }

  const normalizedLabel = label.trim().toLowerCase();
  if (!normalizedLabel) {
    return null;
  }

  const matched = Object.values(unitRecordsById).find((unit) => {
    const aliases = [
      unit.abbreviation,
      unit.symbol,
      unit.shortName,
      unit.name,
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    const typeMatches = preferredType
      ? unit.type?.toLowerCase() === preferredType.toLowerCase()
      : true;

    return typeMatches && aliases.includes(normalizedLabel);
  });

  return matched?.id || null;
}

function getCompatibleUnits(
  unitId: string | null | undefined,
  unitRecordsById: Record<string, UnitLookupRecord>
) {
  if (!unitId) {
    return [];
  }

  const currentUnit = unitRecordsById[unitId];
  if (!currentUnit?.type) {
    return currentUnit ? [currentUnit] : [];
  }

  const preferredLabelsByType: Record<string, string[]> = {
    mass: ['g', 'kg', 'cup', 'tbsp', 'tsp'],
    volume: ['ml', 'l', 'cup', 'tbsp', 'tsp'],
  };

  const preferredLabels =
    preferredLabelsByType[currentUnit.type.toLowerCase()] || [];

  const getNormalizedUnitAliases = (unit: UnitLookupRecord) =>
    [
      unit.abbreviation,
      unit.symbol,
      unit.shortName,
      unit.name,
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

  if (preferredLabels.length > 0) {
    const preferredUnits = preferredLabels
      .map((label) =>
        Object.values(unitRecordsById).find((unit) =>
          getNormalizedUnitAliases(unit).includes(label)
        )
      )
      .filter(
        (unit): unit is UnitLookupRecord =>
          Boolean(
            unit &&
              typeof unit.conversionToBase === 'number' &&
              unit.conversionToBase > 0
          )
      );

    if (preferredUnits.length > 0) {
      return preferredUnits;
    }
  }

  return Object.values(unitRecordsById)
    .filter(
      (unit) =>
        unit.type === currentUnit.type &&
        typeof unit.conversionToBase === 'number' &&
        unit.conversionToBase > 0
    )
    .sort((a, b) => (a.conversionToBase || 0) - (b.conversionToBase || 0));
}

function getFixedIngredientUnits(
  unitType: string | null | undefined,
  unitRecordsById: Record<string, UnitLookupRecord>
) {
  const normalizedType = unitType?.toLowerCase();
  const preferredLabels =
    normalizedType === 'mass'
      ? ['g', 'kg', 'cup', 'tbsp', 'tsp']
      : normalizedType === 'volume'
        ? ['ml', 'l', 'cup', 'tbsp', 'tsp']
        : [];

  if (preferredLabels.length === 0) {
    return [];
  }

  return preferredLabels
    .map((label) =>
      Object.values(unitRecordsById).find((unit) => {
        const aliases = [
          unit.abbreviation,
          unit.symbol,
          unit.shortName,
          unit.name,
        ]
          .filter(Boolean)
          .map((value) => String(value).trim().toLowerCase());

        return aliases.includes(label);
      })
    )
    .filter(
      (unit): unit is UnitLookupRecord =>
        Boolean(
          unit &&
            typeof unit.conversionToBase === 'number' &&
            unit.conversionToBase > 0
        )
    );
}

function convertNutrientAmount(
  amount: number,
  fromUnitId: string,
  toUnitId: string,
  unitRecordsById: Record<string, UnitLookupRecord>
) {
  const fromUnit = unitRecordsById[fromUnitId];
  const toUnit = unitRecordsById[toUnitId];

  if (
    !fromUnit ||
    !toUnit ||
    typeof fromUnit.conversionToBase !== 'number' ||
    typeof toUnit.conversionToBase !== 'number' ||
    fromUnit.conversionToBase <= 0 ||
    toUnit.conversionToBase <= 0
  ) {
    return amount;
  }

  const baseAmount = amount * fromUnit.conversionToBase;
  return baseAmount / toUnit.conversionToBase;
}

function buildNutrientProgressItems(
  currentCals: number,
  childNutritionTargets: ReturnType<typeof calculateNutrients>
) {
  if (!childNutritionTargets) {
    return [];
  }

  return [
    {
      key: 'calorie',
      label: 'Calorie',
      current: Math.round(currentCals),
      target: childNutritionTargets.calories,
      unit: '',
    },
    {
      key: 'carbohydrate',
      label: 'Carbohydrate',
      current: Math.round(currentCals * 0.125),
      target: Math.round(childNutritionTargets.carbs),
      unit: '',
    },
    {
      key: 'protein',
      label: 'Protein',
      current: Math.round(currentCals * 0.04),
      target: Math.round(childNutritionTargets.protein),
      unit: '',
    },
    {
      key: 'fat',
      label: 'Fat',
      current: Math.round(currentCals * 0.033),
      target: Math.round(childNutritionTargets.fat),
      unit: '',
    },
    {
      key: 'iron',
      label: 'Iron',
      current: Math.round(currentCals * 0.01),
      target: Math.round(childNutritionTargets.iron),
      unit: '',
    },
    {
      key: 'calcium',
      label: 'Calcium',
      current: Math.round(currentCals * 0.53),
      target: Math.round(childNutritionTargets.calcium),
      unit: '',
    },
    {
      key: 'zinc',
      label: 'Zinc',
      current: Math.round(currentCals * 0.007),
      target: Math.round(childNutritionTargets.zinc),
      unit: '',
    },
    {
      key: 'vita',
      label: 'Vit A',
      current: Math.round(currentCals * 0.27),
      target: Math.round(childNutritionTargets.vitamina),
      unit: '',
    },
  ];
}

function getMealCaloriesSummary(
  mealIngredients: DetailedMeal['mealIngredients'] | undefined,
  unitLabelsById: Record<string, string>,
  unitRecordsById: Record<string, UnitLookupRecord>
) {
  let totalAmount = 0;
  let baseUnitId: string | null = null;
  let unitLabel = '';

  mealIngredients?.forEach((item) => {
    (item.ingredient?.nutrientAmounts || []).forEach((entry) => {
      const nutrientName = entry.nutrient?.name?.trim().toLowerCase();
      if (nutrientName !== 'calories' && nutrientName !== 'calorie') {
        return;
      }

      const amount = entry.amount || 0;
      const quantity = item.quantity || 0;
      const portionSize = item.ingredient?.portionSize || 1;
      const adjustedAmount = amount * (quantity / portionSize);
      const unitId = getNutrientUnitId(entry.nutrient);
      const resolvedLabel = getNutrientUnitLabel(entry.nutrient, unitLabelsById);

      if (baseUnitId && unitId && baseUnitId !== unitId) {
        totalAmount += convertNutrientAmount(
          adjustedAmount,
          unitId,
          baseUnitId,
          unitRecordsById,
        );
      } else {
        totalAmount += adjustedAmount;
        baseUnitId = baseUnitId || unitId;
      }

      unitLabel = unitLabel || resolvedLabel || '';
    });
  });

  if (!baseUnitId && !unitLabel && totalAmount === 0) {
    return null;
  }

  return {
    amount: totalAmount,
    unitLabel: unitLabel || 'kcal',
  };
}

function getDetailedMealSummary(
  detailedMeal: DetailedMeal | null | undefined,
  multiplier: number,
  unitLabelsById: Record<string, string>,
  unitRecordsById: Record<string, UnitLookupRecord>,
  options?: { preferVolumeLabel?: boolean }
) {
  if (!detailedMeal) {
    return {
      calories: null as { amount: number; unitLabel: string } | null,
      measurement: null as string | null,
    };
  }

  const scaledDetailedMeal: DetailedMeal = {
    ...detailedMeal,
    totalVolume:
      typeof detailedMeal.totalVolume === 'number'
        ? Number((detailedMeal.totalVolume * multiplier).toFixed(2))
        : detailedMeal.totalVolume,
    mealIngredients: detailedMeal.mealIngredients?.map((item) => ({
      ...item,
      quantity:
        typeof item.quantity === 'number'
          ? Number((item.quantity * multiplier).toFixed(2))
          : item.quantity,
    })),
  };

  const measurement = deriveMealMeasurement(scaledDetailedMeal);
  const volumeMeasurementLabel =
    typeof scaledDetailedMeal.totalVolume === 'number' &&
    scaledDetailedMeal.totalVolume > 0
      ? `${formatMeasurementValue(scaledDetailedMeal.totalVolume)} ml`
      : null;
  const computedVolumeMeasurementLabel =
    measurement.kind === 'single' && measurement.displayAsVolume
      ? `${formatMeasurementValue(measurement.kitchenVolumeBase ?? measurement.baseValue)} ml`
      : null;
  const measurementLabel =
    options?.preferVolumeLabel && (volumeMeasurementLabel || computedVolumeMeasurementLabel)
      ? volumeMeasurementLabel || computedVolumeMeasurementLabel
      : measurement.kind === 'single'
      ? `${formatMeasurementValue(
          measurement.displayAsVolume
            ? (measurement.kitchenVolumeBase ?? measurement.baseValue)
            : measurement.baseValue
        )} ${measurement.family === 'volume' || measurement.displayAsVolume ? 'ml' : 'g'}`
      : measurement.kind === 'mixed'
        ? measurement.values
            .map((entry) =>
              `${formatMeasurementValue(entry.baseValue)} ${entry.family === 'volume' ? 'ml' : 'g'}`
            )
            .join(' + ')
        : volumeMeasurementLabel;

  return {
    calories: getMealCaloriesSummary(
      scaledDetailedMeal.mealIngredients,
      unitLabelsById,
      unitRecordsById,
    ),
    measurement: measurementLabel,
  };
}

function getIngredientAgeRangeLabel(
  suitableAgeRange: DetailedIngredient['suitableAgeRange'] | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  const parsedRange = parseSuitableAgeRange(suitableAgeRange);

  if (!parsedRange || parsedRange.minMonths == null) {
    return t('N/A');
  }

  if (!parsedRange.maxMonths) {
    return t('Ingredient age range open ended', {
      minMonths: parsedRange.minMonths,
    });
  }

  return t('Ingredient age range bounded', {
    minMonths: parsedRange.minMonths,
    maxMonths: parsedRange.maxMonths,
  });
}

function parseSuitableAgeRange(
  suitableAgeRange?: DetailedIngredient['suitableAgeRange']
) {
  if (!suitableAgeRange) {
    return null;
  }

  if (typeof suitableAgeRange === 'string') {
    try {
      return JSON.parse(suitableAgeRange);
    } catch {
      return null;
    }
  }

  return suitableAgeRange;
}

function getIngredientDescription(
  ingredient: DetailedIngredient | null | undefined,
  ageRangeLabel: string,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (!ingredient) {
    return '';
  }

  const foodGroup = ingredient.foodGroup?.toLowerCase() || t('Food').toLowerCase();

  if (ageRangeLabel && ageRangeLabel !== t('N/A')) {
    return t('Ingredient description with age', {
      name: ingredient.name,
      foodGroup,
      ageRange: ageRangeLabel,
    });
  }

  return t('Ingredient description', {
    name: ingredient.name,
    foodGroup,
  });
}

function parseMealMinAgeMonths(value?: string | number | null) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const numericValue = Number(trimmed);
  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  const match = trimmed.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function formatMealAgeGroup(value?: string | number | null) {
  const minAgeMonths = parseMealMinAgeMonths(value);

  if (minAgeMonths == null) {
    return typeof value === 'string' && value.trim() ? value : 'N/A';
  }

  return `${minAgeMonths}+ months`;
}

function getAgeFilterLimitInMonths(ageFilter: string) {
  if (ageFilter === 'all') {
    return null;
  }

  const match = ageFilter.match(/\d+/);
  const rawAgeLimit = match ? Number(match[0]) : null;

  if (rawAgeLimit == null) {
    return null;
  }

  return ageFilter.includes('year') ? rawAgeLimit * 12 : rawAgeLimit;
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

const VOLUME_UNITS = [
  { value: 'ml', label: 'ML', factor: 1 },
  { value: 'l', label: 'L', factor: 1000 },
  { value: 'cup', label: 'Cup', factor: 240 },
  { value: 'tbsp', label: 'Tbsp', factor: 15 },
  { value: 'tsp', label: 'Tsp', factor: 5 },
] as const;

const KITCHEN_VOLUME_UNITS = [
  { value: 'cup', label: 'Cup', factor: 240 },
  { value: 'tbsp', label: 'Tbsp', factor: 15 },
  { value: 'tsp', label: 'Tsp', factor: 5 },
] as const;

const MASS_UNITS = [
  { value: 'g', label: 'G', factor: 1 },
  { value: 'kg', label: 'Kg', factor: 1000 },
] as const;

type MeasurementFamily = 'volume' | 'mass';

type MealMeasurement =
  | {
      kind: 'single';
      family: MeasurementFamily;
      baseValue: number;
      kitchenVolumeBase?: number | null;
      displayAsVolume?: boolean;
    }
  | {
      kind: 'mixed';
      values: Array<{ family: MeasurementFamily; baseValue: number }>;
    }
  | {
      kind: 'none';
    };

function deriveMealMeasurement(meal?: DetailedMeal | null): MealMeasurement {
  if (!meal) {
    return { kind: 'none' };
  }

  if (typeof meal.totalVolume === 'number' && meal.totalVolume > 0) {
    return {
      kind: 'single',
      family: 'volume',
      baseValue: meal.totalVolume,
    };
  }

  let volumeBase = 0;
  let massBase = 0;
  let kitchenVolumeBase = 0;
  let canConvertMassToKitchenVolume = true;

  meal.mealIngredients?.forEach((item) => {
    const ingredient = item.ingredient;
    const unitType = ingredient?.portionUnit?.type?.toLowerCase();
    const quantity = item.quantity ?? 0;
    const conversionToBase = ingredient?.portionUnit?.conversionToBase ?? 1;
    const baseAmount = quantity * conversionToBase;

    if (!baseAmount) {
      return;
    }

    if (unitType === 'volume') {
      volumeBase += baseAmount;
      return;
    }

    if (unitType === 'mass') {
      massBase += baseAmount;
      if (ingredient?.density && ingredient.density > 0) {
        kitchenVolumeBase += baseAmount / ingredient.density;
      } else {
        canConvertMassToKitchenVolume = false;
      }
    }
  });

  if (volumeBase > 0 && massBase === 0) {
    return {
      kind: 'single',
      family: 'volume',
      baseValue: volumeBase,
      kitchenVolumeBase: volumeBase,
      displayAsVolume: true,
    };
  }

  if (massBase > 0 && volumeBase === 0) {
    return {
      kind: 'single',
      family: 'mass',
      baseValue: massBase,
      kitchenVolumeBase: canConvertMassToKitchenVolume ? kitchenVolumeBase : null,
      displayAsVolume: canConvertMassToKitchenVolume,
    };
  }

  if (volumeBase > 0 && massBase > 0) {
    return {
      kind: 'mixed',
      values: [
        { family: 'volume', baseValue: volumeBase },
        { family: 'mass', baseValue: massBase },
      ],
    };
  }

  return { kind: 'none' };
}

function formatMeasurementValue(value: number) {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(value >= 10 ? 1 : 2).replace(/\.0+$/, '');
}

function sanitizeMultiplier(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(0.1, Number(value.toFixed(2)));
}

const MealLibraryDetailOverlay = ({
  meal,
  multiplier,
  loading,
  error,
  onClose,
  unitLabelsById,
  unitRecordsById,
}: {
  meal: DetailedMeal | null;
  multiplier: number | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  unitLabelsById: Record<string, string>;
  unitRecordsById: Record<string, UnitLookupRecord>;
}) => {
  const [displayUnit, setDisplayUnit] = useState<
    | (typeof VOLUME_UNITS)[number]['value']
    | (typeof MASS_UNITS)[number]['value']
    | (typeof KITCHEN_VOLUME_UNITS)[number]['value']
  >('ml');
  const [detailTab, setDetailTab] = useState<'ingredients' | 'directions'>('ingredients');
  const [selectedIngredientUnits, setSelectedIngredientUnits] = useState<Record<string, string>>({});
  const mealFactsScrollRef = useRef<HTMLDivElement | null>(null);
  const effectiveMultiplier = multiplier ?? 1;

  const scaledMeal = useMemo(() => {
    if (!meal) {
      return null;
    }

    return {
      ...meal,
      totalVolume:
        typeof meal.totalVolume === 'number'
          ? Number((meal.totalVolume * effectiveMultiplier).toFixed(2))
          : meal.totalVolume,
      mealIngredients: meal.mealIngredients?.map((item) => ({
        ...item,
        quantity:
          typeof item.quantity === 'number'
            ? Number((item.quantity * effectiveMultiplier).toFixed(2))
            : item.quantity,
      })),
    };
  }, [effectiveMultiplier, meal]);

  const measurement = useMemo(
    () => deriveMealMeasurement(scaledMeal),
    [scaledMeal],
  );

  useEffect(() => {
    if (measurement.kind === 'single') {
      setDisplayUnit(
        measurement.family === 'volume' || measurement.displayAsVolume ? 'ml' : 'g'
      );
      return;
    }

    setDisplayUnit('ml');
  }, [measurement, scaledMeal?.id]);

  if (!scaledMeal && !loading && !error) return null;

  const directions = scaledMeal?.direction
    ? scaledMeal.direction
        .split('.')
        .map((step) => step.trim())
        .filter(Boolean)
    : [];
  const mealDetailFacts = [
    { label: 'Age', value: formatMealAgeGroup(scaledMeal?.ageGroup) },
    { label: 'Meal', value: scaledMeal?.mealType || 'N/A' },
    { label: 'Time', value: scaledMeal?.mealTimes?.join(', ') || 'N/A' },
    { label: 'Skill', value: scaledMeal?.skillLevel || 'N/A' },
  ];

  useEffect(() => {
    if (scaledMeal?.mealIngredients?.length) {
      setDetailTab('ingredients');
      return;
    }

    if (directions.length > 0) {
      setDetailTab('directions');
    }
  }, [directions.length, scaledMeal?.id, scaledMeal?.mealIngredients?.length]);

  const nutrients = useMemo(
    () => {
      const nutrientTotals = new Map<string, {
        key: string;
        name: string;
        amount: number;
        unit: string;
        baseUnitId: string | null;
        compatibleUnits: UnitLookupRecord[];
      }>();

      scaledMeal?.mealIngredients?.forEach((item) => {
        (item.ingredient?.nutrientAmounts || []).forEach((entry) => {
          const nutrientName = getDisplayLabel(entry.nutrient?.name, 'Nutrient');
          const baseUnitId = getNutrientUnitId(entry.nutrient);
          const compatibleUnits = getCompatibleUnits(baseUnitId, unitRecordsById);
          const current = nutrientTotals.get(nutrientName);
          const normalizedAmount = entry.amount || 0;
          const quantity = item.quantity || 0;
          const portionSize = item.ingredient?.portionSize || 1;
          const adjustedAmount = normalizedAmount * (quantity / portionSize);
          const mergedAmount =
            current?.baseUnitId && baseUnitId && current.baseUnitId !== baseUnitId
              ? current.amount +
                convertNutrientAmount(
                  adjustedAmount,
                  baseUnitId,
                  current.baseUnitId,
                  unitRecordsById,
                )
              : (current?.amount || 0) + adjustedAmount;

          nutrientTotals.set(nutrientName, {
            key: current?.key || nutrientName.toLowerCase().replace(/\s+/g, '-'),
            name: nutrientName,
            amount: mergedAmount,
            unit: getNutrientUnitLabel(entry.nutrient, unitLabelsById) || current?.unit || '',
            baseUnitId: current?.baseUnitId || baseUnitId,
            compatibleUnits:
              current?.compatibleUnits?.length ? current.compatibleUnits : compatibleUnits,
          });
        });
      });

      return Array.from(nutrientTotals.values());
    },
    [scaledMeal, unitLabelsById, unitRecordsById]
  );

  const calorieSummary = useMemo(
    () => getMealCaloriesSummary(scaledMeal?.mealIngredients, unitLabelsById, unitRecordsById),
    [scaledMeal?.mealIngredients, unitLabelsById, unitRecordsById]
  );

  const ingredientDisplayRows = useMemo(
    () =>
      (scaledMeal?.mealIngredients || []).map((item, index) => {
        const portionUnit = item.ingredient?.portionUnit;
        const baseUnitId =
          portionUnit?.id ||
          getUnitRecordIdByLabel(
            portionUnit?.abbreviation || portionUnit?.name,
            unitRecordsById,
            portionUnit?.type,
          );
        const fixedUnits = getFixedIngredientUnits(
          portionUnit?.type,
          unitRecordsById,
        );
        const compatibleUnits =
          fixedUnits.length > 0
            ? fixedUnits
            : getCompatibleUnits(baseUnitId, unitRecordsById);

        return {
          ...item,
          order: index + 1,
          baseUnitId,
          compatibleUnits,
        };
      }),
    [scaledMeal, unitRecordsById]
  );

  useEffect(() => {
    setSelectedIngredientUnits((current) => {
      const next: Record<string, string> = {};

      ingredientDisplayRows.forEach((item) => {
        if (item.baseUnitId) {
          next[item.id] = current[item.id] || item.baseUnitId;
        }
      });

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      if (
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => current[key] === next[key])
      ) {
        return current;
      }

      return next;
    });
  }, [ingredientDisplayRows]);
  const selectedUnits =
    measurement.kind === 'single'
      ? measurement.family === 'mass' && !measurement.displayAsVolume
        ? MASS_UNITS
        : VOLUME_UNITS
      : VOLUME_UNITS;
  const selectedUnit = selectedUnits.find((unit) => unit.value === displayUnit) || selectedUnits[0];
  const formattedMeasurement =
    measurement.kind === 'single'
      ? formatMeasurementValue(
          measurement.displayAsVolume
            ? (measurement.kitchenVolumeBase ?? 0) / selectedUnit.factor
            : measurement.family === 'mass' &&
              KITCHEN_VOLUME_UNITS.some((unit) => unit.value === selectedUnit.value)
            ? (measurement.kitchenVolumeBase ?? 0) / selectedUnit.factor
            : measurement.baseValue / selectedUnit.factor
        )
      : null;

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
        ) : scaledMeal ? (
          <div className="space-y-8">
            <div className="relative h-64 overflow-hidden rounded-[2.5rem] bg-slate-100 shadow-xl">
              {scaledMeal.imageUrl && (
                <img
                  src={scaledMeal.imageUrl}
                  className="absolute inset-0 h-full w-full object-cover"
                  alt={scaledMeal.name}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>

            <div className="rounded-[2.5rem] border border-slate-50 bg-white p-8 shadow-xl shadow-slate-100">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-slate-800">{scaledMeal.name}</h2>
                {multiplier != null && multiplier !== 1 ? (
                  <span className="rounded-full border border-[#DCE7C8] bg-[#F8FBF1] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#76A13B]">
                    x{formatMeasurementValue(multiplier)}
                  </span>
                ) : null}
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                {calorieSummary ? (
                  <>
                    <span className="font-black text-[#76A13B]">
                      {formatMeasurementValue(calorieSummary.amount)} {calorieSummary.unitLabel}
                    </span>
                    <span className="text-slate-300">•</span>
                  </>
                ) : null}
                {measurement.kind === 'single' ? (
                  <>
                    <span className="font-medium text-slate-400">{formattedMeasurement}</span>
                    <select
                      value={displayUnit}
                      onChange={(event) =>
                        setDisplayUnit(
                          event.target.value as
                            | (typeof VOLUME_UNITS)[number]['value']
                            | (typeof MASS_UNITS)[number]['value']
                        )
                      }
                      className="rounded-full border border-[#DCE7C8] bg-[#F8FBF1] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#76A13B] outline-none"
                    >
                      {selectedUnits.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </>
                ) : measurement.kind === 'mixed' ? (
                  <span className="font-medium text-slate-400">
                    {measurement.values
                      .map((entry) => `${formatMeasurementValue(entry.baseValue)} ${entry.family === 'volume' ? 'ml' : 'g'}`)
                      .join(' + ')}
                  </span>
                ) : (
                  <span className="font-medium text-slate-400">Measurement N/A</span>
                )}
              </div>

              {scaledMeal.description && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Description
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{scaledMeal.description}</p>
                </div>
              )}

              <div className="mb-8">
                <div className="mb-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Meal Facts
                  </label>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white via-white/90 to-transparent" />
                  <button
                    type="button"
                    onClick={() =>
                      mealFactsScrollRef.current?.scrollBy({
                        left: 180,
                        behavior: 'smooth',
                      })
                    }
                    className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 shadow-sm transition-transform active:scale-95"
                    aria-label="Scroll meal facts"
                  >
                    <span aria-hidden="true" className="text-lg leading-none">→</span>
                  </button>
                  <div
                    ref={mealFactsScrollRef}
                    className="hide-scrollbar -mx-2 overflow-x-auto px-2 pr-16"
                  >
                  <div className="flex min-w-max items-stretch gap-3 pr-4">
                    {mealDetailFacts.map((item) => (
                      <div
                        key={item.label}
                        className="min-w-[9rem] max-w-[13rem] rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {item.label}
                        </div>
                        <div className="mt-2 break-words text-sm font-bold leading-5 text-slate-700">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-8">
                <div>
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Choking Hazard
                  </label>
                  <span
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-black ${
                      scaledMeal.choking
                        ? 'border-rose-100 bg-rose-50 text-rose-500'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-500'
                    }`}
                  >
                    {scaledMeal.choking ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Allergen
                  </label>
                  <span
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-black ${
                      scaledMeal.allergen
                        ? 'border-rose-100 bg-rose-50 text-rose-500'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-500'
                    }`}
                  >
                    {scaledMeal.allergen ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {scaledMeal.allergenDescription && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Allergen Detail
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{scaledMeal.allergenDescription}</p>
                </div>
              )}

              {scaledMeal.intoleranceDescription && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Intolerance
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{scaledMeal.intoleranceDescription}</p>
                </div>
              )}

              {scaledMeal.modificationNote && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Modification Note
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{scaledMeal.modificationNote}</p>
                </div>
              )}

              {scaledMeal.drugInteraction && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Drug Interaction
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{scaledMeal.drugInteraction}</p>
                </div>
              )}

              {(scaledMeal.mealIngredients?.length || directions.length > 0) && (
                <div className="mb-8">
                  <div className="mb-5 rounded-[1.75rem] bg-slate-100 p-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailTab('ingredients')}
                        className={`rounded-[1.2rem] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                          detailTab === 'ingredients'
                            ? 'bg-white text-[#76A13B] shadow-sm'
                            : 'text-slate-400'
                        }`}
                      >
                        Ingredients
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailTab('directions')}
                        className={`rounded-[1.2rem] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                          detailTab === 'directions'
                            ? 'bg-white text-[#76A13B] shadow-sm'
                            : 'text-slate-400'
                        }`}
                      >
                        Directions
                      </button>
                    </div>
                  </div>

                  {detailTab === 'ingredients' ? (
                    ingredientDisplayRows.length > 0 ? (
                      <div className="space-y-3">
                        {ingredientDisplayRows.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-[1.75rem] border border-slate-100 bg-slate-50 px-5 py-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span className="min-w-0 text-base font-black text-slate-700">
                                {item.ingredient?.name || 'Ingredient'}
                              </span>
                              <div className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500">
                              <span className="font-semibold text-slate-600">
                                {(() => {
                                  const quantity = item.quantity ?? 0;
                                  const selectedUnitId =
                                    selectedIngredientUnits[item.id] || item.baseUnitId || '';
                                  const convertedQuantity =
                                    item.baseUnitId && selectedUnitId
                                      ? convertNutrientAmount(
                                          quantity,
                                          item.baseUnitId,
                                          selectedUnitId,
                                          unitRecordsById,
                                        )
                                      : quantity;

                                  return formatMeasurementValue(convertedQuantity);
                                })()}
                              </span>
                              {item.compatibleUnits.length > 1 ? (
                                <select
                                  value={selectedIngredientUnits[item.id] || item.baseUnitId || ''}
                                  onChange={(event) =>
                                    setSelectedIngredientUnits((current) => ({
                                      ...current,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                  className="min-w-[4.5rem] border-0 bg-transparent px-0 py-0 text-sm font-semibold text-slate-500 outline-none"
                                >
                                  {item.compatibleUnits.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                      {getUnitDisplayLabel(unit)}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-semibold text-slate-500">
                                  {item.baseUnitId
                                    ? getUnitDisplayLabel(unitRecordsById[item.baseUnitId])
                                    : item.ingredient?.portionUnit?.abbreviation ||
                                      item.ingredient?.portionUnit?.name ||
                                      ''}
                                </span>
                              )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm font-medium text-slate-400">
                        No ingredients available.
                      </div>
                    )
                  ) : directions.length > 0 ? (
                    <div className="space-y-4">
                      {directions.map((step, index) => (
                        <div
                          key={`${index}-${step}`}
                          className="rounded-[1.75rem] border border-slate-100 bg-slate-50 px-5 py-4"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-base font-black text-slate-700">
                              Step {index + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-400">
                              {index + 1}/{directions.length}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-600">{step}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm font-medium text-slate-400">
                      No directions available.
                    </div>
                  )}
                </div>
              )}

              {scaledMeal.howToStore && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    How to Store
                  </label>
                  <p className="text-sm leading-relaxed text-slate-600">{scaledMeal.howToStore}</p>
                </div>
              )}

              {getEmbeddableVideoUrl(scaledMeal.videoUrl) && (
                <div className="mb-8">
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cooking Video
                  </label>
                  <div className="aspect-video overflow-hidden rounded-2xl border border-slate-100">
                    <iframe
                      width="100%"
                      height="100%"
                      src={getEmbeddableVideoUrl(scaledMeal.videoUrl)}
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
                              {nutrient.amount == null
                                ? 'N/A'
                                : `${formatMeasurementValue(nutrient.amount)} ${nutrient.unit || ''}`.trim()}
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
  unitLabelsById,
  unitRecordsById,
}: {
  ingredient: DetailedIngredient | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  unitLabelsById: Record<string, string>;
  unitRecordsById: Record<string, UnitLookupRecord>;
}) => {
  const { t } = useTranslation();
  const nutrients = useMemo(() => {
    const nutrientTotals = new Map<string, {
      key: string;
      amount: number;
      unit: string;
      baseUnitId: string | null;
      compatibleUnits: UnitLookupRecord[];
    }>();

    (ingredient?.nutrientAmounts || []).forEach((entry) => {
      const nutrientName = getDisplayLabel(entry.nutrient?.name, 'Nutrient');
      const baseUnitId = getNutrientUnitId(entry.nutrient);
      const compatibleUnits = getCompatibleUnits(baseUnitId, unitRecordsById);
      const current = nutrientTotals.get(nutrientName);
      const normalizedAmount = entry.amount || 0;
      const mergedAmount =
        current?.baseUnitId && baseUnitId && current.baseUnitId !== baseUnitId
          ? current.amount + convertNutrientAmount(normalizedAmount, baseUnitId, current.baseUnitId, unitRecordsById)
          : (current?.amount || 0) + normalizedAmount;

      nutrientTotals.set(nutrientName, {
        key: current?.key || `${nutrientName}-${baseUnitId || 'unitless'}`,
        amount: mergedAmount,
        unit: getNutrientUnitLabel(entry.nutrient, unitLabelsById) || current?.unit || '',
        baseUnitId: current?.baseUnitId || baseUnitId,
        compatibleUnits: current?.compatibleUnits?.length ? current.compatibleUnits : compatibleUnits,
      });
    });

    return Array.from(nutrientTotals.entries()).map(([name, value]) => ({
      name,
      key: value.key,
      amount: value.amount,
      unit: value.unit,
      baseUnitId: value.baseUnitId,
      compatibleUnits: value.compatibleUnits,
    }));
  }, [ingredient, unitLabelsById, unitRecordsById]);

  if (!ingredient && !loading && !error) return null;

  const portionUnit = ingredient?.portionUnit?.abbreviation || ingredient?.portionUnit?.name || '';
  const portionLabel =
    ingredient?.portionSize != null
      ? `${ingredient.portionSize}${portionUnit ? ` ${portionUnit}` : ''}`
      : t('N/A');
  const ageRangeLabel = getIngredientAgeRangeLabel(ingredient?.suitableAgeRange, t);
  const description = getIngredientDescription(ingredient, ageRangeLabel, t);
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
        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">{t('Ingredient Details')}</h3>
        <div className="w-10" />
      </div>

      <div className="p-6">
        {loading ? (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-400">{t('Loading ingredient details...')}</p>
          </div>
        ) : error ? (
          <div className="rounded-[2.5rem] border border-rose-100 bg-rose-50 p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-rose-500">{error}</p>
          </div>
        ) : ingredient ? (
          <div className="rounded-[2.5rem] border border-slate-50 bg-white p-8 shadow-xl shadow-slate-100">
              <div className="relative mb-8 h-56 overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-100">
                {ingredient.imageUrl && (
                  <img
                    src={ingredient.imageUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    alt={ingredient.name}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
              <h2 className="mb-4 text-2xl font-black text-slate-800">{ingredient.name}</h2>
              <div className="mb-10 text-xl font-black uppercase tracking-[0.22em] text-[#76A13B]">
                {getDisplayLabel(ingredient.foodGroup, 'Food')}
              </div>

              <div className="mb-10">
                <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  {t('Description')}
                </label>
                <p className="max-w-[24rem] text-sm leading-9 text-slate-500">
                  {description}
                </p>
              </div>

              <div className="mb-10 grid grid-cols-2 gap-8">
                <div>
                  <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    {t('Choking Hazard')}
                  </label>
                  <span
                    className={`inline-flex rounded-2xl border px-5 py-2 text-sm font-black ${badgeClassName(ingredient.choking)}`}
                  >
                    {ingredient.choking ? t('Yes') : t('No')}
                  </span>
                </div>
                <div>
                  <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    {t('Allergen')}
                  </label>
                  <span
                    className={`inline-flex rounded-2xl border px-5 py-2 text-sm font-black ${badgeClassName(ingredient.allergen)}`}
                  >
                    {ingredient.allergen ? t('Yes') : t('No')}
                  </span>
                </div>
              </div>

              <div className="mb-10 border-t border-slate-100 pt-10">
                <label className="mb-6 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  {t('Ingredient Facts')}
                </label>
                <div className="grid grid-cols-2 gap-y-5 text-sm text-slate-500">
                  <div className="font-black uppercase tracking-[0.18em] text-slate-400">{t('Age Range')}</div>
                  <div className="text-right font-medium">{ageRangeLabel}</div>
                  <div className="font-black uppercase tracking-[0.18em] text-slate-400">{t('Portion')}</div>
                  <div className="text-right font-medium">{portionLabel}</div>
                  <div className="font-black uppercase tracking-[0.18em] text-slate-400">{t('Density')}</div>
                  <div className="text-right font-medium">{ingredient.density ?? t('N/A')}</div>
                  {!!ingredient.intoleranceDescription && (
                    <>
                      <div className="font-black uppercase tracking-[0.18em] text-slate-400">{t('Intolerance')}</div>
                      <div className="text-right font-medium">{ingredient.intoleranceDescription}</div>
                    </>
                  )}
                  {!!ingredient.allergenDescription && (
                    <>
                      <div className="font-black uppercase tracking-[0.18em] text-slate-400">{t('Allergen Detail')}</div>
                      <div className="text-right font-medium">{ingredient.allergenDescription}</div>
                    </>
                  )}
                  {!!ingredient.drugInteraction && (
                    <>
                      <div className="font-black uppercase tracking-[0.18em] text-slate-400">{t('Drug Interaction')}</div>
                      <div className="text-right font-medium">{ingredient.drugInteraction}</div>
                    </>
                  )}
                </div>
              </div>

              {nutrients.length > 0 && (
                <div className="border-t border-slate-100 pt-10">
                  <label className="mb-6 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    {t('Nutrient Profile')}
                  </label>
                  <div className="overflow-hidden rounded-[2rem] border border-slate-100">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{t('Nutrient')}</th>
                          <th className="px-6 py-5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{t('Amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {nutrients.map((nutrient) => (
                          <tr key={nutrient.key}>
                            <td className="px-6 py-5 text-base font-bold text-slate-700">{nutrient.name}</td>
                            <td className="px-6 py-5 text-base font-medium text-slate-400">
                              <div className="inline-flex max-w-full items-center gap-2 whitespace-nowrap">
                                <span>{formatMeasurementValue(nutrient.amount)}</span>
                                <span>{nutrient.unit}</span>
                              </div>
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
  const { i18n, t } = useTranslation();
  const {
    meals: backendMeals,
    ingredients: backendIngredients,
    mealsPagination,
    mealsLoading,
    ingredientsPagination,
    ingredientsLoading,
  } = useSelector((state: RootState) => state.meals);
  const { data: children = [], loading: childrenLoading } = useSelector((state: RootState) => state.children);

  const [subTab, setSubTab] = useState<'mealLib' | 'foodLib' | 'planning'>('planning');
  const [planSourceTab, setPlanSourceTab] = useState<'parent' | 'nutritionist'>('parent');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [planName, setPlanName] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayKey>('Mon');
  const [activeSlot, setActiveSlot] = useState<MealSlot>('Breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedMealSearch, setDebouncedMealSearch] = useState('');
  const [debouncedIngredientSearch, setDebouncedIngredientSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [ageFilter, setAgeFilter] = useState('all');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [ingredientTypeFilter, setIngredientTypeFilter] = useState('all');
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [dietTypeFilter, setDietTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMealsByDay, setSelectedMealsByDay] = useState<MealsByDay>({});
  const [multiplierDrafts, setMultiplierDrafts] = useState<Record<string, string>>({});
  const [selectedLibraryMeal, setSelectedLibraryMeal] = useState<DetailedMeal | null>(null);
  const [selectedLibraryMealMultiplier, setSelectedLibraryMealMultiplier] = useState<number | null>(null);
  const [mealDetailLoading, setMealDetailLoading] = useState(false);
  const [mealDetailError, setMealDetailError] = useState<string | null>(null);
  const [selectedLibraryIngredient, setSelectedLibraryIngredient] = useState<DetailedIngredient | null>(null);
  const [ingredientDetailLoading, setIngredientDetailLoading] = useState(false);
  const [ingredientDetailError, setIngredientDetailError] = useState<string | null>(null);
  const [unitRecordsById, setUnitRecordsById] = useState<Record<string, UnitLookupRecord>>({});
  const [mealPlans, setMealPlans] = useState<BackendMealPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [plansSuccess, setPlansSuccess] = useState<string | null>(null);
  const [focusedChildId, setFocusedChildId] = useState<string | null>(null);
  const mealCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const ingredientCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const plannerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const librarySearchInputRef = useRef<HTMLInputElement | null>(null);
  const previousVisibleMealIdsRef = useRef<string[]>([]);
  const previousVisibleIngredientIdsRef = useRef<string[]>([]);
  const shouldScrollToLoadedMealsRef = useRef(false);
  const shouldScrollToLoadedIngredientsRef = useRef(false);
  const restoredViewPlanIdRef = useRef<string | null>(null);
  const hasRestoredPersistedStateRef = useRef(false);
  const previousBackLayerRef = useRef(0);
  const browserBackInFlightRef = useRef(false);
  const [activeViewPlan, setActiveViewPlan] = useState<BackendMealPlan | null>(null);
  const [activeViewDay, setActiveViewDay] = useState<string | null>(null);
  const [activeViewReadOnly, setActiveViewReadOnly] = useState(false);
  const [viewPlanMealDetails, setViewPlanMealDetails] = useState<Record<string, DetailedMeal>>({});
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanGroupKey, setEditingPlanGroupKey] = useState<string | null>(null);
  const [deletingPlanGroupKey, setDeletingPlanGroupKey] = useState<string | null>(null);
  const [pendingDeletePlan, setPendingDeletePlan] = useState<BackendMealPlan | null>(null);
  const filterOverlayTab: LibrarySubTab = subTab === 'planning' ? 'mealLib' : subTab;
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

  const unitLabelsById = useMemo(
    () =>
      Object.values(unitRecordsById).reduce<Record<string, string>>((acc, unit) => {
        const label = getUnitDisplayLabel(unit);
        if (unit.id && label) {
          acc[unit.id] = label;
        }
        return acc;
      }, {}),
    [unitRecordsById]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchQuery.trim();
      setDebouncedMealSearch(nextSearch);
      setDebouncedIngredientSearch(nextSearch);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    dispatch(fetchMeals({ page: 1, limit: 10, search: debouncedMealSearch }));
  }, [debouncedMealSearch, dispatch, i18n.language]);

  useEffect(() => {
    dispatch(fetchIngredients({ page: 1, limit: 10, search: debouncedIngredientSearch }));
  }, [debouncedIngredientSearch, dispatch, i18n.language]);

  const insertSearchText = (text: string, input: HTMLInputElement | null) => {
    if (!text) {
      return;
    }

    const selectionStart = input?.selectionStart;
    const selectionEnd = input?.selectionEnd;

    setSearchQuery((currentValue) => {
      const nextSelectionStart = selectionStart ?? currentValue.length;
      const nextSelectionEnd = selectionEnd ?? currentValue.length;
      return `${currentValue.slice(0, nextSelectionStart)}${text}${currentValue.slice(nextSelectionEnd)}`;
    });

    requestAnimationFrame(() => {
      if (!input) {
        return;
      }

      const cursorPosition = (selectionStart ?? input.value.length) + text.length;
      input.focus();
      input.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleSearchPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData?.getData('text');

    if (!pastedText) {
      return;
    }

    event.preventDefault();
    insertSearchText(pastedText, event.currentTarget);
  };

  useEffect(() => {
    let active = true;

    const loadUnits = async () => {
      try {
        const response = await api.get<UnitLookupResponse>('/unit/find-all', {
          params: {
            page: 1,
            limit: 200,
          },
        });

        if (!active) {
          return;
        }

        const nextUnitRecords = [...(response.data?.data || []), ...SYNTHETIC_UNIT_RECORDS].reduce<
          Record<string, UnitLookupRecord>
        >((acc, unit) => {
          if (unit.id) {
            acc[unit.id] = unit;
          }

          return acc;
        }, {});

        setUnitRecordsById(nextUnitRecords);
      } catch (error) {
        console.error('Failed to load unit labels', error);
      }
    };

    void loadUnits();

    return () => {
      active = false;
    };
  }, []);

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
  }, [children.length, focusedChildId, i18n.language]);

  useEffect(() => {
    const state = location.state as
      | {
          openPlanning?: boolean;
          planSourceTab?: 'parent' | 'nutritionist';
          successMessage?: string;
          selectedChildId?: string;
        }
      | null;

    if (!state) return;

    if (state.openPlanning) {
      setSubTab('planning');
    }

    if (state.planSourceTab) {
      setPlanSourceTab(state.planSourceTab);
    }

    if (state.selectedChildId) {
      setFocusedChildId(state.selectedChildId);
    }

    if (state.successMessage) {
      setPlansSuccess(state.successMessage);
    }

    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (hasRestoredPersistedStateRef.current) {
      return;
    }

    hasRestoredPersistedStateRef.current = true;

    try {
      const rawState = window.sessionStorage.getItem(MEALS_VIEW_STATE_KEY);
      if (!rawState) {
        return;
      }

      const persistedState = JSON.parse(rawState) as Partial<PersistedMealsViewState>;

      if (persistedState.subTab === 'planning' || persistedState.subTab === 'mealLib' || persistedState.subTab === 'foodLib') {
        setSubTab(persistedState.subTab);
      }

      if (persistedState.planSourceTab === 'parent' || persistedState.planSourceTab === 'nutritionist') {
        setPlanSourceTab(persistedState.planSourceTab);
      }

      if (typeof persistedState.isCreatingPlan === 'boolean') {
        setIsCreatingPlan(persistedState.isCreatingPlan);
      }

      if (persistedState.creationStep === 1 || persistedState.creationStep === 2) {
        setCreationStep(persistedState.creationStep);
      }

      if (typeof persistedState.planName === 'string') {
        setPlanName(persistedState.planName);
      }

      if (persistedState.selectedDay && WEEK_DAYS.includes(persistedState.selectedDay)) {
        setSelectedDay(persistedState.selectedDay);
      }

      if (persistedState.activeSlot && MEAL_SLOTS.includes(persistedState.activeSlot)) {
        setActiveSlot(persistedState.activeSlot);
      }

      if (persistedState.selectedMealsByDay && typeof persistedState.selectedMealsByDay === 'object') {
        setSelectedMealsByDay(persistedState.selectedMealsByDay);
      }

      if (typeof persistedState.focusedChildId === 'string' || persistedState.focusedChildId === null) {
        setFocusedChildId(persistedState.focusedChildId ?? null);
      }

      if (typeof persistedState.activeViewDay === 'string' || persistedState.activeViewDay === null) {
        setActiveViewDay(persistedState.activeViewDay ?? null);
      }

      if (typeof persistedState.activeViewReadOnly === 'boolean') {
        setActiveViewReadOnly(persistedState.activeViewReadOnly);
      }

      if (typeof persistedState.activeViewPlanId === 'string' && persistedState.activeViewPlanId) {
        restoredViewPlanIdRef.current = persistedState.activeViewPlanId;
      }
    } catch {
      window.sessionStorage.removeItem(MEALS_VIEW_STATE_KEY);
    }
  }, []);

  // Helper to map meal time to valid type
  const getMealType = (mealTime: string | undefined): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' =>
    normalizeMealSlot(mealTime) || 'Snack';

  // Transform backend meals to match UI format
  const transformedMeals = backendMeals.map(m => ({
    raw: m,
    minAgeMonths: parseMealMinAgeMonths(m.ageGroup),
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
    image: m.imageUrl || '',
    description: m.description || '',
    prepTime: m.prepTime || 'N/A',
    ageGroup: formatMealAgeGroup(m.ageGroup),
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
    image: i.imageUrl || '',
  }));

  // Use transformed data or fallback to empty arrays
  const MEALS = transformedMeals.length > 0 ? transformedMeals.map(({ raw: _raw, derivedDietType: _derivedDietType, derivedCategory: _derivedCategory, derivedAllergens: _derivedAllergens, ...meal }) => meal) : [];
  const transformedMealsById = useMemo(
    () =>
      new Map(
        transformedMeals.map((meal) => [meal.id, meal] as const)
      ),
    [transformedMeals]
  );
  const selectedMealsForSlot = useMemo(
    () => selectedMealsByDay[selectedDay]?.[activeSlot] ?? [],
    [activeSlot, selectedDay, selectedMealsByDay]
  );
  const selectedMealsForDay = useMemo(
    () => Object.values(selectedMealsByDay[selectedDay] ?? {}).flat(),
    [selectedDay, selectedMealsByDay]
  );
  const selectedMealsForSlotMap = useMemo(
    () =>
      new Map(
        selectedMealsForSlot.map((selection) => [selection.meal.id, selection])
      ),
    [selectedMealsForSlot]
  );

  useEffect(() => {
    setMultiplierDrafts((current) => {
      const next: Record<string, string> = {};

      selectedMealsForSlot.forEach((selection) => {
        const key = selection.meal.id;
        next[key] = current[key] ?? String(selection.multiplier ?? 1);
      });

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      if (
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => current[key] === next[key])
      ) {
        return current;
      }

      return next;
    });
  }, [selectedMealsForSlot]);
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

    if (ageFilter !== 'all') {
      const maxMonths = getAgeFilterLimitInMonths(ageFilter);
      if (maxMonths != null) {
        result = result.filter((meal) => meal.minAgeMonths != null && meal.minAgeMonths < maxMonths);
      }
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
    }

    return result.map(({ raw: _raw, minAgeMonths: _minAgeMonths, derivedDietType: _derivedDietType, derivedCategory: _derivedCategory, derivedAllergens: _derivedAllergens, ...meal }) => meal);
  }, [
    transformedMeals,
    ageFilter,
    mealTypeFilter,
    excludedAllergens,
    excludedAllergenKeywords,
    dietTypeFilter,
    categoryFilter,
    sortBy,
  ]);
  const canLoadMoreMeals = Boolean(mealsPagination?.next);

  const canLoadMoreIngredients = Boolean(ingredientsPagination?.next);

  const plannerMealsForActiveSlot = useMemo(() => {
    const slotFilteredMeals = filteredMeals.filter((meal) => meal.type === activeSlot);
    const selectedById = new Map<string, Meal>(
      selectedMealsForSlot.map((selection) => [
        selection.meal.id,
        {
          ...selection.meal,
          type: activeSlot,
        },
      ])
    );

    slotFilteredMeals.forEach((meal) => {
      if (!selectedById.has(meal.id)) {
        selectedById.set(meal.id, meal);
      }
    });

    return Array.from(selectedById.values());
  }, [activeSlot, filteredMeals, selectedMealsForSlot]);

  const visibleMealIds = useMemo(
    () =>
      subTab === 'planning'
        ? plannerMealsForActiveSlot.map((meal) => meal.id)
        : subTab === 'mealLib'
          ? filteredMeals.map((meal) => meal.id)
          : [],
    [filteredMeals, plannerMealsForActiveSlot, subTab]
  );

  useEffect(() => {
    if (!shouldScrollToLoadedMealsRef.current || mealsLoading) {
      previousVisibleMealIdsRef.current = visibleMealIds;
      return;
    }

    const previousVisibleMealIds = new Set(previousVisibleMealIdsRef.current);
    const firstNewVisibleMealId = visibleMealIds.find(
      (mealId) => !previousVisibleMealIds.has(mealId)
    );

    previousVisibleMealIdsRef.current = visibleMealIds;
    shouldScrollToLoadedMealsRef.current = false;

    if (!firstNewVisibleMealId) {
      return;
    }

    window.requestAnimationFrame(() => {
      mealCardRefs.current[firstNewVisibleMealId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [mealsLoading, visibleMealIds]);

  const handleLoadMoreMeals = () => {
    if (!mealsPagination?.next || mealsLoading) {
      return;
    }

    shouldScrollToLoadedMealsRef.current = true;
    dispatch(
      fetchMeals({
        page: mealsPagination.next,
        limit: mealsPagination.perPage,
        search: debouncedMealSearch,
        append: true,
      })
    );
  };

  const filteredIngredients = useMemo(() => {
    let result = [...transformedIngredients];

    if (ageFilter !== 'all') {
      const match = ageFilter.match(/\d+/);
      const rawAgeLimit = match ? Number(match[0]) : null;
      const maxMonths =
        rawAgeLimit == null
          ? null
          : ageFilter.includes('year')
            ? rawAgeLimit * 12
            : rawAgeLimit;

      if (maxMonths != null) {
        result = result.filter((ingredient) => {
          const ageRange = parseSuitableAgeRange(ingredient.raw.suitableAgeRange);

          if (!ageRange || ageRange.minMonths == null) {
            return false;
          }

          // "<12mo" means suitable for some age strictly below 12 months.
          // Ex: "12+ months" should not match, but "6-18 months" should.
          return ageRange.minMonths < maxMonths;
        });
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
    }

    return result.map(({ raw: _raw, derivedType: _derivedType, derivedDietType: _derivedDietType, ...ingredient }) => ingredient);
  }, [
    transformedIngredients,
    ageFilter,
    ingredientTypeFilter,
    ingredientTypeKeywords,
    excludedAllergens,
    excludedAllergenKeywords,
    dietTypeFilter,
    sortBy,
  ]);

  const visibleIngredientIds = useMemo(
    () => (subTab === 'foodLib' ? filteredIngredients.map((ingredient) => ingredient.id) : []),
    [filteredIngredients, subTab]
  );

  useEffect(() => {
    if (!shouldScrollToLoadedIngredientsRef.current || ingredientsLoading) {
      previousVisibleIngredientIdsRef.current = visibleIngredientIds;
      return;
    }

    const previousVisibleIngredientIds = new Set(previousVisibleIngredientIdsRef.current);
    const firstNewVisibleIngredientId = visibleIngredientIds.find(
      (ingredientId) => !previousVisibleIngredientIds.has(ingredientId)
    );

    previousVisibleIngredientIdsRef.current = visibleIngredientIds;
    shouldScrollToLoadedIngredientsRef.current = false;

    if (!firstNewVisibleIngredientId) {
      return;
    }

    window.requestAnimationFrame(() => {
      ingredientCardRefs.current[firstNewVisibleIngredientId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [ingredientsLoading, visibleIngredientIds]);

  const handleLoadMoreIngredients = () => {
    if (!ingredientsPagination?.next || ingredientsLoading) {
      return;
    }

    shouldScrollToLoadedIngredientsRef.current = true;
    dispatch(
      fetchIngredients({
        page: ingredientsPagination.next,
        limit: ingredientsPagination.perPage,
        search: debouncedIngredientSearch,
        append: true,
      })
    );
  };
  const getRealMealSummary = (mealId: string, multiplier: number) => {
    const sanitizedMultiplier = sanitizeMultiplier(multiplier);
    const detailedMeal = viewPlanMealDetails[mealId];

    if (detailedMeal) {
      return getDetailedMealSummary(
        detailedMeal,
        sanitizedMultiplier,
        unitLabelsById,
        unitRecordsById,
        { preferVolumeLabel: true },
      );
    }

    const fallbackMeal = transformedMealsById.get(mealId);
    const totalVolume = fallbackMeal?.raw.totalVolume;
    const estimatedCalories = fallbackMeal?.calories
      ? Number((fallbackMeal.calories * sanitizedMultiplier).toFixed(0))
      : null;

    return {
      calories:
        estimatedCalories != null
          ? { amount: estimatedCalories, unitLabel: 'kcal' }
          : null,
      measurement:
        typeof totalVolume === 'number' && totalVolume > 0
          ? `${formatMeasurementValue(totalVolume * sanitizedMultiplier)} ml`
          : null,
    };
  };

  const currentCals = useMemo(
    () =>
      selectedMealsForDay.reduce(
        (sum, selection) => {
          const summary = getRealMealSummary(selection.meal.id, selection.multiplier);
          return sum + (summary.calories?.amount || 0);
        },
        0
      ),
    [getRealMealSummary, selectedMealsForDay]
  );
  const favoriteChildId = localStorage.getItem('favorite_child_id');
  const effectiveChildId = focusedChildId ?? favoriteChildId;
  const selectedChild = useMemo(
    () =>
      children.find((child) => child.id === effectiveChildId) ??
      children[0] ??
      null,
    [children, effectiveChildId]
  );
  const selectedChildId = selectedChild?.id ?? null;
  const childNutritionTargets = useMemo(() => {
    if (!selectedChild?.gender || !selectedChild?.date_of_birth) {
      return null;
    }

    return calculateNutrients(
      selectedChild.weight,
      selectedChild.height,
      selectedChild.gender,
      selectedChild.date_of_birth,
      selectedChild.activity_level ?? 'Moderate',
    );
  }, [
    selectedChild?.weight,
    selectedChild?.height,
    selectedChild?.gender,
    selectedChild?.date_of_birth,
    selectedChild?.activity_level,
  ]);
  const nutrientProgressItems = useMemo(
    () =>
      buildNutrientProgressItems(currentCals, childNutritionTargets),
    [childNutritionTargets, currentCals]
  );

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
  const weekDays = WEEK_DAYS;
  const mealSlots = MEAL_SLOTS;
  const mealsBackLayer = useMemo(() => {
    if (showFilters) return 6;
    if (pendingDeletePlan) return 5;
    if (selectedLibraryMeal || mealDetailLoading || mealDetailError) return 4;
    if (selectedLibraryIngredient || ingredientDetailLoading || ingredientDetailError) return 4;
    if (activeViewPlan) return 3;
    if (isCreatingPlan && creationStep === 2) return 2;
    if (isCreatingPlan || subTab !== 'planning') return 1;
    return 0;
  }, [
    activeViewPlan,
    creationStep,
    ingredientDetailError,
    ingredientDetailLoading,
    isCreatingPlan,
    mealDetailError,
    mealDetailLoading,
    pendingDeletePlan,
    selectedLibraryIngredient,
    selectedLibraryMeal,
    showFilters,
    subTab,
  ]);

  useEffect(() => {
    const persistedState: PersistedMealsViewState = {
      subTab,
      planSourceTab,
      isCreatingPlan,
      creationStep,
      planName,
      selectedDay,
      activeSlot,
      selectedMealsByDay,
      focusedChildId,
      activeViewPlanId: activeViewPlan?.id ?? restoredViewPlanIdRef.current,
      activeViewDay,
      activeViewReadOnly,
    };

    window.sessionStorage.setItem(MEALS_VIEW_STATE_KEY, JSON.stringify(persistedState));
  }, [
    activeSlot,
    activeViewDay,
    activeViewPlan,
    activeViewReadOnly,
    creationStep,
    focusedChildId,
    isCreatingPlan,
    planName,
    planSourceTab,
    selectedDay,
    selectedMealsByDay,
    subTab,
  ]);

  useEffect(() => {
    if (!restoredViewPlanIdRef.current || mealPlans.length === 0 || activeViewPlan) {
      return;
    }

    const matchedPlan = mealPlans.find((plan) => plan.id === restoredViewPlanIdRef.current);
    if (!matchedPlan) {
      restoredViewPlanIdRef.current = null;
      return;
    }

    setActiveViewPlan(matchedPlan);
    restoredViewPlanIdRef.current = null;
  }, [activeViewPlan, mealPlans]);

  useEffect(() => {
    if (browserBackInFlightRef.current) {
      browserBackInFlightRef.current = false;
      previousBackLayerRef.current = mealsBackLayer;
      return;
    }

    if (mealsBackLayer > previousBackLayerRef.current) {
      window.history.pushState(
        {
          ...(window.history.state ?? {}),
          __lijeMealsBackLayer: mealsBackLayer,
        },
        '',
        window.location.href,
      );
    }

    previousBackLayerRef.current = mealsBackLayer;
  }, [mealsBackLayer]);

  const resetPlanBuilder = () => {
    setSavingPlan(false);
    setIsCreatingPlan(false);
    setCreationStep(1);
    setEditingPlanId(null);
    setEditingPlanGroupKey(null);
    setPlanName('');
    setSelectedDay('Mon');
    setActiveSlot('Breakfast');
    setSelectedMealsByDay({});
  };

  const openNewPlanBuilder = () => {
    setSavingPlan(false);
    setPlansError(null);
    setPlansSuccess(null);
    setCreationStep(1);
    setEditingPlanId(null);
    setEditingPlanGroupKey(null);
    setPlanName('');
    setSelectedDay('Mon');
    setActiveSlot('Breakfast');
    setSelectedMealsByDay({});
    setIsCreatingPlan(true);
  };

  const openMealDetail = async (mealId: string, multiplier?: number) => {
    setMealDetailLoading(true);
    setMealDetailError(null);
    setSelectedLibraryMeal(null);
    setSelectedLibraryMealMultiplier(
      typeof multiplier === 'number' ? sanitizeMultiplier(multiplier) : null
    );

    try {
      const response = await api.get(
        `/meal/find-one/${mealId}?lang=${i18n.language || getPreferredLanguage()}`
      );
      setSelectedLibraryMeal(response.data);
      setViewPlanMealDetails((current) => ({
        ...current,
        [mealId]: response.data,
      }));
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
    setSelectedLibraryMealMultiplier(1);
    setMealDetailError(null);
    setMealDetailLoading(false);
  };

  const openIngredientDetail = async (ingredientId: string) => {
    setIngredientDetailLoading(true);
    setIngredientDetailError(null);
    setSelectedLibraryIngredient(null);

    try {
      const response = await api.get(
        `/ingredient/find-one/${ingredientId}?lang=${i18n.language || getPreferredLanguage()}`
      );
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
    meal?.imageUrl || '';

  const mapBackendMealToSelection = (
    meal: BackendPlanMeal,
    selectedSlot: MealSlot
  ): PlannedMealSelection => {
    const matchingMeal = MEALS.find((candidate) => candidate.id === meal.id);

    if (matchingMeal) {
      return {
        meal: {
          ...matchingMeal,
          type: selectedSlot,
          image: meal.imageUrl || matchingMeal.image,
          volume:
            meal.totalVolume != null ? `${meal.totalVolume}ml` : matchingMeal.volume,
        },
        multiplier: sanitizeMultiplier(meal.multiplier),
      };
    }

    return {
      meal: {
        id: meal.id,
        name: meal.name || 'Meal',
        type: selectedSlot,
        nutrients: [],
        image: getMealImage(meal),
        description: '',
        prepTime: 'N/A',
        ageGroup: '',
        ingredients: [],
        method: [],
        calories: Math.round((meal.totalVolume ?? 0) * 1.3) || 200,
        volume: `${meal.totalVolume ?? 0}ml`,
      },
      multiplier: sanitizeMultiplier(meal.multiplier),
    };
  };

  const buildMealSelectionsForPlan = (plan: BackendMealPlan) =>
    (plan.meals || []).reduce<Partial<Record<MealSlot, PlannedMealSelection[]>>>((acc, meal) => {
      const slots = (plan.mealTimes?.[meal.id] || [])
        .map((slot) => normalizeMealSlot(slot))
        .filter((slot): slot is MealSlot => slot !== null);

      slots.forEach((slot) => {
        acc[slot] = [...(acc[slot] ?? []), mapBackendMealToSelection(meal, slot)];
      });

      return acc;
    }, {});

  const openEditPlan = (plan: BackendMealPlan) => {
    const relatedPlans = getRelatedPlans(plan);
    const selectionsByDay = relatedPlans.reduce<MealsByDay>((acc, relatedPlan) => {
      const dayKey = getDayKeyFromIsoDate(relatedPlan.meal_date) as DayKey;
      acc[dayKey] = buildMealSelectionsForPlan(relatedPlan);
      return acc;
    }, {});
    const dayKey = getDayKeyFromIsoDate(plan.meal_date) as DayKey;
    const selectionsForDay = selectionsByDay[dayKey] ?? {};
    const selectedSlot =
      mealSlots.find((slot) => (selectionsForDay[slot] ?? []).length > 0) || 'Breakfast';

    setActiveViewPlan(null);
    setSavingPlan(false);
    setIsCreatingPlan(true);
    setCreationStep(2);
    setEditingPlanId(plan.id);
    setEditingPlanGroupKey(getPlanGroupKey(plan));
    setPlanName(plan.meal_description || '');
    setSelectedDay(dayKey);
    setActiveSlot(selectedSlot);
    setSelectedMealsByDay(selectionsByDay);
    setPlansError(null);
    setPlansSuccess(null);
  };

  const openViewPlan = (plan: BackendMealPlan) => {
    setActiveViewPlan(plan);
    setActiveViewDay(getDayKeyFromIsoDate(plan.meal_date));
    setActiveViewReadOnly(getPlanSource(plan) === 'nutritionist');
    setPlansError(null);
    setPlansSuccess(null);

    const relatedPlans = getRelatedPlans(plan);
    const missingMealIds = Array.from(
      new Set(
        relatedPlans
          .flatMap((candidate) => candidate.meals || [])
          .map((meal) => meal.id)
          .filter((mealId) => mealId && !viewPlanMealDetails[mealId])
      )
    );

    if (missingMealIds.length > 0) {
      void Promise.allSettled(
        missingMealIds.map(async (mealId) => {
          const response = await api.get<DetailedMeal>(
            `/meal/find-one/${mealId}?lang=${i18n.language || getPreferredLanguage()}`
          );
          return { id: mealId, meal: response.data };
        })
      ).then((results) => {
        setViewPlanMealDetails((current) => {
          const next = { ...current };

          results.forEach((result) => {
            if (result.status === 'fulfilled') {
              next[result.value.id] = result.value.meal;
            }
          });

          return next;
        });
      });
    }
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

  useEffect(() => {
    const handleMealsBackIntent = (event: Event) => {
      const customEvent = event as CustomEvent<{ pathname?: string }>;
      if (customEvent.detail?.pathname !== '/meals') {
        return;
      }

      if (showFilters) {
        event.preventDefault();
        setShowFilters(false);
        return;
      }

      if (pendingDeletePlan) {
        event.preventDefault();
        closeDeletePlanDialog();
        return;
      }

      if (selectedLibraryMeal || mealDetailLoading || mealDetailError) {
        event.preventDefault();
        closeMealDetail();
        return;
      }

      if (selectedLibraryIngredient || ingredientDetailLoading || ingredientDetailError) {
        event.preventDefault();
        closeIngredientDetail();
        return;
      }

      if (activeViewPlan) {
        event.preventDefault();
        setActiveViewPlan(null);
        setActiveViewDay(null);
        setActiveViewReadOnly(false);
        return;
      }

      if (isCreatingPlan) {
        event.preventDefault();

        if (creationStep === 2) {
          setCreationStep(1);
          return;
        }

        resetPlanBuilder();
        return;
      }

      if (subTab !== 'planning') {
        event.preventDefault();
        setSubTab('planning');
      }
    };

    window.addEventListener('lije:back-intent', handleMealsBackIntent as EventListener);

    return () => {
      window.removeEventListener('lije:back-intent', handleMealsBackIntent as EventListener);
    };
  }, [
    activeViewPlan,
    creationStep,
    deletingPlanGroupKey,
    ingredientDetailError,
    ingredientDetailLoading,
    isCreatingPlan,
    mealDetailError,
    mealDetailLoading,
    pendingDeletePlan,
    selectedLibraryIngredient,
    selectedLibraryMeal,
    showFilters,
    subTab,
  ]);

  useEffect(() => {
    const handleBrowserBack = () => {
      if (mealsBackLayer === 0) {
        return;
      }

      browserBackInFlightRef.current = true;

      if (showFilters) {
        setShowFilters(false);
        return;
      }

      if (pendingDeletePlan) {
        closeDeletePlanDialog();
        return;
      }

      if (selectedLibraryMeal || mealDetailLoading || mealDetailError) {
        closeMealDetail();
        return;
      }

      if (selectedLibraryIngredient || ingredientDetailLoading || ingredientDetailError) {
        closeIngredientDetail();
        return;
      }

      if (activeViewPlan) {
        setActiveViewPlan(null);
        setActiveViewDay(null);
        setActiveViewReadOnly(false);
        return;
      }

      if (isCreatingPlan) {
        if (creationStep === 2) {
          setCreationStep(1);
          return;
        }

        resetPlanBuilder();
        return;
      }

      if (subTab !== 'planning') {
        setSubTab('planning');
      }
    };

    window.addEventListener('popstate', handleBrowserBack);

    return () => {
      window.removeEventListener('popstate', handleBrowserBack);
    };
  }, [
    activeViewPlan,
    creationStep,
    ingredientDetailError,
    ingredientDetailLoading,
    isCreatingPlan,
    mealDetailError,
    mealDetailLoading,
    mealsBackLayer,
    pendingDeletePlan,
    selectedLibraryIngredient,
    selectedLibraryMeal,
    showFilters,
    subTab,
  ]);

  // Keep a ref so the backStore handler always sees the latest state without
  // recreating itself (and causing unnecessary BackButton flickers) on every
  // render that changes an inline closure.
  const mealsOnBackRef = useRef<() => boolean>(() => false);
  mealsOnBackRef.current = () => {
    if (showFilters) { setShowFilters(false); return true; }
    if (pendingDeletePlan) { closeDeletePlanDialog(); return true; }
    if (selectedLibraryMeal || mealDetailLoading || mealDetailError) { closeMealDetail(); return true; }
    if (selectedLibraryIngredient || ingredientDetailLoading || ingredientDetailError) { closeIngredientDetail(); return true; }
    if (activeViewPlan) { setActiveViewPlan(null); setActiveViewDay(null); setActiveViewReadOnly(false); return true; }
    if (isCreatingPlan) {
      if (creationStep === 2) { setCreationStep(1); return true; }
      resetPlanBuilder(); return true;
    }
    if (subTab !== 'planning') { setSubTab('planning'); return true; }
    return false;
  };

  // Register a backStore handler whenever there are in-page overlay layers.
  // This makes the Telegram BackButton visible so the system back button is
  // captured by Telegram (and forwarded to our handler) rather than closing
  // the mini app. The existing lije:back-intent listener handles the action;
  // this handler is a safety fallback that also does the work directly.
  useEffect(() => {
    if (mealsBackLayer === 0) return;
    return registerBackHandler({
      id: 'meals-view',
      priority: 10,
      canHandle: () => mealsBackLayer > 0,
      onBack: () => mealsOnBackRef.current(),
    });
  }, [mealsBackLayer]);

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
    const childIds = focusedChildId
      ? [focusedChildId]
      : Array.from(
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
        childIds.map((childId) =>
          api.get(`/meal-plans/by-child/${childId}?lang=${i18n.language || getPreferredLanguage()}`)
        )
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

    const selectedDayMeals = selectedMealsByDay[selectedDay] ?? {};
    const mealsForPayload = Object.entries(selectedDayMeals).flatMap(([slot, meals]) =>
      (meals ?? []).map((selection) => ({
        slot: slot as MealSlot,
        meal: selection.meal,
        multiplier: selection.multiplier,
      }))
    );

    if (mealsForPayload.length === 0) {
      setPlansError('Select at least one meal for the chosen day.');
      return;
    }

    setSavingPlan(true);
    setPlansError(null);
    setPlansSuccess(null);

    try {
      const populatedDayEntries = weekDays
        .map((day) => {
          const dayMeals = selectedMealsByDay[day] ?? {};
          const mealsForDay = Object.entries(dayMeals).flatMap(([slot, meals]) =>
            (meals ?? []).map((selection) => ({
              slot: slot as MealSlot,
              meal: selection.meal,
              multiplier: sanitizeMultiplier(selection.multiplier),
            }))
          );

          if (!mealsForDay.length) {
            return null;
          }

          const mealSelectionMap = mealsForDay.reduce<
            Record<string, { meal: Meal; mealTimes: Set<MealSlot>; multiplier: number }>
          >((acc, entry) => {
            const existing = acc[entry.meal.id];

            if (existing) {
              existing.mealTimes.add(entry.slot);
              existing.multiplier += entry.multiplier;
            } else {
              acc[entry.meal.id] = {
                meal: entry.meal,
                mealTimes: new Set([entry.slot]),
                multiplier: entry.multiplier,
              };
            }

            return acc;
          }, {});

          const normalizedMeals = Object.values(mealSelectionMap).map(
            ({ meal, multiplier }) => ({
              id: meal.id,
              multiplier: sanitizeMultiplier(multiplier),
            })
          );

          const mealTimes = Object.fromEntries(
            Object.entries(mealSelectionMap).map(([mealId, value]) => [
              mealId,
              Array.from(value.mealTimes),
            ])
          );

          const dayCalories = mealsForDay.reduce((sum, selection) => {
            const summary = getRealMealSummary(selection.meal.id, selection.multiplier);
            return sum + (summary.calories?.amount || 0);
          }, 0);

          const matchingDayPlan = editingPlanGroupKey
            ? mealPlans.find(
                (plan) =>
                  getPlanGroupKey(plan) === editingPlanGroupKey &&
                  getDayKeyFromIsoDate(plan.meal_date) === day
              )
            : null;

          return {
            day,
            matchingDayPlan,
            payload: {
              expertId: currentUserId ?? selectedChildId,
              childId: selectedChildId,
              source: 'parent',
              meal_description: planName.trim(),
              mealTimes,
              meal_date: getNextDateForDay(day),
              calories: Math.round(dayCalories),
              meals: normalizedMeals,
            },
          };
        })
        .filter(
          (
            entry
          ): entry is {
            day: DayKey;
            matchingDayPlan: BackendMealPlan | undefined;
            payload: {
              expertId: string;
              childId: string;
              source: 'parent';
              meal_description: string;
              mealTimes: Record<string, MealSlot[]>;
              meal_date: string;
              calories: number;
              meals: { id: string; multiplier: number }[];
            };
          } => Boolean(entry)
        );

      if (!populatedDayEntries.length) {
        setPlansError('Select at least one meal for at least one day.');
        setSavingPlan(false);
        return;
      }

      await Promise.all(
        populatedDayEntries.map(({ matchingDayPlan, payload }, index) => {
          if (editingPlanGroupKey && matchingDayPlan) {
            return api.put(`/meal-plans/update/${matchingDayPlan.id}`, payload);
          }

          if (
            editingPlanId &&
            !editingPlanGroupKey &&
            index === 0 &&
            populatedDayEntries.length === 1
          ) {
            return api.put(`/meal-plans/update/${editingPlanId}`, payload);
          }

          return api.post('/meal-plans/create', payload);
        })
      );

      setSavingPlan(false);
      setPlanSourceTab('parent');
      setPlansSuccess(
        editingPlanGroupKey
          ? 'Meal plan updated.'
          : editingPlanId
            ? 'Meal plan updated.'
            : populatedDayEntries.length === 1
              ? 'Meal plan saved to My Plans.'
              : `${populatedDayEntries.length} days saved to My Plans.`
      );
      resetPlanBuilder();
      void refreshMealPlans();
    } catch (error: any) {
      console.error('Meal plan save failed', {
        selectedMealsByDay,
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
    const planChildProfile =
      children.find((child) => child.id === (selectedPlan?.child?.id ?? plan.child?.id)) ??
      null;
    const planNutritionTargets =
      planChildProfile &&
      planChildProfile.gender &&
      planChildProfile.date_of_birth
        ? calculateNutrients(
            planChildProfile.weight,
            planChildProfile.height,
            planChildProfile.gender,
            planChildProfile.date_of_birth,
            planChildProfile.activity_level ?? 'Moderate',
          )
        : null;
    const getCachedMealSummary = (meal: BackendPlanMeal) => {
      const detailedMeal = viewPlanMealDetails[meal.id];
      const multiplier = sanitizeMultiplier(meal.multiplier);

      if (!detailedMeal) {
        return {
          calories: null as { amount: number; unitLabel: string } | null,
          measurement:
            meal.totalVolume != null
              ? `${formatMeasurementValue((meal.totalVolume ?? 0) * multiplier)} ml`
              : null,
        };
      }

      return getDetailedMealSummary(
        detailedMeal,
        multiplier,
        unitLabelsById,
        unitRecordsById,
        { preferVolumeLabel: true },
      );
    };
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
    const viewPlanCurrentCals = slotEntries.reduce(
      (sum, { meals }) =>
        sum +
        meals.reduce((mealSum, meal) => {
          const summary = getCachedMealSummary(meal);
          return mealSum + (summary.calories?.amount || 0);
        }, 0),
      0,
    );
    const viewPlanProgressItems = buildNutrientProgressItems(
      viewPlanCurrentCals,
      planNutritionTargets,
    );

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
          </div>
          {isReadOnlyPlan ? (
            <div className="min-w-12" />
          ) : (
            <button
              onClick={() => openEditPlan(selectedPlan ?? plan)}
              className="cursor-pointer w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center transition-transform active:scale-90 hover:text-[#76A13B]"
            >
              <AssessmentIcon size={20} />
            </button>
          )}
        </div>

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

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">
            Nutrient Progress ({selectedDay})
          </h4>
          {planNutritionTargets ? (
            <div className="max-h-80 overflow-y-auto pr-2">
              <div className="space-y-4">
                {viewPlanProgressItems.map((item) => {
                  const percentage = Math.min(
                    100,
                    Math.round((item.current / item.target) * 100)
                  );

                  return (
                    <div
                      key={item.key}
                      className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {item.current} / {item.target}
                          {item.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#76A13B] rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-6 text-sm font-medium text-slate-300">
              Complete the child profile with weight, height, gender, and date of birth to view daily nutrient targets.
            </div>
          )}
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
                    (() => {
                      const summary = getCachedMealSummary(meal);

                      return (
                        <div
                          key={meal.id}
                          className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm flex items-center gap-4"
                        >
                          <button
                            onClick={() =>
                              void openMealDetail(
                                meal.id,
                                sanitizeMultiplier(meal.multiplier),
                              )
                            }
                            className="flex flex-1 items-center gap-4 text-left"
                          >
                            <div className="relative w-16 h-16 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden">
                              {getMealImage(meal) && (
                                <img
                                  src={getMealImage(meal)}
                                  alt={meal.name || 'Meal'}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="line-clamp-2 text-sm font-bold leading-tight text-slate-800">
                                {meal.name || 'Meal'}
                              </h5>
                              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                {summary.calories
                                  ? `${formatMeasurementValue(summary.calories.amount)} ${summary.calories.unitLabel}`
                                  : ''}
                                {summary.measurement ? ` • ${summary.measurement}` : ''}
                              </p>
                            </div>
                          </button>
                        </div>
                      );
                    })()
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
          <div className="bg-[#0B1A12] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2 leading-tight">Smart Child<br/>Meal Planning</h3>
              <p className="text-sky-100 text-xs font-medium mb-8 leading-relaxed">Design balanced nutrition tailored to your little one's growth.</p>
              <button
                onClick={openNewPlanBuilder}
                className="bg-[#F9C846] text-[#0B1A12] px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-transform"
              >
              Create New Plan
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-sky-400 rounded-full -mb-20 -mr-20"></div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setPlanSourceTab('parent')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${planSourceTab === 'parent' ? 'bg-white shadow-sm text-[#76A13B]' : 'text-slate-400'}`}
            >
              My Plans
            </button>
            <button
              onClick={() => setPlanSourceTab('nutritionist')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${planSourceTab === 'nutritionist' ? 'bg-white shadow-sm text-[#76A13B]' : 'text-slate-400'}`}
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
                <button
                  onClick={openNewPlanBuilder}
                  className="mt-4 text-sky-500 text-xs font-black uppercase"
                >
                  Start First Plan
                </button>
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
                return (
                  <div key={plan.id} className="bg-white rounded-[2rem] p-4 border border-slate-50 shadow-sm flex items-center gap-3">
                    <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
                      {planSourceTab === 'nutritionist' ? '🥗' : '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-800 truncate text-sm">
                        {plan.meal_description || 'Meal Plan'}
                      </h5>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">
                        {dayCount} Days • {mealCount} Meals
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openViewPlan(plan)}
                        aria-label="View plan"
                        title="View plan"
                        className="cursor-pointer min-w-[52px] h-10 px-3 bg-[#F9C846]/10 text-[#76A13B] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center"
                      >
                        View
                      </button>
                      {planSourceTab === 'parent' && (
                        <>
                          <button
                            onClick={() => openEditPlan(plan)}
                            aria-label="Edit plan"
                            title="Edit plan"
                            className="cursor-pointer w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center transition-transform active:scale-90 hover:text-[#76A13B]"
                          >
                            <AssessmentIcon size={18} />
                          </button>
                          <button
                            onClick={() => requestDeletePlan(plan)}
                            disabled={deletingPlanGroupKey === planGroupKey}
                            aria-label="Delete plan"
                            title="Delete plan"
                            className="cursor-pointer w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center transition-transform active:scale-90 hover:text-rose-500 disabled:opacity-50"
                          >
                            {deletingPlanGroupKey === planGroupKey ? '…' : <TrashIcon size={18} />}
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
          <div className="flex items-center gap-4">
            <button onClick={resetPlanBuilder} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <PlusIcon className="rotate-45 text-slate-500" />
            </button>
            <div className="flex-1">
              <h3 className="font-black text-slate-800">
                {creationStep === 1 ? 'Plan Name' : 'Add Meals'}
              </h3>
              <div className="flex gap-1 mt-1">
                {[1, 2].map((step) => (
                  <div
                    key={step}
                    className={`h-1 rounded-full flex-1 ${
                      step <= creationStep ? 'bg-[#76A13B]' : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {plansError && (
            <div className="bg-rose-50 rounded-[2rem] border border-rose-100 px-5 py-4 shadow-sm">
              <p className="text-sm font-bold text-rose-600">{plansError}</p>
            </div>
          )}
          {creationStep === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 ml-2 tracking-widest">
                  What's the plan name?
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Enter plan name..."
                  className="w-full rounded-2xl border-2 border-[#76A13B] bg-white px-6 py-4 text-slate-800 font-bold outline-none shadow-sm"
                />
              </div>
              <button
                onClick={() => {
                  if (!planName.trim()) {
                    setPlansError('Plan name is required.');
                    return;
                  }
                  setPlansError(null);
                  setCreationStep(2);
                }}
                disabled={!planName.trim()}
                className="w-full rounded-2xl bg-[#0B1A12] py-5 font-black text-white shadow-xl shadow-emerald-100 disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
                  Select Day
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`min-w-18 px-6 py-3 rounded-xl font-bold text-xs border transition-all flex-shrink-0 ${
                        selectedDay === day
                          ? 'bg-[#76A13B] border-[#76A13B] text-white shadow-lg shadow-emerald-100'
                          : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                  {mealSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setActiveSlot(slot)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                        activeSlot === slot ? 'bg-white shadow-sm text-[#76A13B]' : 'text-slate-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">
                  Nutrient Progress ({selectedDay})
                </h4>
                {childNutritionTargets ? (
                  <div className="max-h-80 overflow-y-auto pr-2">
                    <div className="space-y-4">
                    {nutrientProgressItems.map((item) => {
                      const percentage = Math.min(
                        100,
                        Math.round((item.current / item.target) * 100)
                      );

                      return (
                        <div
                          key={item.key}
                          className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                              {item.label}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              {item.current} / {item.target}
                              {item.unit}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#76A13B] rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-6 text-sm font-medium text-slate-300">
                    Complete the child profile with weight, height, gender, and date of birth to view daily nutrient targets.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h5 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">
                    Select {activeSlot} Meals
                  </h5>
                  <span className="text-[10px] font-bold text-slate-400">
                    {selectedMealsForSlot.length} Selected
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      ref={plannerSearchInputRef}
                      type="text"
                      placeholder={`Search ${activeSlot.toLowerCase()} meals...`}
                      className="w-full rounded-2xl border border-slate-100 bg-white py-4 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none focus:border-sky-300 placeholder:text-slate-300 caret-slate-700"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onPaste={handleSearchPaste}
                      enterKeyHint="search"
                      inputMode="search"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowFilters(true);
                    }}
                    className="cursor-pointer w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#76A13B] hover:border-[#76A13B] transition-all"
                  >
                    <FilterIcon />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {plannerMealsForActiveSlot.map((meal) => {
                    const selectedEntry = selectedMealsForSlotMap.get(meal.id);
                    const isSelected = Boolean(selectedEntry);
                    const displayMultiplier = selectedEntry?.multiplier ?? 1;
                    const summary = getRealMealSummary(meal.id, displayMultiplier);

                    return (
                      <div
                        key={meal.id}
                        ref={(node) => {
                          mealCardRefs.current[meal.id] = node;
                        }}
                        className={`rounded-[2rem] border-2 px-4 py-4 transition-all ${
                          isSelected
                            ? 'border-[#76A13B] bg-[#FBFDF6] shadow-[0_12px_30px_rgba(118,161,59,0.12)]'
                            : 'border-slate-100 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => void openMealDetail(meal.id, displayMultiplier)}
                            className="flex flex-1 items-center gap-4 text-left"
                          >
                            <div className="relative h-16 w-16 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden">
                              {meal.image && (
                                <img
                                  src={meal.image}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  alt={meal.name}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h6 className="line-clamp-2 text-sm font-bold leading-tight text-slate-800">
                                {meal.name}
                              </h6>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                {summary.calories
                                  ? `${formatMeasurementValue(summary.calories.amount)} ${summary.calories.unitLabel}`
                                  : ''}
                                {summary.measurement
                                  ? `${summary.calories ? ' • ' : ''}${summary.measurement}`
                                  : ''}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMealsByDay((prev) => ({
                                  ...prev,
                                  [selectedDay]: {
                                    ...(prev[selectedDay] ?? {}),
                                    [activeSlot]: selectedMealsForSlot.filter(
                                      (entry) => entry.meal.id !== meal.id,
                                    ),
                                  },
                                }));
                              } else {
                                setSelectedMealsByDay((prev) => ({
                                  ...prev,
                                  [selectedDay]: {
                                    ...(prev[selectedDay] ?? {}),
                                    [activeSlot]: [
                                      ...selectedMealsForSlot,
                                      { meal, multiplier: 1 },
                                    ],
                                  },
                                }));
                              }
                            }}
                            aria-label={isSelected ? 'Deselect meal' : 'Select meal'}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                              isSelected
                                ? 'border-[#76A13B] bg-[#76A13B] text-white shadow-[0_10px_25px_rgba(118,161,59,0.25)]'
                                : 'border-slate-200 bg-white text-transparent'
                            }`}
                          >
                            ✓
                          </button>
                        </div>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          {isSelected ? (
                            <div className="flex flex-1 items-center justify-between gap-3 pl-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Portion Multiplier:
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                min={0.1}
                                step={0.25}
                                value={multiplierDrafts[meal.id] ?? String(displayMultiplier)}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  setMultiplierDrafts((current) => ({
                                    ...current,
                                    [meal.id]: nextValue,
                                  }));

                                  const normalizedValue = nextValue.replace(',', '.').trim();
                                  if (!normalizedValue || normalizedValue === '.' || normalizedValue === '-') {
                                    return;
                                  }

                                  const parsedValue = Number(normalizedValue);
                                  if (!Number.isFinite(parsedValue)) {
                                    return;
                                  }

                                  setSelectedMealsByDay((prev) => ({
                                    ...prev,
                                    [selectedDay]: {
                                      ...(prev[selectedDay] ?? {}),
                                      [activeSlot]: selectedMealsForSlot.map((entry) =>
                                        entry.meal.id === meal.id
                                          ? {
                                              ...entry,
                                              multiplier: sanitizeMultiplier(parsedValue),
                                            }
                                          : entry
                                      ),
                                    },
                                  }));
                                }}
                                onBlur={(event) => {
                                  const normalizedValue = event.target.value.replace(',', '.').trim();
                                  const parsedValue = Number(normalizedValue);
                                  const finalValue = Number.isFinite(parsedValue)
                                    ? sanitizeMultiplier(parsedValue)
                                    : displayMultiplier;

                                  setMultiplierDrafts((current) => ({
                                    ...current,
                                    [meal.id]: String(finalValue),
                                  }));

                                  setSelectedMealsByDay((prev) => ({
                                    ...prev,
                                    [selectedDay]: {
                                      ...(prev[selectedDay] ?? {}),
                                      [activeSlot]: selectedMealsForSlot.map((entry) =>
                                        entry.meal.id === meal.id
                                          ? {
                                              ...entry,
                                              multiplier: finalValue,
                                            }
                                          : entry
                                      ),
                                    },
                                  }));
                                }}
                                onClick={(event) => event.stopPropagation()}
                                className="w-24 rounded-xl border border-[#DCE7C8] bg-white px-3 py-1.5 text-center text-sm font-black text-[#76A13B] outline-none"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  {activeSlot && plannerMealsForActiveSlot.length === 0 && (
                    <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">
                        No {activeSlot.toLowerCase()} meals available
                      </p>
                    </div>
                  )}
                </div>
                {canLoadMoreMeals ? (
                  <button
                    type="button"
                    onClick={handleLoadMoreMeals}
                    disabled={mealsLoading}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-600 transition-colors hover:border-[#76A13B] hover:text-[#76A13B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {mealsLoading ? 'Loading more...' : 'Load More Meals'}
                  </button>
                ) : null}
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {selectedMealsForDay.length} Meals Total
                </p>
                <button
                  onClick={() => void handleCreatePlan()}
                  disabled={savingPlan || selectedMealsForDay.length === 0}
                  className="px-8 py-4 bg-[#0B1A12] text-white font-black rounded-3xl shadow-xl shadow-emerald-100 disabled:opacity-50"
                >
                  {savingPlan ? 'Saving...' : editingPlanId ? 'Update Plan' : 'Finish Plan'}
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
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'mealLib' ? 'bg-white shadow-sm text-[#76A13B]' : 'text-slate-400'}`}
        >
          {t('Meal Library')}
        </button>
        <button
          onClick={() => setSubTab('foodLib')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'foodLib' ? 'bg-white shadow-sm text-[#76A13B]' : 'text-slate-400'}`}
        >
          {t('Food Library')}
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            ref={librarySearchInputRef}
            type="text"
            placeholder={t('Search by name, allergy...')}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-sky-300 text-sm font-medium text-slate-800 placeholder:text-slate-300 caret-slate-700"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onPaste={handleSearchPaste}
            enterKeyHint="search"
            inputMode="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
          <>
            {filteredMeals.map(meal => (
              <button
                key={meal.id}
                ref={(node) => {
                  mealCardRefs.current[meal.id] = node;
                }}
                type="button"
                onClick={() => void openMealDetail(meal.id)}
                className="cursor-pointer bg-white rounded-[2.5rem] p-5 flex gap-5 border border-slate-50 shadow-sm transition-transform active:scale-95 text-left"
              >
                <div className="relative w-24 h-24 rounded-3xl bg-slate-100 flex-shrink-0 overflow-hidden">
                  {meal.image && (
                    <img
                      src={meal.image}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt={meal.name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
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
            ))}
            {canLoadMoreMeals ? (
              <button
                type="button"
                onClick={handleLoadMoreMeals}
                disabled={mealsLoading}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-600 transition-colors hover:border-[#76A13B] hover:text-[#76A13B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mealsLoading ? 'Loading more...' : 'Load More Meals'}
              </button>
            ) : null}
          </>
        ) : (
          <>
            {filteredIngredients.map(food => (
              <button
                key={food.id}
                ref={(node) => {
                  ingredientCardRefs.current[food.id] = node;
                }}
                type="button"
                onClick={() => void openIngredientDetail(food.id)}
                className="cursor-pointer bg-white rounded-[2.5rem] p-4 flex gap-5 border border-slate-50 shadow-sm text-left transition-transform active:scale-95"
              >
                <div
                  className="relative w-20 h-20 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden"
                  aria-hidden={!food.image}
                >
                  {food.image && (
                    <img
                      src={food.image}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt={food.name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
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
            ))}
            {canLoadMoreIngredients ? (
              <button
                type="button"
                onClick={handleLoadMoreIngredients}
                disabled={ingredientsLoading}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-600 transition-colors hover:border-[#76A13B] hover:text-[#76A13B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ingredientsLoading ? 'Loading more...' : 'Load More Ingredients'}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-32 pt-4">
      {(selectedLibraryMeal || mealDetailLoading || mealDetailError) && (
        <MealLibraryDetailOverlay
          meal={selectedLibraryMeal}
          multiplier={selectedLibraryMealMultiplier}
          loading={mealDetailLoading}
          error={mealDetailError}
          onClose={closeMealDetail}
          unitLabelsById={unitLabelsById}
          unitRecordsById={unitRecordsById}
        />
      )}
      {(selectedLibraryIngredient || ingredientDetailLoading || ingredientDetailError) && (
        <IngredientLibraryDetailOverlay
          ingredient={selectedLibraryIngredient}
          loading={ingredientDetailLoading}
          error={ingredientDetailError}
          onClose={closeIngredientDetail}
          unitLabelsById={unitLabelsById}
          unitRecordsById={unitRecordsById}
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
      {showFilters && (
        <FilterOverlay
          onClose={() => setShowFilters(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
          ageFilter={ageFilter}
          setAgeFilter={setAgeFilter}
          subTab={filterOverlayTab}
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
      {!activeViewPlan && !isCreatingPlan && (
        <>
          <div className="px-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Nutri-Meal</h2>
            <p className="text-slate-500 text-sm">Balanced food for bright futures.</p>
          </div>

          <div className="px-6 mb-8">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex">
              <button
                onClick={() => setSubTab('planning')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab === 'planning' ? 'bg-white shadow-sm text-[#76A13B]' : 'text-slate-500'}`}
              >
                Planning
              </button>
              <button
                onClick={() => setSubTab('mealLib')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${subTab !== 'planning' ? 'bg-white shadow-sm text-[#76A13B]' : 'text-slate-500'}`}
              >
                Libraries
              </button>
            </div>
          </div>
        </>
      )}

      {subTab === 'planning' ? renderPlanning() : renderLibraries()}
    </div>
  );
};

export default MealsView;
