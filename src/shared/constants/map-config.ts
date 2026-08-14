export const APP_THEMES = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type AppTheme = (typeof APP_THEMES)[keyof typeof APP_THEMES];

export const DEFAULT_APP_THEME: AppTheme = APP_THEMES.LIGHT;

export const MAP_ENV_KEYS = {
  LIGHT_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_LIGHT,
  DARK_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_DARK,
  DEFAULT_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
} as const;
