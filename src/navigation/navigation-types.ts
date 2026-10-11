import type { NavigatorScreenParams } from "@react-navigation/native";
import type { RouteMode, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { TravelLogResponse } from "@/apis/mutations/travel/createTravelLog";
import type { RouteEndpoint } from "@/features/routing/endpoint";

export type BottomTabParamList = {
  RankingTab: undefined;
  HomeTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  Search: {
    /** 홈의 최근 도착지처럼 도착지를 미리 정해서 들어올 때 */
    destination?: RouteEndpoint;
  } | undefined;
  RouteResult: {
    origin: RouteEndpoint;
    destination: RouteEndpoint;
    mode?: RouteMode;
  };
  RouteDetail: {
    origin: RouteEndpoint;
    destination: RouteEndpoint;
    option: SubwayRouteOptionDto;
    /** 목록 카드의 제목과 한 줄 설명 */
    title: string;
    tagline?: string;
  };
  LiveNav: {
    sessionId: string;
    /** 딥링크로만 들어오면 없어서 진행 중인 안내를 찾지 못했다고 보여 준다 */
    option?: SubwayRouteOptionDto;
    startedAtMs?: number;
  };
  Arrived: {
    log: TravelLogResponse;
    destinationName: string;
    arrivedAtMs: number;
  };
  Timeline: undefined;
};
