import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "@/screens/HomeScreen";
import { RankingScreen } from "@/screens/RankingScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import type { BottomTabParamList } from "./navigation-types";

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerStyle: { backgroundColor: "#0B0F19" },
        headerTintColor: "#FFFFFF",
        tabBarStyle: { backgroundColor: "#0B0F19", borderTopColor: "#1E293B" },
        tabBarActiveTintColor: "#38BDF8",
        tabBarInactiveTintColor: "#64748B",
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
