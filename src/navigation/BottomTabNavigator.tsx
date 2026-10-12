import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DesignIcon, type DesignIconName } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { HomeScreen } from "@/screens/HomeScreen";
import { RankingScreen } from "@/screens/RankingScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { useTheme } from "@/theme";
import { cn } from "@/lib/cn";
import type { BottomTabParamList } from "./navigation-types";

const Tab = createBottomTabNavigator<BottomTabParamList>();

/** 프로토타입 탭바: 활성은 속이 찬 아이콘과 primary 굵은 글자, 비활성은 선 아이콘과 text-secondary */
const tabOptions = (title: string, icon: DesignIconName) => ({
  title,
  tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
    <DesignIcon name={icon} color={color} filled={focused} />
  ),
  tabBarLabel: ({ color, focused }: { color: string; focused: boolean }) => (
    <Text
      className={cn("mt-0.75 text-caption", focused ? "font-sans-bold" : "font-sans-semibold")}
      style={{ color }}
    >
      {title}
    </Text>
  ),
});

export function BottomTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        // 탭 헤더를 쓰면 Screen의 상단 안전 영역과 겹쳐 빈 영역이 생긴다. 제목은 각 화면이 직접 그린다
        headerShown: false,
        // 프로토타입의 탭 전환 효과(.tab fade .25s)
        animation: "fade",
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen name="RankingTab" component={RankingScreen} options={tabOptions("랭킹", "ranking")} />
      <Tab.Screen name="HomeTab" component={HomeScreen} options={tabOptions("홈", "home")} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={tabOptions("MY", "person")} />
    </Tab.Navigator>
  );
}
