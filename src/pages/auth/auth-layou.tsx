import { use } from 'react';
import { useAuthContext } from '../../provider/auth-context';
import { Navigate, Outlet } from 'react-router';

export const AuthPagesLayout = () => {
  const { userPromise } = useAuthContext();

  const user = use(userPromise);

  return user ? <Navigate to="/" replace /> : <Outlet />;
};
