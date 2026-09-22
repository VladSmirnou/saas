import * as z from 'zod';

const signInSchema = z.object({
  email: z.string().trim().min(3, { error: 'email is invalid' }),
  password: z.string().trim().min(3, { error: 'password is invalid' }),
});

const signupSchema = signInSchema.extend({
  username: z.string().trim().min(3, { error: 'username is invalid' }),
});

export { signupSchema, signInSchema };
