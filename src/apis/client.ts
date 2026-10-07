import axios, { type InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/constants/env";

export type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter | null = null;

/**
 * React 외부 모듈인 client.ts에 Clerk getToken 함수를 주입합니다.
 * AppProviders의 TokenBridge 컴포넌트에서 호출됩니다.
 */
export const setTokenGetter = (fn: TokenGetter | null): void => {
  getToken = fn;
};

export const api = axios.create({
  baseURL: `${ENV.API_BASE_URL}/api/v1`,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    "X-Sub1S-Client-Key": ENV.CLIENT_KEY,
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // 토큰 획득 실패 시 Authorization 없이 진행 (가드에서 401 처리)
    }
  }
  return config;
});

/** 백엔드 비즈니스 예외 및 HTTP 에러 통합 클래스 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status ?? 0;
    const body = error.response?.data as ErrorEnvelope | undefined;

    const code =
      body?.error?.code ??
      (status === 429
        ? "TOO_MANY_REQUESTS"
        : status === 401
        ? "UNAUTHORIZED"
        : "UNKNOWN_ERROR");

    const message =
      body?.error?.message ??
      body?.message ??
      error.message ??
      "An unexpected API error occurred.";

    return Promise.reject(
      new ApiError(code, message, status, body?.error?.details)
    );
  }
);

/** 백엔드 성공 응답 봉투 */
export interface Envelope<T> {
  data: T;
}

export interface PagedEnvelope<T, M = unknown> {
  data: T;
  meta: M;
}

export async function get<T>(url: string, params?: object): Promise<T> {
  const res = await api.get<Envelope<T>>(url, params ? { params } : undefined);
  return res.data.data;
}

export async function getPaged<T, M = unknown>(
  url: string,
  params?: object
): Promise<{ data: T; meta: M }> {
  const res = await api.get<PagedEnvelope<T, M>>(
    url,
    params ? { params } : undefined
  );
  return { data: res.data.data, meta: res.data.meta };
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<Envelope<T>>(url, body);
  return res.data.data;
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put<Envelope<T>>(url, body);
  return res.data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch<Envelope<T>>(url, body);
  return res.data.data;
}

export async function del<T = void>(url: string): Promise<T> {
  const res = await api.delete<Envelope<T>>(url);
  return res.data?.data as T;
}

/** 음성 등 멀티파트 파일 업로드 헬퍼 (5MB 제한 사전 검사) */
export async function postMultipart<T>(
  url: string,
  formData: FormData,
  fileSizeBytes?: number
): Promise<T> {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (fileSizeBytes !== undefined && fileSizeBytes > MAX_FILE_SIZE) {
    throw new ApiError(
      "FILE_TOO_LARGE",
      "Upload file size exceeds 5MB limit.",
      400
    );
  }

  const res = await api.post<Envelope<T>>(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.data;
}
