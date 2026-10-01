import request from 'supertest';
import { app } from '../app';
import { SESSION_ID_NAME } from '../constants/session';
import { repo } from '../repo/repo';
import type { Session } from '../repo/db';
import {
  getEncryptedSessionToken,
  signSessionToken,
} from '../lib/session-utils';

vitest.mock('../repo/repo');

const sessionToken = getEncryptedSessionToken();
const newSessionSignature = signSessionToken(sessionToken);
const signedSessionIdValue = `${sessionToken}.${newSessionSignature}`;

const mockedSessionInstance = {
  token: sessionToken,
} as Session;

const mockedDelete = vitest.mocked(repo.deleteSessionByToken);
const mockedFindFirst = vitest.mocked(repo.findSessionByToken);

test.beforeEach(() => {
  mockedFindFirst.mockReturnValueOnce(mockedSessionInstance);
});

test('successfull sign-out', async () => {
  const response = await request(app)
    .delete('/sign-out')
    .set('cookie', `${SESSION_ID_NAME}=${signedSessionIdValue}`);
  expect(mockedDelete).toHaveBeenCalledWith(sessionToken);
  expect(response.status).toBe(200);

  expect(response.headers['set-cookie']).toEqual(
    expect.arrayContaining([
      `${SESSION_ID_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure`,
    ]),
  );
  expect(response.header['clear-site-data']).toBe('"cookies", "cache"');
});

test('error sign-out', async () => {
  mockedDelete.mockImplementationOnce(() => {
    throw new Error('failed to sign-out');
  });

  const response = await request(app)
    .delete('/sign-out')
    .set('cookie', `${SESSION_ID_NAME}=${signedSessionIdValue}`);
  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    message: 'Failed to logout. Refresh your page and try again.',
  });
});
