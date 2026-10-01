import { describe } from 'vitest';
import { repo } from '../repo/repo';
import {
  getRepoInterfaceTests,
  userData,
  sessionDataWithNoUser,
} from './repo.spec';
import { sessions, users } from '../repo/db';

describe('msw-data repository', () => {
  const { errorTests, successTests } = getRepoInterfaceTests(repo);

  describe('error tests', async () => {
    beforeEach(() => {
      vitest.spyOn(sessions, 'findFirst').mockImplementation(() => {
        throw new Error('');
      });
      vitest.spyOn(sessions, 'findMany').mockImplementation(() => {
        throw new Error('');
      });
      vitest.spyOn(sessions, 'create').mockRejectedValue(new Error(''));
      vitest.spyOn(users, 'create').mockRejectedValue(new Error(''));
      vitest.spyOn(users, 'findFirst').mockImplementation(() => {
        throw new Error('');
      });
    });
    errorTests();
  });

  describe('success tests', () => {
    beforeEach(async () => {
      const newUser = await users.create(userData);
      await sessions.create({
        ...sessionDataWithNoUser,
        user: newUser,
      });
    });
    afterEach(() => {
      sessions.clear();
      users.clear();
    });

    successTests();
  });
});

// i need to have at least one user and one session before running
// each test
