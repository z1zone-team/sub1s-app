import { useColorScheme } from "react-native";
import { palettes, type ColorScheme, type Palette } from "./palette";

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
}

export function resolveScheme(system: string | null | undefined): ColorScheme {
  return system === "dark" ? "dark" : "light";
}

/** 기기 설정을 따라 라이트와 다크를 고른다. 설정을 읽지 못하면 프로토타입 기본인 라이트 */
export function useTheme(): Theme {
  const scheme = resolveScheme(useColorScheme());
  return { scheme, colors: palettes[scheme] };
}
