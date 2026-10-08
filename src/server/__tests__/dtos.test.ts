import { expect } from 'vitest';
import { getUserDTO } from '../lib/get-user-dto';
import { test } from 'vitest';
import type { User } from '../repo/types/entities';

const dbUser: User = {
  email: 'email',
  id: 1,
  isEmailVerified: true,
  username: 'username',
  password: 'password',
  role: null,
};

test('should return exposed user properties', () => {
  expect(getUserDTO(dbUser)).toEqual({
    email: 'email',
    id: 1,
    isEmailVerified: true,
    username: 'username',
    role: null,
  });
});
