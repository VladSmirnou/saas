import request from 'supertest';
import { mockLogError } from '../../../__mocks__/pino-http';
import { app } from '../app';
import { repo } from '../repo/msw/repo';
import type { User } from '../repo/types/entities';

vitest.mock('../repo/msw/repo');
vitest.mock('pino-http');

const mockedFindUserByUsername = vitest.mocked(repo.findUserByUsername);

const mockedFindUserbyEmail = vitest.mocked(repo.findUserByEmail);
const mockedCreateUser = vitest.mocked(repo.createUser);

const mockedSubmittedData = {
  email: 'my-email@gmail.com',
  username: 'bob',
  password: 'my-password',
};

test('should sign-up successfully', async () => {
  mockedFindUserByUsername.mockResolvedValueOnce(undefined);
  mockedFindUserbyEmail.mockResolvedValueOnce(undefined);

  const response = await request(app)
    .post('/sign-up')
    .send(mockedSubmittedData);

  expect(repo.createUser).toHaveBeenCalledWith({
    email: mockedSubmittedData.email,
    username: mockedSubmittedData.username,
    hashedPassword: expect.any(String),
  });

  expect(response.status).toBe(201);
});

test('should return an error if failed to create a user', async () => {
  mockedCreateUser.mockRejectedValueOnce(new Error('failed to create user'));

  const response = await request(app)
    .post('/sign-up')
    .send(mockedSubmittedData);

  expect(response.status).toBe(400);
  expect(response.body).toEqual({ server: 'Failed to create user' });
});

test('should return an opaque success on existing user found by email', async () => {
  mockedFindUserbyEmail.mockResolvedValueOnce({} as User);

  const response = await request(app)
    .post('/sign-up')
    .send(mockedSubmittedData);

  expect(response.status).toBe(201);
  expect(mockedCreateUser).not.toHaveBeenCalled();
});

test('should return validation error on invalid submitted data', async () => {
  const response = await request(app)
    .post('/sign-up')
    .send({ email: '', password: '', username: '' });

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    email: expect.any(String),
    password: expect.any(String),
    username: expect.any(String),
  });
});

test('should return an error if user with provided username already exists', async () => {
  mockedFindUserByUsername.mockResolvedValueOnce({} as User);
  const response = await request(app)
    .post('/sign-up')
    .send(mockedSubmittedData);

  expect(response.status).toBe(409);
  expect(response.body).toEqual({
    server: 'user with this username already exist',
  });
});

test('should return an error if find by username query fails', async () => {
  const error = new Error('db connection failure');

  mockedFindUserByUsername.mockImplementationOnce(() => {
    throw error;
  });
  const response = await request(app)
    .post('/sign-up')
    .send(mockedSubmittedData);

  expect(mockLogError).toHaveBeenCalledWith(
    {
      err: error,
    },
    `Failed to find a used by username: ${mockedSubmittedData.username}`,
  );
  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    server: 'Failed to sign-up. Try again',
  });
});
