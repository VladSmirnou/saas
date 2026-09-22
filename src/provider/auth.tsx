import { isAxiosError } from 'axios';
import { startTransition, useMemo, useState } from 'react';
import { Outlet } from 'react-router';
import { instance } from '../api/axios-instance';
import type { User } from '../mocks/todolists-feature/collections';
import { AuthContext, type AuthContextType } from './auth-context';

// user goes to a route
// cookie is sent to the server
// if cookie doesn't exist ->
//  redirect to the '/sign-in'
//

// authentication check
// load user
//  make server request
//  show loader untill request is in progress
//  if success return result
//  else throw remapped error
// if user is returned then show the dashboard
// else show the sign-in page

type FetchUserResponse = { user: User };

const fetchUser = async () => {
  try {
    const { data } = await instance.get<FetchUserResponse>('/user');
    return data.user;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
  }
  throw new Error('failed to fetch user');
};

const logout = async () => {
  try {
    await instance.delete('/sign-out');
  } catch {
    throw new Error('failed to sign-out');
  }
};

export const AuthProvider = () => {
  const [userPromise, setUserPromise] = useState(fetchUser);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      userPromise,
      signIn() {
        startTransition(() => {
          setUserPromise(fetchUser());
        });
      },
      async signOut() {
        try {
          await logout();
          setUserPromise(Promise.resolve(null));
        } catch (error) {
          alert(error instanceof Error ? error.message : 'failed to sign-out');
        }
      },
      retry() {
        setUserPromise(fetchUser());
      },
    }),
    [userPromise],
  );

  return (
    <AuthContext value={contextValue}>
      <Outlet />
    </AuthContext>
  );
};
