export interface ApiResponse<T = unknown> {
  success: boolean;
  status: 'success' | 'error';
  message: string;
  data: T | null;
  errors: Record<string, unknown> | null;
}
