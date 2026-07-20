import { Collection } from '@msw/data';
import { z } from 'zod';
import { faker } from '@faker-js/faker';

const todolists = new Collection({
  schema: z.object({
    id: z.number(),
    title: z.string(),
  }),
});

await todolists.createMany(5, (index) => {
  return {
    id: index + 1,
    title: faker.word.noun(),
  };
});

export { todolists };
