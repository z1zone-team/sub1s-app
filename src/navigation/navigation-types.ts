import type { NavigatorScreenParams } from "@react-navigation/native";
import type { RouteMode, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { TravelLogResponse } from "@/apis/mutations/travel/createTravelLog";
import type { OffRouteAlert } from "@/apis/queries/tracking/getTrackingSession";
import type { RouteEndpoint } from "@/features/routing/endpoint";

export type BottomTabParamList = {
  RankingTab: undefined;
  HomeTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  /** editing이면 저장된 답을 채워서 다시 고친다 */
  Voice: undefined;
  Onboarding: { editing?: boolean } | undefined;
  ProfileEdit: undefined;
  Friends: undefined;
  NotificationSettings: undefined;
  Invite: { token: string };
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
  OffRoute: {
    alert: OffRouteAlert;
    /** 이탈을 감지한 시점에 원래 경로에서 남아 있던 시간(초) */
    remainingSec: number;
  };
  Arrived: {
    log: TravelLogResponse;
    destinationName: string;
    arrivedAtMs: number;
  };
  Timeline: undefined;
  MoveMap: undefined;
};
