import React from "react";
import { View } from "react-native";
import { Button } from "@/common/components/Button";
import { Text } from "@/common/components/Text";

interface PhaseCardProps {
  title: string;
  detail?: string;
  actionLabel: string;
  onAction: () => void;
  /** 아래에 작게 붙는 안내. 걷는 중에 직접 알리는 방법 등 */
  hint?: string;
}

/** 열차를 타기 전 단계(역까지 걷기, 승강장 대기)에 안내 시트 위쪽에 보이는 카드와 다음 단계로 넘기는 버튼 */
export function PhaseCard({ title, detail, actionLabel, onAction, hint }: PhaseCardProps) {
  return (
    <View className="mt-2 rounded-lg bg-primary-tint px-4 pb-3 pt-3.5">
      <Text className="text-subtitle font-sans-bold">{title}</Text>
      {detail ? <Text className="mt-0.5 text-body-sm text-text-secondary">{detail}</Text> : null}
      <Button label={actionLabel} onPress={onAction} className="mt-3" />
      {hint ? <Text className="mt-2 text-center text-small text-text-secondary">{hint}</Text> : null}
    </View>
  );
}
