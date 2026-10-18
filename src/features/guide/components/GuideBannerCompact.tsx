import React from "react";
import { Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";

/** 한 줄 배너의 높이(px). 뒤로가기 버튼과 같은 높이다 */
export const GUIDE_BANNER_COMPACT_HEIGHT = 44;

interface GuideBannerCompactProps {
  nextStationName: string;
  stopsLeft: number;
  /** "약 21분" */
  remainingLabel: string;
  onBack: () => void;
}

/**
 * 시트를 전체로 올렸을 때 위에 남기는 한 줄 배너. 큰 배너와 달리 뒤로가기 버튼 높이로 납작하게 두고
 * 꼭 필요한 정보(역 이름, 남은 역 수와 시간)만 보여 준다
 */
export function GuideBannerCompact({ nextStationName, stopsLeft, remainingLabel, onBack }: GuideBannerCompactProps) {
  return (
    <View
      style={{ height: GUIDE_BANNER_COMPACT_HEIGHT }}
      className="flex-row items-center gap-2.5 rounded-pill bg-primary px-1.5"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="안내 화면 나가기"
        onPress={onBack}
        className="h-9 w-9 items-center justify-center rounded-pill bg-primary-dark"
      >
        <DesignIcon name="back" size={20} tone="onPrimary" strokeWidth={2.2} />
      </Pressable>
      <Text numberOfLines={1} className="shrink text-body font-sans-bold text-on-primary">
        {nextStationName}
      </Text>
      <Text numberOfLines={1} className="ml-auto pr-3 text-body-sm text-on-primary">
        {stopsLeft}개 역{remainingLabel ? ` · ${remainingLabel}` : ""}
      </Text>
    </View>
  );
}
