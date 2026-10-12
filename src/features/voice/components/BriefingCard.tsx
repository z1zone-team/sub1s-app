import React from "react";
import { Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";

interface BriefingCardProps {
  text: string;
  playing: boolean;
  /** 음성 파일이 있을 때만 재생 버튼이 눌린다. 없으면 글만 보여 준다 */
  canPlay: boolean;
  onToggle: () => void;
}

/** 결과 화면의 브리핑 카드. 왼쪽 36px 원 버튼으로 읽어 주기를 재생, 일시정지하고 오른쪽에 브리핑 문장이 있다 */
export function BriefingCard({ text, playing, canPlay, onToggle }: BriefingCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playing ? "브리핑 일시정지" : "브리핑 재생"}
      accessibilityState={{ selected: playing, disabled: !canPlay }}
      disabled={!canPlay}
      onPress={onToggle}
      className="mt-3.5 w-full max-w-80 min-h-14 flex-row items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5"
    >
      <View className="h-9 w-9 items-center justify-center rounded-pill bg-primary">
        <DesignIcon name={playing ? "pause" : "play"} size={14} tone="onPrimary" />
      </View>
      <Text className="flex-1 text-body-sm">{text}</Text>
    </Pressable>
  );
}
