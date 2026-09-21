import type { NonUndefined } from 'react-hook-form';
import type { sessions } from '../collections';

export const isSessionFresh = (
  session: NonUndefined<ReturnType<typeof sessions.findFirst>>,
) => {
  return new Date(session.expiresAt).getTime() > new Date().getTime();
};
