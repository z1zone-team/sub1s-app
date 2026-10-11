import React from "react";
import { Switch, Text, View } from "react-native";
import { Screen } from "@/common/components/Screen";
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from "@/apis/queries/users/useNotificationSettings";
import { useTheme } from "@/theme";

export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const settings = useNotificationSettingsQuery();
  const update = useUpdateNotificationSettingsMutation();

  return (
    <Screen edges={[]} contentStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: 12, gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>월말정산 알림</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            매월 1일 오전 9시에 지난달 이동 횟수와 거리, 랭킹을 알려 드려요
          </Text>
        </View>
        <Switch
          value={settings.data?.monthlySettlement ?? true}
          disabled={!settings.data || update.isPending}
          onValueChange={(value) => update.mutate({ monthlySettlement: value })}
          trackColor={{ true: colors.primary }}
        />
      </View>
      {settings.error || update.error ? (
        <Text style={{ fontSize: 13, color: colors.error }}>
          설정을 불러오거나 저장하지 못했어요. 다시 시도해 주세요.
        </Text>
      ) : null}
    </Screen>
  );
}
