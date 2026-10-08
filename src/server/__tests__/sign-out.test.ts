import request from 'supertest';
import { mockLogError, mockLogInfo } from '../../../__mocks__/pino-http';
import { app } from '../app';
import { SESSION_ID_NAME } from '../constants/session';
import {
  createSessionIdValue,
  getRawSessionTokenAndSecret,
  hashSessionSecret,
} from '../lib/session-utils';
import type { SessionWithUser } from '../repo/types/entities';
import { repo } from '../repo/get-current-repo';

vitest.mock('../repo/get-current-repo.ts');
vitest.mock('pino-http');

const { rawSessionToken, rawSessionSecret } = getRawSessionTokenAndSecret();

const sessionIdValue = createSessionIdValue({
  rawSessionToken,
  rawSessionSecret,
});

const mockedSessionInstance = {
  token: rawSessionToken,
  user: {
    id: 1,
    email: 'my-email',
  },
  secret: hashSessionSecret(rawSessionSecret),
} as SessionWithUser;

const mockedDelete = vitest.mocked(repo.deleteSessionByToken);
const mockedFindSessionByToken = vitest.mocked(repo.findSessionByToken);

test.beforeEach(() => {
  mockedFindSessionByToken.mockResolvedValue(mockedSessionInstance);
});

test('successfull sign-out', async () => {
  const response = await request(app)
    .delete('/sign-out')
    .set('cookie', `${SESSION_ID_NAME}=${sessionIdValue}`);

  expect(mockedDelete).toHaveBeenCalledWith(rawSessionToken);
  expect(mockLogInfo.mock.calls).toEqual(
    expect.arrayContaining([
      expect.arrayContaining([
        expect.stringContaining(String(mockedSessionInstance.user.id)),
        expect.stringContaining(mockedSessionInstance.token),
      ]),
    ]),
  );
  expect(response.status).toBe(200);
  expect(response.headers['set-cookie']).toEqual(
    expect.arrayContaining([
      `${SESSION_ID_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure`,
    ]),
  );
  expect(response.header['clear-site-data']).toBe('"cache"');
});

test('error sign-out', async () => {
  const errorInstance = new Error('failed to sign-out');
  mockedDelete.mockImplementationOnce(() => {
    throw errorInstance;
  });

  const response = await request(app)
    .delete('/sign-out')
    .set('cookie', `${SESSION_ID_NAME}=${sessionIdValue}`);

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    message: 'Failed to logout. Refresh your page and try again.',
  });
  expect(mockLogError).toHaveBeenCalledWith(
    {
      err: errorInstance,
      userId: mockedSessionInstance.user.id,
      sessionToken: mockedSessionInstance.token,
    },
    expect.any(String),
  );
});
