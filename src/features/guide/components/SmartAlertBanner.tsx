import React from "react";
import { Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Text } from "@/common/components/Text";

interface SmartAlertBannerProps {
  title: string;
  /** 서버 문구와 추천 문. 예: "다음 역 강남역에서 환승이에요 · 6번째 칸 2번 문" */
  body: string;
  onDismiss: () => void;
}

/** 안내 배너 아래에 잠깐 나타나는 환승, 하차 알림. 누르면 닫는다 */
export function SmartAlertBanner({ title, body, onDismiss }: SmartAlertBannerProps) {
  return (
    <RiseIn from={-10} durationMs={300}>
      <Pressable
        accessibilityRole="alert"
        accessibilityLabel={`${title}. ${body}`}
        onPress={onDismiss}
        className="mt-2 flex-row items-center gap-2.5 rounded-lg bg-primary-dark px-4 py-3.5"
      >
        <DesignIcon name="warning" size={22} tone="onPrimary" />
        <View className="flex-1">
          <Text className="text-body font-sans-bold text-on-primary">{title}</Text>
          <Text className="mt-0.5 text-small text-on-primary">{body}</Text>
        </View>
      </Pressable>
    </RiseIn>
  );
}
