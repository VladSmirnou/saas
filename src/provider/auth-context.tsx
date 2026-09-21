import { createContext, use } from 'react';
import type { User } from '../mocks/todolists-feature/collections';

export type AuthContextType = {
  userPromise: Promise<User | null>;
  signIn: () => void;
  signOut: () => Promise<void>;
  retry: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
  const context = use(AuthContext);

  if (!context) throw new Error('not wrapped in auth context');

  return context;
};
