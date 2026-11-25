export const AUTH_TOKEN_KEY = 'casa_estudiantil_access_token';
export const AUTH_EXPIRED_EVENT = 'casa-estudiantil:auth-expired';

export function getStoredToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearStoredSession() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('userRole');
}

export function expireStoredSession() {
  clearStoredSession();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}
