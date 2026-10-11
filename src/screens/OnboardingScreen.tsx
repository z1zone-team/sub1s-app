import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useUpdatePreferencesMutation } from "@/apis/mutations/users/useUpdatePreferencesMutation";
import { Button } from "@/common/components/Button";
import { Chip } from "@/common/components/Chip";
import { Screen } from "@/common/components/Screen";
import {
  canProceed,
  PURPOSES,
  ROUTE_PREFS,
  toggleSelection,
  type Step,
} from "@/features/onboarding/options";
import { useOnboardingSkipStore } from "@/features/onboarding/skip-store";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

export function OnboardingScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const skip = useOnboardingSkipStore((state) => state.skip);
  const save = useUpdatePreferencesMutation();

  const [step, setStep] = useState<Step>(1);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [routePrefs, setRoutePrefs] = useState<string[]>([]);

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

  return (
    <Screen contentStyle={{ paddingHorizontal: 24, paddingTop: 8, gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>{step} / 2</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (userId) void skip(userId);
            leave();
          }}
        >
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>건너뛰기</Text>
        </Pressable>
      </View>

      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border }}>
        <View
          style={{
            height: 4,
            borderRadius: 2,
            width: step === 1 ? "50%" : "100%",
            backgroundColor: colors.primary,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>
          {step === 1 ? "주로 지하철을 어떤 용무로 타시나요?" : "어떤 경로를 좋아하세요?"}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          {step === 1 ? "중복 선택 가능" : "골라주신 취향으로 AI가 경로를 맨 위에 추천해 드려요"}
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => (
          <Chip
            key={option.code}
            label={option.label}
            selected={selected.includes(option.code)}
            onPress={() => setSelected((current) => toggleSelection(current, option.code))}
          />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {save.error ? (
        <Text style={{ fontSize: 13, textAlign: "center", color: colors.error }}>
          저장하지 못했어요. 다시 시도해 주세요.
        </Text>
      ) : null}
      <View style={{ gap: 8, paddingBottom: 16 }}>
        <Button
          label={step === 1 ? "다음" : "시작하기"}
          onPress={next}
          disabled={!proceed}
          loading={save.isPending}
        />
        {step === 2 ? <Button label="이전" variant="ghost" onPress={() => setStep(1)} /> : null}
      </View>
    </Screen>
  );
}
