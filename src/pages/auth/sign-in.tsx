import { isAxiosError } from 'axios';
import { useActionState } from 'react';
import { Link } from 'react-router';
import { instance } from '../../api/axios-instance';
import { useAuthContext } from '../../provider/auth-context';

type State = {
  errors?: FormErrors;
};

type FormFields = 'email' | 'password' | 'server';
type FormErrors = Partial<Record<FormFields, string>>;

export const SignIn = () => {
  const { signIn } = useAuthContext();

  const [state, dispatch, isPending] = useActionState<State, FormData>(
    async (prevState, formData) => {
      try {
        await instance.post('/sign-in', Object.fromEntries(formData.entries()));
        signIn();
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
            server: 'failed to signin',
          },
        };
      }
    },
    {},
  );

  return (
    <div>
      <h1>Sign-In</h1>
      <form action={dispatch}>
        {state.errors?.server && <p>{state.errors?.server}</p>}
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
      <Link to="/sign-up">sign-up</Link>
    </div>
  );
};
