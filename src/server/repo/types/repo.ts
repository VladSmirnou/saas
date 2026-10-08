import type { MaybeValue } from '../../types/common';
import type { User, Session, SessionWithUser } from './entities';

type Repo = {
  findSessionByToken(token: string): Promise<MaybeValue<SessionWithUser>>;
  findUserById(id: number): Promise<MaybeValue<User>>;
  findUserByEmail(email: string): Promise<MaybeValue<User>>;
  findUserByUsername(username: string): Promise<MaybeValue<User>>;
  updateSessionIdleTimeout(sessionId: number): Promise<void>;
  deleteSessionByToken(token: string): Promise<void>;
  deleteSessionsWithExpiredIdleTimeout(): Promise<void>;
  deleteSessionsWithExpiredAbsoluteTimeout(): Promise<void>;
  createUser({
    email,
    hashedPassword,
    username,
  }: {
    email: string;
    hashedPassword: string;
    username: string;
  }): Promise<User>;
  createSession({
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
    secret: string;
    user: User;
  }): Promise<Session>;
};

export type { Repo, User, Session };
