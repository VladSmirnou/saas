import { sessions, users, type Session, type User } from './db';

export const repo = {
  deleteSessionByToken(token: string) {
    try {
      sessions.delete((q) => q.where({ token }));
    } catch {
      throw new Error(`failed to delete a session by token: ${token}`);
    }
  },

  findSessionByToken(token: string) {
    try {
      const session = sessions.findFirst((q) => q.where({ token }));
      if (session) return Object.create(session) as Session;
    } catch {
      throw new Error(`failed to find a session by token: ${token}`);
    }
  },

  findUserById(id: number) {
    try {
      const user = users.findFirst((q) => q.where({ id }));
      if (user) return Object.create(user) as User;
    } catch {
      throw new Error(`Failed to find a user by id: ${id}`);
    }
  },

  async createSession({
    createdAt,
    expiresAt,
    user,
    token,
  }: {
    createdAt: number;
    expiresAt: number;
    token: string;
    user: User;
  }) {
    try {
      const newSession = await sessions.create({
        createdAt: new Date(createdAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        user,
        token,
      });
      return Object.create(newSession) as Session;
    } catch {
      throw new Error('Failed to create a session');
    }
  },

  findUserByEmail(email: string) {
    try {
      const user = users.findFirst((q) => q.where({ email }));
      if (user) return Object.create(user) as User;
    } catch {
      throw new Error(`Failed to find a user with email ${email}`);
    }
  },

  checkUsernameDuplication(username: string) {
    try {
      const user = users.findFirst((q) => q.where({ username }));
      if (user) return true;
      throw new Error('');
    } catch {
      return false;
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
  }) {
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
};
