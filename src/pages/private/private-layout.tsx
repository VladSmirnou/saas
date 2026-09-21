import { use } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuthContext } from '../../provider/auth-context';

export const PrivateLayout = () => {
  const { userPromise } = useAuthContext();

  const user = use(userPromise);

  return user ? <Outlet /> : <Navigate to="/sign-in" replace />;
};

// useUserContext
