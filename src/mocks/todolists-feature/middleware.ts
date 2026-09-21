import { type HttpResponseResolver, HttpResponse } from 'msw';
import { sessions, users } from './collections';
import { signSessionToken } from './lib/sign-session-token';
import { safeCompareSessionSignatures } from './lib/safe-compare-session-signatures';
import { isSessionFresh } from './lib/is-session-fresh';
import type { NonUndefined } from 'react-hook-form';

type ResolverInputWithSession = Parameters<HttpResponseResolver>[0] & {
  session: ReturnType<typeof getSessionInstanceBySessionValue>;
};

export type SessionResponseResolver = (
  input: ResolverInputWithSession,
) => ReturnType<HttpResponseResolver>;

const getSessionInstanceBySessionValue = (sessionValue: string) => {
  if (!sessionValue) {
    throw new Error('session value is either undefined or an empty string');
  }

  const [token, sessionSignature] = sessionValue.split('.', 2);
  const signature = signSessionToken(token);

  if (!safeCompareSessionSignatures(sessionSignature, signature)) {
    throw new Error('session signature is invalid');
  }

  const session = sessions.findFirst((q) => q.where({ token }));

  if (!session) {
    throw new Error("session doesn't exist");
  }
  return session;
};

const withSession = (resolver: SessionResponseResolver) => {
  return (input: Parameters<HttpResponseResolver>[0]) => {
    const { cookies } = input;
    const sessionValue = cookies.sid;

    try {
      const session = getSessionInstanceBySessionValue(sessionValue);
      resolver({ ...input, session });
    } catch (error) {
      console.log(error);
      return new HttpResponse(null, {
        status: 401,
        headers: new Headers({
          'set-cookie': 'sid=; Max-Age=0; path=/; secure; HttpOnly',
        }),
      });
    }
  };
};

const withLoggedInCheck = (resolver: SessionResponseResolver) => {
  return withSession((input) => {
    const session = input.session;
    if (isSessionFresh(session)) {
      return new HttpResponse(null, {
        status: 303,
        headers: new Headers({
          location: '/',
        }),
      });
    }

    try {
      sessions.delete((q) => q.where({ token: session.token }));
    } catch (error) {
      console.log(error);
    }
    resolver(input);
  });
};

type ResolverInputWithUser = Parameters<HttpResponseResolver>[0] & {
  user: NonUndefined<ReturnType<typeof users.findFirst>>;
};

export type UserResponseResolver = (
  input: ResolverInputWithUser,
) => ReturnType<HttpResponseResolver>;

const withUser = (resolver: UserResponseResolver) => {
  return withLoggedInCheck((input) => {
    const session = input.session;

    try {
      const user = users.findFirst((q) => q.where({ id: session.user.id }));
      if (user) {
        return resolver({ ...input, user });
      }
      sessions.delete((q) => q.where({ token: session.token }));
      throw new Error("User doesn't exist");
    } catch (error) {
      console.log(error);
      return HttpResponse.json(
        { user: null },
        {
          status: 401,
          headers: new Headers({
            'set-cookie': 'sid=; Max-Age=0; path=/; secure; HttpOnly',
          }),
        },
      );
    }
  });
};

export { withSession, withLoggedInCheck, withUser };
