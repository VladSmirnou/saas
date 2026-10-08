import { IDLE_TIMEOUT_MS } from '../../constants/session';
import { errorMessages } from '../constants/error-messages';
import type { Repo, Session, User } from '../types/repo';
import { sql } from './connection';

type QuerySession = Omit<Session, 'id'> & { sessionId: number };
type QueryUser = Omit<User, 'id'> & { userId: number };

export const repo: Repo = {
  async findSessionByToken(token) {
    try {
      const sessions = await sql<[(QueryUser & QuerySession)?]>`
      select
        sessions.id as session_id,
        users.id as user_id,
        expires_at,
        created_at,
        updated_at,
        token,
        secret,
        username,
        email,
        is_email_verified,
        role,
        password
      from sessions join users on sessions.user_id = users.id where token = ${token}`;

      const session = sessions.at(0);
      if (!session) return undefined;

      return {
        id: session.sessionId,
        token: session.token,
        secret: session.secret,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        user: {
          id: session.userId,
          username: session.username,
          email: session.email,
          isEmailVerified: session.isEmailVerified,
          role: session.role,
          password: session.password,
        },
      };
    } catch {
      throw new Error(errorMessages.failedToFindSessionByToken(token));
    }
  },

  async findUserById(id) {
    try {
      const users = await sql<[User?]>`
        select id, username, email, is_email_verified, password, role from users where id = ${id};
      `;
      const user = users.at(0);
      if (!user) return undefined;
      return user;
    } catch {
      throw new Error(errorMessages.failedToFindUserById(id));
    }
  },

  async findUserByEmail(email) {
    try {
      const users = await sql<[User?]>`
        select id, username, email, is_email_verified, password, role from users where email = ${email};
      `;
      const user = users.at(0);
      if (!user) return undefined;
      return user;
    } catch {
      throw new Error(errorMessages.failedToFindUserByEmail(email));
    }
  },

  async deleteSessionsWithExpiredIdleTimeout() {
    try {
      await sql`delete from sessions where updated_at < ${new Date(Date.now() - IDLE_TIMEOUT_MS).toISOString()}`;
    } catch {
      throw new Error(errorMessages.failedToDeleteSessionsWithExpiredTimeout);
    }
  },

  async deleteSessionsWithExpiredAbsoluteTimeout() {
    try {
      await sql`delete from sessions where expires_at < ${new Date(Date.now()).toISOString()}`;
    } catch {
      throw new Error(errorMessages.failedToDeleteSessionsWithAbsoluteTimeout);
    }
  },

  async deleteSessionByToken(token) {
    try {
      await sql`delete from sessions where token = ${token}`;
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
      const sessions = await sql<[Session]>`
        insert into sessions (
          created_at,
          expires_at,
          updated_at,
          token,
          secret,
          user_id
        ) values (
          ${createdAt},
          ${expiresAt},
          ${updatedAt},
          ${token},
          ${secret},
          ${user.id}
        ) returning id, created_at, expires_at, updated_at, token, secret, user_id
      `;
      return sessions[0];
    } catch {
      throw new Error(errorMessages.failedToCreateSession);
    }
  },

  async findUserByUsername(username) {
    try {
      const users = await sql<
        [User?]
      >`select id, username, email, is_email_verified, password, role from users where username = ${username}`;

      const user = users.at(0);
      if (!user) return undefined;

      return user;
    } catch {
      throw new Error(errorMessages.failedToFindUsersByUsername(username));
    }
  },

  async createUser({ email, hashedPassword, username }) {
    try {
      const users = await sql<[User]>`
        insert into users (
          email,
          password,
          username
        ) values (
          ${email},
          ${hashedPassword},
          ${username}
        ) returning id, username, email, password, is_email_verified, role`;
      return users[0];
    } catch {
      throw new Error(errorMessages.failedToCreateUserWithEmail(email));
    }
  },

  async updateSessionIdleTimeout(sessionId) {
    try {
      await sql`update sessions set updated_at = ${new Date(Date.now()).toISOString()} where id = ${sessionId}`;
    } catch {
      throw new Error(
        errorMessages.failedToUpdateSessionIdleTimeout(sessionId),
      );
    }
  },
};
