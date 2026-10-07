import { ApiError, setTokenGetter, postMultipart, api, get } from "./client";

describe("API Client", () => {
  afterEach(() => {
    setTokenGetter(null);
  });

  it("should create ApiError with expected properties", () => {
    const error = new ApiError("RATE_LIMIT", "Too many requests", 429, { retryAfter: 60 });
    expect(error.name).toBe("ApiError");
    expect(error.code).toBe("RATE_LIMIT");
    expect(error.message).toBe("Too many requests");
    expect(error.status).toBe(429);
    expect(error.details).toEqual({ retryAfter: 60 });
  });

  it("should reject postMultipart if file size exceeds 5MB", async () => {
    const formData = new FormData();
    const oversizedBytes = 5 * 1024 * 1024 + 1; // 5MB + 1 byte

    await expect(
      postMultipart("/voice/route-recommend", formData, oversizedBytes)
    ).rejects.toThrow("Upload file size exceeds 5MB limit.");
  });

  it("should pass AbortSignal and headers in get request", async () => {
    const getSpy = jest.spyOn(api, "get").mockResolvedValue({
      data: { data: { success: true } },
    } as any);

    const controller = new AbortController();
    const result = await get<{ success: boolean }>(
      "/test",
      { foo: "bar" },
      { signal: controller.signal, headers: { "X-Custom": "test" } }
    );

    expect(result).toEqual({ success: true });
    expect(getSpy).toHaveBeenCalledWith("/test", {
      params: { foo: "bar" },
      signal: controller.signal,
      headers: { "X-Custom": "test" },
      timeout: undefined,
    });

    getSpy.mockRestore();
  });
});
