import * as cookie from 'cookie';
import request from 'supertest';
import { expect, test, vitest } from 'vitest';
import { app } from '../app';
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_ID_NAME,
  FAKE_USER,
} from '../constants/session';
import { comparePasswords } from '../lib/manage-password';
import {
  getEncryptedSessionToken,
  hashSessionToken,
  isFakeUser,
  signSessionToken,
} from '../lib/session-utils';
import type { Session, User } from '../repo/db';
import { repo } from '../repo/repo';

vitest.mock('../repo/repo');
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
    isFakeUser: vi.fn() as unknown as typeof isFakeUser,
  };
});

const mockedFindUserbyEmail = vitest.mocked(repo.findUserByEmail);
const mockedCreateSession = vitest.mocked(repo.createSession);
const mockedComparePasswords = vitest.mocked(comparePasswords);
const mockedGetEncryptedSessionToken = vitest.mocked(getEncryptedSessionToken);
const mockedIsFakeUser = vitest.mocked(isFakeUser);

const mockUser = {
  id: 1,
  username: 'bob',
  password: 'some-hash',
} as User;

const mockedSession = {
  token: 'my-token',
} as Session;

const mockedSubmittedData = {
  email: 'my-email@gmail.com',
  password: 'my-password',
};

test('should sign-in successfully', async () => {
  const mockedTimeNow = 1000;
  const createdAtDate = new Date(mockedTimeNow).toISOString();
  const sessionExpiresAt = mockedTimeNow + SESSION_ABSOLUTE_TIMEOUT_MS;

  vitest.spyOn(Date, 'now').mockReturnValue(mockedTimeNow);
  mockedFindUserbyEmail.mockReturnValueOnce(mockUser);
  mockedComparePasswords.mockResolvedValueOnce(true);
  mockedCreateSession.mockResolvedValueOnce(mockedSession);
  mockedGetEncryptedSessionToken.mockReturnValueOnce(mockedSession.token);

  const response = await request(app)
    .post('/sign-in')
    .send(mockedSubmittedData);

  const signature = signSessionToken(mockedSession.token);
  const cookiesArray = response.headers['set-cookie'] as unknown as string[];

  expect(cookiesArray).toBeDefined();

  const sessionCookie = cookiesArray.find((cookie) =>
    cookie.startsWith(SESSION_ID_NAME),
  );
  expect(sessionCookie).toBeDefined();

  const parsedCookie = cookie.parseCookie(sessionCookie!);

  expect(mockedCreateSession).toHaveBeenCalledWith({
    createdAt: createdAtDate,
    updatedAt: createdAtDate,
    expiresAt: new Date(sessionExpiresAt).toISOString(),
    user: mockUser,
    token: hashSessionToken(mockedSession.token),
  });
  expect(parsedCookie).toEqual({
    [SESSION_ID_NAME]: `${mockedSession.token}.${signature}`,
    'Max-Age': String(SESSION_ABSOLUTE_TIMEOUT_MS / 1000),
    Path: '/',
    Expires: expect.any(String),
    SameSite: 'Lax',
  });
  expect(response.status).toBe(200);
  expect(response.headers['cache-control']).toBe('no-store');
});

test('should return an error response on session creation failure', async () => {
  mockedCreateSession.mockRejectedValueOnce(
    new Error('failed to create a session'),
  );

  const response = await request(app)
    .post('/sign-in')
    .send(mockedSubmittedData);

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

test("should check fake user password when email doesn't exist and return a generic error", async () => {
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
  expect(mockedIsFakeUser).toHaveBeenCalledWith(FAKE_USER);
  expect(mockedCreateSession).not.toHaveBeenCalled();
  expect(response.status).toBe(401);
  expect(response.body).toEqual({ server: 'invalid credentials' });
});

test("should return an error response is passwords don't match", async () => {
  mockedComparePasswords.mockRejectedValueOnce(
    new Error('passwords dont match'),
  );

  const response = await request(app)
    .post('/sign-in')
    .send(mockedSubmittedData);

  expect(response.status).toBe(401);
  expect(response.body).toEqual({ server: 'invalid credentials' });
});
