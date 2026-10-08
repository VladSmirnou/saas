import crypto from 'crypto';
import {
  CLEAR_EXPIRED_ABSOLUTE_TIME_SESSIONS_INTERVAL,
  CLEAR_EXPIRED_IDLE_TIME_SESSIONS_INTERVAL,
  FAKE_USER,
} from '../constants/session';
import { repo } from '../repo/msw/repo';
import { loggerInstance } from '../logger';
import { getEncryptedString } from './get-encrypted-string';
import type { User } from '../repo/types/entities';

type FakeUser = typeof FAKE_USER;

const getSessionInstanceBySessionValue = async (sessionValue?: string) => {
  if (!sessionValue) {
    throw new Error('session value is either undefined or an empty string');
  }

  const splitSessionIdValue = sessionValue.split('.', 2);
  if (splitSessionIdValue.length !== 2) {
    throw new Error('invalid session id value');
  }

  const [rawToken, rawSecret] = splitSessionIdValue;

  const session = await repo.findSessionByToken(rawToken);
  if (!session) {
    throw new Error("session doesn't exist");
  }

  const hashedIncommingSecret = hashSessionSecret(rawSecret);

  if (!safeCompareSessionHashedSecrets(session.secret, hashedIncommingSecret)) {
    throw new Error("session secrets don't match");
  }

  return session;
};

const isSessionFresh = (expiresAt: string) =>
  new Date(expiresAt).getTime() > new Date().getTime();

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
  setTimeout(async () => {
    try {
      await repo.deleteSessionsWithExpiredIdleTimeout();
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
  setTimeout(async () => {
    try {
      await repo.deleteSessionsWithExpiredAbsoluteTimeout();
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
