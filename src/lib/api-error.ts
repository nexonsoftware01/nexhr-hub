import { toast } from '@/hooks/use-toast';

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  timestamp?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly backendMessage: string;
  public readonly isDeviceError: boolean;
  public readonly isGeofenceError: boolean;
  public readonly isSessionExpired: boolean;
  public readonly isForbidden: boolean;
  public readonly isValidation: boolean;
  public readonly isRateLimited: boolean;
  public readonly cooldownSeconds: number | null;

  constructor(
    message: string,
    status: number = 0,
    public readonly rawResponse?: ApiErrorResponse
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.backendMessage = message;

    const msgLower = message.toLowerCase();
    this.isDeviceError = /device/i.test(message);
    this.isGeofenceError = /geofence|location|radius|office.*range|out.*range/i.test(message);
    this.isSessionExpired = status === 401;
    this.isForbidden = status === 403;
    this.isValidation = status === 400 || status === 422;
    this.isRateLimited = status === 429;

    // Try to extract cooldown seconds from message like "retry after 60 seconds" or "cooldown: 30s"
    const cooldownMatch = message.match(/(\d+)\s*(?:second|sec|s\b)/i);
    this.cooldownSeconds = this.isRateLimited && cooldownMatch ? parseInt(cooldownMatch[1], 10) : null;
  }
}

/**
 * Parses any caught error into an ApiError with the backend message preserved.
 */
export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new ApiError('Network error. Please try again.', 0);
  }

  if (error instanceof Error) {
    return new ApiError(error.message || 'Request failed. Please try again.', 0);
  }

  return new ApiError('Request failed. Please try again.', 0);
}

/**
 * Reusable error handler — shows a toast with the backend message.
 * Returns the parsed ApiError for additional handling by the caller.
 */
export function handleApiError(
  error: unknown,
  options: {
    /** Custom title for the toast. Defaults to contextual titles based on error type. */
    title?: string;
    /** If true, suppresses the toast (caller handles UI). */
    silent?: boolean;
  } = {}
): ApiError {
  const apiError = parseApiError(error);

  if (!options.silent) {
    let title = options.title || 'Error';

    if (apiError.isSessionExpired) {
      title = 'Session Expired';
    } else if (apiError.isForbidden) {
      title = 'Access Denied';
    } else if (apiError.isRateLimited) {
      title = 'Too Many Requests';
    } else if (apiError.isValidation) {
      title = 'Validation Error';
    } else if (apiError.isDeviceError) {
      title = 'Device Mismatch';
    }

    const description = apiError.isDeviceError
      ? `${apiError.backendMessage} Login again on your primary device.`
      : apiError.backendMessage;

    toast({
      title,
      description,
      variant: 'destructive',
    });
  }

  return apiError;
}
