import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ScrollView, useWindowDimensions, View } from "react-native";
import { Text } from "@/common/components/Text";
import { useTheme } from "@/theme";
import { axisTicks, type ChartBar } from "../timelineView";

const PLOT_HEIGHT = 140;
const LABEL_HEIGHT = 20;
// 기존 w-6 간격(24px)을 최소 칸 폭으로 사용해 두 자리 날짜와 14px 막대가 들어가게 한다.
const MONTH_SLOT_WIDTH = 24;
const GROW_MS = 600;
const STAGGER_MS = 40;

interface BarChartProps {
  bars: ChartBar[];
  scrollable?: boolean;
}

function Bar({ ratio, label, index, wide, color }: { ratio: number; label: string; index: number; wide: boolean; color: string }) {
  const grow = useRef(new Animated.Value(0)).current;
  const target = Math.max(ratio > 0 ? 4 : 2, Math.round(ratio * PLOT_HEIGHT));

  useEffect(() => {
    grow.setValue(0);
    const animation = Animated.timing(grow, {
      toValue: 1,
      duration: GROW_MS,
      delay: index * STAGGER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [grow, index, target]);

  return (
    <View className="flex-1 items-center gap-1.5">
      <Animated.View
        className={wide ? "w-5.5" : "w-3.5"}
        style={{
          height: grow.interpolate({ inputRange: [0, 1], outputRange: [0, target] }),
          backgroundColor: color,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        }}
      />
      <Text numberOfLines={1} className="h-3.5 text-caption font-sans-semibold text-text-secondary">{label}</Text>
    </View>
  );
}

/**
 * 프로토타입 Timeline.dc.html의 막대 그래프. 가로 선 4개 위에 막대가 서고 오른쪽에 세로 눈금 숫자가 있다.
 * 막대가 7개 이하면 22px, 많으면 14px 너비이고 아래에서 위로 자란다. 가장 많이 이동한 막대만 primary 색이고 나머지는 테두리색이다
 */
export function BarChart({ bars, scrollable = false }: BarChartProps) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const { max, ticks } = useMemo(() => axisTicks(Math.max(0, ...bars.map((bar) => bar.distanceKm))), [bars]);
  const wide = bars.length <= 7;
  const maxKm = Math.max(0, ...bars.map((bar) => bar.distanceKm));

  const plot = (
    <View
      className="h-40 flex-1"
      style={scrollable ? { minWidth: bars.length * MONTH_SLOT_WIDTH * fontScale } : undefined}
    >
      <View className="absolute inset-x-0 top-0 justify-between" style={{ bottom: LABEL_HEIGHT }}>
        {ticks.map((tick) => (
          <View key={tick} className="h-px bg-border" />
        ))}
      </View>
      <View className="absolute inset-0 flex-row items-end justify-around gap-1">
        {bars.map((bar, index) => (
          <Bar
            key={bar.key}
            ratio={max > 0 ? bar.distanceKm / max : 0}
            label={bar.label}
            index={index}
            wide={wide}
            color={bar.distanceKm > 0 && bar.distanceKm === maxKm ? colors.primary : colors.border}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View className="flex-row gap-2.5">
      {scrollable ? (
        <ScrollView
          horizontal
          className="h-40 flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsHorizontalScrollIndicator
        >
          {plot}
        </ScrollView>
      ) : plot}
      <View className="-mt-1.75 h-35 w-6 justify-between">
        {ticks.map((tick) => (
          <Text key={tick} className="text-right text-caption text-text-secondary">
            {tick}
          </Text>
        ))}
      </View>
    </View>
  );
}
