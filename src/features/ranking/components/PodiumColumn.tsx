import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { Bob } from "@/common/components/Bob";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";
import { Crown, FirstPlaceCharacter, SecondPlaceCharacter, ThirdPlaceCharacter } from "./RankCharacters";

interface PodiumColumnProps {
  rank: 1 | 2 | 3;
  name: string;
  /** "1,204점" */
  points: string;
  /** "312.8km". 점수 아래에 작게 보인다 */
  km: string;
  onPress?: () => void;
}

const RISE_MS = 500;
/** 프로토타입의 pod: 단은 아래에서 위로 자라고 2등은 0.1초, 3등은 0.2초 늦게 시작한다 */
const RISE_DELAY_MS: Record<number, number> = { 1: 0, 2: 100, 3: 200 };

const POD = {
  1: { height: "h-28", number: "text-display", numberColor: "text-on-primary", box: "bg-primary" },
  2: { height: "h-19", number: "text-headline-md", numberColor: "text-text-secondary", box: "border border-b-0 border-border bg-surface" },
  3: { height: "h-14", number: "text-title-lg", numberColor: "text-text-secondary", box: "border border-b-0 border-border bg-surface" },
} as const;

/** TOP 3 시상대의 한 칸: 캐릭터, 닉네임, 점수와 그 아래 작은 거리, 그 아래 순위 단. 1등은 왕관을 쓰고 둥실 떠 있다 */
export function PodiumColumn({ rank, name, points, km, onPress }: PodiumColumnProps) {
  const rise = useRef(new Animated.Value(0)).current;
  const pod = POD[rank];

  useEffect(() => {
    const animation = Animated.timing(rise, {
      toValue: 1,
      duration: RISE_MS,
      delay: RISE_DELAY_MS[rank],
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [rise, rank]);

  return (
    <Pressable
      className="flex-1 items-center"
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `${rank}위 ${name} 이동 기록 보기` : undefined}
      onPress={onPress}
    >
      {rank === 1 ? (
        <>
          <View className="mb-0.5">
            <Crown />
          </View>
          <Bob lift={4} periodMs={2600}>
            <FirstPlaceCharacter size={92} />
          </Bob>
        </>
      ) : rank === 2 ? (
        <SecondPlaceCharacter size={76} />
      ) : (
        <ThirdPlaceCharacter size={76} />
      )}
      <Text className={cn("mt-1.5 max-w-full", rank === 1 ? "text-body font-sans-bold" : "text-body-sm font-sans-bold")} numberOfLines={1}>
        {name}
      </Text>
      <Text className="text-small font-sans-semibold">{points}</Text>
      <Text className="text-caption text-text-secondary">{km}</Text>
      <Animated.View
        className={cn("mt-2 w-full items-center pt-2.5", pod.height, pod.box)}
        style={{ borderTopLeftRadius: 16, borderTopRightRadius: 12, transform: [{ scaleY: rise }], transformOrigin: "bottom" }}
      >
        <Text
          className={cn("font-sans-bold", pod.number, pod.numberColor)}
          style={{ transform: [{ skewX: "-4deg" }] }}
        >
          {rank}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
