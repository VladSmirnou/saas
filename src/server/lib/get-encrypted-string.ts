import crypto from 'crypto';

export const getEncryptedString = (bytes: number) =>
  crypto.randomBytes(bytes).toString('hex');
