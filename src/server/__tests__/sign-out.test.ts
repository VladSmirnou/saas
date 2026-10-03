import type { NextFunction, Request, Response } from 'express';
import type { Options } from 'pino-http';
import request from 'supertest';
import { app } from '../app';
import { SESSION_ID_NAME } from '../constants/session';
import {
  createSessionIdValue,
  getRawSessionTokenAndSecret,
  hashSessionSecret,
} from '../lib/session-utils';
import type { Session } from '../repo/db';
import { repo } from '../repo/repo';

vitest.mock('../repo/repo');

const { mockLogError, mockLogInfo } = vi.hoisted(() => {
  return {
    mockLogError: vi.fn(),
    mockLogInfo: vi.fn(),
  };
});
vi.mock('pino-http', async (loadOriginal) => {
  const original = await loadOriginal<typeof import('pino-http')>();

  return {
    ...original,
    default: (opts: Options) => {
      const middleware = original.default(opts);

      return (req: Request, res: Response, next: NextFunction) => {
        middleware(req, res, () => {
          req.log.error = mockLogError;
          req.log.info = mockLogInfo;
          next();
        });
      };
    },
  };
});

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
} as Session;

const mockedDelete = vitest.mocked(repo.deleteSessionByToken);
const mockedFindSessionByToken = vitest.mocked(repo.findSessionByToken);

test.beforeEach(() => {
  mockedFindSessionByToken.mockReturnValueOnce(mockedSessionInstance);
});

test('successfull sign-out', async () => {
  const response = await request(app)
    .delete('/sign-out')
    .set('cookie', `${SESSION_ID_NAME}=${sessionIdValue}`);

  expect(mockedDelete).toHaveBeenCalledWith(rawSessionToken);
  expect(mockLogInfo.mock.calls).toEqual(
    expect.arrayContaining([
      expect.arrayContaining([
        expect.stringContaining(mockedSessionInstance.user.email),
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
