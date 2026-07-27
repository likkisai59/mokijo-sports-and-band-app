export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details: any;
  };
}
