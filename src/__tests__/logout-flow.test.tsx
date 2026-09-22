import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test } from 'vitest';
import { RouterMock } from '../mocks/todolists-feature/router-mock';
import { server } from '../mocks/todolists-feature/server';

// signed in user pesses the logout button
// a request is sent to the backend
// if success then user should be redirected to the sign-in page
// if error then I need to display an error

test.beforeAll(() => server.listen());
test.afterEach(() => server.resetHandlers());
test.afterAll(() => server.close());

test('logout flow', async () => {
  const user = userEvent.setup();

  await act(() => render(<RouterMock initialEntries={['/']} />));

  const signOutButton = await screen.findByRole('button', {
    name: /sign out/i,
  });

  await act(() => user.click(signOutButton));

  await screen.findByRole('heading', { level: 1, name: /sign-in/i });
});
