import request from 'supertest';
import { expect, test, vitest } from 'vitest';
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

test('successfull logout', async () => {
  const response = await request(app)
    .delete('/sign-out')
    .set('cookie', `sid=${signedSessionIdValue}`);
  expect(mockedDelete).toHaveBeenCalledWith(sessionToken);
  expect(response.status).toBe(200);
  expect(response.headers['set-cookie']).toEqual(
    expect.arrayContaining([
      `${SESSION_ID_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    ]),
  );
});

test('error logout', async () => {
  mockedDelete.mockImplementationOnce(() => {
    throw new Error('failed to logout');
  });

  const response = await request(app)
    .delete('/sign-out')
    .set('cookie', `sid=${signedSessionIdValue}`);
  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    message: 'Failed to logout. Refresh your page and try again.',
  });
});
