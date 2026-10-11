import React, { useEffect, useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "@/theme";

interface StopStripProps {
  names: string[];
  currentIndex: number;
}

const ITEM_WIDTH = 72;

/** 지나온 역은 흐리게, 지금 역은 진하게 보여 주는 가로 역 목록 */
export function StopStrip({ names, currentIndex }: StopStripProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: Math.max(0, (currentIndex - 1) * ITEM_WIDTH), animated: true });
  }, [currentIndex]);

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
      {names.map((name, index) => {
        const passed = index < currentIndex;
        const current = index === currentIndex;
        const reached = passed || current;
        return (
          <View key={`${index}-${name}`} style={{ width: ITEM_WIDTH, alignItems: "center", gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
              <View
                style={{
                  flex: 1,
                  height: 3,
                  backgroundColor: index === 0 ? "transparent" : reached ? colors.primary : colors.border,
                }}
              />
              <View
                style={{
                  width: current ? 16 : 10,
                  height: current ? 16 : 10,
                  borderRadius: 8,
                  backgroundColor: reached ? colors.primary : colors.bg,
                  borderWidth: 2,
                  borderColor: reached ? colors.primary : colors.border,
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: 3,
                  backgroundColor: index === names.length - 1 ? "transparent" : passed ? colors.primary : colors.border,
                }}
              />
            </View>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                fontWeight: current ? "800" : "500",
                color: passed ? colors.textSecondary : colors.text,
              }}
            >
              {name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
