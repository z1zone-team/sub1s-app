import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/expo";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabNavigator } from "./BottomTabNavigator";
import { RouteDetailScreen } from "@/screens/RouteDetailScreen";
import { RouteResultScreen } from "@/screens/RouteResultScreen";
import { MapPickScreen } from "@/screens/MapPickScreen";
import { MapSearchScreen } from "@/screens/MapSearchScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { resolveStartRoute } from "@/common/auth/startRoute";
import { useAppearanceStore } from "@/common/settings/appearance-store";
import { useGuestStore } from "@/common/auth/guest-store";
import { useAuthSync } from "@/common/auth/useAuthSync";
import { useGuideLocationService } from "@/features/guide/useGuideLocationService";
import { usePushNavigation, usePushRegistration } from "@/common/notifications/pushRegistration";
import type { PushTarget } from "@/common/notifications/pushRoute";
import { FriendsScreen } from "@/screens/FriendsScreen";
import { InviteScreen } from "@/screens/InviteScreen";
import { NotificationSettingsScreen } from "@/screens/NotificationSettingsScreen";
import { VoiceScreen } from "@/screens/VoiceScreen";
import { ProfileEditScreen } from "@/screens/ProfileEditScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { OffRouteScreen } from "@/screens/OffRouteScreen";
import { ArrivedScreen } from "@/screens/ArrivedScreen";
import { LiveNavScreen } from "@/screens/LiveNavScreen";
import { WalkNavScreen } from "@/screens/WalkNavScreen";
import { MoveMapScreen } from "@/screens/MoveMapScreen";
import { TimelineScreen } from "@/screens/TimelineScreen";
import { RankedUserTravelScreen } from "@/screens/RankedUserTravelScreen";
import { MonthlyRecapScreen } from "@/screens/MonthlyRecapScreen";
import { SplashScreen } from "@/common/components/SplashScreen";
import { useSplashMinimumElapsed } from "@/common/components/splashTiming";
import { useTheme } from "@/theme";
import { buildNavigationTheme } from "@/theme/navigationTheme";
import { linking } from "./linking";
import type { RootStackParamList } from "./navigation-types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const AUTH_LOAD_TIMEOUT_MS = 5000;

function navigateToPush(target: NonNullable<PushTarget>) {
  if (target.screen === "MonthlyRecap") {
    navigationRef.navigate("MonthlyRecap", { periodKey: target.periodKey, openedAt: Date.now() });
  } else {
    navigationRef.navigate("Timeline", { periodKey: target.periodKey, pushOpenedAt: Date.now() });
  }
}

export function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();
  const guestLoaded = useGuestStore((state) => state.loaded);
  const guestChosen = useGuestStore((state) => state.chosen);
  const hydrateGuest = useGuestStore((state) => state.hydrate);
  useAuthSync();
  usePushRegistration();
  useGuideLocationService();

  // 앱이 꺼져 있다가 알림으로 열리면 내비게이션이 준비될 때까지 기다렸다가 이동한다
  const pendingTarget = useRef<NonNullable<PushTarget> | null>(null);
  const openTarget = useCallback((target: NonNullable<PushTarget>) => {
    if (navigationRef.isReady()) navigateToPush(target);
    else pendingTarget.current = target;
  }, []);
  usePushNavigation(openTarget);

  const hydrateAppearance = useAppearanceStore((state) => state.hydrate);
  useEffect(() => {
    void hydrateGuest();
    void hydrateAppearance();
  }, [hydrateGuest, hydrateAppearance]);

  // 로그인 서비스가 응답하지 않아도 앱이 멈춘 것처럼 보이지 않게 일정 시간 뒤에는 로그인하지 않은 상태로 시작한다
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setAuthTimedOut(true), AUTH_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  const start = resolveStartRoute({
    authLoaded: isLoaded,
    signedIn: !!isSignedIn,
    guestLoaded,
    guestChosen,
    authTimedOut,
  });

  // 로딩이 빨리 끝나도 스플래시 연출(나타나기, 유령 흔들림)이 보이도록 최소 시간은 보여 준다
  const splashElapsed = useSplashMinimumElapsed();

  if (start === "LOADING" || !splashElapsed) return <SplashScreen />;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingTarget.current) {
          navigateToPush(pendingTarget.current);
          pendingTarget.current = null;
        }
      }}
      linking={linking}
      theme={buildNavigationTheme(scheme, colors)}
    >
      <Stack.Navigator
        initialRouteName={start === "LOGIN" ? "Login" : "MainTabs"}
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Friends" component={FriendsScreen} options={{ title: "친구 관리" }} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: "알림 설정" }} />
        <Stack.Screen name="Invite" component={InviteScreen} options={{ title: "친구 초대" }} />
        <Stack.Screen name="Voice" component={VoiceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "설정" }} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: "프로필 수정" }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="MainTabs"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MapSearch"
          component={MapSearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MapPick"
          component={MapPickScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RouteResult"
          component={RouteResultScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RouteDetail"
          component={RouteDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LiveNav"
          component={LiveNavScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="WalkNav"
          component={WalkNavScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="OffRoute"
          component={OffRouteScreen}
          options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }}
        />
        <Stack.Screen
          name="Arrived"
          component={ArrivedScreen}
          options={{ headerShown: false, gestureEnabled: false, animation: "fade" }}
        />
        <Stack.Screen name="MoveMap" component={MoveMapScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RankedUserTravel" component={RankedUserTravelScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MonthlyRecap" component={MonthlyRecapScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Timeline"
          component={TimelineScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
