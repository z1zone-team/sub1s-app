# 🚇 Sub1S 프론트엔드 API 연동 가이드

이 문서는 백엔드 API 연동 및 화면 개발을 담당하는 팀원을 위한 실무 가이드입니다.  
화면(UI)에는 최대한 UI 렌더링 로직만 남기고, 서버 통신 및 캐시 관리는 **순수 API 함수 + React Query 커스텀 훅 1:1 쌍**으로 분리합니다.

---

## 📁 1. 디렉터리 구조 및 네이밍 규칙

모든 API 통신은 `src/apis/` 디렉터리에 모여 있습니다:

```text
src/apis/
├── client.ts                 # Base HTTP 클라이언트 (토큰 자동주입, 에러 처리, get/getPaged/post/put/patch/del/postMultipart)
├── retry.ts                  # 재시도 정책
├── index.ts                  # 화면에서 쓰는 함수와 훅을 다시 내보냄 (`@/apis`)
├── queries/                  # [조회성 API] GET 요청. 같은 입력이면 결과를 재사용할 조회는 POST여도 여기에 둔다(경로 검색 `useRouteSearchQuery`)
│   ├── auth/                 # ✅ 기준 모범 예제 (getMe.ts, useGetMe.ts)
│   ├── routing/              # 경로 탐색
│   ├── places/               # 역·장소 검색, 좌표의 주소 조회
│   ├── stations/             # 역 정보, 다음 열차, 편의시설
│   ├── trains/               # 호선의 열차 위치
│   ├── congestion/           # 칸별 혼잡도
│   ├── tracking/             # 주행 세션 조회
│   ├── ranking/              # 랭킹 리더보드, 랭킹에서 고른 사용자의 이동 기록
│   ├── profile/              # 프로필 통계, 타임라인, 노선도
│   └── users/                # 설문, 집·학교, 즐겨찾기 경로, 친구, 알림 설정 (조회와 저장 훅을 함께 둔다)
└── mutations/                # [변경성 API] POST / PUT / PATCH / DELETE 요청
    ├── tracking/             # 안내 시작, 위치 보고, 이탈 확인
    ├── travel/               # 이동 완료 기록
    ├── users/                # 프로필, 설문 수정
    ├── voice/                # 음성 작업 제출과 조회 (voiceJobs.ts)
    └── notifications/        # 푸시 토큰 등록
```

- 호출 함수(`getMe.ts`)와 훅(`useGetMe.ts`)을 1:1로 둔다. 쿼리 키는 `src/constants/queryKeys.ts`의 팩토리에 등록한다.
- 타입은 서버 계약(sub1s-docs `API_SPEC.md`)을 그대로 옮긴다.

---

## 🚀 2. 새 Query(조회 API) 추가하는 법

실제 코드 `queries/auth/`를 예로 든다.

### 1단계: 순수 API 함수 작성 (`queries/auth/getMe.ts`)
```typescript
import { get } from "@/apis/client";

export interface Me {
  id: string;
  nickname: string;
  // ... API_SPEC.md의 UserProfileResponseDto
}

export const getMe = (): Promise<Me> => {
  return get<Me>("/auth/me");
};
```

### 2단계: 쿼리 키 등록 (`constants/queryKeys.ts`)
```typescript
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  // ...
};
```

### 3단계: React Query 훅 작성 (`queries/auth/useGetMe.ts`)
```typescript
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthToken } from "@/hooks/useAuthToken";
import { getMe, type Me } from "./getMe";

export const useGetMe = (): UseQueryResult<Me, Error> => {
  const { isSignedIn } = useAuthToken();
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: getMe,
    enabled: Boolean(isSignedIn),
    staleTime: 5 * 60_000,
  });
};
```

### 4단계: 화면에서 사용
```tsx
import { useGetMe } from "@/apis";

export function ProfileHeader() {
  const { data: me, isLoading, isError, error } = useGetMe();
  if (isLoading) return <ActivityIndicator />;
  if (isError) return <Text className="text-red-500">{error.message}</Text>;
  return <Text>{me?.nickname}님</Text>;
}
```

---

## ⚡ 3. 새 Mutation(변경 API) 추가하는 법

실제 코드 `mutations/users/`의 프로필 수정을 예로 든다.

### 1단계: 순수 API 함수 작성 (`mutations/users/updateProfile.ts`)
```typescript
import { patch, type RequestOptions } from "@/apis/client";

export interface UpdateProfileRequest {
  name?: string | null;
  nickname?: string;
  rankingVisibility?: "PUBLIC" | "ANONYMOUS" | "PRIVATE";
}

export const updateProfile = (body: UpdateProfileRequest, options?: RequestOptions): Promise<MyProfile> => {
  return patch<MyProfile>("/users/me", body, options);
};
```

### 2단계: React Query 훅 작성 (`mutations/users/useUpdateProfileMutation.ts`)
```typescript
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { updateProfile, type MyProfile, type UpdateProfileRequest } from "./updateProfile";

export const useUpdateProfileMutation = (): UseMutationResult<MyProfile, Error, UpdateProfileRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => updateProfile(body),
    onSuccess: () => {
      // 프로필이 바뀌면 내 정보와 랭킹 표시를 다시 불러온다
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.ranking.all });
    },
  });
};
```

### 3단계: 화면에서 사용
```tsx
const { mutate: save, isPending } = useUpdateProfileMutation();
save({ nickname: "새닉네임" });
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
실제 사용처는 음성 작업 제출이다(`mutations/voice/voiceJobs.ts`). 결과는 바로 오지 않고 소켓 `voice_result`로 오며, 놓치면 `getVoiceJob`으로 조회한다.
```typescript
import { postMultipart } from "@/apis/client";
import { buildVoiceFormData } from "./voiceRouteTypes";

export const submitVoiceJob = (params: VoiceRouteRecommendRequest, fileSizeBytes?: number, options?: RequestOptions) =>
  postMultipart<VoiceJobSubmitResponse>("/voice/jobs", buildVoiceFormData(params), fileSizeBytes, options);
```
5MB를 초과하는 파일은 네트워크 요청을 보내기 전에 클라이언트단에서 `FILE_TOO_LARGE` `ApiError`를 발생시켜 서버 과부하를 방지합니다.
