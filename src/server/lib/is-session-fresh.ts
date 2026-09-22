import type { Session } from '../db';

export const isSessionFresh = (session: Session) => {
  return new Date(session.expiresAt).getTime() > new Date().getTime();
};
