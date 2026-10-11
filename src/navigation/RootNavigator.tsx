import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabNavigator } from "./BottomTabNavigator";
import { RouteResultScreen } from "@/screens/RouteResultScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { LiveNavScreen } from "@/screens/LiveNavScreen";
import { TimelineScreen } from "@/screens/TimelineScreen";
import { useTheme } from "@/theme";
import { buildNavigationTheme } from "@/theme/navigationTheme";
import { linking } from "./linking";
import type { RootStackParamList } from "./navigation-types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { scheme, colors } = useTheme();

  return (
    <NavigationContainer linking={linking} theme={buildNavigationTheme(scheme, colors)}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
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
          name="LiveNav"
          component={LiveNavScreen}
          options={{ title: "실시간 주행" }}
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
