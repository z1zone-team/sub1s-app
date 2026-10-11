import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabNavigator } from "./BottomTabNavigator";
import { RouteDetailScreen } from "@/screens/RouteDetailScreen";
import { RouteResultScreen } from "@/screens/RouteResultScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { resolveStartRoute } from "@/common/auth/startRoute";
import { useGuestStore } from "@/common/auth/guest-store";
import { useAuthSync } from "@/common/auth/useAuthSync";
import { usePushNavigation, usePushRegistration } from "@/common/notifications/pushRegistration";
import type { PushTarget } from "@/common/notifications/pushRoute";
import { FriendsScreen } from "@/screens/FriendsScreen";
import { InviteScreen } from "@/screens/InviteScreen";
import { NotificationSettingsScreen } from "@/screens/NotificationSettingsScreen";
import { VoiceScreen } from "@/screens/VoiceScreen";
import { ProfileEditScreen } from "@/screens/ProfileEditScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { OffRouteScreen } from "@/screens/OffRouteScreen";
import { ArrivedScreen } from "@/screens/ArrivedScreen";
import { LiveNavScreen } from "@/screens/LiveNavScreen";
import { MoveMapScreen } from "@/screens/MoveMapScreen";
import { TimelineScreen } from "@/screens/TimelineScreen";
import { useTheme } from "@/theme";
import { buildNavigationTheme } from "@/theme/navigationTheme";
import { linking } from "./linking";
import type { RootStackParamList } from "./navigation-types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const AUTH_LOAD_TIMEOUT_MS = 5000;

export function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();
  const guestLoaded = useGuestStore((state) => state.loaded);
  const guestChosen = useGuestStore((state) => state.chosen);
  const hydrateGuest = useGuestStore((state) => state.hydrate);
  useAuthSync();
  usePushRegistration();

  // 앱이 꺼져 있다가 알림으로 열리면 내비게이션이 준비될 때까지 기다렸다가 이동한다
  const pendingTarget = useRef<NonNullable<PushTarget> | null>(null);
  const openTarget = useCallback((target: NonNullable<PushTarget>) => {
    if (navigationRef.isReady()) navigationRef.navigate(target.screen);
    else pendingTarget.current = target;
  }, []);
  usePushNavigation(openTarget);

  useEffect(() => {
    void hydrateGuest();
  }, [hydrateGuest]);

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

  if (start === "LOADING") {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingTarget.current) {
          navigationRef.navigate(pendingTarget.current.screen);
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
        <Stack.Screen name="Voice" component={VoiceScreen} options={{ title: "음성 검색" }} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: "프로필 수정" }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="MainTabs"
          component={BottomTabNavigator}
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
          options={{ title: "추천 경로" }}
        />
        <Stack.Screen
          name="RouteDetail"
          component={RouteDetailScreen}
          options={{ title: "경로 상세" }}
        />
        <Stack.Screen
          name="LiveNav"
          component={LiveNavScreen}
          options={{ title: "안내 중", headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="OffRoute"
          component={OffRouteScreen}
          options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }}
        />
        <Stack.Screen
          name="Arrived"
          component={ArrivedScreen}
          options={{ title: "도착", headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen name="MoveMap" component={MoveMapScreen} options={{ title: "이동 지도" }} />
        <Stack.Screen
          name="Timeline"
          component={TimelineScreen}
          options={{ title: "이동 기록 타임라인" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
