import { use } from 'react';
import { useAuthContext } from '../../provider/auth-context';

export const Header = () => {
  const { userPromise, signOut } = useAuthContext();
  const user = use(userPromise);

  return (
    <header>
      <p>Logo</p>
      {user && <button onClick={signOut}>sign out</button>}
    </header>
  );
};
