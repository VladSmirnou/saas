import { describe } from 'vitest';
import { resetAutoincrementIds, sessions, users } from '../repo/msw/models';
import { repo } from '../repo/msw/repo';
import { getRepoInterfaceTests } from './repo.spec';

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
    afterEach(() => {
      sessions.clear();
      users.clear();
      resetAutoincrementIds();
    });

    successTests();
  });
});
