import axios from 'axios';
import { startTransition, Suspense, useState } from 'react';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import { Loader } from '../components/loader/loader';
import { Retry } from '../components/retry/retry';
import { Todolists } from './components/todolists/todolists';
import { FAILED_TO_FETCH_TODOLISTS, LOADER_TEXT } from './constants/constants';
import type { Todolist } from './types/types';

const getTodolistsPromise = () => {
  return axios.get<Todolist[]>('/todolists').then((response) => response.data);
};

export const TodolistsFeature = () => {
  const [todolistsPromise, setTodolistsPromise] = useState(getTodolistsPromise);

  return (
    <div>
      <h1>Todolists Application</h1>
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => {
          return (
            <Retry
              errorMessage={getErrorMessage(error) || FAILED_TO_FETCH_TODOLISTS}
              retryAction={async () => {
                const promise = getTodolistsPromise();
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
