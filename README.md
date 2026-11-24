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
│   ├── auth/                # Clerk 인증 동기화와 소셜 로그인(인증 상태의 기준은 Clerk, 토큰 주입은 `AppProviders`의 브리지)
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
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Expo 푸시 토큰을 받는 EAS 프로젝트 ID(UUID) | `app.config.ts`의 기본 Sub1S 프로젝트 ID 사용. 설정값이 유효한 UUID가 아니면 등록 생략 |
| `EXPO_PUBLIC_CLIENT_KEY` | 서버로 보내는 클라이언트 식별 헤더 | 개발용 기본값 |

---

## 📱 기기에서 실행

- **서버 주소**: 안드로이드 에뮬레이터는 기본값(`10.0.2.2`)으로 호스트 PC의 서버에 닿습니다. 실기기는 PC의 같은 네트워크 주소(`http://192.168.x.x:3000`)나 운영 주소를 `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WS_URL`로 지정합니다.
- **빌드**: 로그인(Clerk 소셜 로그인 리다이렉트 `sub1s://`), 푸시 토큰, 마이크, 위치를 쓰므로 **개발 빌드**(`npx expo run:android` 또는 EAS 개발 빌드)를 권장합니다. 네이티브 권한 문구(위치, 마이크)는 `app.config.ts`의 플러그인에 있어 바꾸면 다시 빌드해야 반영됩니다. Expo Go에서의 동작은 확인하지 않았습니다.
- **로그인 제공자**: Clerk 대시보드에서 Google과 카카오(키가 `kakao`인 사용자 지정 OIDC 제공자)를 켜야 합니다.
- **Android 푸시**: Firebase에 현재 패키지명을 등록하고 Android 앱 설정을 `google-services.local.json`로 둡니다. 개발용 패키지는 `com.z1zone.sub1s.local`, 운영용은 `com.z1zone.sub1s`입니다. 같은 Firebase 프로젝트여도 두 앱은 각각 등록합니다. FCM V1 서비스 계정 키는 해당 Expo 앱 식별자의 Credentials에 업로드합니다. **비공개 서비스 계정 JSON은 앱에 넣지 않습니다.** [공식 FCM 안내](https://docs.expo.dev/push-notifications/fcm-credentials/)
- **빌드 설정**: `APP_ENV`는 기본 `local`이고, 기본 Firebase 파일은 `google-services.<APP_ENV>.json`입니다. 다른 경로는 빌드 전용 `GOOGLE_SERVICES_JSON`으로 지정합니다(앱에 공개하는 `EXPO_PUBLIC_` 변수가 아님). 파일이 있으면 패키지명을 검증해 네이티브 빌드에 연결합니다. 기본 파일이 없으면 원격 푸시 설정을 생략하고, 명시한 경로가 없거나 패키지명이 다르거나 서비스 계정 키를 잘못 지정하면 오류로 중단합니다. EAS 프로필은 development→local, preview→staging, production→production을 명시합니다. 로컬 파일은 git에서 제외하므로 다른 PC·클라우드 빌드에서는 해당 파일을 별도로 준비해야 합니다(EAS 파일 환경변수를 쓸 때도 경로 변수는 `GOOGLE_SERVICES_JSON`).
- **재빌드와 검증**: 공식 `expo-notifications` 플러그인의 Android 설정을 적용합니다. iOS 원격 푸시 제외 결정을 유지해 기존 iOS mod는 보존하고 APNs 권한은 추가하지 않습니다. Android에서 `expo prebuild --platform android` 후 개발 APK를 재빌드해야 하며, 앱 로그인·알림 권한 허용 후 토큰 등록과 실제 수신을 검증합니다. 이 설정만으로 수신 검증이 완료된 것은 아닙니다.
- **발송 인증**: 서버 `EXPO_ACCESS_TOKEN`은 Expo의 강화 푸시 보안을 켰을 때 필요합니다. 비어 있다는 사실만으로 발송 불가로 판단하지 않습니다. [Expo 발송 보안](https://docs.expo.dev/push-notifications/sending-notifications/#additional-security)

---

## 🤖 안드로이드 에뮬레이터와 adb

실기기가 없을 때와 화면, 위치, 서버 연동을 반복해서 확인할 때 쓰는 설정입니다. 아래 값과 명령은 이 프로젝트에서 실제로 쓴 것입니다(Windows 기준, Git Bash나 PowerShell).

### 1. 준비

- **Android Studio**를 설치하면 SDK, `platform-tools`(adb), `emulator`가 함께 들어옵니다. 기본 위치는 `%LOCALAPPDATA%\Android\Sdk`입니다.
- **PATH**에 `%LOCALAPPDATA%\Android\Sdk\platform-tools`를 넣으면 어디서든 `adb`를 쓸 수 있습니다. `emulator`는 같은 SDK의 `emulator\emulator.exe`입니다.
- **JDK 21**: 네이티브 빌드(`expo run:android`, gradle)는 Android Studio에 들어 있는 JDK 21을 `JAVA_HOME`으로 지정합니다. PATH의 다른 Java(JDK 8 등)는 쓰지 않습니다.
- **하드웨어 가속**: x86_64 에뮬레이터는 PC의 가상화(Windows 하이퍼바이저 플랫폼 등)가 켜져 있어야 빠르게 돌아갑니다.

### 2. AVD 만들기 (Android Studio > Device Manager > Create Virtual Device)

| 항목 | 값 |
| :--- | :--- |
| 이름 | `sub1s-dev` |
| 기기 | Pixel 5 (1080 x 2340, 440dpi) |
| 시스템 이미지 | API 36(Android 16), **Google Play**, **x86_64** |
| RAM | 4096 MB (Show Advanced Settings에서 지정) |
| 내부 저장소 | 6 GB |
| CPU 코어 / GPU | 4 / Automatic |
| 키보드 | 하드웨어 키보드 입력 켬(PC 키보드로 입력) |

- 저장 위치를 바꾸려면 환경 변수 `ANDROID_AVD_HOME`을 지정하거나 `%USERPROFILE%\.android\avd\<이름>.ini`의 `path`를 수정합니다(이 프로젝트의 AVD는 `D:\android-avd\sub1s-dev.avd`에 있습니다).
- 실행은 Device Manager의 ▶ 버튼이나 아래 명령입니다.

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd sub1s-dev -no-snapshot-load -gpu auto
adb devices   # emulator-5554 device 가 보이면 준비 끝
```

- **한글 입력**: 설정 > 시스템 > 언어 및 입력 > 화상 키보드 > Gboard > 언어에서 `한국어(두벌식)`를 추가합니다. `adb shell input text`는 영문과 숫자만 되고 한글은 입력되지 않습니다.

### 3. 앱 설치와 실행

- 패키지 이름은 `com.z1zone.sub1s.<APP_ENV>`이고 `APP_ENV`를 지정하지 않으면 `local`이라 **`com.z1zone.sub1s.local`**입니다(앱 이름 `Sub1S (Dev)`).
- 이 앱은 네이티브 기능을 써서 Expo Go가 아닌 **개발 빌드**를 설치해야 합니다.

```bash
pnpm install
npx expo run:android          # 에뮬레이터나 연결된 기기에 개발 빌드를 설치하고 Metro를 띄움
pnpm start                    # 이미 설치돼 있다면 Metro만 다시 띄움
```

- 에뮬레이터는 서버 주소 기본값 `http://10.0.2.2:3000`(호스트 PC의 `localhost`)으로 로컬 서버에 닿습니다(위 "기기에서 실행" 참고).
- 빌드를 줄이려면 gradle에 대상 ABI만 지정합니다. 에뮬레이터는 `x86_64`, 실기기는 `arm64-v8a`입니다.

```bash
cd android && ./gradlew app:assembleDebug -PreactNativeArchitectures=x86_64      # 에뮬레이터
cd android && ./gradlew app:assembleDebug -PreactNativeArchitectures=arm64-v8a   # 실기기(약 3분)
```

- `expo prebuild`나 `expo run:android`가 `package.json`의 `android`, `ios` 스크립트와 `tsconfig.json`을 바꾸는 경우가 있으니 커밋 전에 `git diff`로 의도하지 않은 변경을 되돌립니다.

#### 운영용 앱을 같은 폰에 설치하기 (.env.prod)

`APP_ENV=production`이면 패키지 이름이 `com.z1zone.sub1s`(앱 이름 `Sub1S`)라서 dev 앱(`com.z1zone.sub1s.local`)과 **같은 폰에 함께 설치**됩니다. 운영 서버와 Clerk 운영 키(`pk_live_`)는 `.env.prod`에 있고, `.env.local`은 dev용입니다. Expo는 `.env.prod`를 자동으로 읽지 않으므로 셸 환경으로 올려서 빌드합니다. 값은 출력하지 마세요.

```bash
cd sub1s-app
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"   # JDK 21
set -a; . ./.env.prod; set +a                                    # 프로세스 환경이 .env.local보다 우선한다
export APP_ENV=production NODE_ENV=production

mv android android-local                                         # dev용 네이티브 폴더를 옮겨 둔다(/android-* 는 git 무시)
npx expo prebuild --platform android --no-install                # applicationId가 com.z1zone.sub1s 인지 확인
cd android && ./gradlew app:assembleRelease -PreactNativeArchitectures=arm64-v8a
adb -s <시리얼> install -r app/build/outputs/apk/release/app-release.apk

cd .. && mv android android-prod && mv android-local android     # dev 빌드 환경으로 되돌린다
```

- 릴리스 빌드는 Metro 없이 단독으로 실행되고, `EXPO_PUBLIC_*` 값이 빌드할 때 번들에 들어갑니다. 값을 바꾸면 다시 빌드합니다.
- 서명은 디버그 키스토어를 씁니다(개인 설치용). 스토어 배포용이 아닙니다.
- 같은 스킴(`sub1s://`)과 초대 링크 주소를 두 앱이 함께 가져서, 링크를 열 때 어느 앱으로 열지 묻는 창이 뜰 수 있습니다.
- 빌드 약 5분(arm64, 이 PC 기준).

### 4. 실기기 연결과 adb 기본

```bash
adb devices                       # 연결된 기기 목록(에뮬레이터와 폰이 함께 보일 수 있음)
adb -s emulator-5554 shell ...    # 기기가 둘 이상이면 -s <시리얼>이 꼭 필요함("more than one device" 오류)
```

- **USB**: 개발자 옵션에서 USB 디버깅을 켜고 연결해 허용합니다.
- **무선 디버깅**(Android 11 이상): 개발자 옵션 > 무선 디버깅 > 페어링 코드로 기기 페어링에서 보이는 주소와 코드로 `adb pair <IP:포트>`, 이어서 `adb connect <IP:포트>`를 실행합니다.
- **서버와 Metro 연결**: 폰은 PC의 `localhost`에 닿지 않으므로 포트를 넘겨 줍니다.

```bash
adb reverse tcp:3000 tcp:3000    # 서버
adb reverse tcp:8081 tcp:8081    # Metro
# Metro를 서버 주소를 지정해 시작
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 EXPO_PUBLIC_WS_URL=http://localhost:3000/ws/subway pnpm start
```

### 5. 에뮬레이터에 위치 넣기

앱의 현재 위치(홈 지도, 음성 검색의 출발지)를 확인하려면 위치를 넣어야 합니다. **`adb emu geo fix`는 위치를 한 번만 내보내서 앱이 못 받는 경우가 많습니다**(앱은 2분 안의 마지막 위치나 2초 안의 새 위치만 씁니다). 아래 테스트 프로바이더 방식을 씁니다(Git Bash 기준).

```bash
adb shell appops set 2000 android:mock_location allow
for p in gps fused network; do
  adb shell cmd location providers remove-test-provider $p 2>/dev/null
  adb shell cmd location providers add-test-provider $p
  adb shell cmd location providers set-test-provider-enabled $p true
  adb shell cmd location providers set-test-provider-location $p --location 37.2380,127.1903 --accuracy 5
done
```

- 좌표는 위도,경도 순서입니다(예시는 명지대 자연캠퍼스 근처).
- **넣은 위치는 2분이 지나면 앱이 받지 못합니다.** 음성이나 현재 위치 확인 직전에 `set-test-provider-location`만 다시 실행하세요.
- 위치 권한은 앱에서 허용돼 있어야 합니다.

### 6. 자주 쓰는 명령

```bash
# 스크린샷
MSYS_NO_PATHCONV=1 adb shell screencap -p /sdcard/s.png && MSYS_NO_PATHCONV=1 adb pull /sdcard/s.png ./s.png

# 화면 요소와 bounds
MSYS_NO_PATHCONV=1 adb shell uiautomator dump /sdcard/u.xml && MSYS_NO_PATHCONV=1 adb pull /sdcard/u.xml ./u.xml

adb shell input tap 540 1200            # 화면 터치(좌표는 1080 x 2340 기준 픽셀)
adb shell input keyevent KEYCODE_BACK   # 뒤로 가기
adb logcat -s ReactNativeJS             # 앱 JS 로그
adb shell pm list packages | grep sub1s # 설치된 앱 확인
```

- **Git Bash에서는 `/sdcard/...` 경로가 `/Files/Git/sdcard/...`로 바뀌어 실패합니다.** `/sdcard`를 쓰는 명령(`screencap`, `uiautomator dump`, `pull`, `push`)에는 `MSYS_NO_PATHCONV=1`을 앞에 붙입니다(PowerShell과 cmd는 필요 없음).

- 440dpi라 dp는 `픽셀 / 2.75`입니다. `uiautomator dump`의 bounds를 2.75로 나누면 dp 크기를 알 수 있습니다.
- 스크린샷 이미지를 줄여서 보면 좌표가 어긋나므로 터치 좌표는 원본(1080 x 2340) 기준으로 환산합니다.

### 7. 음성 검색 확인

에뮬레이터의 마이크는 가상 입력이라 말한 내용이 STT로 인식되지 않습니다. 에뮬레이터에서 음성 흐름을 확인할 때는 서버의 `POST /voice/jobs`가 받는 텍스트 힌트(`transcriptHint`)를 씁니다. 앱의 요청 본문을 만드는 `buildVoiceFormData`에 확인할 동안만 `formData.append("transcriptHint", "문화로 67-1에서 강남역까지 가자")`를 넣고, **확인이 끝나면 지우고 커밋하지 않습니다.** 실제 음성과 STT는 실기기에서 확인합니다.

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
