import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@/apis/client";
import { useRankedUserTravel, type RankedTravelPeriod } from "@/apis/queries/ranking/useRankedUserTravel";
import { BackButton } from "@/common/components/BackButton";
import { LoadFailView } from "@/common/components/LoadFailView";
import { LoadingGhost } from "@/common/components/LoadingGhost";
import { LoginRequired } from "@/common/components/LoginRequired";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDistanceKm } from "@/common/utils/format";
import { visitedMapData } from "@/features/map/mapData";
import { VWorldMap } from "@/features/map/VWorldMap";
import { MoodFace } from "@/features/ranking/components/RankCharacters";
import { moodOf } from "@/features/ranking/rankingView";
import { ActivityRow } from "@/features/timeline/components/ActivityRow";
import { kstYearMonth, logDateLabel, logSummary } from "@/features/timeline/timelineView";
import { useAuthToken } from "@/hooks/useAuthToken";
import { cn } from "@/lib/cn";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { getLineInfo } from "@/theme";

const PERIODS = [{ value: "MONTH", label: "이번 달" }, { value: "ALL", label: "전체" }] as const;

export function RankedUserTravelScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "RankedUserTravel">) {
  const { nickname, userId } = route.params;
  const { isLoaded, isSignedIn } = useAuthToken();
  const [period, setPeriod] = useState<RankedTravelPeriod>(route.params.period);
  const month = kstYearMonth(Date.now());
  const query = useRankedUserTravel(userId, period, month);
  const logs = query.data?.timeline?.logs ?? [];
  const map = useMemo(() => visitedMapData(query.data?.map), [query.data?.map]);
  const status = query.error instanceof ApiError ? query.error.status : undefined;
  const accessMessage = status === 403 ? "이 사용자의 이동 기록은 볼 수 없어요" : status === 404 ? "사용자를 찾을 수 없어요" : undefined;

  return (
    <Screen edges={["top", "bottom"]} scroll>
      <BackButton className="ml-3" onPress={() => navigation.goBack()} />
      <Text className="mx-5 mt-1 text-display-sm font-sans-bold">이동 기록</Text>
      {isLoaded && isSignedIn && !accessMessage ? (
        <View className="mx-5 mt-4 flex-row gap-2">
          {PERIODS.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected: period === item.value }}
              className={cn("h-11 justify-center rounded-pill border px-4", period === item.value ? "border-primary bg-primary" : "border-border bg-bg")}
              onPress={() => setPeriod(item.value)}
            >
              <Text className={cn("font-sans-bold", period === item.value ? "text-on-primary" : "text-text-secondary")}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!isLoaded ? <LoadingGhost minHeight={360} /> : !isSignedIn ? (
        <LoginRequired edges={[]} description="로그인하면 랭킹에서 이동 기록을 볼 수 있어요" />
      ) : accessMessage ? (
        <View className="mx-5 mt-5 rounded-xl bg-surface p-5" accessibilityRole="alert">
          <Text className="text-subtitle font-sans-bold">{accessMessage}</Text>
        </View>
      ) : query.isFetching || query.isPending ? <LoadingGhost minHeight={360} /> : query.error ? (
        <LoadFailView title="이동 기록을 불러오지 못했어요" body="연결 상태를 확인하고 다시 시도해 주세요." onRetry={() => void query.refetch()} />
      ) : query.data ? (
        <>
          <View className="mx-5 mt-5 rounded-xl bg-surface p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-pill bg-bg"><MoodFace mood={moodOf(query.data.stats.totalDistanceKm).key} size={36} /></View>
              <Text className="min-w-0 flex-1 text-title font-sans-bold" numberOfLines={1}>{nickname}</Text>
            </View>
            <View className="mt-5 flex-row gap-3">
              <Stat label="이동 거리" value={formatDistanceKm(query.data.stats.totalDistanceKm)} />
              <Stat label="이동 횟수" value={`${query.data.stats.totalTravelCount}회`} />
              <Stat label="환승" value={`${query.data.stats.transferCount}회`} />
            </View>
          </View>
          {query.data.stats.totalTravelCount === 0 ? (
            <Text className="mx-5 mt-6 text-text-secondary">이 기간에 이동 기록이 없어요</Text>
          ) : (
            <>
              <Text className="mx-5 mt-6 text-title-lg font-sans-bold">이동 지도</Text>
              {map.markers.length > 0 ? (
                <VWorldMap mode="2D" data={map} className="mx-5 mt-3 h-75 rounded-lg border border-border" />
              ) : <Text className="mx-5 mt-2 text-text-secondary">표시할 방문 역이 없어요</Text>}
              {logs.length > 0 ? (
                <View className="mx-5 mt-6">
                  <Text className="mb-1 text-title-lg font-sans-bold">이번 달 활동</Text>
                  {logs.map((log, index) => (
                    <ActivityRow
                      key={log.id}
                      color={getLineInfo(log.lineIds[0] ?? "").color}
                      date={logDateLabel(log.traveledAt)}
                      route={`${log.originStationName} → ${log.destStationName}`}
                      summary={logSummary(log)}
                      distanceKm={log.distanceKm}
                      last={index === logs.length - 1}
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="text-title font-sans-bold" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text className="text-small text-text-secondary">{label}</Text>
    </View>
  );
}
