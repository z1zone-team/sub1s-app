import Constants from "expo-constants";

const scheme = Constants.expoConfig?.scheme;

/** app.config.ts에 등록된 현재 빌드의 앱 주소 */
export const APP_SCHEME = typeof scheme === "string" ? scheme : "sub1s-local";
