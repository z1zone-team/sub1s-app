import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";
import type { Palette } from "./palette";

/** React Navigation이 배경, 헤더, 탭 색을 앱 팔레트로 쓰도록 만든다 */
export function buildNavigationTheme(scheme: "light" | "dark", colors: Palette): Theme {
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.bg,
      card: colors.bg,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
  };
}
