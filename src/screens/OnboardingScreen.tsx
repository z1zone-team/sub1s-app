import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePreferencesQuery } from "@/apis/queries/users/usePreferencesQuery";
import { useUpdatePreferencesMutation } from "@/apis/mutations/users/useUpdatePreferencesMutation";
import { Button } from "@/common/components/Button";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Chip } from "@/common/components/Chip";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import {
  canProceed,
  PURPOSES,
  ROUTE_PREFS,
  toggleSelection,
  type Step,
} from "@/features/onboarding/options";
import { useOnboardingSkipStore } from "@/features/onboarding/skip-store";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";

export function OnboardingScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const { userId } = useAuth();
  const skip = useOnboardingSkipStore((state) => state.skip);
  const save = useUpdatePreferencesMutation();

  const [step, setStep] = useState<Step>(1);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [routePrefs, setRoutePrefs] = useState<string[]>([]);

  const editing = !!route.params?.editing;
  const saved = usePreferencesQuery(editing).data;
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (editing && saved && !seeded) {
      setPurposes(saved.purposes);
      setRoutePrefs(saved.routePrefs);
      setSeeded(true);
    }
  }, [editing, saved, seeded]);

  const leave = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  const options = step === 1 ? PURPOSES : ROUTE_PREFS;
  const selected = step === 1 ? purposes : routePrefs;
  const setSelected = step === 1 ? setPurposes : setRoutePrefs;
  const proceed = canProceed(step, purposes, routePrefs);

  const next = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    save.mutate({ purposes, routePrefs }, { onSuccess: leave });
  };

  const close = () => {
    if (userId && !editing) void skip(userId);
    leave();
  };
  const label = step === 1 ? "다음" : "시작하기";

  return (
    <Screen edges={["top", "bottom"]} contentClassName="px-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={step === 1 ? leave : () => setStep(1)}
          className="h-control w-control items-center justify-center"
        >
          <DesignIcon name="back" size={24} strokeWidth={2} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={close} className="h-control justify-center px-2">
          <Text className="text-body font-sans-semibold text-text-secondary">{editing ? "닫기" : "건너뛰기"}</Text>
        </Pressable>
      </View>

      <View className="mx-2 mt-2 h-1 overflow-hidden rounded-pill bg-border">
        <View className={cn("h-1 rounded-pill bg-primary", step === 1 ? "w-1/2" : "w-full")} />
      </View>

      <View className="px-2 pt-7">
        <Text className="text-body-sm font-sans-bold text-primary">{step} / 2</Text>
        <Text className="mt-2 text-headline-sm font-sans-bold leading-snug">
          {step === 1 ? "주로 지하철을 어떤 용무로 타시나요?" : "어떤 경로를 좋아하세요?"}
        </Text>
        <Text className="mt-2 text-body text-text-secondary">
          {step === 1 ? "중복 선택 가능" : "골라주신 취향으로 AI가 경로를 맨 위에 추천해 드려요"}
        </Text>
        <View className="mt-7 flex-row flex-wrap gap-2.5">
          {options.map((option) => (
            <Chip
              key={option.code}
              large
              label={option.label}
              selected={selected.includes(option.code)}
              onPress={() => setSelected((current) => toggleSelection(current, option.code))}
            />
          ))}
        </View>
      </View>

      <View className="flex-1" />

      {save.error ? (
        <Text className="pb-2 text-center text-body-sm text-error">저장하지 못했어요. 다시 시도해 주세요.</Text>
      ) : null}
      <View className="px-2 pb-4">
        {proceed ? (
          <Button label={label} onPress={next} loading={save.isPending} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            className="h-control-lg items-center justify-center rounded-md bg-border"
          >
            <Text className="text-base font-sans-bold text-text-secondary">{label}</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
