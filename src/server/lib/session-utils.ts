import crypto from 'crypto';
import {
  CLEAR_EXPIRED_ABSOLUTE_TIME_SESSIONS_INTERVAL,
  CLEAR_EXPIRED_IDLE_TIME_SESSIONS_INTERVAL,
  FAKE_USER,
} from '../constants/session';
import { type Session, type User } from '../repo/db';
import { repo } from '../repo/repo';
import { loggerInstance } from '../logger';
import { getEncryptedString } from './get-encrypted-string';

type FakeUser = typeof FAKE_USER;

const getSessionInstanceBySessionValue = (sessionValue: string | undefined) => {
  if (!sessionValue) {
    throw new Error('session value is either undefined or an empty string');
  }

  const splitSessionIdValue = sessionValue.split('.', 2);
  if (splitSessionIdValue.length !== 2) {
    throw new Error('invalid session id value');
  }

  const [rawToken, rawSecret] = splitSessionIdValue;

  const session = repo.findSessionByToken(rawToken);
  if (!session) {
    throw new Error("session doesn't exist");
  }

  const hashedIncommingSecret = hashSessionSecret(rawSecret);

  if (!safeCompareSessionHashedSecrets(session.secret, hashedIncommingSecret)) {
    throw new Error("session secrets don't match");
  }

  return session;
};

const isSessionFresh = (session: Session) =>
  new Date(session.expiresAt).getTime() > new Date().getTime();

const safeCompareSessionHashedSecrets = (a: string, b: string) => {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');

  return crypto.timingSafeEqual(bufferA, bufferB);
};

const isFakeUser = (user: User | FakeUser): user is FakeUser => 'fake' in user;

const clearExpiredIdleTimeSessions = () => {
  setTimeout(() => {
    try {
      repo.deleteSessionsWithExpiredIdleTimeout();
    } catch (error) {
      loggerInstance.logger.error(
        {
          err: error,
        },
        'Failed to clear expired idle time sessions',
      );
    }
    clearExpiredIdleTimeSessions();
  }, CLEAR_EXPIRED_IDLE_TIME_SESSIONS_INTERVAL);
};

const clearExpiredAbsoluteTimeSessions = () => {
  setTimeout(() => {
    try {
      repo.deleteSessionsWithExpiredAbsoluteTimeout();
    } catch (error) {
      loggerInstance.logger.error(
        {
          err: error,
        },
        'Failed to clear expired absolute time sessions',
      );
    }
    clearExpiredAbsoluteTimeSessions();
  }, CLEAR_EXPIRED_ABSOLUTE_TIME_SESSIONS_INTERVAL);
};

const hashSessionSecret = (sessionSecret: string) =>
  crypto.createHash('sha256').update(sessionSecret).digest('hex');

const createSessionIdValue = ({
  rawSessionToken,
  rawSessionSecret,
}: {
  rawSessionToken: string;
  rawSessionSecret: string;
}) => {
  return `${rawSessionToken}.${rawSessionSecret}`;
};

const getRawSessionTokenAndSecret = () => {
  return {
    rawSessionToken: getEncryptedString(16),
    rawSessionSecret: getEncryptedString(32),
  };
};

export {
  clearExpiredIdleTimeSessions,
  getSessionInstanceBySessionValue,
  isFakeUser,
  isSessionFresh,
  safeCompareSessionHashedSecrets,
  hashSessionSecret,
  createSessionIdValue,
  getRawSessionTokenAndSecret,
  clearExpiredAbsoluteTimeSessions,
};
