import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'multitrack_user_id';

export function getUserId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let userId = sessionStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = uuidv4();
    sessionStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}
