import bcrypt from 'bcrypt';

const saltRounds = 10;

const encryptPassword = (password: string) => bcrypt.hash(password, saltRounds);

const comparePasswords = ({
  candidate,
  standard,
}: {
  candidate: string;
  standard: string;
}) => {
  return (
    candidate.length === standard.length && bcrypt.compare(candidate, standard)
  );
};

export { encryptPassword, comparePasswords };
