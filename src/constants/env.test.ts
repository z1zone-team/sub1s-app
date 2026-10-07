import { parseEnv } from "./env";

describe("env configuration", () => {
  it("should successfully parse valid environment variables", () => {
    const env = parseEnv({
      APP_ENV: "staging",
      API_BASE_URL: "https://staging-api.sub1s.com",
      WS_URL: "wss://staging-api.sub1s.com/ws/subway",
      CLERK_PUBLISHABLE_KEY: "pk_test_sample",
      CLIENT_KEY: "test-key",
    });

    expect(env.APP_ENV).toBe("staging");
    expect(env.API_BASE_URL).toBe("https://staging-api.sub1s.com");
  });

  it("should throw error when API_BASE_URL is not a valid URL", () => {
    expect(() => {
      parseEnv({
        APP_ENV: "local",
        API_BASE_URL: "not-a-valid-url",
        WS_URL: "ws://localhost:3000",
        CLERK_PUBLISHABLE_KEY: "pk_test_sample",
        CLIENT_KEY: "test-key",
      });
    }).toThrow("Invalid environment configuration");
  });
});
