import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { test } from 'vitest';
import { createUrl } from '../lib/create-url';
import { RouterMock } from '../mocks/todolists-feature/router-mock';
import { server } from '../mocks/todolists-feature/server';

// fill form fields
// submit form
//  press submit button
//  block submit button
// process server response
//  if error
//   display error
//  redirect to the dashboard page

test.beforeAll(() => server.listen());
test.afterEach(() => server.resetHandlers());
test.afterAll(() => server.close());

test('successfull sign-in', async () => {
  const user = userEvent.setup();

  server.use(
    http.post(createUrl('sign-in'), () => {
      return new HttpResponse(null, { status: 200 });
    }),
    http.get(createUrl('user'), () => {
      return HttpResponse.json({
        user: null,
      });
    }),
  );

  await act(() => render(<RouterMock initialEntries={['/sign-in']} />));

  server.use(
    http.get(createUrl('user'), () => {
      return HttpResponse.json({
        user: {
          id: 1,
          username: 'bob',
          email: 'asd',
          isEmailVerified: false,
        },
      });
    }),
  );

  const emailInput = await screen.findByRole('textbox', { name: /email/i });
  const passwordInput = screen.getByRole('textbox', { name: /password/i });

  const submitButton = screen.getByRole('button', { name: /submit/i });

  await user.type(emailInput, 'email@gmail.com');
  await user.type(passwordInput, 'password');

  await user.click(submitButton);

  await screen.findByRole('heading', { name: /dashboard/i });
});
