import type { RouteObject } from 'react-router';
import { AuthPagesLayout } from '../pages/auth/auth-layou';
import { SignIn } from '../pages/auth/sign-in';
import { SignUp } from '../pages/auth/sign-up';
import { Dashboard } from '../pages/private/dashboard';
import { PrivateLayout } from '../pages/private/private-layout';
import { AuthProvider } from '../provider/auth';
import RootLayout from '../root-layout';

export const routes = [
  {
    Component: AuthProvider,
    children: [
      {
        Component: RootLayout,
        children: [
          {
            Component: PrivateLayout,
            children: [
              {
                path: '/',
                Component: Dashboard,
              },
            ],
          },
          {
            Component: AuthPagesLayout,
            children: [
              {
                path: '/sign-up',
                Component: SignUp,
              },
              {
                path: '/sign-in',
                Component: SignIn,
              },
            ],
          },
        ],
      },
    ],
  },
] satisfies RouteObject[];
