import type { Session } from '../repo/types/entities';

export const isSessionFresh = (session: Session) => {
  return new Date(session.expiresAt).getTime() > new Date().getTime();
};
