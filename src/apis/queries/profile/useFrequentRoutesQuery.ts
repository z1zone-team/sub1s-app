import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthToken } from "@/hooks/useAuthToken";
import { getFrequentRoutes, type FrequentRoutesResponseDto } from "./getFrequentRoutes";

/** 홈 경로 칩에 쓰는 자주 다닌 경로. 로그인했을 때만 부른다 */
export const useFrequentRoutesQuery = (): UseQueryResult<FrequentRoutesResponseDto, Error> => {
  const { isSignedIn } = useAuthToken();

  return useQuery({
    queryKey: queryKeys.profile.frequentRoutes(),
    queryFn: ({ signal }) => getFrequentRoutes({}, { signal }),
    enabled: Boolean(isSignedIn),
    staleTime: 10 * 60_000,
  });
};
