import type { User } from '../repo/types/entities';

export const getUserDTO = (user: User) => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    isEmailVerified: user.isEmailVerified,
    role: user.role,
  } as Omit<User, 'password'>;
};
