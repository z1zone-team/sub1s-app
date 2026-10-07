# Sub1S 모바일 애플리케이션 (sub1s-app)

> **Subway in 1 Second (1초 지하철 네비게이션)** - React Native (Expo SDK 57 Managed Workflow) 기반 실시간 혼잡도 및 초단위 지하철 내비게이션 모바일 앱

---

## 🛠 기술 스택

- **Framework**: Expo SDK 57 (React Native 0.86, React 19)
- **Styling**: NativeWind v4 (Tailwind CSS 3.4)
- **Navigation**: React Navigation v7 (Native Stack, Bottom Tabs, Deep Linking `sub1s://`)
- **Server State**: TanStack React Query v5 (순수 fetch 함수 + 커스텀 훅 1:1 매핑)
- **Global / Realtime State**: Zustand v5 (칸 단위 셀렉터 분리 구독)
- **HTTP Client**: Axios with Clerk Auth Interceptor & AbortSignal 지원
- **Realtime / Socket**: Socket.io Client (`/ws/subway` 네임스페이스, 지수 백오프 자동 재연결)
- **Notifications & Haptics**: Expo Notifications v57, Expo Haptics
- **Device Capabilities**: Expo Location, Expo AV (오디오 녹음/재생), NetInfo
- **Storage**: Expo SecureStore (민감 토큰) + AsyncStorage (일반 데이터)

---

## 📂 프로젝트 구조

```text
src/
├── apis/                    # 중앙화된 서버 API 통신 계층
│   ├── client.ts            # Axios 인스턴스, Clerk TokenBridge 연동, ApiError 처리
│   ├── queries/             # 조회(GET) 전용 순수 fetcher + useQuery 훅
│   ├── mutations/           # 생성/수정/삭제 전용 순수 fetcher + useMutation 훅
│   └── README.md            # API 작성 컨벤션 및 예시 가이드
├── common/                  # 도메인 비의존적 공통 인프라 모듈
│   ├── api/                 # API 클라이언트 및 타입 re-export
│   ├── auth/                # Clerk 인증 동기화, AuthGate, 목 인증 스토어
│   ├── components/          # ErrorBoundary 등 글로벌 공통 컴포넌트
│   ├── device/              # 위치(GPS), 오디오(녹음/재생/업로드), 네트워크 모니터링
│   ├── logging/             # Authorization/토큰 자동 마스킹 로거
│   ├── notifications/       # Android 4개 채널, 하차/환승/오탑승 스케줄러, 푸시 토큰
│   ├── realtime/            # Socket.io 클라이언트, 실시간 혼잡도 스트림 스토어, REST 폴백
│   ├── storage/             # SecureStore + AsyncStorage 통합 어댑터, 최근 검색 경로
│   ├── store/               # 글로벌 토스트(toast-store) 등 UI 상태
│   ├── utils/               # 시간 포맷(KST), 에러 파싱
│   └── widget/              # 홈 화면 위젯 스냅샷 공유 및 딥링크 규약
├── constants/               # 환경 변수(Zod 검증), QueryKey 팩토리
├── features/                # 6대 핵심 비즈니스 도메인 폴더 (UI 및 타입)
│   ├── routing/             # 경로 탐색
│   ├── congestion/          # 실시간 혼잡도
│   ├── navigation/          # 실시간 주행 안내 및 오탑승 감지
│   ├── voice/               # 음성 쿼리 및 AI 브리핑
│   ├── ranking/             # 이동거리 리더보드
│   └── profile/             # 이동 타임라인 및 통계
├── navigation/              # 루트/탭 네비게이터 및 딥링크 매핑
└── screens/                 # 네비게이션에 마운트되는 스크린 컴포넌트
```

---

## 🚀 빠른 시작

### 1. 패키지 설치
> **주의**: 본 프로젝트는 반드시 `pnpm`을 사용합니다.
```bash
pnpm install
```

### 2. 타입 검증 및 단위 테스트 실행
```bash
pnpm run typecheck
pnpm test
```

### 3. 개발 서버 구동
```bash
pnpm start
```

---

## 📖 모듈 사용 가이드 (팀원을 위한 치트시트)

자세한 코드 스니펫 및 훅 시그니처는 [`docs/MOBILE_MODULE_GUIDE.md`](../docs/MOBILE_MODULE_GUIDE.md)를 참고하세요.

### 1. API 호출 (TanStack Query)
```typescript
import { useGetMe } from "@/apis/queries/auth/useGetMe";

function ProfileHeader() {
  const { data: user, isLoading } = useGetMe();
  if (isLoading) return <Text>로딩 중...</Text>;
  return <Text>{user?.nickname}님 환영합니다</Text>;
}
```

### 2. 실시간 열차 혼잡도 (30초 스트림 & 칸 단위 렌더링 최적화)
```typescript
import { useRealtimeSubscription, useCarCongestion } from "@/common/realtime";

// 열차 룸 구독
useRealtimeSubscription({ lineId: "02", trainId: "2145" });

// 특정 칸의 혼잡도만 구독 (전체 화면 리렌더링 방지)
function CarBar({ carNo }: { carNo: number }) {
  const car = useCarCongestion(carNo);
  return <Text>{carNo}번 칸 혼잡도: {car?.congestion}%</Text>;
}
```

### 3. 하차 / 환승 1개 역 전 로컬 알림 & 진동
```typescript
import { scheduleStationAlert, triggerOffRouteAlert } from "@/common/notifications";

// 환승 1개 역 전 알림 예약 (60초 뒤)
await scheduleStationAlert({
  type: "TRANSFER",
  stationName: "신도림",
  lineName: "2호선",
  secondsFromNow: 60,
});

// 오탑승 감지 시 즉시 긴급 알림 및 강한 진동
await triggerOffRouteAlert("영등포");
```

### 4. 음성 녹음 및 AI 경로 추천 업로드
```typescript
import { useAudioRecorder, uploadVoiceRouteRecommend, useAudioPlayer } from "@/common/device";

const { startRecording, stopRecording } = useAudioRecorder();
const { playAudio } = useAudioPlayer();

async function handleVoiceSearch() {
  const result = await stopRecording();
  if (result?.uri) {
    const aiResponse = await uploadVoiceRouteRecommend(result.uri);
    console.log("추천 경로:", aiResponse.recommendedRoute);
    if (aiResponse.audioTtsUrl) {
      await playAudio(aiResponse.audioTtsUrl);
    }
  }
}
```

### 5. 최근 검색 경로 저장 및 위젯 데이터 갱신
```typescript
import { useRecentRoutes } from "@/common/storage";
import { saveWidgetSnapshot } from "@/common/widget";

const { routes, addRoute } = useRecentRoutes();

// 최근 경로 추가
await addRoute({ origin: "신도림", destination: "강남" });

// 위젯 스냅샷 동기화
await saveWidgetSnapshot({
  nextTrain: { line: "2호선", stationName: "신도림", remainingSec: 120, direction: "문래 방면" },
  recentRoutes: [{ origin: "신도림", destination: "강남" }],
  updatedAt: new Date().toISOString(),
});
```
