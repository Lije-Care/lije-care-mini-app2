import React from 'react';

// App Views/Navigation
export enum AppView {
  ONBOARDING_PHONE = 'ONBOARDING_PHONE',
  ONBOARDING_OTP = 'ONBOARDING_OTP',
  ONBOARDING_PROFILE = 'ONBOARDING_PROFILE',
  TG_PERMISSION = 'TG_PERMISSION',
  TERMS_AGREEMENT = 'TERMS_AGREEMENT',
  ONBOARDING_PARENT_PROFILE = 'ONBOARDING_PARENT_PROFILE',
  PROFILE = 'PROFILE',
  HOME = 'HOME',
  ASSESSMENT = 'ASSESSMENT',
  MEALS = 'MEALS',
  SHOP = 'SHOP',
  CALL_CENTER = 'CALL_CENTER'
}

export type Gender = 'boy' | 'girl' | 'prefer-not-to-say';

export interface ChildProfile {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string;
  avatar: string;
  height?: number;
  weight?: number;
  muac?: number;
  activityLevel?: 'Active' | 'Moderate' | 'Sedentary';
  allergens?: string[];
}

export interface UserProfile {
  name: string;
  gender: string;
  birthDate: string;
}

export type DevSubCategory = 'Language' | 'Cognitive' | 'Social' | 'Physical';

export interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

// Assessment Types
export type AssessmentStatus = 'under' | 'normal' | 'risk';
export type AssessmentCategory =
  | 'Anthropometric'
  | 'Developmental'
  | 'Feeding Behavior'
  | 'Cognitive'
  | 'Motor Skills'
  | 'Physical Assessment for Malnutrition';

export interface AssessmentData {
  id: string;
  title: string;
  category: AssessmentCategory;
  type: 'measurement' | 'subjective' | 'fact';
  missingDataField?: string;
  result?: {
    status: AssessmentStatus;
    category: string;
    interpretation: string;
    action: string;
    score?: number;
  };
}

export type DevAnswer = 'unanswered' | 'yes' | 'no' | 'addressed';

export interface AssessmentHistoryPoint {
  date: string;
  score: number;
}

export interface DetailedAssessment extends AssessmentData {
  history?: AssessmentHistoryPoint[];
  subCategory?: string;
  answer?: DevAnswer;
  lastUpdated?: string;
  isExpired?: boolean;
}

export interface AssessmentPrompt {
  id: string;
  question: string;
  category: 'development' | 'growth';
}

// Meal & Ingredient Types
export interface Ingredient {
  id: string;
  name: string;
  portion: string;
  calories: number;
  nutrients: { name: string; amount: string }[];
  image: string;
}

export interface Meal {
  id: string;
  name: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  nutrients: string[];
  image: string;
  description: string;
  prepTime: string;
  ageGroup: string;
  ingredients: { ingredientId: string; portion: string }[];
  method: string[];
  servingInfo?: string;
  videoUrl?: string;
  calories: number;
  volume: string;
  allergens?: string[];
}

export interface PlannedMealEntry {
  mealId: string;
  portionMultiplier: number;
}

export interface MealPlanDay {
  dayName: string;
  slots: {
    Breakfast: PlannedMealEntry[];
    Lunch: PlannedMealEntry[];
    Dinner: PlannedMealEntry[];
    Snack: PlannedMealEntry[];
  };
}

export interface MealPlan {
  id: string;
  name: string;
  days: MealPlanDay[];
}

// Shop Types
export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: 'Food' | 'Toys' | 'Lunch Boxes' | 'Utensils' | 'Essentials';
  description: string;
  enlistedDate: string;
}

// Call Center Types
export interface Professional {
  id: string;
  name: string;
  title: string;
  type: 'Doctor' | 'Nutritionist';
  image: string;
  availability: string;
  rating: number;
  fee: number;
  specialty: string;
}
