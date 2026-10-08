import * as cookie from 'cookie';
import request from 'supertest';
import { expect, test, vitest } from 'vitest';
import { mockLogError, mockLogInfo } from '../../../__mocks__/pino-http';
import { app } from '../app';
import {
  FAKE_USER,
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_ID_NAME,
} from '../constants/session';
import { FakeUserError } from '../errors';
import { comparePasswords } from '../lib/manage-password';
import {
  createSessionIdValue,
  getRawSessionTokenAndSecret,
  hashSessionSecret,
  isFakeUser,
} from '../lib/session-utils';
import { repo } from '../repo/get-current-repo';
import type { User } from '../repo/types/entities';

vitest.mock('../repo/get-current-repo.ts');
vitest.mock('pino-http');
vitest.mock(import('../lib/manage-password'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    comparePasswords: vitest.fn(),
  };
});
vitest.mock(import('../lib/session-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    getEncryptedSessionToken: vi.fn(),
    getRawSessionTokenAndSecret: vi.fn(),
    isFakeUser: vi.fn() as unknown as typeof isFakeUser,
  };
});

const mockedFindUserbyEmail = vitest.mocked(repo.findUserByEmail);
const mockedCreateSession = vitest.mocked(repo.createSession);
const mockedComparePasswords = vitest.mocked(comparePasswords);
const mockedIsFakeUser = vitest.mocked(isFakeUser);
const mockedGetRawSessionTokenAndSecret = vitest.mocked(
  getRawSessionTokenAndSecret,
);

const mockUser = {
  id: 1,
  username: 'bob',
  password: '$2b$10$I03nIIzrjQin51qNk.nB.eV1QIe4FF5GjYXUoL5u0FBFuYNN2PEVe',
} as User;

const rawSessionToken = 'my-token';
const rawSessionSecret = 'my-secret';
const hashedSessionSecret = hashSessionSecret(rawSessionSecret);

const mockedSubmittedData = {
  email: 'my-email@gmail.com',
  password: 'my-password',
};

beforeEach(() => {
  mockedGetRawSessionTokenAndSecret.mockReturnValue({
    rawSessionToken,
    rawSessionSecret,
  });
  mockedComparePasswords.mockResolvedValue(true);
});

test('should sign-in successfully', async () => {
  const mockedTimeNow = 1000;
  const createdAtDate = new Date(mockedTimeNow).toISOString();
  const sessionExpiresAt = mockedTimeNow + SESSION_ABSOLUTE_TIMEOUT_MS;

  vitest.spyOn(Date, 'now').mockReturnValue(mockedTimeNow);
  mockedFindUserbyEmail.mockResolvedValueOnce(mockUser);

  const response = await request(app)
    .post('/sign-in')
    .send(mockedSubmittedData);

  const cookiesArray = response.headers['set-cookie'] as unknown as string[];

  expect(cookiesArray).toBeDefined();

  const sessionCookie = cookiesArray.find((cookie) =>
    cookie.startsWith(SESSION_ID_NAME),
  );
  expect(sessionCookie).toBeDefined();

  const parsedCookie = cookie.parseCookie(sessionCookie!);

  expect(mockLogInfo).toHaveBeenCalledWith(
    `User ${mockUser.id} has logged in successfully.`,
  );
  expect(mockedCreateSession).toHaveBeenCalledWith({
    createdAt: createdAtDate,
    updatedAt: createdAtDate,
    expiresAt: new Date(sessionExpiresAt).toISOString(),
    user: mockUser,
    token: rawSessionToken,
    secret: hashedSessionSecret,
  });
  expect(parsedCookie).toEqual({
    [SESSION_ID_NAME]: createSessionIdValue({
      rawSessionToken,
      rawSessionSecret,
    }),
    'Max-Age': String(SESSION_ABSOLUTE_TIMEOUT_MS / 1000),
    Path: '/',
    Expires: expect.any(String),
    SameSite: 'Lax',
  });
  expect(response.status).toBe(200);
  expect(response.headers['cache-control']).toBe('no-store');
});

test('should return an error response on session creation failure', async () => {
  const error = new Error('failed to create a session');
  mockedCreateSession.mockRejectedValueOnce(error);
  mockedFindUserbyEmail.mockResolvedValueOnce(mockUser);

  const response = await request(app)
    .post('/sign-in')
    .send(mockedSubmittedData);

  expect(mockLogError).toHaveBeenCalledWith(
    {
      err: error,
    },
    `Failed to create a session for a user: ${mockUser.id}`,
  );
  expect(response.status).toBe(401);
  expect(response.body).toEqual({ server: 'invalid credentials' });
});

test('should return validation error on invalid submitted data', async () => {
  const response = await request(app)
    .post('/sign-in')
    .send({ email: '', password: '' });

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    email: expect.any(String),
    password: expect.any(String),
  });
});

test("should go to the fake user path when email doesn't exist and return a generic error", async () => {
  mockedIsFakeUser.mockReturnValueOnce(true);

  mockedFindUserbyEmail.mockImplementationOnce(() => {
    throw new Error('failed to find a user');
  });

  const response = await request(app)
    .post('/sign-in')
    .send(mockedSubmittedData);

  expect(mockedComparePasswords).toHaveBeenCalledWith({
    raw: mockedSubmittedData.password,
    encrypted: FAKE_USER.password,
  });
  expect(mockLogError).toHaveBeenCalledWith({
    err: new FakeUserError().error,
  });
  expect(mockedIsFakeUser).toHaveBeenCalledWith(FAKE_USER);
  expect(mockedCreateSession).not.toHaveBeenCalled();
  expect(response.status).toBe(401);
  expect(response.body).toEqual({ server: 'invalid credentials' });
});

test("should return an error response is passwords don't match", async () => {
  const error = new Error('passwords dont match');
  mockedComparePasswords.mockRejectedValueOnce(error);

  const response = await request(app)
    .post('/sign-in')
    .send(mockedSubmittedData);

  expect(mockLogError).toHaveBeenCalledWith(
    {
      err: error,
    },
    `Provided an incorrect password for an email: ${mockedSubmittedData.email}`,
  );
  expect(response.status).toBe(401);
  expect(response.body).toEqual({ server: 'invalid credentials' });
});
