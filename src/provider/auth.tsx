import axios from 'axios';
import { startTransition, useMemo, useState } from 'react';
import { Outlet } from 'react-router';
import { createUrl } from '../lib/create-url';
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

type FetchUserResponse = { user: User | null };

const fetchUser = async (header?: string) => {
  try {
    const { data } = await axios.get<FetchUserResponse>(createUrl('user'), {
      headers: {
        'x-my-header': header,
      },
    });
    return data.user;
  } catch {
    throw new Error('failed to fetch user');
  }
};

const logout = async () => {
  try {
    await axios.delete(createUrl('sign-out'));
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
          setUserPromise(fetchUser('hellow'));
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
