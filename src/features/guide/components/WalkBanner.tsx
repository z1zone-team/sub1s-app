import React from "react";
import { Pressable, View } from "react-native";
import { Blink } from "@/common/components/Blink";
import { DesignIcon } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Text } from "@/common/components/Text";

interface WalkBannerProps {
  destinationName: string;
  /** "520m · 약 7분" */
  summary: string;
  arrived: boolean;
  onBack: () => void;
}

/** 도보 안내 지도 위쪽의 primary 배너. 도착지 이름과 남은 거리, 시간을 보여 주고 도착하면 도착 표시로 바뀐다 */
export function WalkBanner({ destinationName, summary, arrived, onBack }: WalkBannerProps) {
  return (
    <RiseIn from={-14} durationMs={400} delayMs={100}>
      <View className="rounded-lg bg-primary px-4 pb-3.5 pt-4">
        <View className="flex-row items-center gap-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="안내 화면 나가기"
            onPress={onBack}
            className="h-9 w-9 items-center justify-center rounded-pill bg-primary-dark"
          >
            <DesignIcon name="back" size={20} tone="onPrimary" strokeWidth={2.2} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-small font-sans-semibold text-on-primary opacity-85">걸어서 가는 중</Text>
            <Text numberOfLines={1} className="text-headline-md font-sans-bold text-on-primary">
              {destinationName || "도착지"}
            </Text>
          </View>
          <Blink>
            <View className="h-6 flex-row items-center gap-1.25 rounded-pill bg-primary-dark px-2.25">
              <View className="h-1.5 w-1.5 rounded-pill bg-on-primary" />
              <Text className="text-caption font-sans-bold text-on-primary">{arrived ? "도착" : "안내 중"}</Text>
            </View>
          </Blink>
        </View>
        <View className="mt-3 border-t pt-3" style={{ borderTopColor: "rgba(255,255,255,0.18)" }}>
          <Text className="text-body-sm text-on-primary">{arrived ? "목적지에 도착했어요" : summary}</Text>
        </View>
      </View>
    </RiseIn>
  );
}
