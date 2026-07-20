import type { Todolist } from '../../types/types';

export type TodolistsProps = {
  todolistsPromise: Promise<Todolist[]>;
};
