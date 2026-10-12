import React from "react";
import { View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Shake } from "@/common/components/Shake";
import { Text } from "@/common/components/Text";

interface OffRouteBannerProps {
  /** 설명 문구. 이탈한 역에서 내려 맞은편 열차를 타라는 안내 */
  message: string;
}

/** 이탈 화면 위쪽의 빨간 경고 배너. 나타난 뒤 좌우로 흔들린다 (프로토타입의 shake) */
export function OffRouteBanner({ message }: OffRouteBannerProps) {
  return (
    <Shake>
      <View accessibilityRole="alert" className="rounded-lg bg-error px-4 py-4.5">
        <View className="flex-row items-center gap-2.5">
          <DesignIcon name="warning" size={26} tone="onPrimary" />
          <Text className="text-headline font-sans-bold text-on-primary">경로를 이탈했어요</Text>
        </View>
        <Text className="mt-2.5 text-body text-on-primary">{message}</Text>
      </View>
    </Shake>
  );
}
