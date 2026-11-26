import { ExpoConfig, ConfigContext } from "expo/config";
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV || "local";

  const isProd = appEnv === "production";
  const isStaging = appEnv === "staging";
  const androidPackage = isProd ? "com.z1zone.sub1s" : `com.z1zone.sub1s.${appEnv}`;
  const firebaseFile = process.env.GOOGLE_SERVICES_JSON || `./google-services.${appEnv}.json`;
  let googleServicesFile: string | undefined;
  if (existsSync(resolve(projectRoot, firebaseFile))) {
    let firebase;
    try {
      firebase = JSON.parse(readFileSync(resolve(projectRoot, firebaseFile), "utf8"));
    } catch {
      throw new Error("Firebase 앱 설정 파일을 읽을 수 없습니다. JSON 형식과 파일 접근 권한을 확인하세요.");
    }
    if (!firebase || typeof firebase !== "object") throw new Error("Firebase Android 앱 설정 JSON이 아닙니다.");
    if (firebase.type === "service_account" || "private_key" in firebase) {
      throw new Error("GOOGLE_SERVICES_JSON에는 비공개 서비스 계정 키 대신 Android 앱 설정 파일을 지정하세요.");
    }
    const matchesPackage = firebase.client?.some(
      (client: { client_info?: { android_client_info?: { package_name?: string } } }) =>
        client.client_info?.android_client_info?.package_name === androidPackage
    );
    if (!matchesPackage) throw new Error("Firebase 앱 설정의 Android 패키지명이 현재 APP_ENV와 맞지 않습니다.");
    googleServicesFile = firebaseFile;
  } else if (process.env.GOOGLE_SERVICES_JSON) {
    throw new Error("GOOGLE_SERVICES_JSON 경로에 Android 앱 설정 파일이 없습니다.");
  }

  return {
    ...config,
    name: isProd ? "Sub1S" : isStaging ? "Sub1S (Stage)" : "Sub1S (Dev)",
    slug: "sub1s-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: isProd ? "sub1s" : `sub1s-${appEnv}`,
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: false,
      bundleIdentifier: isProd
        ? "com.z1zone.sub1s"
        : `com.z1zone.sub1s.${appEnv}`,
    },
    android: {
      package: androidPackage,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
        backgroundColor: "#002967",
      },
      predictiveBackGestureEnabled: false,
      // 안드로이드 12 이상에서 이 권한이 없으면 expo-sensors가 센서를 초당 5번(200ms)으로만 읽는다. 일반 권한이라 허용 팝업은 뜨지 않는다
      permissions: ["android.permission.HIGH_SAMPLING_RATE_SENSORS"],
      // 초대 링크만 처리한다. 도메인에 assetlinks.json 배포 후 앱 재빌드가 필요하다.
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "sub1s.devnoco.com",
              pathPrefix: "/invite/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    plugins: [
      // 앱이 켜질 때 안드로이드·iOS가 먼저 띄우는 시작 화면. 이어서 나오는 앱 스플래시(SplashScreen)와 같은 남색 바탕에 흰 로고
      [
        "expo-splash-screen",
        {
          backgroundColor: "#002968",
          image: "./assets/splash/splash-logo.png",
          imageWidth: 272,
          resizeMode: "contain",
          dark: { backgroundColor: "#002968", image: "./assets/splash/splash-logo.png" },
        },
      ],
      "expo-secure-store",
      // iOS 원격 푸시는 제외한다. 공식 알림 플러그인의 Android 설정만 적용한다.
      ["./plugins/withAndroidNotifications", { defaultChannel: "subway-settlement" }],
      "@clerk/expo",
      [
        "expo-audio",
        { microphonePermission: "음성으로 목적지를 말해 경로를 찾는 데 마이크를 사용해요." },
      ],
      [
        // 기기 음성 인식(Android SpeechRecognizer, iOS Speech). 안 되면 녹음 파일을 서버에 올린다
        "expo-speech-recognition",
        {
          microphonePermission: "음성으로 목적지를 말해 경로를 찾는 데 마이크를 사용해요.",
          speechRecognitionPermission: "말씀하신 목적지를 기기에서 받아 적는 데 음성 인식을 사용해요.",
          androidSpeechServicePackages: ["com.google.android.googlequicksearchbox"],
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "안내 중에 가까운 지하철역을 찾아 현재 위치를 보정하는 데 사용해요.",
          // 안내 중 앱이 백그라운드여도 위치를 받는다. 상단 알림이 보이는 포그라운드 서비스로만 받아서 "항상 허용" 권한은 필요 없다
          isAndroidForegroundServiceEnabled: true,
        },
      ],
    ],
    extra: {
      appEnv,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        (appEnv === "production"
          ? "https://sub1s.devnoco.com"
          : appEnv === "staging"
          ? "https://staging-api.sub1s.com"
          : "http://10.0.2.2:3000"),
      wsUrl:
        process.env.EXPO_PUBLIC_WS_URL ||
        (appEnv === "production"
          ? "wss://sub1s.devnoco.com/ws/subway"
          : appEnv === "staging"
          ? "wss://staging-api.sub1s.com/ws/subway"
          : "http://10.0.2.2:3000/ws/subway"),
      clerkPublishableKey:
        process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        "pk_test_placeholder_key",
      vworldKey: process.env.EXPO_PUBLIC_VWORLD_KEY || "",
      vworldReferer: process.env.EXPO_PUBLIC_VWORLD_REFERER || "",
      clientKey:
        process.env.EXPO_PUBLIC_CLIENT_KEY || "dev-mobile-client-key",
      eas: {
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "3e349269-0c5c-4ac9-a7cf-bcd284499497",
      },
    },
  };
};
