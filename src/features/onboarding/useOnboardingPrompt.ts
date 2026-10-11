import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePreferencesQuery } from "@/apis/queries/users/usePreferencesQuery";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { needsOnboarding } from "./needsOnboarding";
import { useOnboardingSkipStore } from "./skip-store";

/** 홈에서 한 번 부른다. 로그인했고 설문 전이면 설문 화면으로 보낸다 */
export function useOnboardingPrompt(): void {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSignedIn, userId } = useAuth();
  const preferences = usePreferencesQuery(!!isSignedIn);
  const skipLoaded = useOnboardingSkipStore((state) => state.loadedFor === userId);
  const skipped = useOnboardingSkipStore((state) => (userId ? !!state.skipped[userId] : false));
  const hydrate = useOnboardingSkipStore((state) => state.hydrate);

  useEffect(() => {
    if (isSignedIn && userId) void hydrate(userId);
  }, [isSignedIn, userId, hydrate]);

  const needed = needsOnboarding({
    signedIn: !!isSignedIn,
    preferences: preferences.data,
    skipLoaded,
    skipped,
  });

  useEffect(() => {
    if (needed) navigation.navigate("Onboarding");
  }, [needed, navigation]);
}
