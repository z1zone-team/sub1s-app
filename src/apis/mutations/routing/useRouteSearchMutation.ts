import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  searchRoutes,
  type RouteSearchRequest,
  type RouteSearchResult,
} from "@/apis/queries/routing/searchRoutes";

/**
 * 경로 탐색 버튼 클릭 시 수동 실행하는 Mutation 훅
 */
export const useRouteSearchMutation = (): UseMutationResult<
  RouteSearchResult,
  Error,
  RouteSearchRequest
> => {
  return useMutation({
    mutationFn: (params: RouteSearchRequest) => searchRoutes(params),
  });
};
