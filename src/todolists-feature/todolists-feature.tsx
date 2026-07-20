import { startTransition, Suspense, useState } from 'react';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import { Loader } from '../components/loader/loader';
import { Retry } from '../components/retry/retry';
import { todolistApi } from './api/todolists-api';
import { Todolists } from './components/todolists/todolists';
import { FAILED_TO_FETCH_TODOLISTS, LOADER_TEXT } from './constants/constants';

export const TodolistsFeature = () => {
  const [todolistsPromise, setTodolistsPromise] = useState(
    todolistApi.getTodolists,
  );

  return (
    <div>
      <h1>Todolists Application</h1>
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => {
          return (
            <Retry
              errorMessage={getErrorMessage(error) || FAILED_TO_FETCH_TODOLISTS}
              retryAction={async () => {
                const promise = todolistApi.getTodolists();
                await promise;
                startTransition(() => {
                  resetErrorBoundary();
                  setTodolistsPromise(promise);
                });
              }}
            />
          );
        }}
      >
        <Suspense fallback={<Loader loadingText={LOADER_TEXT} />}>
          <Todolists todolistsPromise={todolistsPromise} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
