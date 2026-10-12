import React, { useEffect, useMemo } from "react";
import { Animated, Easing, View } from "react-native";
import { useAnimatedValues } from "./useAnimatedValues";
import { useTheme } from "@/theme";
import { WAVE_HEIGHTS, waveDelayMs } from "../voiceView";

const LOW_SCALE = 0.25;
const HALF_CYCLE_MS = 500;
interface WaveBarsProps {
  /** 듣는 중이면 막대가 물결치고 primary 색, 아니면 멈춘 회색 막대 */
  active: boolean;
}

/** 24개 막대가 1초 주기로 세로로 늘었다 줄며 물결친다 (프로토타입의 wave: scaleY .25 -> 1). 막대 높이는 값마다 달라 style로 준다 */
export function WaveBars({ active }: WaveBarsProps) {
  const { colors } = useTheme();
  const scales = useAnimatedValues(WAVE_HEIGHTS.length, LOW_SCALE);

  const loops = useMemo(
    () =>
      scales.map((scale, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(waveDelayMs(index)),
            Animated.timing(scale, { toValue: 1, duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(scale, { toValue: LOW_SCALE, duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        )
      ),
    [scales]
  );

  useEffect(() => {
    if (!active) {
      scales.forEach((scale) => scale.setValue(1));
      return;
    }
    scales.forEach((scale) => scale.setValue(LOW_SCALE));
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, loops, scales]);

  return (
    <View className="h-24 flex-row items-center gap-1.25" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {WAVE_HEIGHTS.map((height, index) => (
        <Animated.View
          key={index}
          className="w-1.25 rounded-pill"
          style={{
            height,
            backgroundColor: active ? colors.primary : colors.border,
            transform: [{ scaleY: scales[index] }],
          }}
        />
      ))}
    </View>
  );
}
