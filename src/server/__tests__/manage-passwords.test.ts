import { comparePasswords } from '../lib/manage-password';

const password = 'random-password';
const incorrectPassword = 'incorrect-password';

const passwordHash =
  '$2b$10$mI7I7Wx6w3sTWb43CcHZVutWVfKxtM746kB5p9Tiz3HRSMJbj8I1.';

test("should return false when passwords don't match", async () => {
  await expect(
    comparePasswords({ raw: incorrectPassword, encrypted: passwordHash }),
  ).resolves.toBeFalsy();
});

test('should return true when passwords match', async () => {
  await expect(
    comparePasswords({ raw: password, encrypted: passwordHash }),
  ).resolves.toBeTruthy();
});
