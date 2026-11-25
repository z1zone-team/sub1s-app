import { useCallback, useState } from "react";
import { useSSO } from "@clerk/expo";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { APP_SCHEME } from "@/constants/appScheme";

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = "kakao" | "google";

/** 카카오는 Clerk 기본 제공자가 아니라 대시보드에서 키를 "kakao"로 만든 사용자 지정 OIDC 제공자다 */
const STRATEGY = { kakao: "oauth_custom_kakao", google: "oauth_google" } as const;

export function useSocialSignIn() {
  const { startSSOFlow } = useSSO();
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(
    async (provider: SocialProvider) => {
      if (pending) return;
      setPending(provider);
      setError(null);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy: STRATEGY[provider],
          redirectUrl: makeRedirectUri({ scheme: APP_SCHEME, path: "sso-callback" }),
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch (err) {
        const detail = (err as { errors?: Array<{ code?: string; longMessage?: string }> })?.errors?.[0];
        console.warn("[social-signin]", provider, detail?.code ?? "", detail?.longMessage ?? (err instanceof Error ? err.message : String(err)));
        setError("로그인하지 못했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        setPending(null);
      }
    },
    [pending, startSSOFlow]
  );

  return { signIn, pending, error };
}
