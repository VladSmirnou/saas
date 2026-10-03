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
  secret: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  get user() {
    return usersSchema;
  },
});

const users = new Collection({ schema: usersSchema });
const sessions = new Collection({ schema: sessionSchema });

sessions.defineRelations(({ one }) => ({
  user: one(users),
}));

type User = z.infer<typeof usersSchema>;
type Session = z.infer<typeof sessionSchema>;

export { sessions, todolists, users };
export type { Session, User };

// every time there is a request that uses a session I need to update the
// updatedAt time
// i should run this update after the session was checked on freshness and passed
// i should not await this DB update so that the performance of the application is
// not impacted

// idle timeout -> 5 minutes for example
// every 5 minutes I need to run a delete query

// i need to run a separate process / async job that will check the db for sessions with
// expired idle time using this query ->
// delete from sessions where updatedAt < now - idle timeout

// updatedAt: 10:10
// now: 10:16 - 5 = 10:11
