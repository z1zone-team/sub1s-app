import { get, postMultipart, type RequestOptions } from "@/apis/client";
import {
  buildVoiceFormData,
  type VoiceRouteRecommendRequest,
  type VoiceRouteRecommendResponseDto,
} from "./recommendVoiceRoute";

export interface VoiceJobSubmitResponse {
  jobId: string;
  status: "QUEUED";
}

export type VoiceJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

/** HTTP 오류 응답과 같은 코드, 메시지, 상태 */
export interface VoiceJobError {
  code: string;
  message: string;
  status: number;
}

export interface VoiceJobStatusResponse {
  jobId: string;
  status: VoiceJobStatus;
  /** `COMPLETED`일 때만 */
  result?: VoiceRouteRecommendResponseDto;
  /** `FAILED`일 때만 */
  error?: VoiceJobError;
}

/**
 * 음성 경로 추천 요청을 큐에 넣는다. 결과는 WebSocket(`voice_result`, `voice_failed`)으로 오고
 * 놓치면 `getVoiceJob`으로 조회한다.
 * POST /api/v1/voice/jobs (multipart/form-data, 202)
 */
export const submitVoiceJob = (
  params: VoiceRouteRecommendRequest,
  fileSizeBytes?: number,
  options?: RequestOptions
): Promise<VoiceJobSubmitResponse> =>
  postMultipart<VoiceJobSubmitResponse>("/voice/jobs", buildVoiceFormData(params), fileSizeBytes, options);

/** GET /api/v1/voice/jobs/:jobId. 본인 작업만 조회되고 완료 후 10분이 지나면 404 */
export const getVoiceJob = (jobId: string, options?: RequestOptions): Promise<VoiceJobStatusResponse> =>
  get<VoiceJobStatusResponse>(`/voice/jobs/${jobId}`, undefined, options);
