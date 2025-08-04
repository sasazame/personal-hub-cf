// CSRF token management utilities

// Get CSRF token from cookie
export function getCSRFToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Store CSRF token in memory for faster access
let csrfTokenCache: string | null = null;

export function setCachedCSRFToken(token: string | null): void {
  csrfTokenCache = token;
}

export function getCachedCSRFToken(): string | null {
  // Try cached token first, fall back to cookie
  return csrfTokenCache || getCSRFToken();
}