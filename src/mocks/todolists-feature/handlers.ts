import { delay, http, HttpResponse, type AnyHandler } from 'msw';
import * as z from 'zod';
import { createUrl } from '../../lib/create-url';
import { sessions, todolists, users } from './collections';
import { getEncryptedSessionToken } from './lib/get-encrypted-session-token';
import { comparePasswords, encryptPassword } from './lib/manage-password';
import { signSessionToken } from './lib/sign-session-token';
import { withLoggedInCheck, withSession, withUser } from './middleware';

const signInSchema = z.object({
  email: z.string().trim().min(3, { error: 'email is invalid' }),
  password: z.string().trim().min(3, { error: 'password is invalid' }),
});

const signupSchema = signInSchema.extend({
  username: z.string().trim().min(3, { error: 'username is invalid' }),
});

export const handlers: AnyHandler[] = [
  http.get(createUrl('todolists'), async () => {
    await delay(500);
    return HttpResponse.json(todolists.findMany());
  }),

  http.post(
    createUrl('sign-in'),
    withLoggedInCheck(async ({ request }) => {
      await delay(500);
      const requestBody = await request.json();
      const { error, data } = signInSchema.safeParse(requestBody);

      if (error) {
        const flatErrors = z.flattenError(error).fieldErrors;
        return new HttpResponse(
          JSON.stringify({
            email: flatErrors.email?.[0],
            password: flatErrors.password?.[0],
          }),
          {
            headers: new Headers({
              'content-type': 'application/json',
            }),
            status: 400,
          },
        );
      }

      const { email, password } = data;

      let user;
      try {
        user = users.findFirst((q) => q.where({ email: email }));
        if (!user) {
          throw new Error("user doesn't exist");
        }
      } catch (error) {
        console.log(error);
        return HttpResponse.json(
          {
            server: 'invalid credentials',
          },
          { status: 401 },
        );
      }

      const userPassword = user.password;

      try {
        await comparePasswords({ candidate: password, standard: userPassword });
      } catch {
        return HttpResponse.json(
          {
            server: 'invalid credentials',
          },
          { status: 401 },
        );
      }

      const sessionToken = getEncryptedSessionToken();

      try {
        const sessionMaxAge = Date.now() + 7 * 24 * 60 * 60 * 1000;

        const newSession = await sessions.create({
          expiresAt: new Date(sessionMaxAge).toISOString(),
          user: { id: user.id },
          token: sessionToken,
        });
        const getSessionSignature = signSessionToken(sessionToken);
        const signedSessionValue = `${newSession.token}.${getSessionSignature}`;

        return new HttpResponse(null, {
          status: 200,
          headers: new Headers({
            'set-cookie': `sid=${signedSessionValue}; Max-Age=${sessionMaxAge}; path=/; secure; HttpOnly; sameSite=lax`,
          }),
        });
      } catch (error) {
        console.log(error);
        return HttpResponse.json(
          {
            server: 'invalid credentials',
          },
          { status: 401 },
        );
      }
    }),
  ),

  http.delete(
    createUrl('sign-out'),
    withSession(async ({ session }) => {
      await delay(500);

      try {
        sessions.delete((q) => q.where({ token: session.token }));
        return new HttpResponse(null, {
          status: 200,
          headers: new Headers({
            'set-cookie': 'sid=; Max-Age=0; path=/; secure; HttpOnly',
          }),
        });
      } catch {
        return HttpResponse.json(
          {
            message:
              'Failed to logout. Try to refresh your page and try again.',
          },
          {
            status: 400,
            headers: new Headers({
              'set-cookie': 'sid=; Max-Age=0; path=/; secure; HttpOnly',
            }),
          },
        );
      }
    }),
  ),

  http.get(
    createUrl('user'),
    withUser(async ({ user }) => {
      await delay(500);

      return HttpResponse.json({ user });
    }),
  ),

  http.post(
    createUrl('sign-up'),
    withLoggedInCheck(async ({ request }) => {
      await delay(500);

      const requestBody = await request.json();

      // validate credentials
      const { error, data } = signupSchema.safeParse(requestBody);
      // validate credentials

      // return invalid credentials error
      if (error) {
        const flatErrors = z.flattenError(error).fieldErrors;
        return new HttpResponse(
          JSON.stringify({
            username: flatErrors.username?.[0],
            email: flatErrors.email?.[0],
            password: flatErrors.password?.[0],
          }),
          {
            headers: new Headers({
              'content-type': 'application/json',
            }),
            status: 400,
          },
        );
      }
      // return invalid credentials error

      // get user
      const user = users.findFirst((q) => q.where({ email: data.email }));
      // get user

      // return fake response on existing user
      if (user) {
        return new HttpResponse(null, {
          status: 201,
        });
      }
      // return fake response on existing user

      // create user
      try {
        await users.create({
          email: data.email,
          username: data.username,
          password: await encryptPassword(data.password),
        });
      } catch (error) {
        return new HttpResponse(
          JSON.stringify({
            server:
              error instanceof Error ?
                error.message
              : 'failed to create a user',
          }),
          {
            headers: new Headers({
              'content-type': 'application/json',
            }),
            status: 400,
          },
        );
      }
      // create user

      // return success response
      return new HttpResponse(null, {
        status: 201,
      });
      // return success response
    }),
  ),
];
