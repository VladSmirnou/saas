import { render, screen, act } from '@testing-library/react';
import { test } from 'vitest';
import { RouterMock } from '../mocks/todolists-feature/router-mock';
import { server } from '../mocks/todolists-feature/server';
import { http, HttpResponse } from 'msw';
import { createUrl } from '../lib/create-url';

// user goes to the protected route without authenticating
// redirect user
//  check if user is authenticated
//  if not authenticated then redirect to the sign-in page
//  else '/dashboard' page

test.beforeAll(() => server.listen());
test.afterEach(() => server.resetHandlers());
test.afterAll(() => server.close());

// create a parameterized test for all the private routes

test('should redirect to sign-in if not authenticated', async () => {
  server.use(
    http.get(createUrl('user'), () => {
      return new HttpResponse({ user: null });
    }),
  );

  await act(() => render(<RouterMock initialEntries={['/']} />));

  await screen.findByRole('heading', { level: 1, name: /sign-in/i });
});
