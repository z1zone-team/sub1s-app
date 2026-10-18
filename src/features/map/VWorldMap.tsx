import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { cssInterop } from "nativewind";
import { WebView } from "react-native-webview";
import { Text } from "@/common/components/Text";
import { useAppearanceStore } from "@/common/settings/appearance-store";
import { ENV } from "@/constants/env";
import { useTheme } from "@/theme/useTheme";
import { buildMapHtml, parseMapLongPress, type MapData, type MapLongPress } from "./mapHtml";
import { build3dMapHtml, isMapReadyMessage } from "./map3dHtml";
import { isWebGlMode, LABEL_OVERLAY_LAYER, needsLabelOverlay, tileLayerOf, type MapMode } from "./mapStyle";

// WebView도 className으로 스타일을 줄 수 있게 한다
cssInterop(WebView, { className: "style" });

interface VWorldMapProps {
  data: MapData;
  className?: string;
  /** 지도 모드. 기본은 일반 지도(2D) */
  mode?: MapMode;
  /** 지도를 길게 눌렀을 때 그 자리의 좌표 */
  onLongPress?: (point: MapLongPress) => void;
}

/** 3D 지도의 도메인 확인에 쓰는 호스트. 키를 등록한 주소에서 뽑는다 */
function refererHost(referer: string): string {
  try {
    return new URL(referer).host;
  } catch {
    return referer;
  }
}

/** V-World 지도를 WebView로 보여 주고 데이터가 바뀔 때마다 마커와 선을 다시 그린다. 키가 없으면 안내만 보인다 */
export function VWorldMap({ data, className = "", mode = "2D", onLongPress }: VWorldMapProps) {
  const webViewRef = useRef<WebView>(null);
  const loaded = useRef(false);
  const mapStyle = useAppearanceStore((state) => state.mapStyle);
  const { scheme } = useTheme();
  const webGl = isWebGlMode(mode);
  const html = useMemo(() => {
    const layer = tileLayerOf(mode, mapStyle);
    if (webGl) return build3dMapHtml(ENV.VWORLD_KEY, refererHost(ENV.VWORLD_REFERER), layer);
    return buildMapHtml(ENV.VWORLD_KEY, layer, needsLabelOverlay(mode, mapStyle));
  }, [mode, mapStyle, webGl]);
  const [webGlReady, setWebGlReady] = useState(false);

  // 모드나 스타일이 바뀌면 페이지를 새로 올리므로 준비 상태를 처음부터 다시 본다
  useEffect(() => {
    loaded.current = false;
    setWebGlReady(false);
  }, [html]);

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
        key={html}
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html, baseUrl: ENV.VWORLD_REFERER || undefined }}
        javaScriptEnabled
        scrollEnabled={false}
        onMessage={(event) => {
          const raw = event.nativeEvent.data;
          if (isMapReadyMessage(raw)) {
            setWebGlReady(true);
            return;
          }
          const point = parseMapLongPress(raw);
          if (point) onLongPress?.(point);
          else if (__DEV__) console.warn("[map]", raw);
        }}
        onLoadEnd={() => {
          loaded.current = true;
          push();
        }}
        className="flex-1 bg-transparent"
      />
      {webGl && !webGlReady ? (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center gap-3 bg-surface">
          <ActivityIndicator color={scheme === "dark" ? "#FFFFFF" : "#002968"} />
          <Text className="text-body-sm text-text-secondary">3D 지도를 불러오는 중이에요</Text>
        </View>
      ) : null}
    </View>
  );
}
