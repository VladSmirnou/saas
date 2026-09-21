import crypto from 'crypto';

export const getEncryptedSessionToken = () =>
  crypto.randomBytes(16).toString('hex');
