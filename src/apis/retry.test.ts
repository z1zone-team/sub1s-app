import { ApiError } from "./client";
import { shouldRetry } from "./retry";

describe("shouldRetry", () => {
  it("retries a network failure or a server error once", () => {
    expect(shouldRetry(0, new Error("Network Error"))).toBe(true);
    expect(shouldRetry(0, new ApiError("UNKNOWN_ERROR", "boom", 500))).toBe(true);
    expect(shouldRetry(0, new ApiError("UNKNOWN_ERROR", "no response", 0))).toBe(true);
  });

  it("does not retry after the first retry", () => {
    expect(shouldRetry(1, new Error("Network Error"))).toBe(false);
    expect(shouldRetry(1, new ApiError("UNKNOWN_ERROR", "boom", 503))).toBe(false);
  });

  it("does not retry the rate limit, a bad request, a missing resource or a cancelled request", () => {
    expect(shouldRetry(0, new ApiError("TOO_MANY_REQUESTS", "slow", 429))).toBe(false);
    expect(shouldRetry(0, new ApiError("INVALID_REQUEST_PAYLOAD", "bad", 400))).toBe(false);
    expect(shouldRetry(0, new ApiError("STATION_NOT_FOUND", "gone", 404))).toBe(false);
    expect(shouldRetry(0, new ApiError("UNAUTHORIZED", "login", 401))).toBe(false);
    expect(shouldRetry(0, new ApiError("REQUEST_CANCELLED", "aborted", 0))).toBe(false);
  });
});
