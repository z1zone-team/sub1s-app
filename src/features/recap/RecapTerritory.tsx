import React, { useLayoutEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Text } from "@/common/components/Text";
import { VWorldMap } from "@/features/map/VWorldMap";
import type { MapData } from "@/features/map/mapHtml";
import { useTheme } from "@/theme";
import { buildRecapMap, MAP_HEIGHT, MAP_WIDTH } from "./recapMap";

export function RecapTerritory({ lines, mapData, loading, play, current }: {
  lines: ReturnType<typeof buildRecapMap>;
  mapData: MapData;
  loading: boolean;
  play: boolean;
  current: boolean;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const progress = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [tilesReady, setTilesReady] = useState(false);

  useLayoutEffect(() => {
    if (!current) setTilesReady(false);
  }, [current]);

  useLayoutEffect(() => {
    if (!tilesReady || !current || !play) {
      opacity.setValue(tilesReady && current ? 1 : 0);
      return;
    }
    const fade = Animated.timing(opacity, { toValue: 1, duration: 620, useNativeDriver: true });
    fade.start();
    return () => fade.stop();
  }, [current, play, opacity, tilesReady]);

  useLayoutEffect(() => {
    const animate = play && width > 0 && lines.length > 0;
    progress.setValue(animate ? 0 : 1);
    if (!animate) return;
    const draw = Animated.timing(progress, {
      toValue: 1, duration: 1700, delay: 480, easing: Easing.inOut(Easing.cubic), useNativeDriver: false,
    });
    draw.start();
    return () => draw.stop();
  }, [play, width, progress, lines]);

  if (!lines.length) {
    return <Text style={{ color: colors.textSecondary }}>{loading ? "지나간 역을 불러오는 중이에요" : "표시할 역 위치가 없어요"}</Text>;
  }

  return (
    <View style={styles.content}>
      <Text className="font-sans-bold" style={[styles.summary, { color: colors.primary }]}>{lines.length}개 호선에서 남긴 이동 기록</Text>
      <View
        accessible
        accessibilityLabel="지나간 역의 위치와 저장된 연결 구간을 표시한 지도"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={[styles.map, { backgroundColor: colors.bg, borderColor: colors.border }]}
      >
        {width > 0 ? (
          <Animated.View style={{ width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] }), overflow: "hidden" }}>
            <Svg width={width} height={width * MAP_HEIGHT / MAP_WIDTH} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
              {lines.map((line) => line.path ? <Path key={line.lineId} d={line.path} fill="none" stroke={line.colorHex} strokeWidth={3} strokeLinecap="round" /> : null)}
              {lines.flatMap((line) => line.points.map((point) => (
                <Circle key={`${line.lineId}-${point.id}`} cx={point.x} cy={point.y} r={3.1} fill={line.colorHex} stroke={colors.bg} strokeWidth={0.8} />
              )))}
            </Svg>
          </Animated.View>
        ) : null}
        {current && mapData.markers.length > 0 ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
            <VWorldMap mode="2D" data={mapData} className="flex-1" onTilesReady={() => setTilesReady(true)} />
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.legend}>
        {lines.slice(0, 6).map((line) => (
          <View key={line.lineId} style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={[styles.dot, { backgroundColor: line.colorHex }]} />
            <Text className="font-sans-semibold">{line.lineName}</Text>
          </View>
        ))}
        {lines.length > 6 ? <Text style={{ color: colors.textSecondary }}>외 {lines.length - 6}개</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  summary: { fontSize: 18 },
  map: { aspectRatio: MAP_WIDTH / MAP_HEIGHT, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  legend: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 18, paddingVertical: 5, paddingHorizontal: 9, gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
