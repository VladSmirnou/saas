import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { SESSION_ID_NAME } from './constants/session';
import {
  getSessionInstanceBySessionValue,
  isSessionFresh,
} from './lib/session-utils';
import { sessions, type Session, type User } from './repo/db';
import { repo } from './repo/repo';

type RequestWithSession = Request & {
  session: Session;
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
        getSessionInstanceBySessionValue(sessionValue);
    } catch (error) {
      console.log(error);
      if (sessionValue !== undefined) {
        res.clearCookie(SESSION_ID_NAME);
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
      session = getSessionInstanceBySessionValue(sessionValue);
    } catch {
      // session doesn't exist -> going to the sign-in / sign-up handler
      return await handler(req, res, next);
    }

    if (isSessionFresh(session)) {
      // session exists & fresh -> user is already signed-in
      return res.status(200).json({ authenticated: true });
    }

    // try to delete stale session from the DB, but do not remove cookie,
    // because these routes might re-set the session cookie later
    try {
      sessions.delete((q) => q.where({ token: session.token }));
    } catch (error) {
      console.log(error);
    }
    // session doesn't exist -> going to the sign-in / sign-up handler
    return await handler(req, res, next);
  };
};

const withIsLoggedInCheck = (handler: RequestHandlerWithSession) => {
  return withSession(async (req, res, next) => {
    const session = req.session;
    if (!isSessionFresh(session)) {
      try {
        sessions.delete((q) => q.where({ token: session.token }));
      } catch (error) {
        console.log(error);
      }
      res.clearCookie(SESSION_ID_NAME);
      return res.sendStatus(401);
    }

    return await handler(req, res, next);
  });
};

type RequestWithSessionAndUser = RequestWithSession & {
  user: User;
};

type RequestHandlerWithSessionAndUser = (
  req: RequestWithSessionAndUser,
  res: Response,
  next: NextFunction,
) => ReturnType<RequestHandler>;

const withSessionAndUser = (handler: RequestHandlerWithSessionAndUser) => {
  return withIsLoggedInCheck(async (req, res, next) => {
    const session = req.session;
    try {
      const user = repo.findUserById(session.user.id);
      if (!user) {
        sessions.delete((q) => q.where({ token: session.token }));
        throw new Error("User doesn't exist");
      }
      (req as RequestWithSessionAndUser).user = user;
    } catch (error) {
      console.log(error);
      res.clearCookie(SESSION_ID_NAME);
      return res.sendStatus(401);
    }

    await handler(req as RequestWithSessionAndUser, res, next);
  });
};

export { withAuthenticatedResponse, withSession, withSessionAndUser };
