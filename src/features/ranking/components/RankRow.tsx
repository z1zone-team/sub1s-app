import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/common/components/Text";
import { valueParts } from "@/features/guide/arrivedView";
import { cn } from "@/lib/cn";
import { RowAvatar } from "./RankCharacters";

interface RankRowProps {
  rank: number;
  name: string;
  /** "963점" */
  value: string;
  /** "96.3km". 점수 아래에 작게 보인다. 내 순위가 목록 밖일 때는 없다 */
  sub?: string;
  isMe: boolean;
  onPress?: () => void;
}

/** 4위부터의 한 줄: 순위, 동그란 아바타, 닉네임(내 줄은 굵게 + 나 배지), 점수와 그 아래 작은 거리 */
export function RankRow({ rank, name, value, sub, isMe, onPress }: RankRowProps) {
  const [part] = valueParts(value);
  return (
    <Pressable
      className={cn("h-16 flex-row items-center gap-3.5 rounded-lg px-3", isMe ? "bg-primary-tint" : "")}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `${rank}위 ${name} 이동 기록 보기` : undefined}
      onPress={onPress}
    >
      <Text className={cn("w-6 text-center text-subtitle font-sans-bold", isMe ? "" : "text-text-secondary")}>{rank}</Text>
      <View className="h-10 w-10 items-center justify-center rounded-md-plus bg-surface">
        <RowAvatar size={24} />
      </View>
      <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
        <Text className={cn("text-subtitle", isMe ? "font-sans-bold" : "font-sans-medium")} numberOfLines={1}>
          {name}
        </Text>
        {isMe ? (
          <View className="h-5 justify-center rounded-xs-plus bg-primary px-1.75">
            <Text className="text-caption font-sans-bold text-on-primary">나</Text>
          </View>
        ) : null}
      </View>
      <View className="items-end">
        <Text className={cn("text-subtitle", isMe ? "font-sans-bold" : "font-sans-medium")}>
          {part.number}
          {part.unit ? <Text className="ml-0.5 text-small font-sans-semibold text-text-secondary">{part.unit}</Text> : null}
        </Text>
        {sub ? <Text className="text-caption text-text-secondary">{sub}</Text> : null}
      </View>
    </Pressable>
  );
}
