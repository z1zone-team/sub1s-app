import React from "react";
import { Pressable, Text, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** 선택할 수 있는 알약 버튼. 즐겨찾기 바로가기, 설문 선택지, 필터에 쓴다 */
export function Chip({ label, selected = false, onPress, leading, style }: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        {
          height: 40,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primaryTint : colors.bg,
        },
        style,
      ]}
    >
      {leading}
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: selected ? colors.primary : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
