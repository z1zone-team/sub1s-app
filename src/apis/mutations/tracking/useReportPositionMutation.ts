import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  reportPosition,
  type ReportPositionRequest,
  type ReportPositionResponse,
} from "./reportPosition";

export const useReportPositionMutation = (): UseMutationResult<
  ReportPositionResponse,
  Error,
  ReportPositionRequest
> => {
  return useMutation({ mutationFn: (body: ReportPositionRequest) => reportPosition(body) });
};
