import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV || "local";

  const isProd = appEnv === "production";
  const isStaging = appEnv === "staging";

  return {
    ...config,
    name: isProd ? "Sub1S" : isStaging ? "Sub1S (Stage)" : "Sub1S (Dev)",
    slug: "sub1s-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "sub1s",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: false,
      bundleIdentifier: isProd
        ? "com.z1zone.sub1s"
        : `com.z1zone.sub1s.${appEnv}`,
    },
    android: {
      package: isProd
        ? "com.z1zone.sub1s"
        : `com.z1zone.sub1s.${appEnv}`,
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
      "@clerk/expo",
      [
        "expo-audio",
        { microphonePermission: "음성으로 목적지를 말해 경로를 찾는 데 마이크를 사용해요." },
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
