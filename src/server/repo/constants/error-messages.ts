const errorMessages = {
  failedToFindSessionByToken: (token: string) =>
    `failed to find a session by token: ${token}`,
  failedToFindUserById: (id: number) => `failed to find a user by id: ${id}`,
  failedToFindUserByEmail: (email: string) =>
    `failed to find a user by email ${email}`,
  failedToDeleteSessionsWithExpiredTimeout:
    'failed to delete sessions with expired idle timeout',
  failedToDeleteSessionsWithAbsoluteTimeout:
    'failed to delete sessions with expired absolute timeout',
  failedToDeleteSessionByToken: (token: string) =>
    `failed to delete a session by token: ${token}`,
  failedToCreateSession: 'failed to create a session',
  failedToUpdateSessionIdleTimeout: (sessionId: number) =>
    `failed to update session idle timeout. Session id: ${sessionId}`,
  failedToCreateUserWithEmail: (email: string) =>
    `failed to create a user with email: ${email}`,
  failedToFindUsersByUsername: (username: string) =>
    `failed to find users by username: ${username}`,
};

export { errorMessages };
