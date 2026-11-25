import React from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/common/components/Button";
import { DesignIcon } from "@/common/components/DesignIcon";
import { DraggableSheet } from "@/common/components/DraggableSheet";
import { LineBadge } from "@/common/components/LineBadge";
import { Text } from "@/common/components/Text";
import type { SearchRow } from "@/features/routing/searchRows";

interface PlaceCardProps {
  place: SearchRow;
  onClose: () => void;
  onOrigin: () => void;
  onDestination: () => void;
  /** 즐겨찾기 별 버튼. 주지 않으면 버튼이 없다 */
  favorite?: { saved: boolean; pending: boolean; onToggle: () => void };
}

/**
 * 지도 검색에서 고른 장소의 하단 카드. 이름, 주소(장소) 또는 호선(역), 가까운 역과 도보 시간, 출발/도착 버튼.
 * 프로토타입에 없는 화면이라 홈 바텀시트의 모양(둥근 상단, 흰 배경, 18px 제목)을 따랐다
 */
export function PlaceCard({ place, onClose, onOrigin, onDestination, favorite }: PlaceCardProps) {
  return (
    <DraggableSheet
      label={place.title}
      className="px-5"
      header={
          <View className="flex-row items-center justify-between gap-2">
            <Text numberOfLines={1} className="shrink text-title font-sans-bold">
              {place.title}
            </Text>
            <View className="-mr-3 flex-row">
              {favorite ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={favorite.saved ? "장소 즐겨찾기 해제" : "장소 즐겨찾기"}
                  accessibilityState={{ selected: favorite.saved, disabled: favorite.pending }}
                  disabled={favorite.pending}
                  onPress={favorite.onToggle}
                  className="h-control w-control items-center justify-center"
                >
                  <DesignIcon name="star" size={20} filled={favorite.saved} />
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                onPress={onClose}
                className="h-control w-control items-center justify-center"
              >
                <DesignIcon name="close" size={18} tone="secondary" />
              </Pressable>
            </View>
          </View>
      }
    >
      <View className="pb-5">
        {place.subtitle ? (
          <Text numberOfLines={1} className="text-body-sm text-text-secondary">
            {place.subtitle}
          </Text>
        ) : null}
        {place.kind === "STATION" ? (
          <View className="mt-2 flex-row gap-1.5">
            {place.lineIds.map((lineId) => (
              <LineBadge key={lineId} lineId={lineId} size="sm" />
            ))}
          </View>
        ) : null}
        {place.hint ? <Text className="mt-1.5 text-body font-sans-semibold">{place.hint}</Text> : null}

        <View className="mt-4 flex-row gap-2">
          <Button label="출발" variant="secondary" onPress={onOrigin} className="flex-1" />
          <Button label="도착" onPress={onDestination} className="flex-1" />
        </View>
      </View>
    </DraggableSheet>
  );
}
