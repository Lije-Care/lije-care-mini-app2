// Design System Colors
// Color palette for the Lije Care Mini App

export const COLORS = {
  // Primary section colors
  sky: '#38BDF8',      // Home
  mint: '#34D399',     // Assessment
  yellow: '#FBBF24',   // Meals
  coral: '#FB7185',    // Shop
  purple: '#A855F7',   // Help/Call Center

  // Neutral colors
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Status colors
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
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
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },

  indigo: {
    100: '#E0E7FF',
    500: '#6366F1',
    600: '#4F46E5',
  },

  // Background
  white: '#FFFFFF',
  background: '#F8FAFC', // slate-50
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
