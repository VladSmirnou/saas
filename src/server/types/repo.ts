import type { User, Session } from '../repo/db';
import type { MaybeValue } from './common';

export type Repo = {
  findSessionByToken(token: string): MaybeValue<Session>;
  findUserById(id: number): MaybeValue<User>;
  findUserByEmail(email: string): MaybeValue<User>;
  findUserByUsername(username: string): MaybeValue<User>;
  deleteSessionByToken(token: string): void;
  deleteSessionsWithExpiredIdleTimeout(): void;
  deleteSessionsWithExpiredAbsoluteTimeout(): void;
  updateSessionIdleTimeout(sessionId: number): Promise<void>;
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
