import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { useAnimatedValues } from "./useAnimatedValues";
import { useTheme } from "@/theme";
import { LEVEL_SAMPLE_MS } from "../speechLevel";
import { WAVE_HEIGHTS, waveDelayMs } from "../voiceView";

/** 물결이 가장 낮을 때의 높이 비율 (프로토타입의 wave: scaleY .25 -> 1) */
const LOW_SCALE = 0.25;
const HALF_CYCLE_MS = 500;
/** 소리가 없을 때 막대의 높이 비율. 96px 중 약 4px라 폭 5px의 짧은 선처럼 보인다 */
const FLAT_SCALE = 0.04;
/** 입력 크기가 바뀔 때 진폭이 따라가는 시간. 10Hz로 오는 값이 뚝뚝 끊겨 보이지 않게 한다 */
const LEVEL_SMOOTH_MS = LEVEL_SAMPLE_MS * 1.5;
const MAX_BAR_HEIGHT = Math.max(...WAVE_HEIGHTS);

interface WaveBarsProps {
  /** 마이크 입력 크기(0~1). 물결의 크기를 정하고 0이면 파형 없는 선이다 */
  level: number;
}

/**
 * 24개 막대가 1초 주기로 물결치는 모양(프로토타입의 wave)은 그대로 두고, 물결의 크기가 목소리 크기를 따른다.
 * 소리가 없으면 진폭이 0이라 모든 막대가 같은 낮은 높이의 선으로 보인다. 막대 높이는 값마다 달라 style로 준다
 */
export function WaveBars({ level }: WaveBarsProps) {
  const { colors } = useTheme();
  const waves = useAnimatedValues(WAVE_HEIGHTS.length, LOW_SCALE);
  const amplitude = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = waves.map((wave, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(waveDelayMs(index)),
          Animated.timing(wave, { toValue: 1, duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(wave, { toValue: LOW_SCALE, duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [waves]);

  useEffect(() => {
    Animated.timing(amplitude, { toValue: level, duration: LEVEL_SMOOTH_MS, easing: Easing.linear, useNativeDriver: true }).start();
  }, [amplitude, level]);

  // 막대의 높이 비율 = 선의 높이 + 막대마다 정해진 높이 비율 x 물결 x 진폭
  const scales = useMemo(
    () =>
      waves.map((wave, index) =>
        Animated.add(
          FLAT_SCALE,
          Animated.multiply(Animated.multiply(wave, amplitude), (WAVE_HEIGHTS[index] / MAX_BAR_HEIGHT) * (1 - FLAT_SCALE))
        )
      ),
    [waves, amplitude]
  );

  return (
    <View className="h-24 flex-row items-center gap-1.25" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {WAVE_HEIGHTS.map((_, index) => (
        <Animated.View
          key={index}
          className="h-24 w-1.25 rounded-pill"
          style={{ backgroundColor: colors.primary, transform: [{ scaleY: scales[index] }] }}
        />
      ))}
    </View>
  );
}
