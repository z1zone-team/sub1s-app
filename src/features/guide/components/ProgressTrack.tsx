import React from "react";
import { View } from "react-native";
import { Text } from "@/common/components/Text";
import { cn } from "@/lib/cn";

interface ProgressTrackProps {
  /** 막대 아래에 보일 역 이름들 (처음부터 마지막까지) */
  names: string[];
  /** 이 중 지금 닿은 마지막 역의 순번. 아직 출발역에 있으면 0 */
  reachedIndex: number;
  /** 막대가 채워진 비율 0~1 */
  fill: number;
  /** 호선 색 (진행 부분과 지나온 점) */
  color: string;
}

/**
 * 프로토타입 안내 화면의 진행 막대. 가는 막대 위에 역마다 점이 놓이고 아래에 이름이 붙는다.
 * 지나온 점은 호선 색으로 채우고, 다음 역은 호선 색 테두리, 아직 먼 역은 회색 테두리, 도착역은 검은 점이다.
 * 색과 채움 폭은 값마다 달라 style로 준다
 */
export function ProgressTrack({ names, reachedIndex, fill, color }: ProgressTrackProps) {
  const last = names.length - 1;
  const nextIndex = Math.min(reachedIndex + 1, last);

  return (
    <View className="mx-1.5 mt-4.5 h-10">
      <View className="absolute inset-x-0 top-1.5 h-1 rounded-pill bg-border" />
      <View
        className="absolute left-0 top-1.5 h-1 rounded-pill"
        style={{ width: `${Math.round(Math.min(Math.max(fill, 0), 1) * 100)}%`, backgroundColor: color }}
      />
      <View className="absolute inset-x-0 top-0.5 flex-row justify-between">
        {names.map((name, index) => {
          const isLast = index === last;
          const reached = index <= reachedIndex;
          const upcoming = index === nextIndex && !isLast;
          return (
            <View
              key={`${index}-${name}`}
              className={cn(
                "h-3 w-3 rounded-pill",
                isLast ? "bg-text" : reached ? "" : "border-2 bg-bg",
                !isLast && !reached && !upcoming ? "border-border" : ""
              )}
              style={
                isLast
                  ? undefined
                  : reached
                    ? { backgroundColor: color }
                    : upcoming
                      ? { borderColor: color }
                      : undefined
              }
            />
          );
        })}
      </View>
      <View className="absolute -inset-x-3 top-5.5 flex-row justify-between">
        {names.map((name, index) => {
          const emphasized = index === nextIndex || index === last;
          return (
            <Text
              key={`${index}-${name}`}
              numberOfLines={1}
              className={cn(
                "w-9 text-center text-tiny",
                emphasized ? "font-sans-bold text-text" : "font-sans-semibold text-text-secondary"
              )}
            >
              {name}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
