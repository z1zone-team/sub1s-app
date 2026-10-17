import React from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/common/components/Button";
import { DesignIcon } from "@/common/components/DesignIcon";
import { DraggableSheet } from "@/common/components/DraggableSheet";
import { Text } from "@/common/components/Text";
import type { SearchRow } from "@/features/routing/searchRows";

interface PickConfirmCardProps {
  place: SearchRow;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** 지도에서 고른 곳의 주소와 가까운 역을 보여 주고 확정 버튼 하나를 두는 하단 카드 */
export function PickConfirmCard({ place, confirmLabel, onConfirm, onClose }: PickConfirmCardProps) {
  return (
    <DraggableSheet
      label={place.title}
      className="px-5"
      header={
          <View className="flex-row items-center justify-between gap-2">
            <Text numberOfLines={1} className="shrink text-title font-sans-bold">
              {place.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              className="-mr-3 h-control w-control items-center justify-center"
            >
              <DesignIcon name="close" size={18} tone="secondary" />
            </Pressable>
          </View>
      }
    >
      <View className="pb-5">
        {place.subtitle ? (
          <Text numberOfLines={1} className="text-body-sm text-text-secondary">
            {place.subtitle}
          </Text>
        ) : null}
        {place.hint ? <Text className="mt-1.5 text-body font-sans-semibold">{place.hint}</Text> : null}
        <Button label={confirmLabel} onPress={onConfirm} className="mt-4" />
      </View>
    </DraggableSheet>
  );
}
