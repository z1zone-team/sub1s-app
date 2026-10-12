import React from "react";
import { Pressable, Switch, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useUpdateProfileMutation } from "@/apis/mutations/users/useUpdateProfileMutation";
import { useFriendsQuery } from "@/apis/queries/users/useFriends";
import { useGetMe } from "@/apis/queries/auth/useGetMe";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { useRankingQuery } from "@/apis/queries/ranking/useRankingQuery";
import { Bob } from "@/common/components/Bob";
import { DesignIcon, type DesignIconName } from "@/common/components/DesignIcon";
import { Icon } from "@/common/components/Icon";
import { LoginRequired } from "@/common/components/LoginRequired";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDistanceKm } from "@/common/utils/format";
import { valueParts } from "@/features/guide/arrivedView";
import { ProfileMascot } from "@/features/profile/components/ProfileMascot";
import {
  isVisibilityOn,
  percentileText,
  sumDistanceKm,
  toggledVisibility,
  visibilityDescription,
} from "@/features/profile/profileView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

interface MenuRowProps {
  icon: DesignIconName;
  label: string;
  /** 굵게 보이는 첫 줄(타임라인 자세히 보기) */
  strong?: boolean;
  value?: string;
  onPress: () => void;
}

function MenuRow({ icon, label, strong = false, value, onPress }: MenuRowProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="h-15 flex-row items-center gap-3.5 px-5">
      <DesignIcon name={icon} size={22} />
      <Text className={strong ? "flex-1 text-base font-sans-bold" : "flex-1 text-base font-sans-semibold"}>{label}</Text>
      {value ? <Text className="text-body-sm text-text-secondary">{value}</Text> : null}
      <Icon name="chevron-forward" size={18} tone="secondary" />
    </Pressable>
  );
}

function Divider() {
  return <View className="mx-5 h-px bg-border" />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 px-5 py-4">
      <Text className="text-small font-sans-semibold text-text-secondary">{label}</Text>
      <Text className="mt-1 text-headline font-sans-bold">
        {valueParts(value).map((part, index) => (
          <Text key={index} className="text-headline font-sans-bold">
            {part.number}
            {part.unit ? <Text className="ml-0.5 text-body font-sans-semibold">{part.unit}</Text> : null}
          </Text>
        ))}
      </Text>
    </View>
  );
}

/** 프로토타입 My.dc.html. 프로토타입에 없는 설정은 톱니 버튼으로 여는 설정 화면에 있다 */
export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { isSignedIn } = useAuth();
  const me = useGetMe();
  const all = useTravelStatsQuery("ALL");
  const week = useTravelStatsQuery("WEEK");
  const ranking = useRankingQuery({ periodType: "ALL", periodKey: "ALL", limit: 1 });
  const updateProfile = useUpdateProfileMutation();
  const friends = useFriendsQuery();

  if (!isSignedIn) {
    return <LoginRequired description="로그인하면 이동 기록과 랭킹, 나에게 맞는 경로 추천을 쓸 수 있어요" />;
  }

  const profile = me.data;
  const percentile = percentileText(ranking.data?.myPercentile);
  const visibility = profile?.rankingVisibility ?? "PUBLIC";

  return (
    <Screen scroll contentClassName="pb-6">
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Text className="text-headline-lg font-sans-bold">MY</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="설정"
          onPress={() => navigation.navigate("Settings")}
          className="-mr-2.5 h-control w-control items-center justify-center"
        >
          <DesignIcon name="settings" size={22} />
        </Pressable>
      </View>

      <View className="mx-4 mt-4 overflow-hidden rounded-lg border border-border">
        <View className="flex-row items-center gap-4 p-5">
          <View className="h-19 w-19 items-center justify-center rounded-pill bg-surface">
            <Bob lift={3} periodMs={2400}>
              <ProfileMascot size={56} />
            </Bob>
          </View>
          <View className="flex-1">
            <Text className="text-title-lg font-sans-bold" numberOfLines={1}>
              {profile?.name || profile?.nickname || ""}
            </Text>
            {profile ? <Text className="mt-0.5 text-body text-text-secondary">@{profile.nickname}</Text> : null}
            {percentile ? (
              <View className="mt-2.5 h-6.5 flex-row items-center gap-1 self-start rounded-pill bg-primary-tint px-2.5">
                <DesignIcon name="star" size={12} color={colors.primary} filled strokeWidth={1.5} />
                <Text className="text-small font-sans-bold text-primary">{percentile}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View className="flex-row border-t border-border bg-surface">
          <Stat label="총 이동 거리" value={formatDistanceKm(all.data?.totalDistanceKm ?? 0)} />
          <View className="w-px bg-border" />
          <Stat label="환승" value={`${all.data?.transferCount ?? 0}회`} />
        </View>
      </View>

      <View className="mt-5">
        <MenuRow
          icon="pulse"
          label="타임라인 자세히 보기"
          strong
          value={`이번 주 ${formatDistanceKm(sumDistanceKm(week.data?.buckets))}`}
          onPress={() => navigation.navigate("Timeline")}
        />
        <Divider />
        <MenuRow
          icon="friends"
          label="친구 관리"
          value={friends.data ? `${friends.data.totalCount}명` : undefined}
          onPress={() => navigation.navigate("Friends")}
        />
        <Divider />
        <MenuRow icon="notify" label="알림 설정" onPress={() => navigation.navigate("NotificationSettings")} />
        <Divider />
        <View className="h-18 flex-row items-center gap-3.5 px-5">
          <DesignIcon name="eye" size={22} />
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-sans-semibold">이동 기록 공개</Text>
            <Text className="text-small text-text-secondary">{visibilityDescription(visibility)}</Text>
          </View>
          <Switch
            accessibilityLabel="이동 기록 공개"
            value={isVisibilityOn(visibility)}
            disabled={!profile || updateProfile.isPending}
            onValueChange={() => updateProfile.mutate({ rankingVisibility: toggledVisibility(visibility) })}
            trackColor={{ true: colors.primary, false: colors.textDisabled }}
            thumbColor={colors.bg}
          />
        </View>
        {updateProfile.error ? (
          <Text className="px-5 text-small text-error">변경하지 못했어요. 다시 시도해 주세요.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
