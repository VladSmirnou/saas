import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { act } from 'react';
import { expect, test, vitest } from 'vitest';
import { TodolistsFeature } from '../todolists-feature/todolists-feature';
import type { Todolist } from '../todolists-feature/types/types';

vitest.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();

  return {
    ...actual,
    default: {
      ...actual.default,
      get: vitest.fn(),
    },
  };
});

const mocketGet = vitest.mocked(axios.get);

test('should show loader untill todolists are loading', async () => {
  const { promise, resolve } = Promise.withResolvers<{ data: Todolist[] }>();
  mocketGet.mockReturnValue(promise);

  await act(async () => render(<TodolistsFeature />));

  screen.getByRole('status');

  resolve({ data: [] });

  await screen.findByText(/no todolists yet/i);
});

test('should render todolists', async () => {
  mocketGet.mockResolvedValue({
    data: [
      {
        id: 0,
        title: 'first',
      },
      {
        id: 1,
        title: 'second',
      },
    ],
  });

  await act(async () => render(<TodolistsFeature />));

  const todolists = screen.getAllByRole('heading', { level: 3 });
  expect(todolists).toHaveLength(2);
});

test('should allow to retry after todolists fetch fail', async () => {
  // Suppress error boundary error message
  vitest.spyOn(global.console, 'error').mockImplementation(() => {});

  const user = userEvent.setup();
  mocketGet.mockRejectedValueOnce(Error('fetch failed')).mockResolvedValueOnce({
    data: [],
  });

  await act(async () => render(<TodolistsFeature />));

  const button = screen.getByRole('button', { name: /retry/i });

  await act(() => user.click(button));

  await screen.findByText(/no todolists yet/i);
});
