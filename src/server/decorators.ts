import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { SESSION_ID_NAME } from './constants/session';
import {
  getSessionInstanceBySessionValue,
  isSessionFresh,
} from './lib/session-utils';
import { repo } from './repo/msw/repo';
import type { SessionWithUser } from './repo/types/entities';

type RequestWithSession = Request & {
  session: SessionWithUser;
};

type RequestHandlerWithSession = (
  req: RequestWithSession,
  res: Response,
  next: NextFunction,
) => ReturnType<RequestHandler>;

const withSession = (handler: RequestHandlerWithSession) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const sessionValue = req.cookies[SESSION_ID_NAME] as string | undefined;
    try {
      (req as RequestWithSession).session =
        await getSessionInstanceBySessionValue(sessionValue);
    } catch (error) {
      req.log.error(
        { err: error },
        `Failed to find a session instance by session value. Provided session value: ${sessionValue}`,
      );
      if (sessionValue !== undefined) {
        res.clearCookie(SESSION_ID_NAME, {
          secure: true,
          httpOnly: true,
        });
        res.set('clear-site-data', '"cache"');
      }
      return res.sendStatus(401);
    }

    return await handler(req as RequestWithSession, res, next);
  };
};

const withAuthenticatedResponse = (handler: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const sessionValue = req.cookies[SESSION_ID_NAME] as string | undefined;
    let session;
    try {
      session = await getSessionInstanceBySessionValue(sessionValue);
    } catch {
      // session doesn't exist -> going to the sign-in / sign-up handler
      return await handler(req, res, next);
    }

    if (isSessionFresh(session.expiresAt)) {
      // session exists & fresh -> user is already signed-in
      return res.status(200).json({ authenticated: true });
    }

    // try to delete stale session from the DB, but do not remove cookie,
    // because these routes might re-set the session cookie later
    try {
      repo.deleteSessionByToken(session.token);
    } catch (error) {
      req.log.error(
        { err: error, decorator: withAuthenticatedResponse.name },
        `Failed to delete a session by token: ${session.token}`,
      );
    }
    // session doesn't exist -> going to the sign-in / sign-up handler
    return await handler(req, res, next);
  };
};

const withIsLoggedInCheck = (handler: RequestHandlerWithSession) => {
  return withSession(async (req, res, next) => {
    const session = req.session;
    if (!isSessionFresh(session.expiresAt)) {
      try {
        repo.deleteSessionByToken(session.token);
      } catch (error) {
        req.log.error(
          { err: error, decorator: withIsLoggedInCheck.name },
          `Failed to delete a session by token: ${session.token}`,
        );
      }
      res.set('clear-site-data', '"cache"');
      res.clearCookie(SESSION_ID_NAME, {
        secure: true,
        httpOnly: true,
      });
      return res.sendStatus(401);
    }

    repo.updateSessionIdleTimeout(session.id).catch((error) => {
      req.log.error(
        {
          err: error,
        },
        `Failed to update idle session timeout for the user ${session.user.email}`,
      );
    });

    return await handler(req, res, next);
  });
};

export { withAuthenticatedResponse, withIsLoggedInCheck, withSession };
