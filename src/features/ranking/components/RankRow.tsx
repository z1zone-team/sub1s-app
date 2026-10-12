import React from "react";
import { View } from "react-native";
import { Text } from "@/common/components/Text";
import { valueParts } from "@/features/guide/arrivedView";
import { cn } from "@/lib/cn";
import { RowAvatar } from "./RankCharacters";

interface RankRowProps {
  rank: number;
  name: string;
  /** "96.3km" 또는 내 순위가 목록 밖일 때의 "963점" */
  value: string;
  isMe: boolean;
}

/** 4위부터의 한 줄: 순위, 동그란 아바타, 닉네임(내 줄은 굵게 + 나 배지), 거리 */
export function RankRow({ rank, name, value, isMe }: RankRowProps) {
  const [part] = valueParts(value);
  return (
    <View className={cn("h-16 flex-row items-center gap-3.5 rounded-lg px-3", isMe ? "bg-primary-tint" : "")}>
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
      <Text className={cn("text-subtitle", isMe ? "font-sans-bold" : "font-sans-medium")}>
        {part.number}
        {part.unit ? <Text className="ml-0.5 text-small font-sans-semibold text-text-secondary">{part.unit}</Text> : null}
      </Text>
    </View>
  );
}
