import { Collection } from '@msw/data';
import { z } from 'zod';

const todolists = new Collection({
  schema: z.object({
    id: z.number(),
    title: z.string(),
  }),
});

let nextUserId = 1;
const usersSchema = z.object({
  id: z.number().default(() => nextUserId++),
  username: z.string(),
  email: z.string(),
  password: z.string(),
  isEmailVerified: z.boolean().default(() => false),
  role: z
    .enum(['admin'])
    .nullable()
    .default(() => null),
});

let nextSessionId = 1;
const sessionSchema = z.object({
  id: z.number().default(() => nextSessionId++),
  token: z.string(),
  secret: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  get user() {
    return usersSchema;
  },
});

let userAccountId = 1;
const userAccountSchema = z.object({
  id: z.number().default(() => userAccountId++),
  createdAt: z.string(),
  password: z.string(),
});

const users = new Collection({ schema: usersSchema });
const sessions = new Collection({ schema: sessionSchema });
const accounts = new Collection({ schema: userAccountSchema });

sessions.defineRelations(({ one }) => ({
  user: one(users),
}));

const resetAutoincrementIds = () => {
  nextUserId = 1;
  nextSessionId = 1;
  userAccountId = 1;
};

export { sessions, todolists, users, accounts, resetAutoincrementIds };
