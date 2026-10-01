import crypto from 'crypto';
import {
  CLEAR_EXPIRED_IDLE_TIME_SESSIONS_INTERVAL,
  FAKE_USER,
  HMAC_KEY,
} from '../constants/session';
import { type Session, type User } from '../repo/db';
import { repo } from '../repo/repo';

type FakeUser = typeof FAKE_USER;

const getSessionInstanceBySessionValue = (sessionValue: string | undefined) => {
  if (!sessionValue) {
    throw new Error('session value is either undefined or an empty string');
  }

  const splitSessionIdValue = sessionValue.split('.', 2);
  if (splitSessionIdValue.length !== 2) {
    throw new Error('invalid session id value');
  }

  const [token, sessionSignature] = splitSessionIdValue;

  const signature = signSessionToken(token);

  if (!safeCompareSessionSignatures(sessionSignature, signature)) {
    throw new Error('session signature is invalid');
  }

  // pessimistic checks
  let session;
  try {
    session = repo.findSessionByToken(token);
  } catch (error) {
    console.log(error);
  }

  if (!session) {
    throw new Error("session doesn't exist");
  }
  return session;
};

const isSessionFresh = (session: Session) => {
  return new Date(session.expiresAt).getTime() > new Date().getTime();
};

const signSessionToken = (token: string) => {
  return crypto.createHmac('sha256', HMAC_KEY).update(token).digest('hex');
};

const safeCompareSessionSignatures = (a: string, b: string) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return (
    bufferA.length === bufferB.length &&
    crypto.timingSafeEqual(bufferA, bufferB)
  );
};

const getEncryptedSessionToken = () => crypto.randomBytes(16).toString('hex');

const isFakeUser = (user: User | FakeUser): user is FakeUser => {
  return 'fake' in user;
};

const clearExpiredIdleTimeSessions = () => {
  setTimeout(() => {
    try {
      repo.deleteSessionsWithExpiredIdleTimeout();
    } catch (error) {
      console.log('Failed to clear expired idle time sessions', error);
    }
    clearExpiredIdleTimeSessions();
  }, CLEAR_EXPIRED_IDLE_TIME_SESSIONS_INTERVAL);
};

export {
  clearExpiredIdleTimeSessions,
  getEncryptedSessionToken,
  getSessionInstanceBySessionValue,
  isFakeUser,
  isSessionFresh,
  safeCompareSessionSignatures,
  signSessionToken,
};
