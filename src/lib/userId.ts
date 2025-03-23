import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

export const USER_ID_KEY = 'multitrack_user_id';

export function getUserId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let userId = Cookies.get(USER_ID_KEY);

  if (!userId) {
    userId = uuidv4();
    // Set cookie with a long expiry (1 year) and make it accessible only via HTTP
    Cookies.set(USER_ID_KEY, userId, {
      expires: 365,
      secure: true,
      sameSite: 'strict',
    });
  }

  return userId;
}

// Server-side function to get user ID from cookie header
export function getUserIdFromCookie(cookieHeader?: string): string {
  if (!cookieHeader) return '';

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as { [key: string]: string });

  return cookies[USER_ID_KEY] || '';
}
