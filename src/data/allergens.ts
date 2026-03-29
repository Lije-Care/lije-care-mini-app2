export const ALLERGEN_LIST = [
  'Milk',
  'Egg',
  'Peanuts',
  'Tree Nuts',
  'Soy',
  'Wheat',
  'Fish',
  'Shellfish',
  'Sesame',
  'Honey',
  'Strawberries',
] as const;

export type Allergen = (typeof ALLERGEN_LIST)[number];
