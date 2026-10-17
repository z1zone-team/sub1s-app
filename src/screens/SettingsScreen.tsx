import React from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useUpdateProfileMutation } from "@/apis/mutations/users/useUpdateProfileMutation";
import { useGetMe } from "@/apis/queries/auth/useGetMe";
import { Button } from "@/common/components/Button";
import { Icon } from "@/common/components/Icon";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { unregisterCurrentPushToken } from "@/common/notifications/pushRegistration";
import { useAppearanceStore } from "@/common/settings/appearance-store";
import { MAP_STYLE_OPTIONS } from "@/features/map/mapStyle";
import { THEME_CHOICE_OPTIONS } from "@/theme/themeChoice";
import { VISIBILITY_OPTIONS, visibilityDescription } from "@/features/profile/profileView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-15 flex-row items-center justify-between border-b border-border"
    >
      <Text className="text-base font-sans-semibold">{label}</Text>
      <Icon name="chevron-forward" size={18} tone="secondary" />
    </Pressable>
  );
}

interface ChipOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

function ChipGroup<T extends string>({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: ReadonlyArray<ChipOption<T>>;
  value: T;
  onSelect: (value: T) => void;
}) {
  const description = options.find((option) => option.value === value)?.description;
  return (
    <View className="gap-2">
      <Text className="text-subtitle font-sans-bold">{title}</Text>
      <View className="flex-row gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(option.value)}
              className={cn(
                "h-control flex-1 items-center justify-center rounded-pill border",
                selected ? "border-primary bg-primary-tint" : "border-border bg-bg"
              )}
            >
              <Text className={cn("text-body font-sans-bold", selected ? "text-primary" : "text-text")}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {description ? <Text className="text-small text-text-secondary">{description}</Text> : null}
    </View>
  );
}

/** MY 프로토타입에 없는 설정을 모은 화면: 프로필 수정, 관심 설문, 공개 범위(익명 포함), 로그아웃 */
export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut } = useAuth();
  const me = useGetMe();
  const updateProfile = useUpdateProfileMutation();
  const visibility = me.data?.rankingVisibility ?? "PUBLIC";
  const theme = useAppearanceStore((state) => state.theme);
  const setTheme = useAppearanceStore((state) => state.setTheme);
  const mapStyle = useAppearanceStore((state) => state.mapStyle);
  const setMapStyle = useAppearanceStore((state) => state.setMapStyle);

  return (
    <Screen edges={[]} scroll contentClassName="gap-6 px-5 pt-4">
      <View>
        <Row label="프로필 수정" onPress={() => navigation.navigate("ProfileEdit")} />
        <Row label="관심 설문 다시 고치기" onPress={() => navigation.navigate("Onboarding", { editing: true })} />
      </View>

      <ChipGroup title="화면 테마" options={THEME_CHOICE_OPTIONS} value={theme} onSelect={(value) => void setTheme(value)} />
      <ChipGroup title="지도 스타일" options={MAP_STYLE_OPTIONS} value={mapStyle} onSelect={(value) => void setMapStyle(value)} />

      <View className="gap-2">
        <Text className="text-subtitle font-sans-bold">이동 기록 공개 범위</Text>
        <View className="flex-row gap-2">
          {VISIBILITY_OPTIONS.map((option) => {
            const selected = option.value === visibility;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={updateProfile.isPending}
                onPress={() => {
                  if (!selected) updateProfile.mutate({ rankingVisibility: option.value });
                }}
                className={cn(
                  "h-control flex-1 items-center justify-center rounded-pill border",
                  selected ? "border-primary bg-primary-tint" : "border-border bg-bg"
                )}
              >
                <Text className={cn("text-body font-sans-bold", selected ? "text-primary" : "text-text")}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-small text-text-secondary">{visibilityDescription(visibility)}</Text>
        {updateProfile.error ? <Text className="text-small text-error">변경하지 못했어요. 다시 시도해 주세요.</Text> : null}
      </View>

      <Button label="로그아웃" variant="ghost" onPress={() => void unregisterCurrentPushToken().then(() => signOut())} />
    </Screen>
  );
}
