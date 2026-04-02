// Design System Colors
// Color palette for the Lije Care Mini App

export const COLORS = {
  // Primary section colors
  sky: '#F9C846',      // Home
  mint: '#76A13B',     // Assessment
  yellow: '#F9C846',   // Meals
  coral: '#76A13B',    // Shop
  purple: '#0B1A12',   // Help/Call Center

  // Neutral colors
  slate: {
    50: '#FFFBF0',
    100: '#F8F1DA',
    200: '#E8DFC3',
    300: '#D4C8A6',
    400: '#A6AFB6',
    500: '#7A8794',
    600: '#51606C',
    700: '#31414A',
    800: '#1B2A21',
    900: '#0B1A12',
  },

  // Status colors
  emerald: {
    50: '#EEF6E5',
    100: '#DDECC7',
    400: '#8EB856',
    500: '#76A13B',
    600: '#5E832D',
  },

  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
  },

  amber: {
    50: '#FFF8DE',
    100: '#FFF0BF',
    200: '#FDE68A',
    300: '#F9D86A',
    400: '#F9C846',
    500: '#E4AE1F',
    600: '#C89213',
  },

  indigo: {
    100: '#E0E7FF',
    500: '#6366F1',
    600: '#4F46E5',
  },

  // Background
  white: '#FFFFFF',
  background: '#FFFBF0',
};

// Section color mapping
export const SECTION_COLORS = {
  home: COLORS.sky,
  assessment: COLORS.mint,
  meals: COLORS.yellow,
  shop: COLORS.coral,
  help: COLORS.purple,
} as const;

// Status color mapping
export const STATUS_COLORS = {
  under: COLORS.rose[500],
  normal: COLORS.emerald[500],
  risk: COLORS.amber[500],
} as const;

export type SectionKey = keyof typeof SECTION_COLORS;
export type StatusKey = keyof typeof STATUS_COLORS;
