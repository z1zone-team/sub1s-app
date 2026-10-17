import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { cssInterop } from "nativewind";
import { WebView } from "react-native-webview";
import { Text } from "@/common/components/Text";
import { ENV } from "@/constants/env";
import { buildMapHtml, parseMapLongPress, type MapData, type MapLongPress } from "./mapHtml";

// WebView도 className으로 스타일을 줄 수 있게 한다
cssInterop(WebView, { className: "style" });

interface VWorldMapProps {
  data: MapData;
  className?: string;
  /** 지도를 길게 눌렀을 때 그 자리의 좌표 */
  onLongPress?: (point: MapLongPress) => void;
}

/** V-World 지도를 WebView로 보여 주고 데이터가 바뀔 때마다 마커와 선을 다시 그린다. 키가 없으면 안내만 보인다 */
export function VWorldMap({ data, className = "", onLongPress }: VWorldMapProps) {
  const webViewRef = useRef<WebView>(null);
  const loaded = useRef(false);
  const html = useMemo(() => buildMapHtml(ENV.VWORLD_KEY), []);

  const push = useCallback(() => {
    if (!loaded.current) return;
    webViewRef.current?.injectJavaScript(
      `window.updateMap && window.updateMap(${JSON.stringify(data)}); true;`
    );
  }, [data]);

  useEffect(push, [push]);

  if (!ENV.VWORLD_KEY) {
    return (
      <View className={`items-center justify-center bg-surface ${className}`}>
        <Text className="px-6 text-center text-body-sm text-text-secondary">
          지도 키(EXPO_PUBLIC_VWORLD_KEY)가 설정되지 않아 지도를 보여 줄 수 없어요
        </Text>
      </View>
    );
  }

  return (
    <View className={`overflow-hidden bg-surface ${className}`}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html, baseUrl: ENV.VWORLD_REFERER || undefined }}
        javaScriptEnabled
        scrollEnabled={false}
        onMessage={(event) => {
          const point = parseMapLongPress(event.nativeEvent.data);
          if (point) onLongPress?.(point);
        }}
        onLoadEnd={() => {
          loaded.current = true;
          push();
        }}
        className="flex-1 bg-transparent"
      />
    </View>
  );
}
