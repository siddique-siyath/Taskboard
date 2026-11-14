import { HttpErrorResponse } from '@angular/common/http';

/** Turns any HTTP failure into a message that is safe to show the user. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Check that the API is running.';
    const apiMessage = (err.error as { message?: string } | null)?.message;
    return apiMessage ?? fallback;
  }
  return fallback;
}
