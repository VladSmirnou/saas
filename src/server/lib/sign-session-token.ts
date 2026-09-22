import crypto from 'crypto';

const HMAC_KEY = process.env.HMAC_SECRET_KEY as string;

export const signSessionToken = (token: string) => {
  return crypto.createHmac('sha256', HMAC_KEY).update(token).digest('hex');
};
