import { faker } from '@faker-js/faker';
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
  role: z.enum(['admin']).optional(),
});

let nextSessionId = 1;
const sessionSchema = z.object({
  id: z.number().default(() => nextSessionId++),
  token: z.string(),
  expiresAt: z.string(),
  createdAt: z.string().default(() => new Date().toISOString()),
  get user() {
    return usersSchema.pick({ id: true });
  },
});

const users = new Collection({ schema: usersSchema });
const sessions = new Collection({ schema: sessionSchema });

sessions.defineRelations(({ one }) => ({
  user: one(users),
}));

await todolists.createMany(5, (index) => {
  return {
    id: index + 1,
    title: faker.word.noun(),
  };
});

type User = z.infer<typeof usersSchema>;

export { sessions, todolists, users };
export type { User };
