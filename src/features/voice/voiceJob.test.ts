import type { VoiceJobStatusResponse } from "@/apis/mutations/voice/voiceJobs";
import type { VoiceRouteRecommendResponseDto } from "@/apis/mutations/voice/recommendVoiceRoute";
import { ApiError } from "@/apis/client";
import {
  runVoiceJob,
  VoiceEventChannel,
  VoiceJobAbortedError,
  VoiceJobFailedError,
  type VoiceJobDeps,
} from "./voiceJob";

const RESULT = {
  transcript: "강남에서 사당까지",
  interpretedIntent: { originStationName: "강남", destStationName: "사당", preferredMode: "OPTIMAL", reason: "x" },
  recommendedRoute: { mode: "OPTIMAL" },
  briefingText: "안내합니다",
} as unknown as VoiceRouteRecommendResponseDto;

const FAILURE = { code: "HTTP_ERROR", message: "도착역을 찾을 수 없습니다.", status: 404 };

describe("VoiceEventChannel", () => {
  it("기다리고 있던 작업의 이벤트가 오면 바로 돌려준다", async () => {
    const channel = new VoiceEventChannel();
    const waiting = channel.wait("job-1");

    channel.push({ kind: "result", jobId: "job-1", result: RESULT });

    await expect(waiting).resolves.toEqual({ kind: "result", jobId: "job-1", result: RESULT });
  });

  it("기다리기 전에 온 이벤트도 모아 두었다가 돌려준다 (응답보다 이벤트가 먼저 오는 경우)", async () => {
    const channel = new VoiceEventChannel();

    channel.push({ kind: "failed", jobId: "job-1", error: FAILURE });

    await expect(channel.wait("job-1")).resolves.toEqual({ kind: "failed", jobId: "job-1", error: FAILURE });
  });

  it("다른 작업의 이벤트는 섞이지 않는다", async () => {
    const channel = new VoiceEventChannel();
    const waiting = channel.wait("job-2");

    channel.push({ kind: "result", jobId: "job-1", result: RESULT });
    channel.push({ kind: "result", jobId: "job-2", result: { ...RESULT, transcript: "둘째" } });

    await expect(waiting).resolves.toMatchObject({ jobId: "job-2", result: { transcript: "둘째" } });
    await expect(channel.wait("job-1")).resolves.toMatchObject({ jobId: "job-1" });
  });

  it("닫은 뒤에 온 이벤트는 버린다", async () => {
    jest.useFakeTimers();
    const channel = new VoiceEventChannel();
    channel.close();

    channel.push({ kind: "result", jobId: "job-1", result: RESULT });

    const outcome = Promise.race([channel.wait("job-1"), new Promise((resolve) => setTimeout(() => resolve("none"), 20))]);
    await jest.advanceTimersByTimeAsync(20);
    await expect(outcome).resolves.toBe("none");
    jest.useRealTimers();
  });
});

