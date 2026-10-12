import React, { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { useGuestStore } from "@/common/auth/guest-store";
import { useSocialSignIn } from "@/common/auth/useSocialSignIn";
import type { RootStackParamList } from "@/navigation/navigation-types";

export function LoginScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Login">) {
  const { isSignedIn } = useAuth();
  const chooseGuest = useGuestStore((state) => state.choose);
  const { signIn, pending, error } = useSocialSignIn();

  const leave = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  useEffect(() => {
    if (isSignedIn) leave();
  }, [isSignedIn]);

  return (
    <Screen contentClassName="justify-center gap-3 px-6">
      <View className="mb-6 gap-2">
        <Text className="text-display-md font-sans-extrabold text-primary">Sub1S</Text>
        <Text className="text-title-lg font-sans-extrabold">지하철, 더 가볍게</Text>
        <Text className="text-body text-text-secondary">
          가입 없이 소셜 계정으로 바로 시작하고 나에게 맞는 경로를 추천받으세요
        </Text>
      </View>

      <Button
        label="카카오로 계속하기"
        onPress={() => void signIn("kakao")}
        loading={pending === "kakao"}
        disabled={pending !== null}
      />
      <Button
        label="Google로 계속하기"
        variant="secondary"
        onPress={() => void signIn("google")}
        loading={pending === "google"}
        disabled={pending !== null}
      />
      {error ? <Text className="text-center text-body-sm text-error">{error}</Text> : null}

      <Button
        label="로그인 없이 둘러보기"
        variant="ghost"
        onPress={() => {
          void chooseGuest();
          leave();
        }}
      />

      <Text className="mt-4 text-center text-small text-text-secondary">
        계속하면 Sub1S의 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다.
      </Text>
    </Screen>
  );
}
