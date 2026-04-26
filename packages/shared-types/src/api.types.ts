export interface ApiResponse<T> {
  data: T
  success: true
}

export interface ApiError {
  success: false
  error: string
  details?: string
}

export type ApiResult<T> = ApiResponse<T> | ApiError

export interface BackupData {
  version: string
  exportedAt: string
  properties: unknown[]
  monthlyData: unknown[]
  scorecards: unknown[]
}
