import {
  IDLE_TIMEOUT,
  SESSION_ABSOLUTE_TIMEOUT_MS,
} from '../constants/session';
import type { User, Session } from '../repo/db';
import type { Repo } from '../types/repo';

vi.setSystemTime(new Date('2000-01-01T00:00:00Z'));

const randomTokenName = 'some token';
const randomEmail = 'some email';
const randomPassword = 'some password';
const randomId = 11231;
const randomUsername = 'username12123123123';

const userData: User = {
  id: 1,
  username: 'username',
  email: 'email@gmail.com',
  password: 'password',
  isEmailVerified: false,
};

const timeNow = Date.now();
const createdAtDate = new Date(timeNow).toISOString();

const sessionDataWithNoUser: Omit<Session, 'user'> = {
  id: 1,
  createdAt: createdAtDate,
  updatedAt: createdAtDate,
  expiresAt: new Date(timeNow + SESSION_ABSOLUTE_TIMEOUT_MS).toISOString(),
  token: 'token',
  secret: 'secret',
};

const getRepoInterfaceTests = (repo: Repo) => {
  return {
    errorTests: () => {
      test.for([
        {
          method: async () => repo.findSessionByToken(randomTokenName),
          errorText: `failed to find a session by token: ${randomTokenName}`,
          operation: repo.findSessionByToken.name,
        },
        {
          method: async () => repo.findUserById(randomId),
          errorText: `Failed to find a user by id: ${randomId}`,
          operation: repo.findUserById.name,
        },
        {
          method: async () => repo.deleteSessionByToken(randomTokenName),
          errorText: `failed to delete a session by token: ${randomTokenName}`,
          operation: repo.deleteSessionByToken.name,
        },
        {
          method: async () => repo.deleteSessionsWithExpiredIdleTimeout(),
          errorText: 'failed to delete sessions with expired idle timeout',
          operation: repo.deleteSessionsWithExpiredIdleTimeout.name,
        },
        {
          method: async () =>
            repo.createSession({
              createdAt: '',
              expiresAt: '',
              token: '',
              secret: '',
              updatedAt: '',
              user: {} as User,
            }),
          errorText: 'Failed to create a session',
          operation: repo.createSession.name,
        },
        {
          method: async () =>
            repo.createUser({
              email: 'some-email',
              hashedPassword: '',
              username: randomUsername,
            }),
          errorText: 'Failed to create a user with email: some-email',
          operation: repo.createUser.name,
        },
        {
          method: async () => repo.updateSessionIdleTimeout(randomId),
          errorText: `failed to update session idle timeout. Session id: ${randomId}`,
          operation: repo.updateSessionIdleTimeout.name,
        },
        {
          method: async () => repo.findUserByUsername(randomUsername),
          errorText: `failed to find users by username: ${randomUsername}`,
          operation: repo.findUserByUsername.name,
        },
      ])(
        `should throw a correct error message when $operation fails`,
        async ({ method, errorText }) => {
          await expect(() => method()).rejects.toThrow(errorText);
        },
      );
    },
    successTests: () => {
      test.for([
        () => repo.findSessionByToken(randomTokenName),
        () => repo.findUserById(randomId),
        () => repo.findUserByEmail('email'),
        () => repo.findUserByUsername(randomUsername),
      ])('should return undefined when an entity is not found', (method) => {
        expect(method()).toBeUndefined();
      });

      it('should create a user', async () => {
        const userData = {
          email: 'new-email@gmail.com',
          hashedPassword: 'my-password',
          username: 'username',
        };
        const newUser = await repo.createUser(userData);
        expect(newUser).toEqual({
          id: expect.any(Number),
          username: userData.username,
          password: userData.hashedPassword,
          email: userData.email,
          isEmailVerified: false,
        });
        expect(repo.findUserByEmail(newUser.email)).toEqual(newUser);
      });

      it('should create a new session', async () => {
        const sessionData = {
          createdAt: 'date',
          expiresAt: 'date',
          updatedAt: 'date',
          token: 'random-token',
          secret: 'random-secret',
        };
        const founduser = repo.findUserById(userData.id)!;

        const newSession = await repo.createSession({
          ...sessionData,
          user: founduser,
        });
        expect(newSession).toEqual({
          id: expect.any(Number),
          ...sessionData,
          user: founduser,
        });
        expect(repo.findSessionByToken(newSession.token)).toEqual(newSession);
      });

      it('should find a session by token', async () => {
        const session = repo.findSessionByToken(sessionDataWithNoUser.token);
        expect(session).toEqual({
          ...sessionDataWithNoUser,
          user: userData,
        });
      });

      it('should find a user by id', () => {
        const user = repo.findUserById(userData.id);
        expect(user).toEqual(userData);
      });

      it('should find a user by email', () => {
        const user = repo.findUserByEmail(userData.email);
        expect(user).toEqual(userData);
      });

      it('should find the first user with provided username', () => {
        const user = repo.findUserByUsername(userData.username);
        expect(user).toEqual(userData);
      });

      it('should delete a session by token', () => {
        repo.deleteSessionByToken(sessionDataWithNoUser.token);
        const session = repo.findSessionByToken(sessionDataWithNoUser.token);
        expect(session).toBeUndefined();
      });

      it('should update session idle timeout', async () => {
        vi.setSystemTime(timeNow + IDLE_TIMEOUT);

        await repo.updateSessionIdleTimeout(sessionDataWithNoUser.id);

        expect(
          repo.findSessionByToken(sessionDataWithNoUser.token)?.updatedAt,
        ).toBe(
          new Date(
            Date.parse(sessionDataWithNoUser.updatedAt) + IDLE_TIMEOUT,
          ).toISOString(),
        );

        vi.setSystemTime(timeNow);
      });

      it('should delete session with expired idle timeout', async () => {
        const timeNowPlusIdleTimeout = timeNow + IDLE_TIMEOUT;
        const createdAt = new Date(timeNowPlusIdleTimeout).toISOString();

        vi.setSystemTime(timeNowPlusIdleTimeout + 1);

        const newUser = await repo.createUser({
          email: randomEmail,
          hashedPassword: randomPassword,
          username: userData.username,
        });
        const session = await repo.createSession({
          ...sessionDataWithNoUser,
          token: randomTokenName,
          createdAt,
          updatedAt: createdAt,
          user: newUser,
        });

        repo.deleteSessionsWithExpiredIdleTimeout();

        expect(
          repo.findSessionByToken(sessionDataWithNoUser.token),
        ).toBeUndefined();
        expect(repo.findSessionByToken(session.token)).toEqual(session);

        vi.setSystemTime(timeNow);
      });
    },
  };
};

export { userData, getRepoInterfaceTests, sessionDataWithNoUser };
