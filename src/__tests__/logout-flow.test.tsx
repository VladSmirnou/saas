import { test } from 'vitest';
import { server } from '../mocks/todolists-feature/server';
import { http, HttpResponse } from 'msw';
import { createUrl } from '../lib/create-url';
import { render, screen, act } from '@testing-library/react';
import { RouterMock } from '../mocks/todolists-feature/router-mock';
import userEvent from '@testing-library/user-event';

// signed in user pesses the logout button
// a request is sent to the backend
// if success then user should be redirected to the sign-in page
// if error then I need to display an error

test.beforeAll(() => server.listen());
test.afterEach(() => server.resetHandlers());
test.afterAll(() => server.close());

test('logout flow', async () => {
  const user = userEvent.setup();

  server.use(
    http.get(createUrl('user'), () => {
      return HttpResponse.json({
        user: {
          id: 1,
          username: 'bob',
          email: 'email',
          isEmailVerified: false,
        },
      });
    }),

    http.delete(createUrl('sign-out'), () => {
      return new HttpResponse(null, { status: 200 });
    }),
  );

  await act(() => render(<RouterMock initialEntries={['/']} />));

  const signOutButton = await screen.findByRole('button', {
    name: /sign out/i,
  });

  await act(() => user.click(signOutButton));

  await screen.findByRole('heading', { level: 1, name: /sign-in/i });
});
