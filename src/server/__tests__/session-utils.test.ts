import { describe, expect, test, vi, vitest } from 'vitest';
import {
  CLEAR_EXPIRED_ABSOLUTE_TIME_SESSIONS_INTERVAL,
  IDLE_TIMEOUT_MS,
} from '../constants/session';
import {
  clearExpiredAbsoluteTimeSessions,
  clearExpiredIdleTimeSessions,
  createSessionIdValue,
  getRawSessionTokenAndSecret,
  getSessionInstanceBySessionValue,
  hashSessionSecret,
  isFakeUser,
  isSessionFresh,
  safeCompareSessionHashedSecrets,
} from '../lib/session-utils';
import { repo } from '../repo/msw/repo';
import type { SessionWithUser, User } from '../repo/types/entities';

vitest.mock('../repo/msw/repo');

const mockedFindSessionByToken = vitest.mocked(repo.findSessionByToken);
const mockedDeleteSessionsWithExpiredIdleTimeout = vitest.mocked(
  repo.deleteSessionsWithExpiredIdleTimeout,
);
const mockedDeleteSessionsWithExpiredAbsoluteTimeout = vitest.mocked(
  repo.deleteSessionsWithExpiredAbsoluteTimeout,
);

const { rawSessionToken, rawSessionSecret } = getRawSessionTokenAndSecret();

const sessionValue = createSessionIdValue({
  rawSessionToken,
  rawSessionSecret,
});

describe('safeCompareSessionSignatures', () => {
  test('should return false if strings have different length', () => {
    const a = 'abcd';
    const b = 'abcde';

    expect(safeCompareSessionHashedSecrets(a, b)).toBeFalsy();
  });

  test('should return false if strings are different', () => {
    const a = 'abcd';
    const b = 'abce';

    expect(safeCompareSessionHashedSecrets(a, b)).toBeFalsy();
  });

  test('should return true if strings are the same', () => {
    const a = 'abcd';
    const b = 'abcd';

    expect(safeCompareSessionHashedSecrets(a, b)).toBeTruthy();
  });
});

describe('isSessionFresh', () => {
  test('should return false if session is expired', () => {
    const timeNow = Date.now();
    expect(isSessionFresh(new Date(timeNow - 1000).toISOString())).toBeFalsy();
  });

  test('should return true if session is stil valid', () => {
    const timeNow = Date.now();
    expect(isSessionFresh(new Date(timeNow + 1000).toISOString())).toBeTruthy();
  });
});

describe('getSessionInstanceBySessionValue', () => {
  test('should return session if session value is correct', async () => {
    const mockedSession = {
      secret: hashSessionSecret(rawSessionSecret),
    } as SessionWithUser;

    mockedFindSessionByToken.mockResolvedValue(mockedSession);

    await expect(getSessionInstanceBySessionValue(sessionValue)).resolves.toBe(
      mockedSession,
    );
  });

  test('should throw an error when session value is an empty string or undefined', async () => {
    const errorMessage = 'session value is either undefined or an empty string';
    await expect(() => getSessionInstanceBySessionValue('')).rejects.toThrow(
      errorMessage,
    );
    await expect(() =>
      getSessionInstanceBySessionValue(undefined),
    ).rejects.toThrow(errorMessage);
  });

  test('should throw an error when cannot find session by token', async () => {
    const errorMessage = "session doesn't exist";
    await expect(() =>
      getSessionInstanceBySessionValue(sessionValue),
    ).rejects.toThrow(errorMessage);
  });

  test("should throw an error if hashed secrets don't match", async () => {
    const errorMessage = "session secrets don't match";
    const mockedSession = {
      secret: '123',
    } as SessionWithUser;

    mockedFindSessionByToken.mockResolvedValue(mockedSession);

    await expect(() =>
      getSessionInstanceBySessionValue(sessionValue),
    ).rejects.toThrow(errorMessage);
  });

  test("should throw if session id value doesn't split into token and signature correctly", async () => {
    const sessionValue = '123';
    const errorMessage = 'invalid session id value';

    await expect(() =>
      getSessionInstanceBySessionValue(sessionValue),
    ).rejects.toThrow(errorMessage);
  });

  test("should throw if a session doesn't exist", async () => {
    const errorMessage = "session doesn't exist";

    mockedFindSessionByToken.mockImplementationOnce(() => {
      throw new Error(errorMessage);
    });

    await expect(() =>
      getSessionInstanceBySessionValue(sessionValue),
    ).rejects.toThrow(errorMessage);
  });
});

describe('isFakeUser', () => {
  test('should return the correct boolean when fake and normal users passed', () => {
    expect(isFakeUser({ fake: true, password: '123' })).toBeTruthy();
    expect(isFakeUser({} as User)).toBeFalsy();
  });
});

describe('timers', () => {
  test.beforeEach(() => {
    vi.useFakeTimers();
  });
  test.afterEach(() => {
    vi.useRealTimers();
  });

  const callTimes = 5;
  describe('clearExpiredIdleTimeSessions', () => {
    test('should be called a proper amount of times in a given time interval', async () => {
      clearExpiredIdleTimeSessions();

      await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS * callTimes);
      expect(mockedDeleteSessionsWithExpiredIdleTimeout).toHaveBeenCalledTimes(
        callTimes,
      );
    });
  });

  describe('clearExpiredAbsoluteTimeSessions', () => {
    test('should be called a proper amount of times in a given time interval', async () => {
      clearExpiredAbsoluteTimeSessions();

      await vi.advanceTimersByTimeAsync(
        CLEAR_EXPIRED_ABSOLUTE_TIME_SESSIONS_INTERVAL * callTimes,
      );

      expect(
        mockedDeleteSessionsWithExpiredAbsoluteTimeout,
      ).toHaveBeenCalledTimes(callTimes);
    });

    // test('should log an error if failed to delete sessions', () => {
    //   const error = new Error('');

    //   mockedDeleteSessionsWithExpiredAbsoluteTimeout.mockImplementationOnce(
    //     () => {
    //       throw error;
    //     },
    //   );
    //   clearExpiredAbsoluteTimeSessions();

    //   vi.runOnlyPendingTimers();

    //   expect(mockLogError).toHaveBeenCalledWith(
    //     { err: error },
    //     'Failed to clear expired absolute time sessions',
    //   );
    // });
  });
});

describe('createSessionIdValue', () => {
  test('should correctly construct session id value', () => {
    const sessionIdRawValues = {
      rawSessionToken: 'my-token',
      rawSessionSecret: 'my-secret',
    };
    const sessionValue = createSessionIdValue(sessionIdRawValues);

    expect(sessionValue.split('.')).toHaveLength(2);
    expect(sessionValue).toMatch(
      `${sessionIdRawValues.rawSessionToken}.${sessionIdRawValues.rawSessionSecret}`,
    );
  });
});

describe('getRawSessionTokenAndSecret', () => {
  test('should create a random session token and session secret of required length', () => {
    const { rawSessionSecret, rawSessionToken } = getRawSessionTokenAndSecret();

    expect(rawSessionSecret).toEqual(expect.any(String));
    expect(rawSessionToken).toEqual(expect.any(String));
    expect(rawSessionSecret).not.toBe(rawSessionToken);

    expect(rawSessionToken).toHaveLength(32);
    expect(rawSessionSecret).toHaveLength(64);
  });
});
