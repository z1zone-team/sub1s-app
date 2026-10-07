import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  checkDeviate,
  type DeviateCheckRequest,
  type DeviateCheckResponse,
} from "./deviateCheck";

export type { DeviateCheckRequest, DeviateCheckResponse };

/**
 * 경로 이탈 및 오탑승 감지 Mutation 훅 (WebSocket Fallback)
 * POST /api/v1/routes/track/deviate
 */
export const useDeviateCheckMutation = (): UseMutationResult<
  DeviateCheckResponse,
  Error,
  DeviateCheckRequest
> => {
  return useMutation({
    mutationFn: (body: DeviateCheckRequest) => checkDeviate(body),
  });
};
