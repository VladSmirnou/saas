type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  role: 'admin' | null;
};

type Session = {
  id: number;
  token: string;
  secret: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
};

type SessionWithUser = Omit<Session, 'userId'> & {
  user: User;
};

export type { User, Session, SessionWithUser };
