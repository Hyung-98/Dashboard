export interface ApiError {
  message: string;
  code?: string;
}

export type ApiResult<T> = { data: T; error: null } | { data: null; error: ApiError };
