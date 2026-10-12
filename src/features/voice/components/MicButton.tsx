import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { cn } from "@/lib/cn";

const RING_FROM_OPACITY = 0.35;
const RING_TO_SCALE = 1.9;
const RING_MS = 1600;

interface MicButtonProps {
  onPress: () => void;
  /** 분석 중이면 링을 멈추고 흐리게 보여 준다 */
  disabled?: boolean;
}

/** 80px 마이크 버튼. 뒤에서 링이 1.6초 주기로 1.9배까지 퍼지며 사라진다 (프로토타입의 ring) */
export function MicButton({ onPress, disabled = false }: MicButtonProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: RING_MS, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [disabled, progress]);

  return (
    <View className="h-20 w-20">
      <Animated.View
        className="absolute inset-0 rounded-pill bg-primary"
        style={{
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [disabled ? 0 : RING_FROM_OPACITY, 0] }),
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, RING_TO_SCALE] }) }],
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="말하기 중지"
        disabled={disabled}
        onPress={onPress}
        className={cn("absolute inset-0 items-center justify-center rounded-pill bg-primary", disabled ? "opacity-50" : "")}
      >
        <DesignIcon name="mic" size={30} tone="onPrimary" strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}
