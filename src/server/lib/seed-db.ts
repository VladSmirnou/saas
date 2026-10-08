import { faker } from '@faker-js/faker';
import { users, todolists } from '../repo/msw/models';
import { hashPassword } from './manage-password';

const passwords: string[] = await Promise.all(
  Array.from({ length: 50 }, (_, k) => k + 1).map(() => {
    return hashPassword(faker.internet.password());
  }),
);

await users.createMany(50, (index) => {
  return {
    email: faker.internet.email(),
    password: passwords[index],
    username: faker.person.fullName(),
    isEmailVerified: false,
  };
});

await todolists.createMany(5, (index) => {
  return {
    id: index + 1,
    title: faker.word.noun(),
  };
});
