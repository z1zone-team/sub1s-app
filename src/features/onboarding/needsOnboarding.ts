import type { Preferences } from "@/apis/queries/users/getPreferences";

interface NeedsOnboardingInput {
  signedIn: boolean;
  preferences: Preferences | undefined;
  /** 이 기기에서 건너뛴 기록을 읽어 왔는지 */
  skipLoaded: boolean;
  skipped: boolean;
}

/** 로그인했고 설문 답이 없으며 건너뛴 적이 없을 때만 설문을 보여 준다. 확인이 끝나기 전에는 보여 주지 않는다 */
export function needsOnboarding({
  signedIn,
  preferences,
  skipLoaded,
  skipped,
}: NeedsOnboardingInput): boolean {
  if (!signedIn || !skipLoaded || skipped || !preferences) return false;
  return preferences.purposes.length === 0 && preferences.routePrefs.length === 0;
}
