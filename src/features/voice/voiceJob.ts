import type { VoiceJobError, VoiceJobStatusResponse } from "@/apis/mutations/voice/voiceJobs";
import type { VoiceRouteRecommendResponseDto } from "@/apis/mutations/voice/recommendVoiceRoute";

/** 이 시간 안에 결과가 없으면 실패로 본다. 서버 작업 제한(35초)과 AI 전사 대기(25초)보다 넉넉하게 둔다 */
export const VOICE_JOB_TIMEOUT_MS = 60_000;
/** 소켓 이벤트를 놓쳤을 때를 위한 안전망 조회. 처음 조회까지 기다리는 시간과 이후 간격 */
export const VOICE_JOB_FIRST_POLL_MS = 3_000;
export const VOICE_JOB_POLL_INTERVAL_MS = 2_500;

/** 서버가 알려 준 작업 실패(HTTP 오류와 같은 코드, 상태) 또는 이쪽에서 기다리다 포기한 실패 */
export class VoiceJobFailedError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(error: VoiceJobError) {
    super(error.message);
    this.name = "VoiceJobFailedError";
    this.code = error.code;
    this.status = error.status;
  }
}

export class VoiceJobAbortedError extends Error {
  constructor() {
    super("voice job aborted");
    this.name = "VoiceJobAbortedError";
  }
}

export type VoiceJobEvent =
  | { kind: "result"; jobId: string; result: VoiceRouteRecommendResponseDto }
  | { kind: "failed"; jobId: string; error: VoiceJobError };

/**
 * 소켓에서 온 음성 이벤트를 모아 두는 곳. 요청을 보내기 **전에** 만들어 두면
 * 응답(`jobId`)보다 이벤트가 먼저 도착해도 놓치지 않는다
 */
export class VoiceEventChannel {
  private readonly buffered: VoiceJobEvent[] = [];
  private readonly waiters: { jobId: string; resolve: (event: VoiceJobEvent) => void }[] = [];
  private closed = false;

  push(event: VoiceJobEvent): void {
    if (this.closed) return;
    const index = this.waiters.findIndex((waiter) => waiter.jobId === event.jobId);
    if (index >= 0) {
      const [waiter] = this.waiters.splice(index, 1);
      waiter.resolve(event);
      return;
    }
    this.buffered.push(event);
  }

  /** 이 작업의 이벤트를 기다린다. 이미 와 있으면 바로 돌려준다 */
  wait(jobId: string): Promise<VoiceJobEvent> {
    const index = this.buffered.findIndex((event) => event.jobId === jobId);
    if (index >= 0) return Promise.resolve(this.buffered.splice(index, 1)[0]);
    return new Promise((resolve) => this.waiters.push({ jobId, resolve }));
  }

  close(): void {
    this.closed = true;
    this.buffered.length = 0;
    this.waiters.length = 0;
  }
}

export interface VoiceJobDeps {
  /** 이벤트를 받을 채널을 연다. 소켓에 연결할 수 없으면 빈 채널을 돌려주고 조회만으로 동작한다 */
  openChannel: () => Promise<{ channel: VoiceEventChannel; close: () => void }>;
  submit: () => Promise<{ jobId: string }>;
  poll: (jobId: string) => Promise<VoiceJobStatusResponse>;
}

export interface VoiceJobOptions {
  timeoutMs?: number;
  firstPollMs?: number;
  pollIntervalMs?: number;
  signal?: AbortSignal;
}

const isNotFound = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { status?: unknown }).status === 404;

/**
 * 음성 작업을 보내고 결과를 기다린다.
 * 1) 소켓 이벤트(`voice_result`, `voice_failed`)가 가장 빠른 길이고,
 * 2) 이벤트를 놓치거나 소켓을 못 쓰면 `GET /voice/jobs/:jobId` 조회가 같은 결과를 준다.
 * 둘 중 먼저 오는 쪽을 쓰고, 제한 시간이 지나거나 중단되면 실패다.
 */
export async function runVoiceJob(deps: VoiceJobDeps, options: VoiceJobOptions = {}): Promise<VoiceRouteRecommendResponseDto> {
  const timeoutMs = options.timeoutMs ?? VOICE_JOB_TIMEOUT_MS;
  const firstPollMs = options.firstPollMs ?? VOICE_JOB_FIRST_POLL_MS;
  const pollIntervalMs = options.pollIntervalMs ?? VOICE_JOB_POLL_INTERVAL_MS;
  const { signal } = options;

  if (signal?.aborted) throw new VoiceJobAbortedError();
  const { channel, close } = await deps.openChannel();

  try {
    const { jobId } = await deps.submit();

    return await new Promise<VoiceRouteRecommendResponseDto>((resolve, reject) => {
      let settled = false;
      let pollTimer: ReturnType<typeof setTimeout> | undefined;
      let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

      const finish = (action: () => void) => {
        if (settled) return;
        settled = true;
        if (pollTimer) clearTimeout(pollTimer);
        if (timeoutTimer) clearTimeout(timeoutTimer);
        signal?.removeEventListener("abort", onAbort);
        action();
      };
      const onAbort = () => finish(() => reject(new VoiceJobAbortedError()));
      const fail = (error: VoiceJobError) => finish(() => reject(new VoiceJobFailedError(error)));

      signal?.addEventListener("abort", onAbort);
      timeoutTimer = setTimeout(
        () =>
          fail({
            code: "VOICE_JOB_TIMEOUT",
            message: "음성 처리가 오래 걸리고 있어요. 다시 시도해 주세요.",
            status: 504,
          }),
        timeoutMs
      );

      void channel.wait(jobId).then((event) =>
        finish(() => (event.kind === "result" ? resolve(event.result) : reject(new VoiceJobFailedError(event.error))))
      );

      const poll = async () => {
        if (settled) return;
        try {
          const status = await deps.poll(jobId);
          if (settled) return;
          if (status.status === "COMPLETED" && status.result) {
            finish(() => resolve(status.result as VoiceRouteRecommendResponseDto));
            return;
          }
          if (status.status === "FAILED") {
            fail(
              status.error ?? {
                code: "VOICE_JOB_FAILED",
                message: "음성 요청을 처리하지 못했어요. 다시 시도해 주세요.",
                status: 500,
              }
            );
            return;
          }
        } catch (error: unknown) {
          // 작업이 사라졌으면(보관 기간이 지남) 기다려도 소용없다. 그 밖의 일시적인 오류는 다음 조회에서 다시 본다
          if (isNotFound(error)) {
            fail({ code: "VOICE_JOB_NOT_FOUND", message: "음성 요청을 찾을 수 없어요.", status: 404 });
            return;
          }
        }
        if (!settled) pollTimer = setTimeout(() => void poll(), pollIntervalMs);
      };
      pollTimer = setTimeout(() => void poll(), firstPollMs);
    });
  } finally {
    close();
  }
}
