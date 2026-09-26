import * as cookie from 'cookie';
import request from 'supertest';
import { expect, test, vitest } from 'vitest';
import { app } from '../app';
import { SESSION_ID_NAME } from '../constants/session';
import { comparePasswords } from '../lib/manage-password';
import {
  getEncryptedSessionToken,
  signSessionToken,
} from '../lib/session-utils';
import type { Session, User } from '../repo/db';
import { repo } from '../repo/repo';

vitest.mock('../repo/repo');
vitest.mock('../lib/manage-password');
vitest.mock('../lib/session-utils');

const mockedFindUserbyEmail = vitest.mocked(repo.findUserByEmail);
const mockedCreateSession = vitest.mocked(repo.createSession);
const mockedComparePasswords = vitest.mocked(comparePasswords);
const mockedGetEncryptedSessionToken = vitest.mocked(getEncryptedSessionToken);

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
    createdAt: expect.any(Number),
    expiresAt: expect.any(Number),
    user: mockUser,
    token: mockedSession.token,
  });

  expect(response.status).toBe(200);
  expect(parsedCookie).toEqual({
    sid: `${mockedSession.token}.${signature}`,
    'Max-Age': expect.stringMatching(/^[^0][0-9]{0,}$/),
    Path: '/',
    Expires: expect.any(String),
    SameSite: 'Lax',
  });
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

test("should return an error response when user doesn't exist", async () => {
  mockedFindUserbyEmail.mockImplementationOnce(() => {
    throw new Error('failed to find a user');
  });

  const response = await request(app)
    .post('/sign-in')
    .send(mockedSubmittedData);

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
