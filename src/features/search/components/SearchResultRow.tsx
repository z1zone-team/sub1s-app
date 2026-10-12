import React from "react";
import { Pressable, View } from "react-native";
import { LineBadge } from "@/common/components/LineBadge";
import { Text } from "@/common/components/Text";
import type { SearchRow } from "@/features/routing/searchRows";

/** 역과 장소 검색 결과 한 줄. 장소는 주소와 가까운 역까지의 도보 시간을 함께 보여 준다 */
export function SearchResultRow({ row, onPress }: { row: SearchRow; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border px-5 py-3.5"
    >
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-base font-sans-semibold">
          {row.title}
        </Text>
        {row.subtitle ? (
          <Text numberOfLines={1} className="text-body-sm text-text-secondary">
            {row.subtitle}
          </Text>
        ) : null}
        {row.hint ? (
          <Text numberOfLines={1} className="text-small text-text-secondary">
            {row.hint}
          </Text>
        ) : null}
      </View>
      {row.lineIds.map((lineId) => (
        <LineBadge key={lineId} lineId={lineId} />
      ))}
    </Pressable>
  );
}
