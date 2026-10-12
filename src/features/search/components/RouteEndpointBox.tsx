import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import type { RouteEndpoint } from "@/features/routing/endpoint";
import { cn } from "@/lib/cn";

export type EndpointField = "origin" | "destination";

interface RouteEndpointBoxProps {
  origin: RouteEndpoint | undefined;
  destination: RouteEndpoint | undefined;
  active: EndpointField;
  text: string;
  onChangeText: (value: string) => void;
  onActivate: (field: EndpointField) => void;
  onSwap: () => void;
  originPlaceholder: string;
  destinationPlaceholder: string;
}

interface RowProps {
  field: EndpointField;
  endpoint: RouteEndpoint | undefined;
  placeholder: string;
  active: boolean;
  text: string;
  onChangeText: (value: string) => void;
  onActivate: () => void;
}

function Row({ field, endpoint, placeholder, active, text, onChangeText, onActivate }: RowProps) {
  return (
    <View className={cn("h-12 flex-row items-center gap-2.5 px-4", field === "origin" ? "border-b border-border" : "")}>
      {field === "origin" ? (
        <View className="h-2 w-2 rounded-pill border-2 border-text" />
      ) : (
        <View className="h-2 w-2 rounded-pill bg-primary" />
      )}
      {active ? (
        <TextInput
          autoFocus
          value={text}
          onChangeText={onChangeText}
          placeholder={endpoint?.name || placeholder}
          placeholderClassName="text-text-disabled"
          returnKeyType="search"
          className="h-12 flex-1 p-0 font-sans-semibold text-subtitle text-text"
        />
      ) : (
        <Pressable accessibilityRole="button" onPress={onActivate} className="h-12 flex-1 justify-center">
          <Text
            numberOfLines={1}
            className={cn("text-subtitle", endpoint ? "font-sans-semibold text-text" : "text-text-secondary")}
          >
            {endpoint?.name || placeholder}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/** 프로토타입의 출발/도착 박스. 오른쪽에 두 지점을 서로 바꾸는 버튼이 있다. 입력 중인 줄만 입력칸이 된다 */
export function RouteEndpointBox({
  origin,
  destination,
  active,
  text,
  onChangeText,
  onActivate,
  onSwap,
  originPlaceholder,
  destinationPlaceholder,
}: RouteEndpointBoxProps) {
  return (
    <View className="mx-4 mt-1 flex-row items-stretch rounded-lg-plus bg-bg">
      <View className="flex-1">
        <Row
          field="origin"
          endpoint={origin}
          placeholder={originPlaceholder}
          active={active === "origin"}
          text={text}
          onChangeText={onChangeText}
          onActivate={() => onActivate("origin")}
        />
        <Row
          field="destination"
          endpoint={destination}
          placeholder={destinationPlaceholder}
          active={active === "destination"}
          text={text}
          onChangeText={onChangeText}
          onActivate={() => onActivate("destination")}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="출발지 도착지 바꾸기"
        onPress={onSwap}
        className="w-13 items-center justify-center rounded-r-lg-plus border-l border-border"
      >
        <DesignIcon name="swap" size={20} />
      </Pressable>
    </View>
  );
}
