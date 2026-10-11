import React, { useMemo } from "react";
import { View } from "react-native";
import { vars } from "nativewind";
import { paletteToCssVars } from "./cssVars";
import { useTheme } from "./useTheme";

/** 앱 최상단에서 한 번 감싸 현재 라이트와 다크 팔레트를 CSS 변수로 내려보낸다. className의 색 토큰이 이 값을 읽는다 */
export function ThemeVars({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const themeVars = useMemo(() => vars(paletteToCssVars(colors)), [colors]);

  return <View style={[{ flex: 1 }, themeVars]}>{children}</View>;
}
