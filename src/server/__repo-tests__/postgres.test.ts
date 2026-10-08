import path from 'path';
import shift from 'postgres-shift';
import { sql } from '../repo/postgres/connection';
import { repo } from '../repo/postgres/repo';
import { getRepoInterfaceTests } from './repo.spec';

describe('postgres repository', () => {
  const { errorTests, successTests } = getRepoInterfaceTests(repo);

  describe('error tests', async () => {
    beforeEach(() => {
      vi.spyOn({ sql }, 'sql').mockRejectedValue(new Error(''));
    });
    errorTests();
  });

  describe('success tests', () => {
    beforeAll(async () => {
      await shift({
        sql,
        path: path.join(
          process.cwd(),
          'src',
          'server',
          'repo',
          'postgres',
          'migrations',
        ),
      });
    });

    afterEach(async () => {
      await sql`truncate table users, sessions restart identity cascade`;
    });
    successTests();
  });
});
