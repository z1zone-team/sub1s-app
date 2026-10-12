import React from "react";
import { Pressable, View } from "react-native";
import { Blink } from "@/common/components/Blink";
import { DesignIcon } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Text } from "@/common/components/Text";

interface GuideBannerProps {
  nextStationName: string;
  destinationName: string;
  stopsLeft: number;
  /** "약 21분" */
  remainingLabel: string;
  weakAcCars: number[];
  onBack: () => void;
}

/** 안내 지도 위쪽의 primary 배너. 다음 역, 안내 중 표시, 도착지까지 남은 역과 시간, 약냉방칸을 보여 준다 */
export function GuideBanner({
  nextStationName,
  destinationName,
  stopsLeft,
  remainingLabel,
  weakAcCars,
  onBack,
}: GuideBannerProps) {
  return (
    // 프로토타입의 drop 효과: 0.1초 뒤에 위에서 14px 내려오며 나타난다
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
            <Text className="text-small font-sans-semibold text-on-primary opacity-85">다음 역</Text>
            <Text numberOfLines={1} className="text-headline-md font-sans-extrabold text-on-primary">
              {nextStationName}
            </Text>
          </View>
          <Blink>
            <View className="h-6 flex-row items-center gap-1.25 rounded-pill bg-primary-dark px-2.25">
              <View className="h-1.5 w-1.5 rounded-pill bg-on-primary" />
              <Text className="text-caption font-sans-extrabold text-on-primary">안내 중</Text>
            </View>
          </Blink>
        </View>
        <View
          className="mt-3 flex-row justify-between border-t pt-3"
          style={{ borderTopColor: "rgba(255,255,255,0.18)" }}
        >
          <Text className="text-body-sm text-on-primary">
            {destinationName || "도착역"}까지 <Text className="text-body-sm font-sans-bold text-on-primary">{stopsLeft}개 역</Text>
            {remainingLabel ? ` · ${remainingLabel}` : ""}
          </Text>
          {weakAcCars.length > 0 ? (
            <Text className="text-body-sm text-on-primary">
              약냉방칸 <Text className="text-body-sm font-sans-bold text-on-primary">{weakAcCars.join("·")}번째</Text>
            </Text>
          ) : null}
        </View>
      </View>
    </RiseIn>
  );
}
