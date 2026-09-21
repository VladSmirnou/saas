import crypto from 'crypto';

const HMAC_KEY =
  '9a57d303517ecba6bd3490c18df1a0b922a3aa6bbf557b73934d1e5312a8413d';

export const signSessionToken = (token: string) => {
  return crypto.createHmac('sha256', HMAC_KEY).update(token).digest('hex');
};
