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
        backgroundColor: "#0B0F19",
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      "expo-secure-store",
    ],
    extra: {
      appEnv,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        (appEnv === "production"
          ? "https://api.sub1s.com"
          : appEnv === "staging"
          ? "https://staging-api.sub1s.com"
          : "http://10.0.2.2:3000"),
      wsUrl:
        process.env.EXPO_PUBLIC_WS_URL ||
        (appEnv === "production"
          ? "wss://api.sub1s.com/ws/subway"
          : appEnv === "staging"
          ? "wss://staging-api.sub1s.com/ws/subway"
          : "http://10.0.2.2:3000/ws/subway"),
      clerkPublishableKey:
        process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        "pk_test_placeholder_key",
      clientKey:
        process.env.EXPO_PUBLIC_CLIENT_KEY || "dev-mobile-client-key",
      eas: {
        projectId: "sub1s-mobile-project-id",
      },
    },
  };
};
