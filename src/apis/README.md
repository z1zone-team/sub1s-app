# 🚇 Sub1S 프론트엔드 API 연동 가이드

이 문서는 백엔드 API 연동 및 화면 개발을 담당하는 팀원을 위한 실무 가이드입니다.  
화면(UI)에는 최대한 UI 렌더링 로직만 남기고, 서버 통신 및 캐시 관리는 **순수 API 함수 + React Query 커스텀 훅 1:1 쌍**으로 분리합니다.

---

## 📁 1. 디렉터리 구조 및 네이밍 규칙

모든 API 통신은 `src/apis/` 디렉터리에 모여 있습니다:

```text
src/apis/
├── client.ts                 # Base HTTP 클라이언트 (토큰 자동주입, 에러 처리, get/post/put/patch/del)
├── queries/                  # [조회성 API] GET 요청
│   ├── auth/                 # ✅ 기준 모범 예제 (getMe.ts, useGetMe.ts)
│   ├── routing/              # 경로 탐색
│   ├── congestion/           # 실시간/통계 혼잡도
│   ├── tracking/             # 주행 세션 조회
│   ├── ranking/              # 랭킹 리더보드
│   └── profile/              # 프로필 통계, 타임라인
└── mutations/                # [변경성 API] POST / PUT / PATCH / DELETE 요청
    ├── routing/              # 즐겨찾기 등록 등
    ├── tracking/             # 오탑승 신고, 위치 보고
    ├── voice/                # 음성 AI 질의 업로드
    └── notifications/        # 푸시 토큰 등록
```

---

## 🚀 2. 새 Query(조회 API) 추가하는 법 (3단계)

예: 지하철 경로 4-모드 탐색 조회 API

### 1단계: 순수 API 함수 작성 (`queries/routing/getOptimalRoutes.ts`)
```typescript
import { get } from "@/apis/client";

// API_SPEC.md 에 정의된 DTO 타입 정의
export interface RouteParams {
  originStationId: string;
  destStationId: string;
  mode?: "OPTIMAL" | "COMFORTABLE" | "PERSONAL" | "CHEAPEST";
}

export interface RouteResult {
  routeId: string;
  totalDurationMinutes: number;
  totalFareWon: number;
  transferCount: number;
  path: Array<{ stationId: string; stationName: string; line: string }>;
}

export const getOptimalRoutes = (params: RouteParams): Promise<RouteResult> => {
  return get<RouteResult>("/routes/optimal", params);
};
```

### 2단계: 쿼리 키 등록 (`constants/queryKeys.ts`)
```typescript
export const queryKeys = {
  routes: {
    all: ["routes"] as const,
    optimal: (origin: string, dest: string, mode?: string) =>
      [...queryKeys.routes.all, "optimal", origin, dest, mode] as const,
  },
  // ...
};
```

### 3단계: React Query 훅 작성 (`queries/routing/useGetOptimalRoutes.ts`)
```typescript
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { getOptimalRoutes, type RouteParams, type RouteResult } from "./getOptimalRoutes";

export const useGetOptimalRoutes = (
  params: RouteParams,
  enabled: boolean = true
): UseQueryResult<RouteResult, Error> => {
  return useQuery({
    queryKey: queryKeys.routes.optimal(params.originStationId, params.destStationId, params.mode),
    queryFn: () => getOptimalRoutes(params),
    enabled: enabled && Boolean(params.originStationId && params.destStationId),
    staleTime: 60 * 1000, // 1분간 캐시 유지
  });
};
```

### 4단계: 화면에서 사용
```tsx
import { useGetOptimalRoutes } from "@/apis/queries/routing/useGetOptimalRoutes";

export function RouteResultView({ origin, dest }: { origin: string; dest: string }) {
  const { data: route, isLoading, isError, error } = useGetOptimalRoutes({
    originStationId: origin,
    destStationId: dest,
  });

  if (isLoading) return <ActivityIndicator />;
  if (isError) return <Text className="text-red-500">{error.message}</Text>;

  return (
    <View className="p-4 bg-slate-900 rounded-lg">
      <Text className="text-white text-lg font-bold">소요시간: {route.totalDurationMinutes}분</Text>
      <Text className="text-slate-400">요금: {route.totalFareWon}원</Text>
    </View>
  );
}
```

---

## ⚡ 3. 새 Mutation(변경 API) 추가하는 법 (3단계)

예: 오탑승/이탈 신고 API

### 1단계: 순수 API 함수 작성 (`mutations/tracking/trackDeviate.ts`)
```typescript
import { post } from "@/apis/client";

export interface TrackDeviateBody {
  sessionId: string;
  currentStationId: string;
  latitude: number;
  longitude: number;
}

export interface TrackDeviateResult {
  isDeviated: boolean;
  recoveryRouteId?: string;
}

export const trackDeviate = (body: TrackDeviateBody): Promise<TrackDeviateResult> => {
  return post<TrackDeviateResult>("/routes/track/deviate", body);
};
```

### 2단계: React Query 훅 작성 (`mutations/tracking/useTrackDeviate.ts`)
```typescript
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { trackDeviate, type TrackDeviateBody, type TrackDeviateResult } from "./trackDeviate";

export const useTrackDeviate = (): UseMutationResult<TrackDeviateResult, Error, TrackDeviateBody> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TrackDeviateBody) => trackDeviate(body),
    onSuccess: (_, variables) => {
      // 관련된 주행 세션 쿼리 무효화
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tracking.session(variables.sessionId),
      });
    },
  });
};
```

### 3단계: 화면에서 사용
```tsx
import { useTrackDeviate } from "@/apis/mutations/tracking/useTrackDeviate";

export function DeviationButton({ sessionId, stationId }: { sessionId: string; stationId: string }) {
  const { mutate: reportDeviate, isPending } = useTrackDeviate();

  const handleReport = () => {
    reportDeviate({
      sessionId,
      currentStationId: stationId,
      latitude: 37.4979,
      longitude: 127.0276,
    });
  };

  return (
    <TouchableOpacity onPress={handleReport} disabled={isPending} className="bg-red-600 p-3 rounded-lg">
      <Text className="text-white text-center">{isPending ? "보고 중..." : "오탑승 신고"}</Text>
    </TouchableOpacity>
  );
}
```

---

## 🔐 4. 인증 토큰 및 보안 처리
- **헤더에 토큰을 직접 넣지 마세요!**  
  `AppProviders`의 `TokenBridge`가 사용자가 로그인하면 Clerk SDK의 세션 토큰을 `client.ts`에 자동으로 연결합니다. 모든 요청에 `Authorization: Bearer <token>` 헤더가 자동으로 주입됩니다.
- **클라이언트 식별 키**:  
  `X-Sub1S-Client-Key` 헤더 역시 `client.ts`에서 환경변수(`ENV.CLIENT_KEY`)로 자동 삽입됩니다.

---

## 🎙️ 5. 파일 업로드 (음성 인식 등)
5MB 미만의 멀티파트 폼데이터 업로드가 필요할 때는 `postMultipart` 헬퍼를 사용하세요:
```typescript
import { postMultipart } from "@/apis/client";

export const uploadVoiceAudio = async (formData: FormData, sizeBytes: number) => {
  return postMultipart<VoiceResponse>("/voice/route-recommend", formData, sizeBytes);
};
```
5MB를 초과하는 파일은 네트워크 요청을 보내기 전에 클라이언트단에서 `FILE_TOO_LARGE` `ApiError`를 발생시켜 서버 과부하를 방지합니다.
