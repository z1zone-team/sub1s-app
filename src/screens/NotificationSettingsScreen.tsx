import React, { useEffect, useState } from "react";
import { Switch, View } from "react-native";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from "@/apis/queries/users/useNotificationSettings";
import { useTheme } from "@/theme";
import { appStorage } from "@/common/storage/storage";
import { GUIDE_VOICE_KEY } from "@/features/guide/useGuideNotices";

export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const settings = useNotificationSettingsQuery();
  const update = useUpdateNotificationSettingsMutation();
  const [voice, setVoice] = useState<boolean | null>(null);
  const [voiceError, setVoiceError] = useState(false);
  useEffect(() => {
    void appStorage.getItem(GUIDE_VOICE_KEY).then(value => setVoice(value === "true"));
  }, []);

  return (
    <Screen edges={[]} contentClassName="gap-2 px-5 pt-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-0.5 pr-3">
          <Text className="text-base font-sans-bold">월말정산 알림</Text>
          <Text className="text-body-sm text-text-secondary">
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
        <Text className="text-body-sm text-error">설정을 불러오거나 저장하지 못했어요. 다시 시도해 주세요.</Text>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-sans-bold">도보·승차 안내 읽어주기</Text>
        <Switch accessibilityLabel="도보·승차 안내 읽어주기" value={voice === true} disabled={voice === null}
          trackColor={{ true: colors.primary }}
          onValueChange={async value => {
            setVoice(null);
            try {
              await appStorage.setItem(GUIDE_VOICE_KEY, String(value));
              setVoice(value);
              setVoiceError(false);
            } catch {
              setVoice(!value);
              setVoiceError(true);
            }
          }}
        />
      </View>
      {voiceError ? <Text className="text-small text-error">음성 안내 설정을 저장하지 못했어요.</Text> : null}
    </Screen>
  );
}
