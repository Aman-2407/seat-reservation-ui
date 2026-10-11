import { HttpErrorResponse } from '@angular/common/http';

// Money stays in integer paise everywhere. This only formats it for display.
export function rupees(paise: number): string {
  return '₹' + (paise / 100).toFixed(2);
}

// status 0 means the request never got an answer (server asleep, offline, timeout).
export function isNetworkError(e: unknown): boolean {
  return e instanceof HttpErrorResponse && e.status === 0;
}

// Turns the backend's {"error": "...", "message": "..."} into one readable line.
export function errorMessage(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) {
      return 'Cannot reach the server. On a free host it may be waking up, so wait a minute and retry.';
    }
    const body = e.error as { error?: string; message?: string } | null;
    if (body?.message) return `${body.message} (${e.status} ${body.error ?? ''})`.trim();
    return `Request failed (${e.status})`;
  }
  return 'Something went wrong';
}
