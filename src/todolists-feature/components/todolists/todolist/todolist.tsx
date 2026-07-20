import type { TodolistProps } from './types';

export const Todolist = ({ todolist }: TodolistProps) => {
  return (
    <div>
      <h3>{todolist.title}</h3>
    </div>
  );
};
