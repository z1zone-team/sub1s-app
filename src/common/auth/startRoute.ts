export type StartRoute = "LOADING" | "LOGIN" | "MAIN";

interface StartRouteInput {
  authLoaded: boolean;
  signedIn: boolean;
  /** 둘러보기 선택을 기기에서 읽어 왔는지 */
  guestLoaded: boolean;
  guestChosen: boolean;
}

/** 앱을 열었을 때 처음 보여 줄 화면. 로그인했거나 둘러보기를 골랐으면 홈이다 */
export function resolveStartRoute({
  authLoaded,
  signedIn,
  guestLoaded,
  guestChosen,
}: StartRouteInput): StartRoute {
  if (!authLoaded || !guestLoaded) return "LOADING";
  return signedIn || guestChosen ? "MAIN" : "LOGIN";
}
