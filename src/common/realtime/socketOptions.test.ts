import { buildSocketOptions } from "./socketOptions";

describe("buildSocketOptions", () => {
  it("엔진 경로(path)를 지정하지 않는다", () => {
    expect(buildSocketOptions("t")).not.toHaveProperty("path");
  });

  it("토큰이 있으면 auth에 담는다", () => {
    expect(buildSocketOptions("abc").auth).toEqual({ token: "abc" });
  });

  it("토큰이 없으면 auth를 보내지 않는다", () => {
    expect(buildSocketOptions(null)).not.toHaveProperty("auth");
  });

  it("웹소켓만 쓰고 다섯 번까지 다시 연결한다", () => {
    const options = buildSocketOptions(null);
    expect(options.transports).toEqual(["websocket"]);
    expect(options.reconnectionAttempts).toBe(5);
  });
});
