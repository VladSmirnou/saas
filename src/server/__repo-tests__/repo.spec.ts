import {
  IDLE_TIMEOUT_MS,
  SESSION_ABSOLUTE_TIMEOUT_MS,
} from '../constants/session';
import type { Repo, Session, User } from '../repo/types/repo';

vi.setSystemTime(new Date('2000-01-01T00:00:00Z'));

const randomTokenName = 'some token';
const randomId = -1;

const userData: User = {
  id: 1,
  username: 'username',
  email: 'email@gmail.com',
  password: 'password',
  isEmailVerified: false,
  role: null,
};

const newUserPayload = {
  email: 'some email',
  password: 'some password',
  username: 'username12123123123',
};

const timeNow = Date.now();
const createdAtDate = new Date(timeNow).toISOString();

const sessionDataWithNoUser: Session = {
  id: 1,
  createdAt: createdAtDate,
  updatedAt: createdAtDate,
  expiresAt: new Date(timeNow + SESSION_ABSOLUTE_TIMEOUT_MS).toISOString(),
  token: 'token',
  secret: 'secret',
  userId: 1,
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
          errorText: `failed to find a user by id: ${randomId}`,
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
          errorText: 'failed to create a session',
          operation: repo.createSession.name,
        },
        {
          method: async () =>
            repo.createUser({
              email: newUserPayload.email,
              hashedPassword: newUserPayload.password,
              username: newUserPayload.username,
            }),
          errorText: `failed to create a user with email: ${newUserPayload.email}`,
          operation: repo.createUser.name,
        },
        {
          method: async () => repo.updateSessionIdleTimeout(randomId),
          errorText: `failed to update session idle timeout. Session id: ${randomId}`,
          operation: repo.updateSessionIdleTimeout.name,
        },
        {
          method: async () => repo.findUserByUsername(newUserPayload.username),
          errorText: `failed to find users by username: ${newUserPayload.username}`,
          operation: repo.findUserByUsername.name,
        },
        {
          method: async () => repo.findUserByEmail(newUserPayload.email),
          errorText: `failed to find a user by email ${newUserPayload.email}`,
          operation: repo.findUserByEmail.name,
        },
        {
          method: async () => repo.deleteSessionsWithExpiredAbsoluteTimeout(),
          errorText: 'failed to delete sessions with expired absolute timeout',
          operation: repo.deleteSessionsWithExpiredAbsoluteTimeout.name,
        },
      ])(
        `should throw a correct error message when $operation fails`,
        async ({ method, errorText }) => {
          await expect(() => method()).rejects.toThrow(errorText);
        },
      );
    },
    successTests: () => {
      beforeEach(async () => {
        const newUser = await repo.createUser({
          email: userData.email,
          hashedPassword: userData.password,
          username: userData.username,
        });
        await repo.createSession({
          ...sessionDataWithNoUser,
          user: newUser,
        });
      });

      test.for([
        () => repo.findSessionByToken(randomTokenName),
        () => repo.findUserById(randomId),
        () => repo.findUserByEmail(newUserPayload.email),
        () => repo.findUserByUsername(newUserPayload.username),
      ])(
        'should return undefined when an entity is not found',
        async (method) => {
          await expect(method()).resolves.toBeUndefined();
        },
      );

      it('should create a user', async () => {
        const newUser = await repo.createUser({
          email: newUserPayload.email,
          hashedPassword: newUserPayload.password,
          username: newUserPayload.username,
        });
        expect(newUser).toEqual({
          id: expect.any(Number),
          username: newUserPayload.username,
          password: newUserPayload.password,
          email: newUserPayload.email,
          isEmailVerified: false,
          role: null,
        });
      });

      it('should create a new session', async () => {
        const sessionData = {
          createdAt: 'date',
          expiresAt: 'date',
          updatedAt: 'date',
          token: 'random-token',
          secret: 'random-secret',
        };
        const newUser = await repo.createUser({
          email: newUserPayload.email,
          hashedPassword: newUserPayload.password,
          username: newUserPayload.username,
        });

        const newSession = await repo.createSession({
          ...sessionData,
          user: newUser,
        });
        expect(newSession).toEqual({
          id: expect.any(Number),
          ...sessionData,
          userId: newUser.id,
        });
        await expect(
          repo.findSessionByToken(newSession.token),
        ).resolves.toEqual({
          id: newSession.id,
          secret: sessionData.secret,
          token: sessionData.token,
          createdAt: sessionData.createdAt,
          updatedAt: sessionData.updatedAt,
          expiresAt: sessionData.expiresAt,
          user: newUser,
        });
      });

      it('should find a session by token', async () => {
        const session = await repo.findSessionByToken(
          sessionDataWithNoUser.token,
        );
        expect(session).toEqual({
          id: sessionDataWithNoUser.id,
          createdAt: sessionDataWithNoUser.createdAt,
          updatedAt: sessionDataWithNoUser.updatedAt,
          expiresAt: sessionDataWithNoUser.expiresAt,
          token: sessionDataWithNoUser.token,
          secret: sessionDataWithNoUser.secret,
          user: userData,
        });
      });

      it('should find a user by id', async () => {
        const user = await repo.findUserById(userData.id);
        expect(user).toEqual(userData);
      });

      it('should find a user by email', async () => {
        const user = await repo.findUserByEmail(userData.email);
        expect(user).toEqual(userData);
      });

      it('should find the first user with provided username', async () => {
        const user = await repo.findUserByUsername(userData.username);
        expect(user).toEqual(userData);
      });

      it('should delete a session by token', async () => {
        await repo.deleteSessionByToken(sessionDataWithNoUser.token);
        const session = await repo.findSessionByToken(
          sessionDataWithNoUser.token,
        );
        expect(session).toBeUndefined();
      });

      it('should update session idle timeout', async () => {
        vi.setSystemTime(timeNow + IDLE_TIMEOUT_MS);

        await repo.updateSessionIdleTimeout(sessionDataWithNoUser.id);
        const session = (await repo.findSessionByToken(
          sessionDataWithNoUser.token,
        ))!;
        expect(session.updatedAt).toBe(
          new Date(
            Date.parse(sessionDataWithNoUser.updatedAt) + IDLE_TIMEOUT_MS,
          ).toISOString(),
        );

        vi.setSystemTime(timeNow);
      });

      it('should delete session with expired idle timeout', async () => {
        const timeNowPlusIdleTimeout = timeNow + IDLE_TIMEOUT_MS;
        const createdAt = new Date(timeNowPlusIdleTimeout).toISOString();

        vi.setSystemTime(timeNowPlusIdleTimeout + 1);

        const newUser = await repo.createUser({
          email: newUserPayload.email,
          hashedPassword: newUserPayload.password,
          username: newUserPayload.username,
        });
        const newSession = await repo.createSession({
          ...sessionDataWithNoUser,
          token: randomTokenName,
          createdAt,
          updatedAt: createdAt,
          user: newUser,
        });

        await repo.deleteSessionsWithExpiredIdleTimeout();

        await expect(
          repo.findSessionByToken(sessionDataWithNoUser.token),
        ).resolves.toBeUndefined();
        await expect(
          repo.findSessionByToken(newSession.token),
        ).resolves.toEqual({
          id: newSession.id,
          secret: newSession.secret,
          token: newSession.token,
          createdAt: newSession.createdAt,
          updatedAt: newSession.updatedAt,
          expiresAt: newSession.expiresAt,
          user: newUser,
        });

        vi.setSystemTime(timeNow);
      });

      it('should delete session with expired absolute timeout', async () => {
        const timeNowPlusAbsoluteTimeout =
          timeNow + SESSION_ABSOLUTE_TIMEOUT_MS;
        const createdAt = new Date(timeNowPlusAbsoluteTimeout).toISOString();

        vi.setSystemTime(timeNowPlusAbsoluteTimeout + 1);

        const newUser = await repo.createUser({
          email: newUserPayload.email,
          hashedPassword: newUserPayload.password,
          username: newUserPayload.username,
        });
        const newSession = await repo.createSession({
          secret: sessionDataWithNoUser.secret,
          token: randomTokenName,
          createdAt,
          updatedAt: createdAt,
          expiresAt: new Date(
            timeNowPlusAbsoluteTimeout + SESSION_ABSOLUTE_TIMEOUT_MS,
          ).toISOString(),
          user: newUser,
        });

        await repo.deleteSessionsWithExpiredAbsoluteTimeout();

        await expect(
          repo.findSessionByToken(sessionDataWithNoUser.token),
        ).resolves.toBeUndefined();
        await expect(
          repo.findSessionByToken(newSession.token),
        ).resolves.toEqual({
          id: newSession.id,
          secret: newSession.secret,
          token: newSession.token,
          createdAt: newSession.createdAt,
          updatedAt: newSession.updatedAt,
          expiresAt: newSession.expiresAt,
          user: newUser,
        });

        vi.setSystemTime(timeNow);
      });
    },
  };
};

export { userData, getRepoInterfaceTests, sessionDataWithNoUser };
