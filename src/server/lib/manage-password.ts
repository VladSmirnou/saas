import bcrypt from 'bcrypt';

const saltRounds = 10;

const hashPassword = (password: string) => bcrypt.hash(password, saltRounds);

const comparePasswords = ({
  raw,
  encrypted,
}: {
  raw: string;
  encrypted: string;
}) => bcrypt.compare(raw, encrypted);

export { hashPassword, comparePasswords };
