import type { LinkingOptions } from "@react-navigation/native";
import {
  parseEndpointParam,
  stringifyEndpointParam,
} from "@/features/routing/endpoint";
import type { RootStackParamList } from "./navigation-types";

/**
 * React Navigation 딥링크 설정
 * - 앱 스킴: `sub1s://`
 * - 웹 도메인: `https://sub1s.com`, `https://*.sub1s.com`
 *
 * 지원 URL 패턴:
 * - `sub1s://home` -> 홈 탭
 * - `sub1s://ranking` -> 랭킹 탭
 * - `sub1s://profile` -> 프로필 탭
 * - `sub1s://search` -> 검색 화면
 * - `sub1s://route?origin=09_907&destination=02_222&mode=OPTIMAL` -> 경로 추천 결과 화면 (origin, destination은 역 ID)
 * - `sub1s://livenav/:sessionId` -> 실시간 주행 세션 화면
 * - `sub1s://timeline` -> 이동 타임라인 화면
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    "sub1s://",
    "https://sub1s.com",
    "https://*.sub1s.com",
  ],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: "home",
          RankingTab: "ranking",
          ProfileTab: "profile",
        },
      },
      Search: "search",
      RouteResult: {
        path: "route",
        parse: {
          origin: (value: string) => parseEndpointParam(value),
          destination: (value: string) => parseEndpointParam(value),
        },
        stringify: {
          origin: stringifyEndpointParam,
          destination: stringifyEndpointParam,
        },
      },
      LiveNav: "livenav/:sessionId",
      Timeline: "timeline",
    },
  },
};
