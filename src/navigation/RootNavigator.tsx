import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabNavigator } from "./BottomTabNavigator";
import { RouteDetailScreen } from "@/screens/RouteDetailScreen";
import { RouteResultScreen } from "@/screens/RouteResultScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { resolveStartRoute } from "@/common/auth/startRoute";
import { useGuestStore } from "@/common/auth/guest-store";
import { useAuthSync } from "@/common/auth/useAuthSync";
import { LoginScreen } from "@/screens/LoginScreen";
import { ArrivedScreen } from "@/screens/ArrivedScreen";
import { LiveNavScreen } from "@/screens/LiveNavScreen";
import { TimelineScreen } from "@/screens/TimelineScreen";
import { useTheme } from "@/theme";
import { buildNavigationTheme } from "@/theme/navigationTheme";
import { linking } from "./linking";
import type { RootStackParamList } from "./navigation-types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();
  const guestLoaded = useGuestStore((state) => state.loaded);
  const guestChosen = useGuestStore((state) => state.chosen);
  const hydrateGuest = useGuestStore((state) => state.hydrate);
  useAuthSync();

  useEffect(() => {
    void hydrateGuest();
  }, [hydrateGuest]);

  const start = resolveStartRoute({
    authLoaded: isLoaded,
    signedIn: !!isSignedIn,
    guestLoaded,
    guestChosen,
  });

  if (start === "LOADING") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} theme={buildNavigationTheme(scheme, colors)}>
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
          name="Arrived"
          component={ArrivedScreen}
          options={{ title: "도착", headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Timeline"
          component={TimelineScreen}
          options={{ title: "이동 기록 타임라인" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
