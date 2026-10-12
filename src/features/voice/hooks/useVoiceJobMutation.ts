import { useEffect, useRef } from "react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { getVoiceJob, submitVoiceJob } from "@/apis/mutations/voice/voiceJobs";
import type {
  VoiceRouteRecommendRequest,
  VoiceRouteRecommendResponseDto,
} from "@/apis/mutations/voice/recommendVoiceRoute";
import { subwaySocketClient, type SubwaySocket, type VoiceFailedPayload, type VoiceResultPayload } from "@/common/realtime";
import { runVoiceJob, VoiceEventChannel, type VoiceJobDeps } from "../voiceJob";

/** 소켓이 연결될 때까지 기다리는 최대 시간. 지나도 요청은 보내고 안전망 조회에 맡긴다 */
const SOCKET_CONNECT_WAIT_MS = 1_500;

function waitUntilConnected(socket: SubwaySocket, timeoutMs: number): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      socket.off("connect", done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    socket.on("connect", done);
  });
}

/**
 * 요청을 보내기 전에 소켓에 연결해 음성 이벤트를 모아 둔다. 소켓을 쓸 수 없으면 조회만으로 동작하도록
 * 빈 채널을 돌려준다
 */
async function openSocketChannel(): ReturnType<VoiceJobDeps["openChannel"]> {
  const channel = new VoiceEventChannel();
  let socket: SubwaySocket | null = null;
  let retained = false;
  const onResult = (data: VoiceResultPayload) => channel.push({ kind: "result", jobId: data.jobId, result: data.result });
  const onFailed = (data: VoiceFailedPayload) => channel.push({ kind: "failed", jobId: data.jobId, error: data.error });

  try {
    // retain은 연결을 기다리기 전에 참조 횟수를 올리므로 실패해도 해제해야 한다
    const connecting = subwaySocketClient.retain();
    retained = true;
    socket = await connecting;
    socket.on("voice_result", onResult);
    socket.on("voice_failed", onFailed);
    await waitUntilConnected(socket, SOCKET_CONNECT_WAIT_MS);
  } catch {
    // 소켓을 쓸 수 없어도 요청은 보낸다. 결과는 조회로 받는다
  }

  return {
    channel,
    close: () => {
      channel.close();
      socket?.off("voice_result", onResult);
      socket?.off("voice_failed", onFailed);
      if (retained) subwaySocketClient.release();
    },
  };
}

/**
 * 음성 경로 추천. 녹음을 큐 작업으로 보내고(`POST /voice/jobs`) WebSocket으로 결과를 받는다.
 * 이벤트를 놓치면 작업 조회가 같은 결과를 주고, 화면을 벗어나면 기다림을 멈춘다
 */
export const useVoiceJobMutation = (): UseMutationResult<
  VoiceRouteRecommendResponseDto,
  Error,
  VoiceRouteRecommendRequest
> => {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return useMutation({
    mutationFn: (params: VoiceRouteRecommendRequest) => {
      const controller = new AbortController();
      controllerRef.current = controller;
      const { signal } = controller;
      return runVoiceJob(
        {
          openChannel: openSocketChannel,
          submit: () => submitVoiceJob(params, undefined, { signal }),
          poll: (jobId) => getVoiceJob(jobId, { signal }),
        },
        { signal }
      );
    },
  });
};
