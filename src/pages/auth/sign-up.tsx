import { useActionState } from 'react';

import axios, { isAxiosError } from 'axios';
import { useNavigate } from 'react-router';
import { createUrl } from '../../lib/create-url';

type FormFields = 'email' | 'username' | 'password' | 'server';
type FormErrors = Partial<Record<FormFields, string>>;

type State = {
  errors?: FormErrors;
};

export const SignUp = () => {
  const navigate = useNavigate();

  const [state, dispatch, isPending] = useActionState<State, FormData>(
    async (prevState, formData) => {
      try {
        await axios.post(
          createUrl('sign-up'),
          Object.fromEntries(formData.entries()),
        );
        navigate('/sign-in');
        return {};
      } catch (error) {
        if (isAxiosError(error)) {
          const errors = error.response?.data as FormErrors | undefined;
          if (errors) {
            return {
              errors: {
                ...prevState.errors,
                ...errors,
              },
            };
          }
        }
        return {
          errors: {
            ...prevState.errors,
            server: 'failed to signup',
          },
        };
      }
    },
    {},
  );

  return (
    <form action={dispatch}>
      {state.errors?.server && <p>{state.errors?.server}</p>}
      <div>
        <label htmlFor="username">username</label>
        <input id="username" name="username" />
        {state.errors?.username && <p>{state.errors?.username}</p>}
      </div>
      <div>
        <label htmlFor="email">email</label>
        <input id="email" name="email" />
        {state.errors?.email && <p>{state.errors?.email}</p>}
      </div>
      <div>
        <label htmlFor="password">password</label>
        <input id="password" name="password" />
        {state.errors?.password && <p>{state.errors?.password}</p>}
      </div>
      <button disabled={isPending}>submit</button>
    </form>
  );
};
