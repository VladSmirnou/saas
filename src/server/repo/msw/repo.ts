import { IDLE_TIMEOUT_MS } from '../../constants/session';
import { errorMessages } from '../constants/error-messages';
import type { Repo } from '../types/repo';
import { sessions, users } from './models';

export const repo: Repo = {
  async findSessionByToken(token) {
    try {
      return sessions.findFirst((q) => q.where({ token }));
    } catch {
      throw new Error(errorMessages.failedToFindSessionByToken(token));
    }
  },

  async findUserById(id) {
    try {
      return users.findFirst((q) => q.where({ id }));
    } catch {
      throw new Error(errorMessages.failedToFindUserById(id));
    }
  },

  async findUserByEmail(email) {
    try {
      return users.findFirst((q) => q.where({ email }));
    } catch {
      throw new Error(errorMessages.failedToFindUserByEmail(email));
    }
  },

  async deleteSessionsWithExpiredIdleTimeout() {
    try {
      sessions.deleteMany((q) =>
        q.where({
          updatedAt: (data) =>
            new Date(data).getTime() < new Date().getTime() - IDLE_TIMEOUT_MS,
        }),
      );
    } catch {
      throw new Error(errorMessages.failedToDeleteSessionsWithExpiredTimeout);
    }
  },

  async deleteSessionsWithExpiredAbsoluteTimeout() {
    try {
      sessions.deleteMany((q) =>
        q.where({
          expiresAt: (data) => new Date(data).getTime() < new Date().getTime(),
        }),
      );
    } catch {
      throw new Error(errorMessages.failedToDeleteSessionsWithAbsoluteTimeout);
    }
  },

  async deleteSessionByToken(token) {
    try {
      sessions.delete((q) => q.where({ token }));
    } catch {
      throw new Error(errorMessages.failedToDeleteSessionByToken(token));
    }
  },

  async createSession({
    createdAt,
    expiresAt,
    updatedAt,
    user,
    token,
    secret,
  }) {
    try {
      const newSession = await sessions.create({
        createdAt,
        expiresAt,
        updatedAt,
        user,
        token,
        secret,
      });
      return {
        createdAt: newSession.createdAt,
        expiresAt: newSession.expiresAt,
        updatedAt: newSession.updatedAt,
        id: newSession.id,
        secret: newSession.secret,
        token: newSession.token,
        userId: newSession.user.id,
      };
    } catch {
      throw new Error(errorMessages.failedToCreateSession);
    }
  },

  async updateSessionIdleTimeout(sessionId) {
    try {
      await sessions.update(
        (q) =>
          q.where({
            id: sessionId,
          }),
        {
          data(session) {
            session.updatedAt = new Date(Date.now()).toISOString();
          },
        },
      );
    } catch {
      throw new Error(
        errorMessages.failedToUpdateSessionIdleTimeout(sessionId),
      );
    }
  },

  async createUser({ email, hashedPassword, username }) {
    try {
      return await users.create({
        email,
        password: hashedPassword,
        username,
      });
    } catch {
      throw new Error(errorMessages.failedToCreateUserWithEmail(email));
    }
  },

  async findUserByUsername(username) {
    try {
      return users.findFirst((q) => q.where({ username }));
    } catch {
      throw new Error(errorMessages.failedToFindUsersByUsername(username));
    }
  },
};
