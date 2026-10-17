import { colorScheme } from "nativewind";
import { create } from "zustand";
import { appStorage } from "@/common/storage/storage";
import { DEFAULT_MAP_STYLE, isMapStyle, type MapStyle } from "@/features/map/mapStyle";
import { DEFAULT_THEME_CHOICE, parseThemeChoice, type ThemeChoice } from "@/theme/themeChoice";

const THEME_KEY = "sub1s.theme";
const MAP_STYLE_KEY = "sub1s.map-style";

interface AppearanceState {
  loaded: boolean;
  theme: ThemeChoice;
  mapStyle: MapStyle;
  hydrate: () => Promise<void>;
  setTheme: (theme: ThemeChoice) => Promise<void>;
  setMapStyle: (mapStyle: MapStyle) => Promise<void>;
}

/** 선택을 NativeWind에 알린다. global.css의 .dark:root 토큰과 useTheme가 함께 따라온다 */
function applyTheme(theme: ThemeChoice): void {
  colorScheme.set(theme);
}

/** 설정의 화면 테마와 지도 스타일. 기기에 기억하고 앱을 켤 때 읽어 온다 */
export const useAppearanceStore = create<AppearanceState>((set) => ({
  loaded: false,
  theme: DEFAULT_THEME_CHOICE,
  mapStyle: DEFAULT_MAP_STYLE,

  hydrate: async () => {
    const [theme, mapStyle] = await Promise.all([appStorage.getItem(THEME_KEY), appStorage.getItem(MAP_STYLE_KEY)]);
    const choice = parseThemeChoice(theme);
    applyTheme(choice);
    set({ loaded: true, theme: choice, mapStyle: isMapStyle(mapStyle) ? mapStyle : DEFAULT_MAP_STYLE });
  },

  setTheme: async (theme) => {
    applyTheme(theme);
    set({ theme });
    try {
      await appStorage.setItem(THEME_KEY, theme);
    } catch {
      // 저장하지 못해도 이번 실행에서는 선택이 적용된다
    }
  },

  setMapStyle: async (mapStyle) => {
    set({ mapStyle });
    try {
      await appStorage.setItem(MAP_STYLE_KEY, mapStyle);
    } catch {
      // 저장하지 못해도 이번 실행에서는 선택이 적용된다
    }
  },
}));
