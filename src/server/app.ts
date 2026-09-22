import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import * as z from 'zod';
import { SESSION_ID_NAME } from './constants/session';
import { sessions, users, type User } from './db';
import {
  withAuthenticatedResponse,
  withSession,
  withSessionAndUser,
} from './decorators';
import { getEncryptedSessionToken } from './lib/get-encrypted-session-token';
import { comparePasswords, hashPassword } from './lib/manage-password';
import { signSessionToken } from './lib/sign-session-token';
import { signInSchema, signupSchema } from './validators';

const port = process.env.PORT;

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

const getUserDTO = (user: User) => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    isEmailVerified: user.isEmailVerified,
    role: user.role,
  } as Omit<User, 'password'>;
};

app.get(
  '/user',
  withSessionAndUser((req, res) => {
    return res.json({
      user: getUserDTO(req.user),
    });
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
      user = users.findFirst((q) => q.where({ email }));
      if (!user) {
        throw new Error("user doesn't exist");
      }
    } catch (error) {
      console.log(error);
      return res.status(401).json({
        server: 'invalid credentials',
      });
    }

    const userPassword = user.password;

    try {
      await comparePasswords({ raw: password, encrypted: userPassword });
    } catch {
      return res.status(401).json({
        server: 'invalid credentials',
      });
    }

    const sessionToken = getEncryptedSessionToken();

    try {
      const createdAt = Date.now();

      const sessionMaxAge = createdAt + 7 * 24 * 60 * 60 * 1000;

      const newSession = await sessions.create({
        createdAt: new Date(createdAt).toISOString(),
        expiresAt: new Date(sessionMaxAge).toISOString(),
        user,
        token: sessionToken,
      });
      const newSessionToken = newSession.token;
      const newSessionSignature = signSessionToken(newSessionToken);
      const signedSessionIdValue = `${newSessionToken}.${newSessionSignature}`;

      res.cookie(SESSION_ID_NAME, signedSessionIdValue, {
        maxAge: sessionMaxAge,
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'lax',
      });
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
      return res
        .json({
          email: flatErrors.email?.[0],
          password: flatErrors.password?.[0],
          username: flatErrors.username?.[0],
        })
        .status(400);
    }

    const { email, password, username } = data;

    const userByUsername = users.findFirst((q) => q.where({ username }));

    if (userByUsername) {
      return res
        .status(409)
        .json({ server: 'user with this username already exist' });
    }

    const userByEmail = users.findFirst((q) => q.where({ email }));

    const hashedPassword = await hashPassword(password);

    if (userByEmail) {
      // timing here will be a lot faster than in the branch below
      return res.sendStatus(201);
    }

    try {
      await users.create({
        email,
        password: hashedPassword,
        username,
      });
      res.sendStatus(201);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ server: 'failed to create user' });
    }
  }),
);

app.delete(
  '/sign-out',
  withSession((req, res) => {
    const session = req.session;

    try {
      sessions.delete((q) => q.where({ token: session.token }));
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.status(400).json({
        message: 'Failed to logout. Refresh your page and try again.',
      });
    }
    res.clearCookie(SESSION_ID_NAME);
  }),
);

app.listen(port, () => {
  console.log('server is listening on port:', port);
});
