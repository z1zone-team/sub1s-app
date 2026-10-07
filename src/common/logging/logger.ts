const SENSITIVE_KEYS = new Set([
  "authorization",
  "token",
  "accesstoken",
  "refreshtoken",
  "jwt",
  "secret",
  "clientkey",
  "wrappeddek",
  "password",
]);

/**
 * 객체 내 민감 필드(Authorization, 토큰, wrappedDek 등)를 재귀적으로 마스킹
 */
export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    // Bearer token 마스킹
    return data.replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, "Bearer ****");
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  if (typeof data === "object") {
    const maskedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        maskedObj[key] = "****";
      } else {
        maskedObj[key] = maskSensitiveData(value);
      }
    }
    return maskedObj;
  }

  return data;
}

export const logger = {
  debug: (...args: unknown[]): void => {
    if (__DEV__) {
      console.debug(...args.map((arg) => maskSensitiveData(arg)));
    }
  },
  info: (...args: unknown[]): void => {
    console.info(...args.map((arg) => maskSensitiveData(arg)));
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args.map((arg) => maskSensitiveData(arg)));
  },
  error: (...args: unknown[]): void => {
    console.error(...args.map((arg) => maskSensitiveData(arg)));
  },
};
