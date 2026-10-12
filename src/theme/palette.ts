export type ColorScheme = "light" | "dark";

export interface Palette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryTint: string;
  accent: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  onPrimary: string;
  success: string;
  warning: string;
  error: string;
  /** 이탈 안내 박스처럼 경고 색을 옅게 깐 배경 */
  errorTint: string;
  info: string;
}

const light: Palette = {
  primary: "#002968",
  primaryDark: "#001A45",
  primaryLight: "#3D5A99",
  primaryTint: "#E8EDF6",
  accent: "#0072CE",
  bg: "#FFFFFF",
  surface: "#F5F7FA",
  border: "#E1E5EC",
  text: "#111827",
  textSecondary: "#4B5563",
  textDisabled: "#9CA3AF",
  onPrimary: "#FFFFFF",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  errorTint: "#FDECEC",
  info: "#0072CE",
};

const dark: Palette = {
  ...light,
  primary: "#5B8DEF",
  primaryTint: "#1B2A47",
  bg: "#0B1220",
  surface: "#151E2E",
  border: "#263248",
  text: "#F3F4F6",
  textSecondary: "#9CA3AF",
};

export const palettes: Record<ColorScheme, Palette> = { light, dark };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
