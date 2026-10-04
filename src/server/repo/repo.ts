import { IDLE_TIMEOUT_MS } from '../constants/session';
import type { MaybeValue } from '../types/common';
import type { Repo } from '../types/repo';
import { sessions, users, type Session, type User } from './db';

export const repo: Repo = {
  findSessionByToken(token: string): MaybeValue<Session> {
    try {
      return sessions.findFirst((q) => q.where({ token }));
    } catch {
      throw new Error(`failed to find a session by token: ${token}`);
    }
  },

  findUserById(id: number): MaybeValue<User> {
    try {
      return users.findFirst((q) => q.where({ id }));
    } catch {
      throw new Error(`Failed to find a user by id: ${id}`);
    }
  },

  findUserByEmail(email: string): MaybeValue<User> {
    try {
      return users.findFirst((q) => q.where({ email }));
    } catch {
      throw new Error(`Failed to find a user with email ${email}`);
    }
  },

  deleteSessionsWithExpiredIdleTimeout() {
    try {
      sessions.deleteMany((q) =>
        q.where({
          updatedAt: (data) =>
            new Date(data).getTime() < new Date().getTime() - IDLE_TIMEOUT_MS,
        }),
      );
    } catch {
      throw new Error('failed to delete sessions with expired idle timeout');
    }
  },

  deleteSessionsWithExpiredAbsoluteTimeout() {
    try {
      sessions.deleteMany((q) =>
        q.where({
          expiresAt: (data) => new Date(data).getTime() < new Date().getTime(),
        }),
      );
    } catch {
      throw new Error('failed to delete sessions with expired idle timeout');
    }
  },

  deleteSessionByToken(token: string) {
    try {
      sessions.delete((q) => q.where({ token }));
    } catch {
      throw new Error(`failed to delete a session by token: ${token}`);
    }
  },

  async createSession({
    createdAt,
    expiresAt,
    updatedAt,
    user,
    token,
    secret,
  }: {
    createdAt: string;
    expiresAt: string;
    updatedAt: string;
    token: string;
    user: User;
    secret: string;
  }): Promise<Session> {
    try {
      return await sessions.create({
        createdAt,
        expiresAt,
        updatedAt,
        user,
        token,
        secret,
      });
    } catch {
      throw new Error('Failed to create a session');
    }
  },

  async updateSessionIdleTimeout(sessionId: number) {
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
        `failed to update session idle timeout. Session id: ${sessionId}`,
      );
    }
  },

  async createUser({
    email,
    hashedPassword,
    username,
  }: {
    email: string;
    hashedPassword: string;
    username: string;
  }): Promise<User> {
    try {
      return await users.create({
        email,
        password: hashedPassword,
        username,
      });
    } catch {
      throw new Error(`Failed to create a user with email: ${email}`);
    }
  },

  findUserByUsername(username: string): MaybeValue<User> {
    try {
      return users.findFirst((q) => q.where({ username }));
    } catch {
      throw new Error(`failed to find users by username: ${username}`);
    }
  },
};
