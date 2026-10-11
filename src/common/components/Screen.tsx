import React from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

interface ScreenProps {
  children: React.ReactNode;
  /** true면 내용이 길어질 때 스크롤된다 */
  scroll?: boolean;
  /** 하단 탭이 이미 아래 여백을 처리하는 화면에서는 아래쪽 안전 영역을 뺀다 */
  edges?: ("top" | "bottom")[];
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  scroll = false,
  edges = ["top"],
  contentStyle,
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ paddingBottom: 24 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
