import type { NavigatorScreenParams } from "@react-navigation/native";

export type BottomTabParamList = {
  RankingTab: undefined;
  HomeTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  RouteResult: {
    origin: string;
    destination: string;
    mode?: string;
  };
  LiveNav: {
    sessionId: string;
  };
  Timeline: undefined;
};
