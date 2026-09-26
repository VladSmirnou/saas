import type { Session } from '../repo/db';
import { repo } from '../repo/repo';
import crypto from 'crypto';

const HMAC_KEY = process.env.HMAC_SECRET_KEY as string;

const getSessionInstanceBySessionValue = (sessionValue: string | undefined) => {
  if (!sessionValue) {
    throw new Error('session value is either undefined or an empty string');
  }

  const splitSessionIdValue = sessionValue.split('.', 2);
  if (splitSessionIdValue.length !== 2) {
    throw new Error('invalid session id value');
  }

  const [token, sessionSignature] = splitSessionIdValue;

  const signature = signSessionToken(token);

  if (!safeCompareSessionSignatures(sessionSignature, signature)) {
    throw new Error('session signature is invalid');
  }

  let session;
  try {
    session = repo.findSessionByToken(token);
  } catch (error) {
    console.log(error);
  }

  if (!session) {
    throw new Error("session doesn't exist");
  }
  return session;
};

const isSessionFresh = (session: Session) => {
  return new Date(session.expiresAt).getTime() > new Date().getTime();
};

const signSessionToken = (token: string) => {
  return crypto.createHmac('sha256', HMAC_KEY).update(token).digest('hex');
};

const safeCompareSessionSignatures = (a: string, b: string) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return (
    bufferA.length === bufferB.length &&
    crypto.timingSafeEqual(bufferA, bufferB)
  );
};

const getEncryptedSessionToken = () => crypto.randomBytes(16).toString('hex');

export {
  getSessionInstanceBySessionValue,
  isSessionFresh,
  signSessionToken,
  safeCompareSessionSignatures,
  getEncryptedSessionToken,
};
