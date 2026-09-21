import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { test } from 'vitest';
import { createUrl } from '../lib/create-url';
import { RouterMock } from '../mocks/todolists-feature/router-mock';
import { server } from '../mocks/todolists-feature/server';

// test simple session signup flow

// sign-up form
//  fill the form fields
//  press the submit button
// process request on the server
//  check if data is valid
//   validate fields
//   return error response if data is invalid
//  create a user
//   return error if user exists
//   make a db call to create a user
//   return error response if user exists
//  return a response
// action based on the submitted form result
//  display errors if errors returned
//   set error per field
//  redirect to the sign-in page if successfull

test.beforeAll(() => server.listen());
test.afterEach(() => server.resetHandlers());
test.afterAll(() => server.close());

test('field errors signup', async () => {
  const user = userEvent.setup();

  server.use(
    http.get(createUrl('user'), () => {
      return HttpResponse.json({ user: null });
    }),
    http.post(createUrl('sign-up'), () => {
      return HttpResponse.json(
        {
          username: 'username is invalid',
          email: 'email is invalid',
          password: 'password is invalid',
        },
        { status: 400 },
      );
    }),
  );

  await act(() => render(<RouterMock initialEntries={['/sign-up']} />));

  const emailInput = await screen.findByRole('textbox', { name: /email/i });
  const usernameInput = screen.getByRole('textbox', { name: /username/i });
  const passwordInput = screen.getByRole('textbox', { name: /password/i });

  const submitButton = screen.getByRole('button', { name: /submit/i });

  await user.type(emailInput, '1');
  await user.type(usernameInput, '3');
  await user.type(passwordInput, '3');

  await user.click(submitButton);

  await screen.findByText('username is invalid');
  await screen.findByText('email is invalid');
  await screen.findByText('password is invalid');
});

test('server error', async () => {
  server.use(
    http.get(createUrl('user'), () => {
      return HttpResponse.json({ user: null });
    }),
    http.post(createUrl('sign-up'), () => {
      return new HttpResponse(
        JSON.stringify({
          server: 'user already exists',
        }),
        {
          headers: new Headers({
            'content-type': 'application/json',
          }),
          status: 409,
        },
      );
    }),
  );
  const user = userEvent.setup();

  await act(() => render(<RouterMock initialEntries={['/sign-up']} />));

  const emailInput = await screen.findByRole('textbox', { name: /email/i });
  const usernameInput = screen.getByRole('textbox', { name: /username/i });
  const passwordInput = screen.getByRole('textbox', { name: /password/i });

  const submitButton = screen.getByRole('button', { name: /submit/i });

  await user.type(emailInput, 'email');
  await user.type(usernameInput, 'nick');
  await user.type(passwordInput, '332123');

  await user.click(submitButton);

  await screen.findByText('user already exists');
});

test('successfull signup', async () => {
  const user = userEvent.setup();

  server.use(
    http.get(createUrl('user'), () => {
      return HttpResponse.json({ user: null });
    }),
    http.post(createUrl('sign-up'), () => {
      return new HttpResponse(null, { status: 201 });
    }),
  );

  await act(() => render(<RouterMock initialEntries={['/sign-up']} />));

  const emailInput = await screen.findByRole('textbox', { name: /email/i });
  const usernameInput = screen.getByRole('textbox', { name: /username/i });
  const passwordInput = screen.getByRole('textbox', { name: /password/i });

  const submitButton = screen.getByRole('button', { name: /submit/i });

  await user.type(emailInput, 'email');
  await user.type(usernameInput, 'nick');
  await user.type(passwordInput, '332123');

  await user.click(submitButton);

  await screen.findByRole('heading', { name: /sign-in/i });
});