describe("runVoiceJob", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = (overrides: Partial<VoiceJobDeps> = {}) => {
    const channel = new VoiceEventChannel();
    const closeChannel = jest.fn();
    const deps = {
      openChannel: jest.fn().mockResolvedValue({ channel, close: closeChannel }),
      submit: jest.fn().mockResolvedValue({ jobId: "job-1" }),
      poll: jest.fn().mockResolvedValue({ jobId: "job-1", status: "PROCESSING" } as VoiceJobStatusResponse),
      ...overrides,
    } as jest.Mocked<VoiceJobDeps>;
    return { channel, closeChannel, deps };
  };

  /** 대기 중인 Promise가 처리되도록 마이크로태스크를 비운다 */
  const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };

  it("소켓 이벤트로 결과를 받는다", async () => {
    const { channel, deps } = setup();

    const promise = runVoiceJob(deps);
    await flush();
    channel.push({ kind: "result", jobId: "job-1", result: RESULT });

    await expect(promise).resolves.toBe(RESULT);
    expect(deps.poll).not.toHaveBeenCalled();
  });

  it("이벤트가 응답보다 먼저 와도 놓치지 않는다", async () => {
    const holder: { channel?: VoiceEventChannel } = {};
    const { channel, deps } = setup({
      submit: jest.fn(async () => {
        // 서버가 응답을 보내기도 전에 결과 이벤트가 먼저 도착한 상황
        holder.channel?.push({ kind: "result", jobId: "job-1", result: RESULT });
        return { jobId: "job-1" };
      }),
    });
    holder.channel = channel;

    await expect(runVoiceJob(deps)).resolves.toBe(RESULT);
  });

  it("요청을 보내기 전에 채널을 먼저 연다", async () => {
    const order: string[] = [];
    const { deps } = setup({
      openChannel: jest.fn(async () => {
        order.push("open");
        return { channel: new VoiceEventChannel(), close: jest.fn() };
      }),
      submit: jest.fn(async () => {
        order.push("submit");
        return { jobId: "job-1" };
      }),
    });
    deps.poll.mockResolvedValue({ jobId: "job-1", status: "COMPLETED", result: RESULT });

    const promise = runVoiceJob(deps);
    await jest.advanceTimersByTimeAsync(3000);

    await promise;
    expect(order).toEqual(["open", "submit"]);
  });

  it("voice_failed 이벤트는 같은 코드와 상태의 VoiceJobFailedError가 된다", async () => {
    const { channel, deps } = setup();

    const promise = runVoiceJob(deps);
    promise.catch(() => undefined);
    await flush();
    channel.push({ kind: "failed", jobId: "job-1", error: FAILURE });

    await expect(promise).rejects.toMatchObject({
      name: "VoiceJobFailedError",
      code: "HTTP_ERROR",
      status: 404,
      message: FAILURE.message,
    });
  });

  it("이벤트를 놓쳐도 조회가 같은 결과를 준다", async () => {
    const { deps } = setup();
    deps.poll
      .mockResolvedValueOnce({ jobId: "job-1", status: "PROCESSING" })
      .mockResolvedValueOnce({ jobId: "job-1", status: "COMPLETED", result: RESULT });

    const promise = runVoiceJob(deps, { firstPollMs: 3000, pollIntervalMs: 2500 });
    await flush();
    expect(deps.poll).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(3000);
    expect(deps.poll).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(2500);

    await expect(promise).resolves.toBe(RESULT);
    expect(deps.poll).toHaveBeenCalledTimes(2);
  });

  it("조회에서 FAILED가 오면 서버의 오류를 그대로 실패로 만든다", async () => {
    const { deps } = setup();
    deps.poll.mockResolvedValue({ jobId: "job-1", status: "FAILED", error: FAILURE });

    const promise = runVoiceJob(deps);
    promise.catch(() => undefined);
    await jest.advanceTimersByTimeAsync(3000);

    await expect(promise).rejects.toMatchObject({ code: "HTTP_ERROR", status: 404 });
  });

  it("오류 내용 없이 FAILED면 일반 실패다", async () => {
    const { deps } = setup();
    deps.poll.mockResolvedValue({ jobId: "job-1", status: "FAILED" });

    const promise = runVoiceJob(deps);
    promise.catch(() => undefined);
    await jest.advanceTimersByTimeAsync(3000);

    await expect(promise).rejects.toMatchObject({ code: "VOICE_JOB_FAILED", status: 500 });
  });

  it("조회가 일시적으로 실패해도 다음 조회로 이어간다", async () => {
    const { deps } = setup();
    deps.poll
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ jobId: "job-1", status: "COMPLETED", result: RESULT });

    const promise = runVoiceJob(deps);
    await jest.advanceTimersByTimeAsync(3000);
    await jest.advanceTimersByTimeAsync(2500);

    await expect(promise).resolves.toBe(RESULT);
  });

  it("작업이 사라졌으면(404) 더 기다리지 않고 실패한다", async () => {
    const { deps } = setup();
    deps.poll.mockRejectedValue(new ApiError("VOICE_JOB_NOT_FOUND", "x", 404));

    const promise = runVoiceJob(deps);
    promise.catch(() => undefined);
    await jest.advanceTimersByTimeAsync(3000);

    await expect(promise).rejects.toMatchObject({ code: "VOICE_JOB_NOT_FOUND", status: 404 });
    expect(deps.poll).toHaveBeenCalledTimes(1);
  });

  it("제한 시간이 지나면 504 VOICE_JOB_TIMEOUT으로 실패한다", async () => {
    const { deps } = setup();

    const promise = runVoiceJob(deps, { timeoutMs: 10_000 });
    promise.catch(() => undefined);
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(promise).rejects.toMatchObject({ code: "VOICE_JOB_TIMEOUT", status: 504 });
  });

  it("끝난 뒤에는 조회를 더 하지 않는다", async () => {
    const { channel, deps } = setup();

    const promise = runVoiceJob(deps);
    await flush();
    channel.push({ kind: "result", jobId: "job-1", result: RESULT });
    await promise;
    await jest.advanceTimersByTimeAsync(60_000);

    expect(deps.poll).not.toHaveBeenCalled();
  });

  it("이벤트가 먼저 오면 뒤늦은 조회 결과는 쓰지 않는다", async () => {
    const { channel, deps } = setup();
    deps.poll.mockResolvedValue({ jobId: "job-1", status: "COMPLETED", result: { ...RESULT, transcript: "조회" } });

    const promise = runVoiceJob(deps);
    await flush();
    channel.push({ kind: "result", jobId: "job-1", result: RESULT });
    await jest.advanceTimersByTimeAsync(3000);

    await expect(promise).resolves.toBe(RESULT);
  });

  it("요청을 보내지 못하면 그 오류를 그대로 던지고 채널을 닫는다", async () => {
    const error = new ApiError("VOICE_QUEUE_FULL", "바빠요", 503);
    const { deps, closeChannel } = setup({ submit: jest.fn().mockRejectedValue(error) });

    await expect(runVoiceJob(deps)).rejects.toBe(error);
    expect(closeChannel).toHaveBeenCalledTimes(1);
  });

  it("성공해도 실패해도 채널을 한 번 닫는다", async () => {
    const ok = setup();
    const okPromise = runVoiceJob(ok.deps);
    await flush();
    ok.channel.push({ kind: "result", jobId: "job-1", result: RESULT });
    await okPromise;

    const failed = setup();
    const failedPromise = runVoiceJob(failed.deps);
    failedPromise.catch(() => undefined);
    await flush();
    failed.channel.push({ kind: "failed", jobId: "job-1", error: FAILURE });
    await failedPromise.catch(() => undefined);

    expect(ok.closeChannel).toHaveBeenCalledTimes(1);
    expect(failed.closeChannel).toHaveBeenCalledTimes(1);
  });

  it("화면을 벗어나 중단하면 기다림을 멈추고 채널을 닫는다", async () => {
    const { deps, closeChannel } = setup();
    const controller = new AbortController();

    const promise = runVoiceJob(deps, { signal: controller.signal });
    promise.catch(() => undefined);
    await flush();
    controller.abort();

    await expect(promise).rejects.toBeInstanceOf(VoiceJobAbortedError);
    expect(closeChannel).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(deps.poll).not.toHaveBeenCalled();
  });

  it("이미 중단된 상태면 아무것도 하지 않는다", async () => {
    const { deps } = setup();
    const controller = new AbortController();
    controller.abort();

    await expect(runVoiceJob(deps, { signal: controller.signal })).rejects.toBeInstanceOf(VoiceJobAbortedError);
    expect(deps.openChannel).not.toHaveBeenCalled();
    expect(deps.submit).not.toHaveBeenCalled();
  });

  it("소켓 없이 빈 채널만 있어도 조회로 결과를 받는다", async () => {
    const { deps } = setup();
    deps.poll.mockResolvedValue({ jobId: "job-1", status: "COMPLETED", result: RESULT });

    const promise = runVoiceJob(deps);
    await jest.advanceTimersByTimeAsync(3000);

    await expect(promise).resolves.toBe(RESULT);
  });

  it("VoiceJobFailedError는 코드와 상태를 가진다", () => {
    const error = new VoiceJobFailedError(FAILURE);

    expect(error).toBeInstanceOf(Error);
    expect({ code: error.code, status: error.status, message: error.message }).toEqual(FAILURE);
  });
});
