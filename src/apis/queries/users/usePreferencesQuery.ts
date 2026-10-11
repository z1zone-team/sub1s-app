import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { getPreferences, type Preferences } from "./getPreferences";

/** 로그인하지 않았으면 조회하지 않는다 */
export const usePreferencesQuery = (enabled: boolean): UseQueryResult<Preferences, Error> => {
  return useQuery({
    queryKey: queryKeys.users.preferences(),
    queryFn: ({ signal }) => getPreferences({ signal }),
    enabled,
    staleTime: 5 * 60_000,
  });
};
