import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BrandLogo } from "@/common/components/BrandLogo";
import { DesignIcon, type DesignIconName } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { useGuestStore } from "@/common/auth/guest-store";
import { useSocialSignIn, type SocialProvider } from "@/common/auth/useSocialSignIn";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";
import { useTheme } from "@/theme";

const RISE_FROM = 12;
const RISE_MS = 500;

interface SocialButtonProps {
  icon: DesignIconName;
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

/** 프로토타입의 소셜 로그인 버튼: 54px, 테두리, 아이콘과 글자가 가운데에 */
function SocialButton({ icon, label, loading, disabled, onPress }: SocialButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "h-13.5 flex-row items-center justify-center gap-2.5 rounded-md-plus border border-border bg-bg active:bg-surface",
        disabled && !loading ? "opacity-50" : ""
      )}
    >
      {loading ? <ActivityIndicator color={colors.text} /> : <DesignIcon name={icon} size={20} />}
      <Text className="text-base font-sans-bold">{label}</Text>
    </Pressable>
  );
}

const PROVIDERS: Array<{ provider: SocialProvider; icon: DesignIconName; label: string }> = [
  { provider: "kakao", icon: "kakao", label: "카카오로 계속하기" },
  { provider: "google", icon: "google", label: "Google로 계속하기" },
];

/** 프로토타입 Login.dc.html */
export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Login">) {
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
    <Screen>
      <View className="flex-1 items-center justify-center px-7">
        <RiseIn from={RISE_FROM} durationMs={RISE_MS}>
          <BrandLogo size={104} radius={24} />
        </RiseIn>
        <RiseIn from={RISE_FROM} durationMs={RISE_MS} delayMs={80}>
          <Text className="mt-7 text-center text-display-sm font-sans-bold leading-snug">지하철, 더 가볍게</Text>
        </RiseIn>
        <RiseIn from={RISE_FROM} durationMs={RISE_MS} delayMs={140}>
          <Text className="mt-2.5 text-center text-subtitle leading-normal text-text-secondary">
            {"가입 없이 소셜 계정으로 바로 시작하고\n나에게 맞는 경로를 추천받으세요"}
          </Text>
        </RiseIn>
      </View>

      <RiseIn from={RISE_FROM} durationMs={RISE_MS} delayMs={200}>
        <View className="gap-2.5 px-5">
          {PROVIDERS.map((item) => (
            <SocialButton
              key={item.provider}
              icon={item.icon}
              label={item.label}
              loading={pending === item.provider}
              disabled={pending !== null}
              onPress={() => void signIn(item.provider)}
            />
          ))}
          {error ? <Text className="text-center text-body-sm text-error">{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void chooseGuest();
              leave();
            }}
            className="h-control items-center justify-center"
          >
            <Text className="text-body font-sans-semibold text-text-secondary">로그인 없이 둘러보기</Text>
          </Pressable>
        </View>
      </RiseIn>

      <Text className="mx-7 mb-6 mt-2 text-center text-small leading-relaxed text-text-secondary">
        {"계속하면 Sub1S의 "}
        <Text className="text-small font-sans-semibold text-accent underline">이용약관</Text>
        {" 및 "}
        <Text className="text-small font-sans-semibold text-accent underline">개인정보처리방침</Text>
        {"에\n동의하게 돼요."}
      </Text>
    </Screen>
  );
}
