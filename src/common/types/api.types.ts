/**
 * 백엔드 공통 API 응답 규격 DTO
 * API_SPEC.md 1절의 공통 응답 규격을 1:1로 반영합니다.
 */

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: PageMeta;
}
