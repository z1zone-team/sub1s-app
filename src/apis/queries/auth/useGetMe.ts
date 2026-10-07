import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthToken } from "@/hooks/useAuthToken";
import { getMe, type Me } from "./getMe";

/**
 * 로그인 사용자 정보 조회 React Query 훅
 * - 로그인된 상태(`isSignedIn === true`)에서만 쿼리를 실행합니다.
 * - 5분간 stale 처리하여 불필요한 네트워크 조회를 줄입니다.
 */
export const useGetMe = (): UseQueryResult<Me, Error> => {
  const { isSignedIn } = useAuthToken();

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: getMe,
    enabled: Boolean(isSignedIn),
    staleTime: 5 * 60_000,
  });
};
