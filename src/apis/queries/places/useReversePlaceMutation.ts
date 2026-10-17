import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { reversePlace, type ReversePlaceItem, type ReversePlaceParams } from "./reversePlace";

/** 눌러서 고른 좌표마다 한 번 부르는 조회라 캐시하지 않는다 */
export const useReversePlaceMutation = (): UseMutationResult<ReversePlaceItem, Error, ReversePlaceParams> =>
  useMutation({ mutationFn: (params: ReversePlaceParams) => reversePlace(params) });
