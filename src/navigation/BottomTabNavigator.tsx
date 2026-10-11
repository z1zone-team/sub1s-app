import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "@/screens/HomeScreen";
import { RankingScreen } from "@/screens/RankingScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { useTheme } from "@/theme";
import type { BottomTabParamList } from "./navigation-types";

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function BottomTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
      }}
    >
      <Tab.Screen
        name="RankingTab"
        component={RankingScreen}
        options={{ title: "랭킹" }}
      />
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "홈" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "프로필" }}
      />
    </Tab.Navigator>
  );
}
