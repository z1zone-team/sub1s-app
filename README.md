# Sub1S 모바일 애플리케이션 (sub1s-app)

> **Subway in 1 Second (1초 지하철 네비게이션)** - React Native (Expo SDK 57 Managed Workflow) 기반 실시간 혼잡도 및 초단위 지하철 내비게이션 모바일 앱

---

## 🛠 기술 스택

- **Framework**: Expo SDK 57 (React Native 0.86, React 19)
- **Styling**: NativeWind v4 (Tailwind CSS 3.4). `className`과 디자인 토큰(`tailwind.config.js`, 색은 `global.css`)을 쓰고 인라인 `style`은 값이 동적인 곳에만 쓴다. 클래스는 `cn`(`src/lib/cn.ts`)으로 합친다
- **Navigation**: React Navigation v7 (Native Stack, Bottom Tabs, Deep Linking `sub1s://`)
- **Server State**: TanStack React Query v5 (순수 fetch 함수 + 커스텀 훅 1:1 매핑)
- **Global / Realtime State**: Zustand v5 (칸 단위 셀렉터 분리 구독)
- **HTTP Client**: Axios with Clerk Auth Interceptor & AbortSignal 지원
- **Realtime / Socket**: Socket.io Client (주소에 `/ws/subway` 네임스페이스를 넣고 엔진 경로 `path`는 주지 않는다, 자동 재연결)
- **Map**: V-World 지도를 `react-native-webview` 안에서 Leaflet으로 그림
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

## ⚙️ 환경 변수

앱이 읽는 값은 모두 `EXPO_PUBLIC_` 접두사입니다. `.env`에 두거나 실행할 때 지정합니다. **이 값들은 앱 번들에 들어가 누구나 볼 수 있으므로 비밀 키를 넣지 않습니다**(서버 전용 키는 서버에만 둡니다).

| 변수 | 용도 | 없을 때 |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_BASE_URL` | REST 서버 주소(`/api/v1`은 앱이 붙임). 운영은 `https://sub1s.devnoco.com` | 로컬 기본값 `http://10.0.2.2:3000`(안드로이드 에뮬레이터에서 호스트 PC) |
| `EXPO_PUBLIC_WS_URL` | 소켓 주소. 운영은 `wss://sub1s.devnoco.com/ws/subway` | 로컬 기본값 `http://10.0.2.2:3000/ws/subway` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 로그인 공개 키 | 자리표시 값이라 **로그인이 되지 않음** |
| `EXPO_PUBLIC_VWORLD_KEY` | V-World 지도 키(도메인 제한이 걸린 지도 전용 키) | 지도 대신 안내 문구가 보임 |
| `EXPO_PUBLIC_VWORLD_REFERER` | 위 키에 등록한 도메인. 지도 요청의 Referer로 보냄 | 키의 도메인 제한에 걸려 타일이 안 뜰 수 있음 |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Expo 푸시 토큰을 받는 EAS 프로젝트 ID(UUID) | 푸시 등록을 건너뜀(나머지 기능은 정상) |
| `EXPO_PUBLIC_CLIENT_KEY` | 서버로 보내는 클라이언트 식별 헤더 | 개발용 기본값 |

---

## 📱 기기에서 실행

- **서버 주소**: 안드로이드 에뮬레이터는 기본값(`10.0.2.2`)으로 호스트 PC의 서버에 닿습니다. 실기기는 PC의 같은 네트워크 주소(`http://192.168.x.x:3000`)나 운영 주소를 `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WS_URL`로 지정합니다.
- **빌드**: 로그인(Clerk 소셜 로그인 리다이렉트 `sub1s://`), 푸시 토큰, 마이크, 위치를 쓰므로 **개발 빌드**(`npx expo run:android` 또는 EAS 개발 빌드)를 권장합니다. 네이티브 권한 문구(위치, 마이크)는 `app.config.ts`의 플러그인에 있어 바꾸면 다시 빌드해야 반영됩니다. Expo Go에서의 동작은 확인하지 않았습니다.
- **로그인 제공자**: Clerk 대시보드에서 Google과 카카오(키가 `kakao`인 사용자 지정 OIDC 제공자)를 켜야 합니다.
- **푸시**: Android는 FCM, iOS는 APNs 키를 EAS에 등록하고 서버에 `EXPO_ACCESS_TOKEN`이 있어야 도착합니다.

---

## 🧭 화면과 서버 의존

| 화면 | 서버 API | 비고 |
| :--- | :--- | :--- |
| 홈, 검색, 경로 목록과 상세 | 장소 검색, 경로 탐색, 다음 열차, 편의시설 | 비로그인으로도 사용 |
| 안내 시작, 안내 중, 이탈, 도착, 홈 복귀 | 주행 추적, 위치 보고(좌표), 이동 기록 | 로그인 필요 |
| 로그인, 온보딩 설문, MY, 프로필 수정, 친구, 알림 설정 | 인증 동기화, 프로필, 설문, 친구, 알림 | 로그인 필요 |
| 타임라인, 이동 지도, 랭킹 | 통계, 이동 기록, 노선도(좌표), 랭킹 | 로그인 필요, 지도는 V-World 키 필요 |
| 음성 검색 | 음성 경로 추천 | 로그인 필요, 서버의 AI 서비스 연결이 있어야 실제 인식 |
| 집, 학교 즐겨찾기 | 장소 저장 | 로그인 필요 |

화면은 모두 타입 검사, 단위 테스트, 번들링까지만 확인했고 **실기기에서 눈으로 확인한 것은 아직 없습니다**.

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
> 소켓은 아직 화면에서 쓰지 않습니다. 경로 상세의 칸별 혼잡도는 경로 응답의 `cars`를 쓰고, 안내 중 위치 보고는 REST입니다.
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
