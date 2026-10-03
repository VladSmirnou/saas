import { describe, expect, test, vi, vitest } from 'vitest';
import { IDLE_TIMEOUT } from '../constants/session';
import {
  clearExpiredIdleTimeSessions,
  createSessionIdValue,
  getRawSessionTokenAndSecret,
  getSessionInstanceBySessionValue,
  hashSessionSecret,
  isFakeUser,
  isSessionFresh,
  safeCompareSessionSignatures,
} from '../lib/session-utils';
import type { Session, User } from '../repo/db';
import { repo } from '../repo/repo';

vitest.mock('../repo/repo');

const mockedFindSessionByToken = vitest.mocked(repo.findSessionByToken);
const mockedDeleteSessionsWithExpiredIdleTimeout = vitest.mocked(
  repo.deleteSessionsWithExpiredIdleTimeout,
);

describe('safeCompareSessionSignatures', () => {
  test('should return false if strings have different length', () => {
    const a = 'abcd';
    const b = 'abcde';

    expect(safeCompareSessionSignatures(a, b)).toBeFalsy();
  });

  test('should return false if strings are different', () => {
    const a = 'abcd';
    const b = 'abce';

    expect(safeCompareSessionSignatures(a, b)).toBeFalsy();
  });

  test('should return true if strings are the same', () => {
    const a = 'abcd';
    const b = 'abcd';

    expect(safeCompareSessionSignatures(a, b)).toBeTruthy();
  });
});

describe('isSessionFresh', () => {
  test('should return false if session is expired', () => {
    const timeNow = Date.now();
    expect(
      isSessionFresh({
        expiresAt: new Date(timeNow - 1000).toISOString(),
      } as Session),
    ).toBeFalsy();
  });

  test('should return true if session is stil valid', () => {
    const timeNow = Date.now();
    expect(
      isSessionFresh({
        expiresAt: new Date(timeNow + 1000).toISOString(),
      } as Session),
    ).toBeTruthy();
  });
});

describe('getSessionInstanceBySessionValue', () => {
  test('should return session if session value is correct', () => {
    const { rawSessionToken, rawSessionSecret } = getRawSessionTokenAndSecret();

    const sessionValue = createSessionIdValue({
      rawSessionToken,
      rawSessionSecret,
    });

    const mockedSession = {
      secret: hashSessionSecret(rawSessionSecret),
    } as Session;

    mockedFindSessionByToken.mockReturnValue(mockedSession);

    expect(getSessionInstanceBySessionValue(sessionValue)).toBe(mockedSession);
  });

  test('should throw an error when session value is an empty string or undefined', () => {
    const errorMessage = 'session value is either undefined or an empty string';
    expect(() => getSessionInstanceBySessionValue('')).toThrow(errorMessage);
    expect(() => getSessionInstanceBySessionValue(undefined)).toThrow(
      errorMessage,
    );
  });

  test("should throw if session id value doesn't split into token and signature correctly", () => {
    const sessionValue = '123';
    const errorMessage = 'invalid session id value';

    expect(() => getSessionInstanceBySessionValue(sessionValue)).toThrow(
      errorMessage,
    );
  });

  test("should throw if a session doesn't exist", () => {
    const errorMessage = "session doesn't exist";
    const { rawSessionToken, rawSessionSecret } = getRawSessionTokenAndSecret();

    const sessionValue = createSessionIdValue({
      rawSessionToken,
      rawSessionSecret,
    });

    mockedFindSessionByToken.mockImplementationOnce(() => {
      throw new Error(errorMessage);
    });

    expect(() => getSessionInstanceBySessionValue(sessionValue)).toThrow(
      errorMessage,
    );
  });
});

describe('isFakeUser', () => {
  test('should return the correct boolean when fake and normal users passed', () => {
    expect(isFakeUser({ fake: true, password: '123' })).toBeTruthy();
    expect(isFakeUser({} as User)).toBeFalsy();
  });
});

describe('clearExpiredIdleTimeSessions', () => {
  test.beforeEach(() => {
    vi.useFakeTimers();
  });
  test.afterEach(() => {
    vi.useRealTimers();
  });

  test('should be called a proper amount of times in a given time interval', () => {
    const callTimes = 5;
    clearExpiredIdleTimeSessions();

    vi.advanceTimersByTime(IDLE_TIMEOUT * callTimes);
    expect(mockedDeleteSessionsWithExpiredIdleTimeout).toHaveBeenCalledTimes(
      callTimes,
    );
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
