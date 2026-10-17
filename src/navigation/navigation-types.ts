import type { TravelStatsPeriod } from "@/apis/queries/profile/getTravelStats";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { RouteMode, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { TravelLogResponse } from "@/apis/mutations/travel/createTravelLog";
import type { OffRouteAlert } from "@/apis/queries/tracking/getTrackingSession";
import type { PlaceKind } from "@/apis/queries/users/places";
import type { RouteEndpoint } from "@/features/routing/endpoint";

export type BottomTabParamList = {
  RankingTab: undefined;
  HomeTab: { recenterRequest?: number } | undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  /** editing이면 저장된 답을 채워서 다시 고친다 */
  Voice: undefined;
  Onboarding: { editing?: boolean } | undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  Friends: undefined;
  NotificationSettings: undefined;
  Invite: { token: string };
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  /** 홈의 검색 필. 입력 한 칸으로 장소를 찾아 지도에서 확인한다 */
  MapSearch: undefined;
  /** 길찾기에서 현재 위치를 잡지 못했을 때 지도를 길게 눌러 출발지를 정한다 */
  MapPick: undefined;
  /** 길찾기. 출발과 도착 두 칸 */
  Search: {
    /** 지도에서 고른 장소를 출발지로 정해서 들어올 때 */
    origin?: RouteEndpoint;
    /** 홈의 최근 도착지처럼 도착지를 미리 정해서 들어올 때 */
    destination?: RouteEndpoint;
    /** 집이나 학교로 저장할 장소를 고르는 모드. 고르면 저장하고 돌아간다 */
    pickPlace?: PlaceKind;
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
  /** 타임라인에서 고른 기간을 이어서 보여 준다 */
  MoveMap: { period: TravelStatsPeriod };
};
