import Constants from "expo-constants";
import { z } from "zod";

const extra = Constants.expoConfig?.extra ?? {};

const envSchema = z.object({
  APP_ENV: z.enum(["local", "staging", "production"]).default("local"),
  API_BASE_URL: z.string().url().default("http://10.0.2.2:3000"),
  WS_URL: z.string().default("http://10.0.2.2:3000/ws/subway"),
  CLERK_PUBLISHABLE_KEY: z.string().min(1).default("pk_test_placeholder_key"),
  CLIENT_KEY: z.string().min(1).default("dev-mobile-client-key"),
});

export type AppEnv = z.infer<typeof envSchema>;

const rawEnv = {
  APP_ENV: process.env.APP_ENV || extra.appEnv || "local",
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    extra.apiBaseUrl ||
    "http://10.0.2.2:3000",
  WS_URL:
    process.env.EXPO_PUBLIC_WS_URL ||
    extra.wsUrl ||
    "http://10.0.2.2:3000/ws/subway",
  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    extra.clerkPublishableKey ||
    "pk_test_placeholder_key",
  CLIENT_KEY:
    process.env.EXPO_PUBLIC_CLIENT_KEY ||
    extra.clientKey ||
    "dev-mobile-client-key",
};

export const parseEnv = (input: Record<string, unknown> = rawEnv): AppEnv => {
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error(`[EnvError] Invalid environment variables:\n${errorDetails}`);
    throw new Error(`Invalid environment configuration:\n${errorDetails}`);
  }
  return parsed.data;
};

export const ENV: AppEnv = parseEnv();
