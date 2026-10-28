import React, { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useGetMe } from "@/apis/queries/auth/useGetMe";
import { usePreferencesQuery } from "@/apis/queries/users/usePreferencesQuery";
import { useUpdatePreferencesMutation } from "@/apis/mutations/users/useUpdatePreferencesMutation";
import { useUpdateProfileMutation } from "@/apis/mutations/users/useUpdateProfileMutation";
import { BackButton } from "@/common/components/BackButton";
import { Button } from "@/common/components/Button";
import { Chip } from "@/common/components/Chip";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import {
  canProceed,
  nextStep,
  PURPOSES,
  ROUTE_PREFS,
  toggleSelection,
  totalSteps,
  type Step,
} from "@/features/onboarding/options";
import { useOnboardingSkipStore } from "@/features/onboarding/skip-store";
import { profileSaveErrorMessage } from "@/features/profile/profileErrors";
import { nicknameError } from "@/features/profile/profileView";
import type { RootStackParamList } from "@/navigation/navigation-types";

const INPUT = "h-row rounded-md border border-border px-3.5 font-sans text-base text-text";

const TITLES: Record<Step, string> = {
  1: "주로 지하철을 어떤 용무로 타시나요?",
  2: "어떤 경로를 좋아하세요?",
  3: "어떻게 불러 드릴까요?",
};

const SUBTITLES: Record<Step, string> = {
  1: "중복 선택 가능",
  2: "골라주신 취향으로 AI가 경로를 맨 위에 추천해 드려요",
  3: "친구와 랭킹에 @닉네임으로 보여요. 나중에 설정에서 바꿀 수 있어요",
};

export function OnboardingScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const { userId } = useAuth();
  const skip = useOnboardingSkipStore((state) => state.skip);
  const savePreferences = useUpdatePreferencesMutation();
  const saveProfile = useUpdateProfileMutation();

  const [step, setStep] = useState<Step>(1);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [routePrefs, setRoutePrefs] = useState<string[]>([]);

  const editing = !!route.params?.editing;
  const total = totalSteps(editing);
  const saved = usePreferencesQuery(editing).data;
  const [seeded, setSeeded] = useState(false);

  // 닉네임 단계: 로그인 때 자동으로 만들어진 닉네임을 미리 채워 둔다
  const me = useGetMe();
  const [nickname, setNickname] = useState("");
  const [nicknameSeeded, setNicknameSeeded] = useState(false);

  useEffect(() => {
    if (editing && saved && !seeded) {
      setPurposes(saved.purposes);
      setRoutePrefs(saved.routePrefs);
      setSeeded(true);
    }
  }, [editing, saved, seeded]);

  useEffect(() => {
    if (!editing && me.data && !nicknameSeeded) {
      setNickname(me.data.nickname);
      setNicknameSeeded(true);
    }
  }, [editing, me.data, nicknameSeeded]);

  const leave = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  const isNicknameStep = step === 3;
  const options = step === 1 ? PURPOSES : ROUTE_PREFS;
  const selected = step === 1 ? purposes : routePrefs;
  const setSelected = step === 1 ? setPurposes : setRoutePrefs;
  const nickError = isNicknameStep && nicknameSeeded ? nicknameError(nickname) : "";
  // 내 정보를 못 읽으면 닉네임은 그대로 두고 설문만 저장할 수 있게 한다
  const nicknameUnavailable = !editing && me.isError && !nicknameSeeded;
  const proceed = isNicknameStep
    ? nicknameUnavailable || (nicknameSeeded && !nickError)
    : canProceed(step, purposes, routePrefs);
  const saving = savePreferences.isPending || saveProfile.isPending;

  const finish = () => {
    const trimmed = nickname.trim();
    const nicknameChanged = !editing && nicknameSeeded && trimmed !== me.data?.nickname;
    savePreferences.mutate(
      { purposes, routePrefs },
      {
        onSuccess: () => {
          if (!nicknameChanged) {
            leave();
            return;
          }
          // 설문은 저장됐으니 닉네임이 겹치면 이 단계에 남아 다시 고를 수 있다
          saveProfile.mutate({ nickname: trimmed }, { onSuccess: leave });
        },
      }
    );
  };

  const next = () => {
    const following = nextStep(step, editing);
    if (following) setStep(following);
    else finish();
  };

  const back = () => {
    if (step === 1) leave();
    else setStep((step - 1) as Step);
  };

  const close = () => {
    if (userId && !editing) void skip(userId);
    leave();
  };
  const label = nextStep(step, editing) ? "다음" : "시작하기";
  const errorMessage = saveProfile.error
    ? profileSaveErrorMessage(saveProfile.error)
    : savePreferences.error
      ? "저장하지 못했어요. 다시 시도해 주세요."
      : "";

  return (
    <Screen edges={["top", "bottom"]} contentClassName="px-3">
      <View className="flex-row items-center justify-between">
        <BackButton onPress={back} iconSize={24} strokeWidth={2} />
        <Pressable accessibilityRole="button" onPress={close} className="h-control justify-center px-2">
          <Text className="text-body font-sans-semibold text-text-secondary">{editing ? "닫기" : "건너뛰기"}</Text>
        </Pressable>
      </View>

      <View className="mx-2 mt-2 h-1 overflow-hidden rounded-pill bg-border">
        <View className="h-1 rounded-pill bg-primary" style={{ width: `${(step / total) * 100}%` }} />
      </View>

      <View className="px-2 pt-7">
        <Text className="text-body-sm font-sans-bold text-primary">
          {step} / {total}
        </Text>
        <Text className="mt-2 text-headline-sm font-sans-bold leading-snug">{TITLES[step]}</Text>
        <Text className="mt-2 text-body text-text-secondary">{SUBTITLES[step]}</Text>
        {isNicknameStep ? (
          <View className="mt-7 gap-1.5">
            <TextInput
              value={nickname}
              onChangeText={(text) => {
                setNickname(text);
                if (saveProfile.error) saveProfile.reset();
              }}
              placeholder="2~20자"
              placeholderClassName="text-text-disabled"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (proceed && !saving) next();
              }}
              accessibilityLabel="닉네임"
              className={INPUT}
            />
            {nickError ? (
              <Text className="text-small text-error">{nickError}</Text>
            ) : (
              <Text className="text-small text-text-secondary">한글, 영문, 숫자, _ . - 만 쓸 수 있어요</Text>
            )}
          </View>
        ) : (
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
        )}
      </View>

      <View className="flex-1" />

      {errorMessage ? <Text className="pb-2 text-center text-body-sm text-error">{errorMessage}</Text> : null}
      <View className="px-2 pb-4">
        {proceed ? (
          <Button label={label} onPress={next} loading={saving} />
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
