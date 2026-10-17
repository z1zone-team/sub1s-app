import React from "react";
import { View } from "react-native";
import { Button } from "@/common/components/Button";
import { Text } from "@/common/components/Text";

interface OriginFallbackProps {
  /** 권한이 없어 위치를 쓸 수 없는 경우. 아니면 위치를 아직 못 잡은 경우다 */
  denied: boolean;
  /** 저장한 집이 있으면 그곳에서 출발하는 버튼을 보인다 */
  homeName?: string;
  onHome: () => void;
  onPickOnMap: () => void;
}

/** 현재 위치를 잡지 못했을 때 출발지를 고르는 다른 방법. 글자로 입력하는 것 말고 집이나 지도로 정할 수 있다 */
export function OriginFallback({ denied, homeName, onHome, onPickOnMap }: OriginFallbackProps) {
  return (
    <View className="gap-2.5 rounded-lg border border-border bg-bg p-4">
      <Text className="text-body font-sans-semibold">
        {denied ? "위치 권한이 없어 현재 위치를 쓸 수 없어요" : "현재 위치를 아직 찾지 못했어요"}
      </Text>
      <View className="flex-row gap-2">
        {homeName ? <Button label={`${homeName}에서 출발`} variant="secondary" onPress={onHome} className="flex-1" /> : null}
        <Button label="지도에서 선택" variant="secondary" onPress={onPickOnMap} className="flex-1" />
      </View>
    </View>
  );
}
