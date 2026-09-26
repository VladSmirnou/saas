import request from 'supertest';
import { expect, test, vitest } from 'vitest';
import { app } from '../app';
import { repo } from '../repo/repo';
import type { User } from '../repo/db';

vitest.mock('../repo/repo');

const mockedCheckUsernameDuplication = vitest.mocked(
  repo.checkUsernameDuplication,
);

const mockedFindUserbyEmail = vitest.mocked(repo.findUserByEmail);
const mockedCreateUser = vitest.mocked(repo.createUser);

const mockedSubmittedData = {
  email: 'my-email@gmail.com',
  username: 'bob',
  password: 'my-password',
};

test('should sign-up successfully', async () => {
  mockedCheckUsernameDuplication.mockReturnValueOnce(false);
  mockedFindUserbyEmail.mockReturnValueOnce(undefined);

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
  mockedCheckUsernameDuplication.mockReturnValueOnce(true);
  const response = await request(app)
    .post('/sign-up')
    .send(mockedSubmittedData);

  expect(response.status).toBe(409);
  expect(response.body).toEqual({
    server: 'user with this username already exist',
  });
});

test('should return an error if find by username query fails', async () => {
  mockedFindUserbyEmail.mockImplementationOnce(() => {
    throw new Error('db connection failure');
  });
  const response = await request(app)
    .post('/sign-up')
    .send(mockedSubmittedData);

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    server: 'Failed to sign-up',
  });
});

test('should return an opaque success on existing user found by email', async () => {
  mockedFindUserbyEmail.mockReturnValueOnce({} as User);

  const response = await request(app)
    .post('/sign-up')
    .send(mockedSubmittedData);

  expect(response.status).toBe(201);
  expect(mockedCreateUser).not.toHaveBeenCalled();
});
