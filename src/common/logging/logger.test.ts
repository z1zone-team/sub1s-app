import { maskSensitiveData } from "./logger";

describe("Logger Masking", () => {
  it("should mask Bearer token in strings", () => {
    const raw = "Request header Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test";
    const masked = maskSensitiveData(raw);
    expect(masked).toBe("Request header Authorization: Bearer ****");
  });

  it("should mask sensitive keys in nested objects", () => {
    const payload = {
      user: "john_doe",
      token: "secret_token_123",
      credentials: {
        password: "super_secret_pw",
        wrappedDek: "dek_hex_bytes_abc",
        clientKey: "client_key_xyz",
      },
      metadata: {
        line: "2호선",
      },
    };

    const masked = maskSensitiveData(payload) as typeof payload;

    expect(masked.user).toBe("john_doe");
    expect(masked.token).toBe("****");
    expect(masked.credentials.password).toBe("****");
    expect(masked.credentials.wrappedDek).toBe("****");
    expect(masked.credentials.clientKey).toBe("****");
    expect(masked.metadata.line).toBe("2호선");
  });

  it("should preserve null and undefined", () => {
    expect(maskSensitiveData(null)).toBeNull();
    expect(maskSensitiveData(undefined)).toBeUndefined();
  });
});
