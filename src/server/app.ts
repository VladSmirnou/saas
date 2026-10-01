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
  withSession,
  withSessionAndUser,
} from './decorators';
import { getUserDTO } from './lib/get-user-dto';
import { comparePasswords, hashPassword } from './lib/manage-password';
import {
  getEncryptedSessionToken,
  isFakeUser,
  signSessionToken,
} from './lib/session-utils';
import { repo } from './repo/repo';
import { signInSchema, signupSchema } from './validators';
import { users } from './repo/db';

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

app.get(
  '/user',
  withSessionAndUser((req, res) => {
    return res.json({ user: getUserDTO(req.user) });
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
      user = repo.findUserByEmail(email);
      if (!user) {
        throw new Error("user doesn't exist");
      }
    } catch (error) {
      console.log(error);
      user = FAKE_USER;
    }

    const userPassword = user.password;

    try {
      const isEqual = await comparePasswords({
        raw: password,
        encrypted: userPassword,
      });
      if (isFakeUser(user) || !isEqual) {
        throw new Error("passwords don't match");
      }
    } catch (error) {
      console.log(error);
      return res.status(401).json({
        server: 'invalid credentials',
      });
    }

    const sessionToken = getEncryptedSessionToken();

    try {
      const createdAt = Date.now();
      const createdAtDate = new Date(createdAt).toISOString();

      const sessionExpiresAt = createdAt + SESSION_ABSOLUTE_TIMEOUT_MS;

      const newSession = await repo.createSession({
        createdAt: createdAtDate,
        updatedAt: createdAtDate,
        expiresAt: new Date(sessionExpiresAt).toISOString(),
        user,
        token: sessionToken,
      });

      const newSessionToken = newSession.token;
      const newSessionSignature = signSessionToken(newSessionToken);
      const signedSessionIdValue = `${newSessionToken}.${newSessionSignature}`;

      res.cookie(SESSION_ID_NAME, signedSessionIdValue, {
        maxAge: SESSION_ABSOLUTE_TIMEOUT_MS,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
      res.set('cache-control', 'no-store');
      return res.sendStatus(200);
    } catch (error) {
      console.log(error);
      return res.status(401).json({
        server: 'invalid credentials',
      });
    }
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

    const user = repo.findUserByUsername(username);

    if (user) {
      return res
        .status(409)
        .json({ server: 'user with this username already exist' });
    }

    const hashedPassword = await hashPassword(password);

    let userByEmail;
    try {
      userByEmail = repo.findUserByEmail(email);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ server: 'Failed to sign-up' });
    }

    if (userByEmail) {
      return res.sendStatus(201);
    }

    try {
      await repo.createUser({
        email,
        hashedPassword,
        username,
      });
      console.log(users.findMany());
      res.sendStatus(201);
    } catch (error) {
      console.log(error);
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
    res.set('clear-site-data', '"cookies", "cache"');
    try {
      repo.deleteSessionByToken(session.token);
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.status(400).json({
        message: 'Failed to logout. Refresh your page and try again.',
      });
    }
  }),
);

app.listen(port, host, () => {
  console.log('server is listening on port:', port);
  import('./lib/seed-db')
    .then(() => {
      console.log('successfully seeded the DB');
    })
    .then(() => {
      import('./lib/start-jobs').then(() => {
        console.log('all jobs started successfully');
      });
    });
});
