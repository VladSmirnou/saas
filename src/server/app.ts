import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import * as z from 'zod';
import {
  FAKE_USER,
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_ID_NAME,
} from './constants/session';
import {
  withAuthenticatedResponse,
  withIsLoggedInCheck,
  withSession,
} from './decorators';
import { FakeUserError } from './errors';
import { getUserDTO } from './lib/get-user-dto';
import { comparePasswords, hashPassword } from './lib/manage-password';
import {
  createSessionIdValue,
  getRawSessionTokenAndSecret,
  hashSessionSecret,
  isFakeUser,
} from './lib/session-utils';
import { loggerInstance } from './logger';
import { repo } from './repo/get-current-repo';
import { signInSchema, signupSchema } from './validators';

const port = Number(process.env.PORT!);
const host = process.env.HOST!;

export const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }),
);
app.use(loggerInstance);

app.get(
  '/user',
  withIsLoggedInCheck((req, res) => {
    return res.json({ user: getUserDTO(req.session.user) });
  }),
);

app.post(
  '/sign-in',
  withAuthenticatedResponse(async (req, res) => {
    const requestBody = req.body;
    const { error, data } = signInSchema.safeParse(requestBody);

    if (error) {
      const flatErrors = z.flattenError(error).fieldErrors;
      return res.status(400).json({
        email: flatErrors.email?.[0],
        password: flatErrors.password?.[0],
      });
    }

    const { email, password } = data;

    let user;
    try {
      user = await repo.findUserByEmail(email);
      if (!user) {
        throw new Error("user doesn't exist");
      }
    } catch {
      user = FAKE_USER;
    }

    const userPassword = user.password;

    try {
      const isEqual = await comparePasswords({
        raw: password,
        encrypted: userPassword,
      });

      if (isFakeUser(user)) {
        throw new FakeUserError();
      }
      if (!isEqual) {
        throw new Error("passwords don't match");
      }
    } catch (error) {
      if (error instanceof FakeUserError) {
        const nestedError = error.error;
        req.log.error({ err: nestedError });
      } else {
        req.log.error(
          { err: error },
          `Provided an incorrect password for an email: ${email}`,
        );
      }
      return res.status(401).json({
        server: 'invalid credentials',
      });
    }

    const createdAt = Date.now();
    const createdAtDate = new Date(createdAt).toISOString();
    const sessionExpiresAt = createdAt + SESSION_ABSOLUTE_TIMEOUT_MS;

    const { rawSessionToken, rawSessionSecret } = getRawSessionTokenAndSecret();

    try {
      await repo.createSession({
        createdAt: createdAtDate,
        updatedAt: createdAtDate,
        expiresAt: new Date(sessionExpiresAt).toISOString(),
        user,
        token: rawSessionToken,
        secret: hashSessionSecret(rawSessionSecret),
      });
    } catch (error) {
      req.log.error(
        { err: error },
        `Failed to create a session for a user: ${user.id}`,
      );
      return res.status(401).json({
        server: 'invalid credentials',
      });
    }

    res.cookie(
      SESSION_ID_NAME,
      createSessionIdValue({ rawSessionToken, rawSessionSecret }),
      {
        maxAge: SESSION_ABSOLUTE_TIMEOUT_MS,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      },
    );
    res.set('cache-control', 'no-store');
    req.log.info(`User ${user.id} has logged in successfully.`);
    return res.sendStatus(200);
  }),
);

app.post(
  '/sign-up',
  withAuthenticatedResponse(async (req, res) => {
    const requestBody = req.body;
    const { error, data } = signupSchema.safeParse(requestBody);

    if (error) {
      const flatErrors = z.flattenError(error).fieldErrors;
      return res.status(400).json({
        email: flatErrors.email?.[0],
        password: flatErrors.password?.[0],
        username: flatErrors.username?.[0],
      });
    }

    const { email, password, username } = data;

    let user;
    try {
      user = await repo.findUserByUsername(username);
    } catch (error) {
      req.log.error(
        {
          err: error,
        },
        `Failed to find a used by username: ${username}`,
      );
      return res.status(400).json({
        server: 'Failed to sign-up. Try again',
      });
    }

    if (user) {
      return res
        .status(409)
        .json({ server: 'user with this username already exist' });
    }

    const hashedPassword = await hashPassword(password);

    let userByEmail;
    try {
      userByEmail = await repo.findUserByEmail(email);
    } catch (error) {
      req.log.error({ err: error }, `Failed to find a user by email: ${email}`);
      return res.status(400).json({ server: 'Failed to sign-up' });
    }

    if (userByEmail) {
      req.log.warn(`An attemp to sign-up as a user: ${userByEmail.id}`);
      return res.sendStatus(201);
    }

    try {
      await repo.createUser({
        email,
        hashedPassword,
        username,
      });
      res.sendStatus(201);
    } catch (error) {
      req.log.error(
        {
          err: error,
        },
        `Failed to create a user with email: ${email}`,
      );
      return res.status(400).json({ server: 'Failed to create user' });
    }
  }),
);

app.delete(
  '/sign-out',
  withSession((req, res) => {
    const session = req.session;

    res.clearCookie(SESSION_ID_NAME, {
      secure: true,
      httpOnly: true,
    });
    res.set('clear-site-data', '"cache"');
    try {
      repo.deleteSessionByToken(session.token);
      req.log.info(
        `User: ${session.user.id} has logged out. Session: ${session.token} was successfully terminated.`,
      );
      res.sendStatus(200);
    } catch (error) {
      req.log.error(
        { err: error, userId: session.user.id, sessionToken: session.token },
        'An error occured trying to delete a session in "/sign-out" endpoint',
      );
      res.status(400).json({
        message: 'Failed to logout. Refresh your page and try again.',
      });
    }
  }),
);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, host, () => {
    import('./lib/start-jobs').then(() => {
      loggerInstance.logger.info('all jobs started successfully');
      loggerInstance.logger.info(`server is listening on port:, ${port}`);
    });
  });
}

// Let's run tests for a repo that is currently in use

// I need test configurations per repo
// repoType -> configFile

// configFile -> {
//  a setup code path,
//  tests to include path
// }
