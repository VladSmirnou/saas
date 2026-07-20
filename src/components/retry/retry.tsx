import { useTransition } from 'react';
import type { RetryProps } from './types';

export const Retry = ({ errorMessage, retryAction }: RetryProps) => {
  const [isPending, startTransition] = useTransition();

  const retry = () => {
    startTransition(async () => {
      await retryAction();
    });
  };

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <p>{errorMessage}</p>
      <button onClick={retry} disabled={isPending}>
        Retry
      </button>
    </div>
  );
};
